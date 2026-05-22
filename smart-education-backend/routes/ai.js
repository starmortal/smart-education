const express = require('express');
const router = express.Router();
const aiController = require('../controllers/aiController');

// AI 分析和推荐
router.post('/analyze-question', aiController.analyzeQuestion);
router.get('/recommend-questions', aiController.recommendQuestions);
router.post('/suggest-tags', aiController.suggestTags);
router.get('/learning-advice', aiController.getLearningAdvice);
router.get('/hot-topics', aiController.getHotTopics);
router.get('/community-stats', aiController.getCommunityStats);
router.get('/similar-questions/:questionId', aiController.findSimilarQuestions);

module.exports = router;
