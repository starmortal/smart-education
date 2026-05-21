const Topic = require('../models/Topic');
const Assistant = require('../models/Assistant');
const Response = require('../utils/response');
const { AppError } = require('../middleware/errorHandler');
const logger = require('../utils/logger');
const ai = require('../utils/ai');

// 创建话题
exports.createTopic = async (req, res) => {
  const { assistantId, userId, title } = req.body;

  if (!assistantId || !userId) {
    throw new AppError('助手ID和用户ID不能为空', 400);
  }

  // 验证助手是否存在
  const assistant = await Assistant.findById(assistantId);
  if (!assistant) {
    throw new AppError('助手不存在', 404);
  }

  const topic = new Topic({
    assistantId,
    userId,
    title: title || '新对话',
    messages: []
  });

  await topic.save();
  logger.info(`话题创建成功: ${topic._id}`);

  Response.success(res, topic, '话题创建成功');
};

// 获取助手下的所有话题
exports.getTopics = async (req, res) => {
  const { assistantId } = req.query;

  if (!assistantId) {
    throw new AppError('助手ID不能为空', 400);
  }

  const topics = await Topic.find({ assistantId })
    .sort({ updatedAt: -1 })
    .select('-messages') // 不返回消息内容，减少数据量
    .lean();

  Response.success(res, topics);
};

// 获取话题详情（包含消息）
exports.getTopic = async (req, res) => {
  const { id } = req.params;

  const topic = await Topic.findById(id).lean();
  
  if (!topic) {
    throw new AppError('话题不存在', 404);
  }

  Response.success(res, topic);
};

// 更新话题标题
exports.updateTopic = async (req, res) => {
  const { id } = req.params;
  const { title } = req.body;

  if (!title) {
    throw new AppError('标题不能为空', 400);
  }

  const topic = await Topic.findById(id);
  
  if (!topic) {
    throw new AppError('话题不存在', 404);
  }

  topic.title = title;
  await topic.save();
  
  logger.info(`话题标题更新成功: ${id}`);

  Response.success(res, topic, '话题标题更新成功');
};

// 删除话题
exports.deleteTopic = async (req, res) => {
  const { id } = req.params;

  const topic = await Topic.findById(id);
  
  if (!topic) {
    throw new AppError('话题不存在', 404);
  }

  await Topic.findByIdAndDelete(id);
  
  logger.info(`话题删除成功: ${id}`);

  Response.success(res, null, '话题删除成功');
};

// 上传文件
exports.uploadFile = async (req, res) => {
  if (!req.file) {
    throw new AppError('请选择文件', 400);
  }

  const fileInfo = {
    filename: req.file.originalname,
    type: req.file.mimetype,
    size: req.file.size,
    url: `/uploads/chat/${req.file.filename}`
  };

  logger.info(`文件上传成功: ${req.file.originalname}`);
  Response.success(res, fileInfo, '文件上传成功');
};

