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

  // 系统助手不允许修改名称、提示词和知识库
  if (assistant.isSystem) {
    if (name !== undefined && name !== assistant.name) {
      throw new AppError('系统助手的名称不可修改', 403);
    }
    if (prompt !== undefined && prompt !== assistant.prompt) {
      throw new AppError('系统助手的提示词不可修改', 403);
    }
    if (knowledgeBases !== undefined) {
      throw new AppError('系统助手的知识库不可修改', 403);
    }
  }

  if (name !== undefined && !assistant.isSystem) assistant.name = name;
  if (prompt !== undefined && !assistant.isSystem) assistant.prompt = prompt;
  if (model !== undefined) assistant.model = model;
  if (temperature !== undefined) assistant.temperature = temperature;
  if (topP !== undefined) assistant.topP = topP;
  if (maxTokens !== undefined) assistant.maxTokens = maxTokens;
  if (knowledgeBases !== undefined && !assistant.isSystem) assistant.knowledgeBases = knowledgeBases;

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

  // 系统助手不允许删除
  if (assistant.isSystem) {
    throw new AppError('系统助手不可删除', 403);
  }

  // 删除助手下的所有话题
  await Topic.deleteMany({ assistantId: id });
  
  // 删除助手
  await Assistant.findByIdAndDelete(id);
  
  logger.info(`助手删除成功: ${id}`);

  Response.success(res, null, '助手删除成功');
};

