const express = require('express');
const router = express.Router();
const Response = require('../utils/response');
const { asyncHandler } = require('../middleware/errorHandler');
const { listChangelogs, getChangelog } = require('../services/changelogService');

router.get('/list', asyncHandler(async (req, res) => {
  const list = await listChangelogs();
  Response.success(res, { list }, '获取更新日志列表成功');
}));

router.get('/:version', asyncHandler(async (req, res) => {
  const data = await getChangelog(req.params.version);
  Response.success(res, data, '获取更新日志成功');
}));

module.exports = router;
