const express = require('express');
const router = express.Router();
const socialController = require('../controllers/socialController');

// 关注相关
router.post('/follow/:userId', socialController.followUser);
router.delete('/follow/:userId', socialController.unfollowUser);
router.get('/following', socialController.getFollowing);
router.get('/followers', socialController.getFollowers);
router.get('/follow-status', socialController.checkFollowStatus);
router.get('/following-questions', socialController.getFollowingQuestions);
router.get('/user-profile/:userId', socialController.getUserProfile);

module.exports = router;
