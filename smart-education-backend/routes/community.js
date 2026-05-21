const express = require('express');
const router = express.Router();
const Question = require('../models/Question');
const Answer = require('../models/Answer');
const Favorite = require('../models/Favorite');
const AnswerLike = require('../models/AnswerLike');

/**
 * 学习社区路由模块
 * 功能：问答社区、问题发布、回答互动、点赞收藏
 * 用途：为学生提供互助学习平台，促进知识分享和交流
 */

// 获取问题列表
router.get('/questions', async (req, res) => {
  try {
    const { userId } = req.query;
    
    const questions = await Question.find()
      .sort({ createTime: -1 })
      .lean();
    
    const questionsWithUserFlag = questions.map(q => {
      const formattedTime = new Date(q.createTime).toLocaleString('zh-CN', {
        timeZone: 'Asia/Shanghai',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
      }).replace(/\//g, '-');
      
      return {
        ...q,
        id: q._id.toString(),
        createTime: formattedTime,
        isMyQuestion: q.userId === userId
      };
    });
    
    res.json({
      success: true,
      data: questionsWithUserFlag
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '获取问题列表失败',
      error: error.message
    });
  }
});

// 发布问题
router.post('/questions', async (req, res) => {
  try {
    const { title, content, tags, userId, userName, userAvatar } = req.body;
    
    if (!title || !content) {
      return res.status(400).json({
        success: false,
        message: '问题标题和内容不能为空'
      });
    }
    
    const newQuestion = new Question({
      title,
      content,
      tags: tags || [],
      userId,
      userName: userName || '匿名用户',
      userAvatar: userAvatar || 'https://cube.elemecdn.com/3/7c/3ea6beec64369c2642b92c6726f1epng.png',
      viewCount: 0,
      answerCount: 0,
      likeCount: 0,
      solved: false
    });
    
    await newQuestion.save();
    
    const formattedTime = new Date(newQuestion.createTime).toLocaleString('zh-CN', {
      timeZone: 'Asia/Shanghai',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    }).replace(/\//g, '-');
    
    const questionData = {
      ...newQuestion.toObject(),
      id: newQuestion._id.toString(),
      createTime: formattedTime
    };
    
    res.json({
      success: true,
      message: '发布成功',
      data: questionData
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '发布问题失败',
      error: error.message
    });
  }
});

// 删除问题
router.delete('/questions/:id', async (req, res) => {
  try {
    const questionId = req.params.id;
    const { userId } = req.body;
    
    const question = await Question.findById(questionId);
    
    if (!question) {
      return res.status(404).json({
        success: false,
        message: '问题不存在'
      });
    }
    
    if (question.userId !== userId) {
      return res.status(403).json({
        success: false,
        message: '只能删除自己发布的问题'
      });
    }
    
    await Question.findByIdAndDelete(questionId);
    await Answer.deleteMany({ questionId });
    await Favorite.deleteMany({ questionId });
    
    res.json({
      success: true,
      message: '删除成功'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '删除问题失败',
      error: error.message
    });
  }
});

// 标记问题为已解决
router.post('/questions/:id/solve', async (req, res) => {
  try {
    const questionId = req.params.id;
    const { userId } = req.body;
    
    const question = await Question.findById(questionId);
    
    if (!question) {
      return res.status(404).json({
        success: false,
        message: '问题不存在'
      });
    }
    
    if (question.userId !== userId) {
      return res.status(403).json({
        success: false,
        message: '只有提问者可以标记问题为已解决'
      });
    }
    
    question.solved = true;
    await question.save();
    
    res.json({
      success: true,
      message: '标记成功'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '标记失败',
      error: error.message
    });
  }
});

// 标记问题为未解决
router.post('/questions/:id/unsolve', async (req, res) => {
  try {
    const questionId = req.params.id;
    const { userId } = req.body;
    
    const question = await Question.findById(questionId);
    
    if (!question) {
      return res.status(404).json({
        success: false,
        message: '问题不存在'
      });
    }
    
    if (question.userId !== userId) {
      return res.status(403).json({
        success: false,
        message: '只有提问者可以标记问题为未解决'
      });
    }
    
    question.solved = false;
    await question.save();
    
    res.json({
      success: true,
      message: '标记成功'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '标记失败',
      error: error.message
    });
  }
});

// 获取我的收藏列表
router.get('/favorites', async (req, res) => {
  try {
    const { userId } = req.query;
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: '用户ID不能为空'
      });
    }
    
    const favorites = await Favorite.find({ userId }).lean();
    const favoriteIds = favorites.map(f => f.questionId.toString());
    
    res.json({
      success: true,
      data: favoriteIds
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '获取收藏列表失败',
      error: error.message
    });
  }
});

// 添加收藏
router.post('/favorites', async (req, res) => {
  try {
    const { userId, questionId } = req.body;
    
    if (!userId || !questionId) {
      return res.status(400).json({
        success: false,
        message: '用户ID和问题ID不能为空'
      });
    }
    
    const existingFavorite = await Favorite.findOne({ userId, questionId });
    if (existingFavorite) {
      return res.status(400).json({
        success: false,
        message: '已经收藏过该问题'
      });
    }
    
    await Favorite.create({ userId, questionId });
    
    const favorites = await Favorite.find({ userId }).lean();
    const favoriteIds = favorites.map(f => f.questionId.toString());
    
    res.json({
      success: true,
      message: '收藏成功',
      data: favoriteIds
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '添加收藏失败',
      error: error.message
    });
  }
});

