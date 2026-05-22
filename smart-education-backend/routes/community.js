const express = require('express');
const router = express.Router();
const Question = require('../models/Question');
const Answer = require('../models/Answer');
const Favorite = require('../models/Favorite');
const AnswerLike = require('../models/AnswerLike');
const Response = require('../utils/response');
const notificationService = require('../services/notificationService');

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
    
    return Response.success(res, questionsWithUserFlag, '获取问题列表成功');
  } catch (error) {
    return Response.error(res, '获取问题列表失败', 500);
  }
});

// 发布问题
router.post('/questions', async (req, res) => {
  try {
    const { title, content, tags, userId, userName, userAvatar } = req.body;
    
    if (!title || !content) {
      return Response.badRequest(res, '问题标题和内容不能为空');
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
    
    return Response.success(res, questionData, '发布成功');
  } catch (error) {
    return Response.error(res, '发布问题失败', 500);
  }
});

// 删除问题
router.delete('/questions/:id', async (req, res) => {
  try {
    const questionId = req.params.id;
    const { userId } = req.body;
    
    const question = await Question.findById(questionId);
    
    if (!question) {
      return Response.notFound(res, '问题不存在');
    }
    
    if (question.userId !== userId) {
      return Response.forbidden(res, '只能删除自己发布的问题');
    }
    
    await Question.findByIdAndDelete(questionId);
    await Answer.deleteMany({ questionId });
    await Favorite.deleteMany({ questionId });
    
    return Response.success(res, null, '删除成功');
  } catch (error) {
    return Response.error(res, '删除问题失败', 500);
  }
});

// 标记问题为已解决
router.post('/questions/:id/solve', async (req, res) => {
  try {
    const questionId = req.params.id;
    const { userId } = req.body;
    
    const question = await Question.findById(questionId);
    
    if (!question) {
      return Response.notFound(res, '问题不存在');
    }
    
    if (question.userId !== userId) {
      return Response.forbidden(res, '只有提问者可以标记问题为已解决');
    }
    
    question.solved = true;
    await question.save();
    
    return Response.success(res, null, '标记成功');
  } catch (error) {
    return Response.error(res, '标记失败', 500);
  }
});

// 标记问题为未解决
router.post('/questions/:id/unsolve', async (req, res) => {
  try {
    const questionId = req.params.id;
    const { userId } = req.body;
    
    const question = await Question.findById(questionId);
    
    if (!question) {
      return Response.notFound(res, '问题不存在');
    }
    
    if (question.userId !== userId) {
      return Response.forbidden(res, '只有提问者可以标记问题为未解决');
    }
    
    question.solved = false;
    await question.save();
    
    return Response.success(res, null, '标记成功');
  } catch (error) {
    return Response.error(res, '标记失败', 500);
  }
});

// 获取我的收藏列表
router.get('/favorites', async (req, res) => {
  try {
    const { userId } = req.query;
    
    if (!userId) {
      return Response.badRequest(res, '用户ID不能为空');
    }
    
    const favorites = await Favorite.find({ userId }).lean();
    const favoriteIds = favorites.map(f => f.questionId.toString());
    
    return Response.success(res, favoriteIds, '获取收藏列表成功');
  } catch (error) {
    return Response.error(res, '获取收藏列表失败', 500);
  }
});

// 添加收藏
router.post('/favorites', async (req, res) => {
  try {
    const { userId, questionId } = req.body;
    
    if (!userId || !questionId) {
      return Response.badRequest(res, '用户ID和问题ID不能为空');
    }
    
    const existingFavorite = await Favorite.findOne({ userId, questionId });
    if (existingFavorite) {
      return Response.badRequest(res, '已经收藏过该问题');
    }
    
    await Favorite.create({ userId, questionId });
    
    const favorites = await Favorite.find({ userId }).lean();
    const favoriteIds = favorites.map(f => f.questionId.toString());
    
    return Response.success(res, favoriteIds, '收藏成功');
  } catch (error) {
    return Response.error(res, '添加收藏失败', 500);
  }
});

// 取消收藏
router.delete('/favorites/:questionId', async (req, res) => {
  try {
    const questionId = req.params.questionId;
    const { userId } = req.body;
    
    if (!userId) {
      return Response.badRequest(res, '用户ID不能为空');
    }
    
    await Favorite.deleteOne({ userId, questionId });
    
    const favorites = await Favorite.find({ userId }).lean();
    const favoriteIds = favorites.map(f => f.questionId.toString());
    
    return Response.success(res, favoriteIds, '取消收藏成功');
  } catch (error) {
    return Response.error(res, '取消收藏失败', 500);
  }
});

// 获取统计数据
router.get('/stats', async (req, res) => {
  try {
    const { userId } = req.query;
    
    const totalQuestions = await Question.countDocuments();
    const unsolvedQuestions = await Question.countDocuments({ solved: false });
    const myQuestions = userId ? await Question.countDocuments({ userId }) : 0;
    
    return Response.success(res, {
      totalQuestions,
      unsolvedQuestions,
      myQuestions
    }, '获取统计数据成功');
  } catch (error) {
    return Response.error(res, '获取统计数据失败', 500);
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
    
    return Response.success(res, answersWithLikeStatus, '获取回答列表成功');
  } catch (error) {
    return Response.error(res, '获取回答列表失败', 500);
  }
});

// 提交回答
router.post('/questions/:id/answers', async (req, res) => {
  try {
    const questionId = req.params.id;
    const { content, userId, userName, userAvatar } = req.body;
    
    if (!content) {
      return Response.badRequest(res, '回答内容不能为空');
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
    
    // 发送回复通知给问题作者
    try {
      const question = await Question.findById(questionId);
      if (question && question.userId !== userId) {
        await notificationService.sendNotification(
          question.userId,
          "reply",
          "💬 您的问题有新回复",
          `用户 ${userName || '匿名用户'} 回复了您的问题`,
          {
            relatedId: questionId,
            relatedType: "question",
            relatedData: {
              userName: userName || '匿名用户',
              userAvatar: userAvatar || 'https://cube.elemecdn.com/3/7c/3ea6beec64369c2642b92c6726f1epng.png',
              questionTitle: question.title,
              questionId: questionId
            }
          }
        );
      }
    } catch (error) {
      console.error("发送回复通知失败：", error);
    }
    
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
    
    return Response.success(res, {
      ...newAnswer.toObject(),
      id: newAnswer._id.toString(),
      createTime: formattedTime,
      liked: false
    }, '回答成功');
  } catch (error) {
    return Response.error(res, '提交回答失败', 500);
  }
});

// 点赞回答
router.post('/answers/:id/like', async (req, res) => {
  try {
    const answerId = req.params.id;
    const { userId } = req.body;
    
    const existingLike = await AnswerLike.findOne({ answerId, userId });
    if (existingLike) {
      return Response.badRequest(res, '已经点赞过了');
    }
    
    await AnswerLike.create({ answerId, userId });
    await Answer.findByIdAndUpdate(answerId, { $inc: { likeCount: 1 } });
    
    // 发送点赞通知给回答作者
    try {
      const answer = await Answer.findById(answerId);
      if (answer && answer.userId !== userId) {
        await notificationService.sendNotification(
          answer.userId,
          "like",
          "❤️ 您的回答被点赞",
          `您的回答获得了点赞`,
          {
            relatedId: answerId,
            relatedType: "answer"
          }
        );
      }
    } catch (error) {
      console.error("发送点赞通知失败：", error);
    }
    
    return Response.success(res, null, '点赞成功');
  } catch (error) {
    return Response.error(res, '点赞失败', 500);
  }
});

// 取消点赞回答
router.delete('/answers/:id/like', async (req, res) => {
  try {
    const answerId = req.params.id;
    const { userId } = req.body;
    
    await AnswerLike.deleteOne({ answerId, userId });
    await Answer.findByIdAndUpdate(answerId, { $inc: { likeCount: -1 } });
    
    return Response.success(res, null, '取消点赞成功');
  } catch (error) {
    return Response.error(res, '取消点赞失败', 500);
  }
});

// 设置最佳答案
router.post('/answers/:id/mark-best', async (req, res) => {
  try {
    const answerId = req.params.id;
    const { questionId } = req.body;
    
    await Answer.updateMany({ questionId }, { isBest: false });
    await Answer.findByIdAndUpdate(answerId, { isBest: true });
    
    return Response.success(res, null, '设置成功');
  } catch (error) {
    return Response.error(res, '设置最佳答案失败', 500);
  }
});

module.exports = router;
