const OpenAI = require('openai');
const logger = require('./logger');

const openai = new OpenAI({
  apiKey: process.env.EMBEDDING_API_KEY || process.env.OPENAI_API_KEY,
  baseURL: process.env.EMBEDDING_BASE_URL || 'https://api.openai.com/v1'
});

class Vectorizer {
  static async generateEmbedding(text) {
    try {
      const model = process.env.EMBEDDING_MODEL || 'text-embedding-ada-002';
      const response = await openai.embeddings.create({
        model: model,
        input: text
      });
      
      return response.data[0].embedding;
    } catch (error) {
      logger.error('生成向量失败:', error);
      throw error;
    }
  }

  static async generateEmbeddings(texts) {
    try {
      const embeddings = [];
      for (const text of texts) {
        const embedding = await this.generateEmbedding(text);
        embeddings.push(embedding);
      }
      return embeddings;
    } catch (error) {
      logger.error('批量生成向量失败:', error);
      throw error;
    }
  }

  static cosineSimilarity(vecA, vecB) {
    if (vecA.length !== vecB.length) {
      throw new Error('向量维度不匹配');
    }

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < vecA.length; i++) {
      dotProduct += vecA[i] * vecB[i];
      normA += vecA[i] * vecA[i];
      normB += vecB[i] * vecB[i];
    }

    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }

  static async searchSimilar(queryEmbedding, vectors, topK = 5) {
    const similarities = vectors.map((vector, index) => ({
      index,
      score: this.cosineSimilarity(queryEmbedding, vector.embedding),
      text: vector.text,
      metadata: vector.metadata
    }));

    similarities.sort((a, b) => b.score - a.score);
    return similarities.slice(0, topK);
  }
}

module.exports = Vectorizer;
