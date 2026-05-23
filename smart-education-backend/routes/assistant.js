const express = require('express');
const router = express.Router();
const assistantController = require('../controllers/assistantController');
const { asyncHandler } = require('../middleware/errorHandler');

// 创建助手
router.post('/create', asyncHandler(assistantController.createAssistant));

// 初始化系统学科助手
router.get('/init-system', asyncHandler(assistantController.getOrInitSystemAssistants));

// 获取用户的所有助手
router.get('/list', asyncHandler(assistantController.getAssistants));

// 获取单个助手详情
router.get('/:id', asyncHandler(assistantController.getAssistant));

// 更新助手
router.put('/:id', asyncHandler(assistantController.updateAssistant));

// 删除助手
router.delete('/:id', asyncHandler(assistantController.deleteAssistant));

module.exports = router;