// 取消收藏
router.delete('/favorites/:questionId', async (req, res) => {
  try {
    const questionId = req.params.questionId;
    const { userId } = req.body;
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: '用户ID不能为空'
      });
    }
    
    await Favorite.deleteOne({ userId, questionId });
    
    const favorites = await Favorite.find({ userId }).lean();
    const favoriteIds = favorites.map(f => f.questionId.toString());
    
    res.json({
      success: true,
      message: '取消收藏成功',
      data: favoriteIds
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '取消收藏失败',
      error: error.message
    });
  }
});

// 获取统计数据
router.get('/stats', async (req, res) => {
  try {
    const { userId } = req.query;
    
    const totalQuestions = await Question.countDocuments();
    const unsolvedQuestions = await Question.countDocuments({ solved: false });
    const myQuestions = userId ? await Question.countDocuments({ userId }) : 0;
    
    res.json({
      success: true,
      data: {
        totalQuestions,
        unsolvedQuestions,
        myQuestions
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '获取统计数据失败',
      error: error.message
    });
  }
});

// 获取问题的回答列表
router.get('/questions/:id/answers', async (req, res) => {
  try {
    const questionId = req.params.id;
    const { userId } = req.query;
    
    const answers = await Answer.find({ questionId })
      .sort({ createTime: -1 })
      .lean();
    
    const answerIds = answers.map(a => a._id);
    const likes = await AnswerLike.find({ 
      answerId: { $in: answerIds },
      userId 
    }).lean();
    
    const likedAnswerIds = new Set(likes.map(l => l.answerId.toString()));
    
    const answersWithLikeStatus = answers.map(answer => ({
      ...answer,
      id: answer._id.toString(),
      liked: likedAnswerIds.has(answer._id.toString()),
      createTime: new Date(answer.createTime).toLocaleString('zh-CN', {
        timeZone: 'Asia/Shanghai',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
      }).replace(/\//g, '-')
    }));
    
    res.json({
      success: true,
      data: answersWithLikeStatus
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '获取回答列表失败',
      error: error.message
    });
  }
});

// 提交回答
router.post('/questions/:id/answers', async (req, res) => {
  try {
    const questionId = req.params.id;
    const { content, userId, userName, userAvatar } = req.body;
    
    if (!content) {
      return res.status(400).json({
        success: false,
        message: '回答内容不能为空'
      });
    }
    
    const newAnswer = await Answer.create({
      questionId,
      content,
      userId,
      userName: userName || '匿名用户',
      userAvatar: userAvatar || 'https://cube.elemecdn.com/3/7c/3ea6beec64369c2642b92c6726f1epng.png',
      likeCount: 0,
      isBest: false
    });
    
    await Question.findByIdAndUpdate(questionId, {
      $inc: { answerCount: 1 }
    });
    
    const formattedTime = new Date(newAnswer.createTime).toLocaleString('zh-CN', {
      timeZone: 'Asia/Shanghai',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    }).replace(/\//g, '-');
    
    res.json({
      success: true,
      message: '回答成功',
      data: {
        ...newAnswer.toObject(),
        id: newAnswer._id.toString(),
        createTime: formattedTime,
        liked: false
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '提交回答失败',
      error: error.message
    });
  }
});

// 点赞回答
router.post('/answers/:id/like', async (req, res) => {
  try {
    const answerId = req.params.id;
    const { userId } = req.body;
    
    const existingLike = await AnswerLike.findOne({ answerId, userId });
    if (existingLike) {
      return res.status(400).json({
        success: false,
        message: '已经点赞过了'
      });
    }
    
    await AnswerLike.create({ answerId, userId });
    await Answer.findByIdAndUpdate(answerId, { $inc: { likeCount: 1 } });
    
    res.json({
      success: true,
      message: '点赞成功'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '点赞失败',
      error: error.message
    });
  }
});

// 取消点赞回答
router.delete('/answers/:id/like', async (req, res) => {
  try {
    const answerId = req.params.id;
    const { userId } = req.body;
    
    await AnswerLike.deleteOne({ answerId, userId });
    await Answer.findByIdAndUpdate(answerId, { $inc: { likeCount: -1 } });
    
    res.json({
      success: true,
      message: '取消点赞成功'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '取消点赞失败',
      error: error.message
    });
  }
});

// 设置最佳答案
router.post('/answers/:id/mark-best', async (req, res) => {
  try {
    const answerId = req.params.id;
    const { questionId } = req.body;
    
    await Answer.updateMany({ questionId }, { isBest: false });
    await Answer.findByIdAndUpdate(answerId, { isBest: true });
    
    res.json({
      success: true,
      message: '设置成功'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '设置最佳答案失败',
      error: error.message
    });
  }
});

module.exports = router;
