const Knowledge = require('../models/Knowledge');
const KnowledgeFile = require('../models/KnowledgeFile');
const Response = require('../utils/response');
const logger = require('../utils/logger');
const FileParser = require('../utils/fileParser');
const Vectorizer = require('../utils/vectorizer');
const fs = require('fs').promises;
const path = require('path');

exports.getKnowledgeBases = async (req, res) => {
  try {
    const { userId } = req.params;
    
    const knowledgeBases = await Knowledge.find({ userId })
      .sort({ createdAt: -1 });
    
    Response.success(res, knowledgeBases, '获取知识库列表成功');
  } catch (error) {
    logger.error('获取知识库列表失败:', error);
    Response.error(res, '获取知识库列表失败', 500);
  }
};

exports.createKnowledgeBase = async (req, res) => {
  try {
    const { userId, name, description, embeddingModel } = req.body;
    
    if (!userId || !name) {
      return Response.badRequest(res, '缺少必要参数');
    }
    
    const knowledge = new Knowledge({
      userId,
      name,
      description: description || '',
      embeddingModel: embeddingModel || process.env.EMBEDDING_MODEL || 'text-embedding-ada-002'
    });
    
    await knowledge.save();
    
    logger.info(`创建知识库成功: ${knowledge._id}`);
    Response.success(res, knowledge, '创建知识库成功');
  } catch (error) {
    logger.error('创建知识库失败:', error);
    Response.error(res, '创建知识库失败', 500);
  }
};

exports.updateKnowledgeBase = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;
    
    const knowledge = await Knowledge.findById(id);
    if (!knowledge) {
      return Response.notFound(res, '知识库不存在');
    }
    
    if (name) knowledge.name = name;
    if (description !== undefined) knowledge.description = description;
    knowledge.updatedAt = Date.now();
    
    await knowledge.save();
    
    logger.info(`更新知识库成功: ${id}`);
    Response.success(res, knowledge, '更新知识库成功');
  } catch (error) {
    logger.error('更新知识库失败:', error);
    Response.error(res, '更新知识库失败', 500);
  }
};

exports.deleteKnowledgeBase = async (req, res) => {
  try {
    const { id } = req.params;
    
    const knowledge = await Knowledge.findById(id);
    if (!knowledge) {
      return Response.notFound(res, '知识库不存在');
    }
    
    // 检查是否为系统知识库
    if (knowledge.isSystem) {
      return Response.error(res, '系统知识库不能删除', 403);
    }
    
    await KnowledgeFile.deleteMany({ knowledgeId: id });
    await Knowledge.findByIdAndDelete(id);
    
    logger.info(`删除知识库成功: ${id}`);
    Response.success(res, null, '删除知识库成功');
  } catch (error) {
    logger.error('删除知识库失败:', error);
    Response.error(res, '删除知识库失败', 500);
  }
};

exports.getKnowledgeFiles = async (req, res) => {
  try {
    const { knowledgeId } = req.params;
    
    const files = await KnowledgeFile.find({ knowledgeId })
      .sort({ createdAt: -1 });
    
    Response.success(res, files, '获取文件列表成功');
  } catch (error) {
    logger.error('获取文件列表失败:', error);
    Response.error(res, '获取文件列表失败', 500);
  }
};

exports.addFile = async (req, res) => {
  try {
    const { knowledgeId } = req.params;
    const file = req.file;
    
    if (!file) {
      return Response.badRequest(res, '未上传文件');
    }
    
    const knowledge = await Knowledge.findById(knowledgeId);
    if (!knowledge) {
      return Response.notFound(res, '知识库不存在');
    }
    
    const knowledgeFile = new KnowledgeFile({
      knowledgeId,
      name: file.originalname,
      type: 'file',
      source: file.path,
      fileSize: file.size,
      mimeType: file.mimetype,
      status: 'pending'
    });
    
    await knowledgeFile.save();
    
    processFileAsync(knowledgeFile._id, file);
    
    knowledge.fileCount += 1;
    await knowledge.save();
    
    Response.success(res, knowledgeFile, '文件上传成功，正在处理');
  } catch (error) {
    logger.error('添加文件失败:', error);
    Response.error(res, '添加文件失败', 500);
  }
};

