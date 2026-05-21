const logger = require('./logger');

class FileParser {
  static async parseText(content) {
    try {
      return content;
    } catch (error) {
      logger.error('解析文本失败:', error);
      throw error;
    }
  }

  static async parsePDF(buffer) {
    try {
      return '暂不支持 PDF 解析，请安装 pdf-parse 库';
    } catch (error) {
      logger.error('解析 PDF 失败:', error);
      throw error;
    }
  }

  static async parseWord(buffer) {
    try {
      return '暂不支持 Word 解析，请安装 mammoth 库';
    } catch (error) {
      logger.error('解析 Word 失败:', error);
      throw error;
    }
  }

  static async parseMarkdown(content) {
    try {
      return content;
    } catch (error) {
      logger.error('解析 Markdown 失败:', error);
      throw error;
    }
  }

  static async parseURL(url) {
    try {
      return `暂不支持 URL 抓取，请安装 cheerio 库。URL: ${url}`;
    } catch (error) {
      logger.error('解析 URL 失败:', error);
      throw error;
    }
  }

  static splitIntoChunks(text, chunkSize = 500) {
    const chunks = [];
    const sentences = text.split(/[。！？\n]+/).filter(s => s.trim());
    
    let currentChunk = '';
    for (const sentence of sentences) {
      if ((currentChunk + sentence).length > chunkSize && currentChunk) {
        chunks.push(currentChunk.trim());
        currentChunk = sentence;
      } else {
        currentChunk += sentence + '。';
      }
    }
    
    if (currentChunk.trim()) {
      chunks.push(currentChunk.trim());
    }
    
    return chunks;
  }
}

module.exports = FileParser;
