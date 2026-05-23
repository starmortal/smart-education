const express = require('express');
const router = express.Router();
const aiController = require('../controllers/aiController');
const scoreAnalysisController = require('../controllers/scoreAnalysisController');
const { authMiddleware } = require('../middleware/authMiddleware');

// AI 分析和推荐
router.post('/analyze-question', aiController.analyzeQuestion);
router.get('/recommend-questions', aiController.recommendQuestions);
router.post('/suggest-tags', aiController.suggestTags);
router.get('/learning-advice', aiController.getLearningAdvice);
router.get('/hot-topics', aiController.getHotTopics);
router.get('/community-stats', aiController.getCommunityStats);
router.get('/similar-questions/:questionId', aiController.findSimilarQuestions);

// 个人中心 AI 成绩分析
router.post('/analyze-scores-stream', authMiddleware, scoreAnalysisController.analyzeScoresStream);
router.post('/save-score-analysis', authMiddleware, scoreAnalysisController.saveScoreAnalysis);
router.get('/score-analysis-list', authMiddleware, scoreAnalysisController.getScoreAnalysisList);
router.get('/score-analysis/:id', authMiddleware, scoreAnalysisController.getScoreAnalysisDetail);
router.delete('/score-analysis/:id', authMiddleware, scoreAnalysisController.deleteScoreAnalysis);

module.exports = router;
