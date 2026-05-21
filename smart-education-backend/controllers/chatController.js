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

// 发送消息并获取AI回复
exports.sendMessage = async (req, res) => {
  const { topicId, message } = req.body;

  if (!topicId || !message) {
    throw new AppError('话题ID和消息内容不能为空', 400);
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
    content: message,
    timestamp: new Date()
  };
  topic.messages.push(userMessage);

  // 构建对话历史（包含系统提示词）
  const history = [];
  
  // 添加系统提示词
  if (assistant.prompt) {
    history.push({
      role: 'system',
      content: assistant.prompt
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
