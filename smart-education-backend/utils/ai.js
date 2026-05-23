// AI工具类 - 封装OpenAI兼容接口
const OpenAI = require("openai");

/**
 * AI工具类
 * 提供智能对话和答题功能
 * 
 * 使用 SiliconFlow 提供的 DeepSeek-V4-Flash 模型
 * 兼容 OpenAI SDK
 */
class AI {
  constructor() {
    // 从环境变量读取配置
    this.apiKey = process.env.OPENAI_API_KEY || process.env.DEEPSEEK_API_KEY;
    this.baseURL = process.env.OPENAI_BASE_URL || 'https://api.siliconflow.cn/v1';
    this.model = process.env.OPENAI_MODEL || 'deepseek-ai/DeepSeek-V3';
    
    if (!this.apiKey) {
      console.warn('⚠️ OPENAI_API_KEY 未配置，请在 .env 文件中设置');
      this.client = null;
    } else {
      this.client = new OpenAI({
        apiKey: this.apiKey,
        baseURL: this.baseURL,
      });
    }
    
    console.log('🔧 AI服务初始化完成');
    console.log('📝 API Key:', this.apiKey ? this.apiKey.substring(0, 10) + '...' : '未配置');
    console.log('🌐 Base URL:', this.baseURL);
    console.log('🤖 Model:', this.model);
  }

  /**
   * AI 对话接口
   * @param {string} message - 用户输入的问题
   * @param {Array} history - 历史对话记录（可选）
   * @returns {Promise<string>} - AI回复内容
   */
  async chat(message, history = []) {
    if (!this.client) {
      throw new Error('AI 服务未配置，请检查 OPENAI_API_KEY 等环境变量');
    }

    try {
      console.log('🔄 调用 AI API...');
      console.log(`🔄 使用模型: ${this.model}`);

      // 构建对话消息列表
      const messages = [];
      if (history && history.length > 0) {
        messages.push(...history);
      }
      messages.push({ role: "user", content: message });

      // 调用 AI API
      const chatCompletion = await this.client.chat.completions.create({
        messages: messages,
        model: this.model,
      });

      // 提取 AI 回复内容
      if (chatCompletion.choices && chatCompletion.choices.length > 0) {
        const result = chatCompletion.choices[0].message.content;
        console.log(`✅ 调用成功（模型：${this.model}）`);
        return result;
      }

      throw new Error("AI 未返回有效回复");
    } catch (error) {
      console.error('❌ AI 调用失败:', error.message);
      throw error;
    }
  }

  /**
   * AI 流式对话接口（逐字返回，提升用户体验）
   * @param {string} message - 用户输入的问题
   * @param {Array} history - 历史对话记录（可选）
   * @param {Function} onChunk - 流式数据回调函数
   * @returns {Promise<string>} - 完整的AI回复内容
   */
  async chatStream(message, history = [], onChunk = null) {
    if (!this.client) {
      throw new Error('AI 服务未配置，请检查 OPENAI_API_KEY 等环境变量');
    }

    try {
      console.log(`🤖 开始流式调用，模型: ${this.model}`);

      // 构建对话消息列表
      const messages = [];
      if (history && history.length > 0) {
        messages.push(...history);
      }
      messages.push({ role: "user", content: message });

      // 创建流式请求
      const stream = await this.client.chat.completions.create({
        messages: messages,
        model: this.model,
        stream: true,
      });

      let fullContent = "";

      // 逐块接收 AI 回复
      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content || '';
        if (content) {
          fullContent += content;
          // 如果提供了回调函数，实时返回每一块内容
          if (onChunk && typeof onChunk === 'function') {
            onChunk(content);
          }
        }
      }

      console.log(`✅ 流式回复完成，长度: ${fullContent.length} 字符`);
      return fullContent;
    } catch (error) {
      console.error("❌ 流式调用失败：", error.message);
      console.log("⚠️ 降级使用非流式调用");
      const result = await this.chat(message, history);
      if (onChunk && result) {
        onChunk(result);
      }
      return result;
    }
  }

  /**
   * 教育问答接口
   * @param {string} question - 学生提出的问题
   * @returns {Promise<string>} - AI回复内容
   */
  async answerQuestion(question) {
    try {
      const systemPrompt = `你是一位专业的教育助手，擅长解答学生的学习问题。请遵循以下原则：
1. 回答要准确、清晰、易懂
2. 对于数学题，要给出详细的解题步骤
3. 对于概念题，要先解释概念，再举例说明
4. 鼓励学生独立思考，适当给出提示而不是直接给答案
5. 语言要亲切友好，符合学生的理解水平

学生的问题是：${question}`;

      return await this.chat(systemPrompt);
    } catch (error) {
      console.error("❌ 教育问答失败：", error.message);
      throw error;
    }
  }
}

// 创建单例实例
const ai = new AI();

module.exports = ai;
