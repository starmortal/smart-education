const logger = require('./logger');
const axios = require('axios');
const cheerio = require('cheerio');

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
      const pdfParse = require('pdf-parse');
      const data = await pdfParse(buffer);
      return data.text;
    } catch (error) {
      logger.error('解析 PDF 失败:', error);
      return '暂不支持 PDF 解析，请安装 pdf-parse 库';
    }
  }

  static async parseWord(buffer) {
    try {
      const mammoth = require('mammoth');
      const result = await mammoth.extractRawText({ buffer });
      return result.value;
    } catch (error) {
      logger.error('解析 Word 失败:', error);
      return '暂不支持 Word 解析，请安装 mammoth 库';
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
      logger.info(`开始抓取 URL: ${url}`);
      
      // 发送 HTTP 请求获取网页内容
      const response = await axios.get(url, {
        timeout: 30000, // 30秒超时
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
      });
      
      // 使用 cheerio 解析 HTML
      const $ = cheerio.load(response.data);
      
      // 移除脚本和样式标签
      $('script').remove();
      $('style').remove();
      $('nav').remove();
      $('footer').remove();
      $('header').remove();
      
      // 提取标题
      const title = $('title').text().trim() || $('h1').first().text().trim() || 'Untitled';
      
      // 提取主要内容
      let content = '';
      
      // 尝试从常见的内容容器中提取
      const contentSelectors = [
        'article',
        'main',
        '.content',
        '.post-content',
        '.article-content',
        '#content',
        '.entry-content',
        'body'
      ];
      
      for (const selector of contentSelectors) {
        const element = $(selector);
        if (element.length > 0) {
          content = element.text();
          break;
        }
      }
      
      // 如果没有找到内容，使用 body
      if (!content) {
        content = $('body').text();
      }
      
      // 清理文本：移除多余空白和换行
      content = content
        .replace(/\s+/g, ' ')
        .replace(/\n+/g, '\n')
        .trim();
      
      // 组合标题和内容
      const fullText = `# ${title}\n\n${content}`;
      
      logger.info(`URL 抓取成功: ${url}, 内容长度: ${fullText.length}`);
      
      return fullText;
    } catch (error) {
      logger.error(`解析 URL 失败: ${url}`, error);
      
      // 返回更详细的错误信息
      if (error.code === 'ENOTFOUND') {
        throw new Error(`无法访问该网址，请检查 URL 是否正确: ${url}`);
      } else if (error.code === 'ETIMEDOUT') {
        throw new Error(`访问超时，请稍后重试: ${url}`);
      } else if (error.response) {
        throw new Error(`网页返回错误 ${error.response.status}: ${url}`);
      } else {
        throw new Error(`抓取失败: ${error.message}`);
      }
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
