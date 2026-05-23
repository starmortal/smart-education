const AIAnalysis = require('../models/AIAnalysis');
const Question = require('../models/Question');
const User = require('../models/User');
const Response = require('../utils/response');
const logger = require('../utils/logger');
const OpenAI = require('openai');

// 初始化 OpenAI 客户端
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// AI 分析问题
exports.analyzeQuestion = async (req, res) => {
  try {
    const { questionId, title, content, tags } = req.body;
    
    // 检查是否已有分析结果
    let analysis = await AIAnalysis.findOne({ questionId });
    
    if (analysis) {
      return Response.success(res, analysis, '获取AI分析成功');
    }
    
    // 调用 OpenAI API 进行分析
    const prompt = `请分析以下学习问题，并提供详细的分析结果：

标题：${title}
内容：${content}
标签：${tags.join(', ')}

请以JSON格式返回以下信息：
1. difficulty: 难度等级(1-5)
2. keywords: 关键词数组
3. knowledgePoints: 知识点数组
4. suggestion: 学习建议
5. quickAnswer: 简短解答提示

返回格式示例：
{
  "difficulty": 3,
  "keywords": ["牛顿定律", "惯性"],
  "knowledgePoints": ["牛顿第一定律", "惯性概念"],
  "suggestion": "建议先复习惯性的基本概念...",
  "quickAnswer": "牛顿第一定律描述的是物体在不受外力时的运动状态..."
}`;

    try {
      const completion = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          { role: "system", content: "你是一个专业的教育AI助手，擅长分析学习问题并提供指导。" },
          { role: "user", content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 500
      });
      
      const aiResponse = JSON.parse(completion.choices[0].message.content);
      
      // 保存分析结果
      analysis = new AIAnalysis({
        questionId,
        difficulty: aiResponse.difficulty || 3,
        keywords: aiResponse.keywords || [],
        knowledgePoints: aiResponse.knowledgePoints || [],
        suggestion: aiResponse.suggestion || '',
        quickAnswer: aiResponse.quickAnswer || '',
        relatedQuestions: []
      });
      
      await analysis.save();
      
      logger.info(`AI分析问题成功：${questionId}`);
      Response.success(res, analysis, 'AI分析完成');
    } catch (aiError) {
      // 如果 OpenAI API 调用失败，返回默认分析
      logger.warn('OpenAI API调用失败，使用默认分析：', aiError.message);
      
      analysis = new AIAnalysis({
        questionId,
        difficulty: 3,
        keywords: tags,
        knowledgePoints: tags,
        suggestion: '这是一个很好的问题，建议查看相关知识点并尝试从基础概念入手。',
        quickAnswer: '建议先理解基本概念，然后逐步深入学习。',
        relatedQuestions: []
      });
      
      await analysis.save();
      Response.success(res, analysis, 'AI分析完成（默认）');
    }
  } catch (error) {
    logger.error('AI分析问题失败：', error);
    Response.error(res, 'AI分析失败', 500);
  }
};

// AI 推荐问题（按社区问题标签热度推荐）
exports.recommendQuestions = async (req, res) => {
  try {
    const { userId } = req.query;

    const allQuestions = await Question.find().select('tags');
    const tagCount = {};

    allQuestions.forEach((q) => {
      (q.tags || []).forEach((tag) => {
        if (tag) {
          tagCount[tag] = (tagCount[tag] || 0) + 1;
        }
      });
    });

    const topTags = Object.entries(tagCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([tag]) => tag);

    if (topTags.length === 0) {
      return Response.success(res, [], 'AI推荐成功');
    }

    const questions = await Question.find({
      tags: { $in: topTags },
      userId: { $ne: userId },
      solved: false
    })
      .sort({ answerCount: -1, viewCount: -1, createTime: -1 })
      .limit(10);

    const recommendations = questions.map((q) => {
      const matchedTag = (q.tags || []).find((t) => topTags.includes(t)) || topTags[0];
      const count = tagCount[matchedTag] || 0;
      return {
        ...q.toObject(),
        id: q._id.toString(),
        recommendReason: `社区热门：${matchedTag}（${count} 个相关问题）`
      };
    });

    Response.success(res, recommendations, 'AI推荐成功');
  } catch (error) {
    logger.error('AI推荐问题失败：', error);
    Response.error(res, 'AI推荐失败', 500);
  }
};

