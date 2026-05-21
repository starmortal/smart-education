const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');
const { asyncHandler } = require('../middleware/errorHandler');

// 创建话题
router.post('/topic/create', asyncHandler(chatController.createTopic));

// 获取助手下的所有话题
router.get('/topic/list', asyncHandler(chatController.getTopics));

// 获取话题详情
router.get('/topic/:id', asyncHandler(chatController.getTopic));

// 更新话题标题
router.put('/topic/:id', asyncHandler(chatController.updateTopic));

// 删除话题
router.delete('/topic/:id', asyncHandler(chatController.deleteTopic));

// 发送消息
router.post('/message/send', asyncHandler(chatController.sendMessage));

// 清空话题消息
router.delete('/topic/:id/messages', asyncHandler(chatController.clearMessages));

module.exports = router;