exports.addText = async (req, res) => {
  try {
    const { knowledgeId } = req.params;
    const { name, content } = req.body;
    
    if (!name || !content) {
      return Response.badRequest(res, '缺少必要参数');
    }
    
    const knowledge = await Knowledge.findById(knowledgeId);
    if (!knowledge) {
      return Response.notFound(res, '知识库不存在');
    }
    
    const knowledgeFile = new KnowledgeFile({
      knowledgeId,
      name,
      type: 'text',
      source: 'manual',
      content,
      status: 'pending'
    });
    
    await knowledgeFile.save();
    
    processTextAsync(knowledgeFile._id, content);
    
    knowledge.fileCount += 1;
    await knowledge.save();
    
    Response.success(res, knowledgeFile, '文本添加成功，正在处理');
  } catch (error) {
    logger.error('添加文本失败:', error);
    Response.error(res, '添加文本失败', 500);
  }
};

exports.addURL = async (req, res) => {
  try {
    const { knowledgeId } = req.params;
    const { url, name } = req.body;
    
    if (!url) {
      return Response.badRequest(res, '缺少 URL 参数');
    }
    
    const knowledge = await Knowledge.findById(knowledgeId);
    if (!knowledge) {
      return Response.notFound(res, '知识库不存在');
    }
    
    const knowledgeFile = new KnowledgeFile({
      knowledgeId,
      name: name || url,
      type: 'url',
      source: url,
      status: 'pending'
    });
    
    await knowledgeFile.save();
    
    processURLAsync(knowledgeFile._id, url);
    
    knowledge.fileCount += 1;
    await knowledge.save();
    
    Response.success(res, knowledgeFile, 'URL 添加成功，正在处理');
  } catch (error) {
    logger.error('添加 URL 失败:', error);
    Response.error(res, '添加 URL 失败', 500);
  }
};

exports.deleteFile = async (req, res) => {
  try {
    const { fileId } = req.params;
    
    const file = await KnowledgeFile.findById(fileId);
    if (!file) {
      return Response.notFound(res, '文件不存在');
    }
    
    const knowledge = await Knowledge.findById(file.knowledgeId);
    if (knowledge) {
      knowledge.fileCount = Math.max(0, knowledge.fileCount - 1);
      knowledge.vectorCount = Math.max(0, knowledge.vectorCount - file.vectors.length);
      await knowledge.save();
    }
    
    await KnowledgeFile.findByIdAndDelete(fileId);
    
    logger.info(`删除文件成功: ${fileId}`);
    Response.success(res, null, '删除文件成功');
  } catch (error) {
    logger.error('删除文件失败:', error);
    Response.error(res, '删除文件失败', 500);
  }
};

exports.searchKnowledge = async (req, res) => {
  try {
    const { knowledgeId } = req.params;
    const { query, topK = 5 } = req.body;
    
    if (!query) {
      return Response.badRequest(res, '缺少查询参数');
    }
    
    const files = await KnowledgeFile.find({ 
      knowledgeId, 
      status: 'completed' 
    });
    
    if (files.length === 0) {
      return Response.success(res, [], '知识库为空');
    }
    
    const queryEmbedding = await Vectorizer.generateEmbedding(query);
    
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
    
    const results = await Vectorizer.searchSimilar(queryEmbedding, allVectors, topK);
    
    Response.success(res, results, '搜索成功');
  } catch (error) {
    logger.error('搜索知识库失败:', error);
    Response.error(res, '搜索知识库失败', 500);
  }
};