// AI 推荐标签
exports.suggestTags = async (req, res) => {
  try {
    const { title, content } = req.body;
    
    // 简单的关键词提取（实际项目中可以使用更复杂的NLP算法）
    const allText = `${title} ${content}`.toLowerCase();
    
    const subjectKeywords = {
      '数学': ['数学', '方程', '函数', '几何', '代数', '微积分', '三角'],
      '物理': ['物理', '力学', '电学', '光学', '热学', '牛顿', '能量'],
      '化学': ['化学', '元素', '反应', '方程式', '分子', '原子', '化合物'],
      '英语': ['英语', 'english', '语法', '单词', '阅读', '写作'],
      '语文': ['语文', '作文', '阅读', '古诗', '文言文', '修辞'],
      '生物': ['生物', '细胞', '遗传', 'dna', '生态', '进化'],
      '历史': ['历史', '朝代', '事件', '人物', '战争', '文化'],
      '地理': ['地理', '地图', '气候', '地形', '经纬度', '板块']
    };
    
    const suggestedTags = [];
    
    for (const [subject, keywords] of Object.entries(subjectKeywords)) {
      if (keywords.some(keyword => allText.includes(keyword))) {
        suggestedTags.push(subject);
      }
    }
    
    // 添加难度标签
    if (allText.includes('难') || allText.includes('不会') || allText.includes('不懂')) {
      suggestedTags.push('难题');
    }
    
    // 添加类型标签
    if (allText.includes('作业')) suggestedTags.push('作业');
    if (allText.includes('考试')) suggestedTags.push('考试');
    if (allText.includes('复习')) suggestedTags.push('复习');
    
    Response.success(res, suggestedTags.slice(0, 5), 'AI标签推荐成功');
  } catch (error) {
    logger.error('AI推荐标签失败：', error);
    Response.error(res, 'AI推荐标签失败', 500);
  }
};

// 获取学习建议
exports.getLearningAdvice = async (req, res) => {
  try {
    const { userId } = req.query;
    
    // 获取用户最近的问题
    const recentQuestions = await Question.find({ userId })
      .sort({ createTime: -1 })
      .limit(10);
    
    // 统计学科分布
    const subjectCount = {};
    const unsolvedCount = recentQuestions.filter(q => !q.solved).length;
    
    recentQuestions.forEach(q => {
      q.tags.forEach(tag => {
        subjectCount[tag] = (subjectCount[tag] || 0) + 1;
      });
    });
    
    // 生成学习建议
    const advice = {
      summary: `最近提问了 ${recentQuestions.length} 个问题，其中 ${unsolvedCount} 个待解决`,
      suggestions: [],
      focusSubjects: Object.entries(subjectCount)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([subject, count]) => ({ subject, count }))
    };
    
    // 根据未解决问题数量给建议
    if (unsolvedCount > 5) {
      advice.suggestions.push('建议优先解决待解决的问题，可以向老师或同学寻求帮助');
    }
    
    if (advice.focusSubjects.length > 0) {
      advice.suggestions.push(`重点关注：${advice.focusSubjects.map(s => s.subject).join('、')}`);
    }
    
    advice.suggestions.push('保持每天学习的好习惯，遇到问题及时提问');
    
    Response.success(res, advice, '获取学习建议成功');
  } catch (error) {
    logger.error('获取学习建议失败：', error);
    Response.error(res, '获取学习建议失败', 500);
  }
};

// 获取热门话题（按全站问题标签出现次数统计）
exports.getHotTopics = async (req, res) => {
  try {
    const questions = await Question.find().select('tags');

    const tagCount = {};

    questions.forEach((q) => {
      (q.tags || []).forEach((tag) => {
        if (tag) {
          tagCount[tag] = (tagCount[tag] || 0) + 1;
        }
      });
    });

    const hotTopics = Object.entries(tagCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([tag, count]) => ({ tag, count }));

    Response.success(res, hotTopics, '获取热门话题成功');
  } catch (error) {
    logger.error('获取热门话题失败：', error);
    Response.error(res, '获取热门话题失败', 500);
  }
};

// 获取社区统计
exports.getCommunityStats = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const todayQuestions = await Question.countDocuments({
      createTime: { $gte: today }
    });
    
    const totalQuestions = await Question.countDocuments();
    const solvedQuestions = await Question.countDocuments({ solved: true });
    const solveRate = totalQuestions > 0 
      ? Math.round((solvedQuestions / totalQuestions) * 100) 
      : 0;
    
    // 活跃用户（最近7天有提问或回答的用户）
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const activeUsers = await Question.distinct('userId', {
      createTime: { $gte: sevenDaysAgo }
    });
    
    const stats = {
      todayQuestions,
      totalQuestions,
      solveRate,
      activeUsers: activeUsers.length
    };
    
    Response.success(res, stats, '获取社区统计成功');
  } catch (error) {
    logger.error('获取社区统计失败：', error);
    Response.error(res, '获取社区统计失败', 500);
  }
};

// 查找相似问题
exports.findSimilarQuestions = async (req, res) => {
  try {
    const { questionId } = req.params;
    
    const question = await Question.findById(questionId);
    if (!question) {
      return Response.notFound(res, '问题不存在');
    }
    
    // 基于标签查找相似问题
    const similarQuestions = await Question.find({
      _id: { $ne: questionId },
      tags: { $in: question.tags }
    })
    .sort({ createTime: -1 })
    .limit(5)
    .select('title tags solved createTime');
    
    Response.success(res, similarQuestions, '查找相似问题成功');
  } catch (error) {
    logger.error('查找相似问题失败：', error);
    Response.error(res, '查找相似问题失败', 500);
  }
};
