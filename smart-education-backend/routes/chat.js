const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const chatController = require('../controllers/chatController');
const { asyncHandler } = require('../middleware/errorHandler');

// 配置文件上传
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads/chat');
    // 确保目录存在
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // 使用时间戳 + 随机数 + 原始扩展名
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, uniqueSuffix + ext);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp',
                          'application/pdf', 'application/msword',
                          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                          'text/plain'];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('不支持的文件类型'));
    }
  }
});

// 上传文件
router.post('/upload', upload.single('file'), asyncHandler(chatController.uploadFile));

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
