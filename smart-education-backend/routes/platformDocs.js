const express = require('express');
const router = express.Router();
const Response = require('../utils/response');
const { asyncHandler } = require('../middleware/errorHandler');
const { listPlatformDocs, getPlatformDoc } = require('../services/platformDocService');

router.get('/list', asyncHandler(async (req, res) => {
  const list = listPlatformDocs();
  Response.success(res, { list }, '获取平台文档列表成功');
}));

router.get('/:slug', asyncHandler(async (req, res) => {
  const data = await getPlatformDoc(req.params.slug);
  Response.success(res, data, '获取平台文档成功');
}));

module.exports = router;