async function processFileAsync(fileId, file) {
  try {
    const knowledgeFile = await KnowledgeFile.findById(fileId);
    if (!knowledgeFile) return;
    
    knowledgeFile.status = 'processing';
    await knowledgeFile.save();
    
    const fileBuffer = await fs.readFile(file.path);
    let content = '';
    
    if (file.mimetype === 'text/plain' || file.mimetype === 'text/markdown') {
      content = fileBuffer.toString('utf-8');
    } else if (file.mimetype === 'application/pdf') {
      content = await FileParser.parsePDF(fileBuffer);
    } else {
      throw new Error('不支持的文件类型');
    }
    
    knowledgeFile.content = content;
    
    const chunks = FileParser.splitIntoChunks(content);
    const embeddings = await Vectorizer.generateEmbeddings(chunks);
    
    knowledgeFile.vectors = chunks.map((text, index) => ({
      text,
      embedding: embeddings[index],
      metadata: {}
    }));
    
    knowledgeFile.status = 'completed';
    await knowledgeFile.save();
    
    const knowledge = await Knowledge.findById(knowledgeFile.knowledgeId);
    if (knowledge) {
      knowledge.vectorCount += chunks.length;
      await knowledge.save();
    }
    
    logger.info(`文件处理成功: ${fileId}`);
  } catch (error) {
    logger.error(`文件处理失败: ${fileId}`, error);
    const knowledgeFile = await KnowledgeFile.findById(fileId);
    if (knowledgeFile) {
      knowledgeFile.status = 'failed';
      knowledgeFile.error = error.message;
      await knowledgeFile.save();
    }
  }
}

async function processTextAsync(fileId, content) {
  try {
    const knowledgeFile = await KnowledgeFile.findById(fileId);
    if (!knowledgeFile) return;
    
    knowledgeFile.status = 'processing';
    await knowledgeFile.save();
    
    const chunks = FileParser.splitIntoChunks(content);
    const embeddings = await Vectorizer.generateEmbeddings(chunks);
    
    knowledgeFile.vectors = chunks.map((text, index) => ({
      text,
      embedding: embeddings[index],
      metadata: {}
    }));
    
    knowledgeFile.status = 'completed';
    await knowledgeFile.save();
    
    const knowledge = await Knowledge.findById(knowledgeFile.knowledgeId);
    if (knowledge) {
      knowledge.vectorCount += chunks.length;
      await knowledge.save();
    }
    
    logger.info(`文本处理成功: ${fileId}`);
  } catch (error) {
    logger.error(`文本处理失败: ${fileId}`, error);
    const knowledgeFile = await KnowledgeFile.findById(fileId);
    if (knowledgeFile) {
      knowledgeFile.status = 'failed';
      knowledgeFile.error = error.message;
      await knowledgeFile.save();
    }
  }
}

async function processURLAsync(fileId, url) {
  try {
    const knowledgeFile = await KnowledgeFile.findById(fileId);
    if (!knowledgeFile) return;
    
    knowledgeFile.status = 'processing';
    await knowledgeFile.save();
    
    const content = await FileParser.parseURL(url);
    knowledgeFile.content = content;
    
    const chunks = FileParser.splitIntoChunks(content);
    const embeddings = await Vectorizer.generateEmbeddings(chunks);
    
    knowledgeFile.vectors = chunks.map((text, index) => ({
      text,
      embedding: embeddings[index],
      metadata: {}
    }));
    
    knowledgeFile.status = 'completed';
    await knowledgeFile.save();
    
    const knowledge = await Knowledge.findById(knowledgeFile.knowledgeId);
    if (knowledge) {
      knowledge.vectorCount += chunks.length;
      await knowledge.save();
    }
    
    logger.info(`URL 处理成功: ${fileId}`);
  } catch (error) {
    logger.error(`URL 处理失败: ${fileId}`, error);
    const knowledgeFile = await KnowledgeFile.findById(fileId);
    if (knowledgeFile) {
      knowledgeFile.status = 'failed';
      knowledgeFile.error = error.message;
      await knowledgeFile.save();
    }
  }
}
