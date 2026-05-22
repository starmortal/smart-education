const Assistant = require('../models/Assistant');
const Topic = require('../models/Topic');
const Response = require('../utils/response');
const { AppError } = require('../middleware/errorHandler');
const logger = require('../utils/logger');

// 创建助手
exports.createAssistant = async (req, res) => {
  const { userId, name, prompt, model, temperature, topP, maxTokens, knowledgeBases } = req.body;

  if (!userId || !name) {
    throw new AppError('用户ID和助手名称不能为空', 400);
  }

  const assistant = new Assistant({
    userId,
    name,
    prompt: prompt || '',
    model: model || 'deepseek-chat',
    temperature: temperature !== undefined ? temperature : 0.7,
    topP: topP !== undefined ? topP : 1,
    maxTokens: maxTokens || 2048,
    knowledgeBases: knowledgeBases || []
  });

  await assistant.save();
  logger.info(`助手创建成功: ${assistant._id}`);

  Response.success(res, assistant, '助手创建成功');
};

// 获取用户的所有助手
exports.getAssistants = async (req, res) => {
  const { userId } = req.query;

  if (!userId) {
    throw new AppError('用户ID不能为空', 400);
  }

  const assistants = await Assistant.find({ userId })
    .sort({ createdAt: -1 })
    .lean();

  Response.success(res, assistants);
};

// 获取单个助手详情
exports.getAssistant = async (req, res) => {
  const { id } = req.params;

  const assistant = await Assistant.findById(id).lean();
  
  if (!assistant) {
    throw new AppError('助手不存在', 404);
  }

  Response.success(res, assistant);
};

// 更新助手
exports.updateAssistant = async (req, res) => {
  const { id } = req.params;
  const { name, prompt, model, temperature, topP, maxTokens, knowledgeBases } = req.body;

  const assistant = await Assistant.findById(id);
  
  if (!assistant) {
    throw new AppError('助手不存在', 404);
  }

  if (name !== undefined) assistant.name = name;
  if (prompt !== undefined) assistant.prompt = prompt;
  if (model !== undefined) assistant.model = model;
  if (temperature !== undefined) assistant.temperature = temperature;
  if (topP !== undefined) assistant.topP = topP;
  if (maxTokens !== undefined) assistant.maxTokens = maxTokens;
  if (knowledgeBases !== undefined) assistant.knowledgeBases = knowledgeBases;

  await assistant.save();
  logger.info(`助手更新成功: ${id}`);

  Response.success(res, assistant, '助手更新成功');
};

// 删除助手
exports.deleteAssistant = async (req, res) => {
  const { id } = req.params;

  const assistant = await Assistant.findById(id);
  
  if (!assistant) {
    throw new AppError('助手不存在', 404);
  }

  // 删除助手下的所有话题
  await Topic.deleteMany({ assistantId: id });
  
  // 删除助手
  await Assistant.findByIdAndDelete(id);
  
  logger.info(`助手删除成功: ${id}`);

  Response.success(res, null, '助手删除成功');
};

// 创建默认助手
exports.createDefaultAssistant = async (req, res) => {
  const { userId } = req.body;

  if (!userId) {
    throw new AppError('用户ID不能为空', 400);
  }

  // 检查是否已有默认助手
  const existingDefault = await Assistant.findOne({ userId, isDefault: true });
  
  if (existingDefault) {
    Response.success(res, existingDefault, '默认助手已存在');
    return;
  }

  const assistant = new Assistant({
    userId,
    name: '默认助手',
    prompt: '你是一个友好、专业的AI助手，致力于帮助用户解决问题。',
    model: 'deepseek-chat',
    temperature: 0.7,
    topP: 1,
    maxTokens: 2048,
    isDefault: true
  });

  await assistant.save();
  logger.info(`默认助手创建成功: ${assistant._id}`);

  Response.success(res, assistant, '默认助手创建成功');
};