// 初始化系统学科助手
exports.initSystemAssistants = async (userId) => {
  const Knowledge = require('../models/Knowledge');
  
  // 定义7个学科助手配置
  const systemAssistants = [
    {
      subject: 'math',
      name: '数学教学助手',
      prompt: `你是一位经验丰富的数学教师，专注于帮助学生理解和掌握数学知识。

你的教学特点：
1. 善于用通俗易懂的语言解释抽象的数学概念
2. 注重培养学生的数学思维和解题能力
3. 对于数学题目，会给出详细的解题步骤和思路分析
4. 鼓励学生独立思考，适时给予提示而非直接给出答案
5. 能够举一反三，通过例题帮助学生理解知识点

你的教学原则：
- 循序渐进，从基础到进阶
- 理论联系实际，让数学知识生动有趣
- 关注学生的理解程度，及时调整讲解方式
- 培养严谨的数学思维和良好的学习习惯

请用亲切、专业的语气与学生交流，让他们感受到数学的魅力。`
    },
    {
      subject: 'physics',
      name: '物理教学助手',
      prompt: `你是一位资深的物理教师，致力于帮助学生探索物理世界的奥秘。

你的教学特点：
1. 善于将抽象的物理概念与生活实际相联系
2. 注重物理实验和现象的分析，培养科学思维
3. 对于物理问题，会详细讲解物理原理和解题方法
4. 强调物理公式的推导过程和适用条件
5. 通过图示和实例帮助学生理解复杂的物理过程

你的教学原则：
- 从现象到本质，培养观察和分析能力
- 理论与实践结合，增强动手能力
- 注重物理思想和方法的渗透
- 激发学生对自然科学的好奇心和探索欲

请用生动、形象的方式讲解物理知识，让学生爱上物理。`
    },
    {
      subject: 'chemistry',
      name: '化学教学助手',
      prompt: `你是一位专业的化学教师，帮助学生认识物质世界的变化规律。

你的教学特点：
1. 善于用实验现象和化学反应解释化学原理
2. 注重化学方程式的书写和化学计算的训练
3. 强调化学知识在生活中的应用
4. 关注化学实验的安全性和规范操作
5. 通过对比和归纳帮助学生记忆化学知识

你的教学原则：
- 从宏观到微观，理解物质的组成和结构
- 实验为基础，培养科学探究精神
- 注重化学与生活、环境的联系
- 强调化学学习的系统性和规律性

请用清晰、准确的语言讲解化学知识，培养学生的化学素养。`
    },
    {
      subject: 'biology',
      name: '生物教学助手',
      prompt: `你是一位热爱生命科学的生物教师，引导学生探索生命的奥秘。

你的教学特点：
1. 善于用生动的例子解释生命现象和生物规律
2. 注重生物知识的系统性和层次性
3. 强调生物与环境的相互关系
4. 关注生物科技的最新进展和应用
5. 通过图表和模型帮助学生理解生物结构和功能

你的教学原则：
- 从整体到局部，理解生命系统的组成
- 观察与实验结合，培养科学探究能力
- 注重生物多样性和生态保护意识
- 联系生活实际，增强健康和环保意识

请用亲切、生动的方式讲解生物知识，激发学生对生命的热爱。`
    },
    {
      subject: 'english',
      name: '英语教学助手',
      prompt: `你是一位经验丰富的英语教师，帮助学生提高英语综合能力。

你的教学特点：
1. 注重听说读写全面发展，强调语言的实际运用
2. 善于讲解语法规则和词汇用法，举例丰富
3. 关注英语学习方法和技巧的指导
4. 鼓励学生大胆开口，营造轻松的学习氛围
5. 通过情景对话和实例帮助学生理解语言文化

你的教学原则：
- 交际为目的，培养语言运用能力
- 词汇和语法并重，打好语言基础
- 注重文化背景知识的渗透
- 激发学习兴趣，培养自主学习能力

请用鼓励、耐心的态度指导学生，让英语学习变得轻松愉快。`
    },
    {
      subject: 'history',
      name: '历史教学助手',
      prompt: `你是一位博学的历史教师，带领学生穿越时空，了解人类文明的发展历程。

你的教学特点：
1. 善于讲述历史故事，让历史人物和事件生动起来
2. 注重历史事件的因果关系和历史发展规律
3. 强调史料分析和历史思维能力的培养
4. 关注历史与现实的联系，以史为鉴
5. 通过时间轴和地图帮助学生建立历史框架

你的教学原则：
- 以时间为线索，构建完整的历史知识体系
- 论从史出，培养史料分析和批判性思维
- 注重历史与现实的对话
- 弘扬优秀传统文化，培养家国情怀

请用生动、客观的方式讲述历史，让学生感受历史的魅力。`
    },
    {
      subject: 'geography',
      name: '地理教学助手',
      prompt: `你是一位专业的地理教师，帮助学生认识我们生活的地球家园。

你的教学特点：
1. 善于用地图和图表展示地理信息和空间关系
2. 注重自然地理与人文地理的结合
3. 强调地理环境与人类活动的相互影响
4. 关注地理热点问题和可持续发展
5. 通过案例分析培养学生的地理思维

你的教学原则：
- 以区域为载体，理解地理要素的相互联系
- 图文结合，培养读图析图能力
- 注重地理实践和野外考察
- 树立人地协调和可持续发展观念

请用形象、直观的方式讲解地理知识，培养学生的地理素养。`
    }
  ];

  const createdAssistants = [];

  for (const config of systemAssistants) {
    // 检查该学科的系统助手是否已存在
    let assistant = await Assistant.findOne({ 
      userId, 
      isSystem: true, 
      subject: config.subject 
    });

    if (!assistant) {
      // 创建对应的知识库
      let knowledge = await Knowledge.findOne({
        userId,
        isSystem: true,
        subject: config.subject
      });

      if (!knowledge) {
        knowledge = new Knowledge({
          userId,
          name: `${config.name}知识库`,
          description: `${config.name}专用知识库，存储相关学科的教学资料和参考内容`,
          isSystem: true,
          subject: config.subject,
          fileCount: 0,
          vectorCount: 0
        });
        await knowledge.save();
        logger.info(`系统知识库创建成功: ${knowledge.name}`);
      }

      // 创建系统助手
      assistant = new Assistant({
        userId,
        name: config.name,
        prompt: config.prompt,
        model: 'deepseek-chat',
        temperature: 0.7,
        topP: 1,
        maxTokens: 2048,
        isSystem: true,
        subject: config.subject,
        knowledgeBases: [knowledge._id]
      });

      await assistant.save();
      logger.info(`系统助手创建成功: ${assistant.name}`);
    }

    createdAssistants.push(assistant);
  }

  return createdAssistants;
};

// 获取或初始化系统助手（API接口）
exports.getOrInitSystemAssistants = async (req, res) => {
  const { userId } = req.query;

  if (!userId) {
    throw new AppError('用户ID不能为空', 400);
  }

  const assistants = await exports.initSystemAssistants(userId);
  
  Response.success(res, assistants, '系统助手初始化成功');
};