// 发送消息并获取AI回复
exports.sendMessage = async (req, res) => {
  const { topicId, message, attachments = [], temporaryKnowledgeBases = [] } = req.body;

  if (!topicId) {
    throw new AppError('话题ID不能为空', 400);
  }

  if (!message && attachments.length === 0) {
    throw new AppError('消息内容或附件不能为空', 400);
  }

  // 获取话题
  const topic = await Topic.findById(topicId);
  if (!topic) {
    throw new AppError('话题不存在', 404);
  }

  // 获取助手配置
  const assistant = await Assistant.findById(topic.assistantId);
  if (!assistant) {
    throw new AppError('助手不存在', 404);
  }

  // 添加用户消息
  const userMessage = {
    role: 'user',
    content: message || '',
    attachments: attachments || [],
    timestamp: new Date()
  };
  topic.messages.push(userMessage);

  // 确定要使用的知识库（优先使用对话级别，否则使用助手级别）
  const knowledgeBasesToUse = temporaryKnowledgeBases.length > 0 
    ? temporaryKnowledgeBases 
    : (assistant.knowledgeBases || []);

  // 检索知识库内容
  let knowledgeContext = '';
  if (knowledgeBasesToUse.length > 0 && message) {
    try {
      const Knowledge = require('../models/Knowledge');
      const { searchKnowledge } = require('./knowledgeController');
      
      // 从所有关联的知识库中检索相关内容
      const searchResults = [];
      for (const kbId of knowledgeBasesToUse) {
        const kb = await Knowledge.findById(kbId);
        if (kb && kb.vectorCount > 0) {
          // 模拟 req/res 对象来调用 searchKnowledge
          const mockReq = {
            params: { knowledgeId: kbId },
            body: { query: message, topK: 3 }
          };
          const mockRes = {
            json: (data) => data
          };
          
          try {
            // 直接调用知识库搜索逻辑
            const KnowledgeFile = require('../models/KnowledgeFile');
            const Vectorizer = require('../utils/vectorizer');
            
            const files = await KnowledgeFile.find({ 
              knowledgeId: kbId, 
              status: 'completed' 
            });
            
            if (files.length > 0) {
              const queryEmbedding = await Vectorizer.generateEmbedding(message);
              const allVectors = [];
              files.forEach(file => {
                file.vectors.forEach(vector => {
                  allVectors.push({
                    ...vector.toObject(),
                    fileName: file.name,
                    fileId: file._id
                  });
                });
              });
              
              const results = await Vectorizer.searchSimilar(queryEmbedding, allVectors, 3);
              searchResults.push(...results);
            }
          } catch (searchError) {
            logger.warn(`知识库 ${kbId} 检索失败:`, searchError);
          }
        }
      }
      
      // 构建知识库上下文
      if (searchResults.length > 0) {
        knowledgeContext = '\n\n【参考知识库内容】\n';
        searchResults.slice(0, 5).forEach((result, index) => {
          knowledgeContext += `${index + 1}. ${result.text}\n`;
        });
        knowledgeContext += '\n请基于以上知识库内容回答用户问题。\n';
      }
    } catch (error) {
      logger.error('知识库检索失败:', error);
      // 检索失败不影响正常对话，继续执行
    }
  }

  // 构建对话历史（包含系统提示词和知识库上下文）
  const history = [];
  
  // 添加系统提示词（包含知识库上下文）
  let systemPrompt = assistant.prompt || '';
  if (knowledgeContext) {
    systemPrompt += knowledgeContext;
  }
  
  if (systemPrompt) {
    history.push({
      role: 'system',
      content: systemPrompt
    });
  }

  // 添加历史消息（最近10条）
  const recentMessages = topic.messages.slice(-10);
  recentMessages.forEach(msg => {
    history.push({
      role: msg.role,
      content: msg.content
    });
  });

  try {
    // 调用AI获取回复
    const aiResponse = await ai.chat(message, history);

    // 添加AI回复
    const assistantMessage = {
      role: 'assistant',
      content: aiResponse,
      timestamp: new Date()
    };
    topic.messages.push(assistantMessage);

    // 自动生成话题标题（如果是第一条消息）
    if (topic.messages.length === 2 && topic.title === '新对话') {
      topic.title = message.substring(0, 30) + (message.length > 30 ? '...' : '');
    }

    await topic.save();
    
    logger.info(`消息发送成功，话题: ${topicId}`);

    Response.success(res, {
      userMessage,
      assistantMessage,
      topic: {
        _id: topic._id,
        title: topic.title,
        updatedAt: topic.updatedAt
      }
    }, '消息发送成功');
  } catch (error) {
    logger.error('AI调用失败:', error);
    throw new AppError('AI服务暂时不可用，请稍后重试', 500);
  }
};

// 清空话题消息
exports.clearMessages = async (req, res) => {
  const { id } = req.params;

  const topic = await Topic.findById(id);
  
  if (!topic) {
    throw new AppError('话题不存在', 404);
  }

  topic.messages = [];
  await topic.save();
  
  logger.info(`话题消息清空成功: ${id}`);

  Response.success(res, topic, '消息已清空');
};
