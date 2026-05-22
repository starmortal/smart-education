const Follow = require('../models/Follow');
const User = require('../models/User');
const Question = require('../models/Question');
const Response = require('../utils/response');
const logger = require('../utils/logger');

// 关注用户
exports.followUser = async (req, res) => {
  try {
    const { userId } = req.body;
    const followingId = req.params.userId;
    
    // 不能关注自己
    if (userId === followingId) {
      return Response.badRequest(res, '不能关注自己');
    }
    
    // 检查是否已关注
    const existingFollow = await Follow.findOne({
      followerId: userId,
      followingId: followingId
    });
    
    if (existingFollow) {
      return Response.badRequest(res, '已经关注过该用户');
    }
    
    // 创建关注关系
    const follow = new Follow({
      followerId: userId,
      followingId: followingId
    });
    
    await follow.save();
    
    // 更新用户统计（可选，如果User模型有这些字段）
    // await User.findByIdAndUpdate(userId, { $inc: { followingCount: 1 } });
    // await User.findByIdAndUpdate(followingId, { $inc: { followerCount: 1 } });
    
    logger.info(`用户 ${userId} 关注了用户 ${followingId}`);
    Response.success(res, null, '关注成功');
  } catch (error) {
    logger.error('关注用户失败：', error);
    Response.error(res, '关注失败', 500);
  }
};

// 取消关注
exports.unfollowUser = async (req, res) => {
  try {
    const { userId } = req.body;
    const followingId = req.params.userId;
    
    const result = await Follow.findOneAndDelete({
      followerId: userId,
      followingId: followingId
    });
    
    if (!result) {
      return Response.notFound(res, '未找到关注关系');
    }
    
    // 更新用户统计（可选）
    // await User.findByIdAndUpdate(userId, { $inc: { followingCount: -1 } });
    // await User.findByIdAndUpdate(followingId, { $inc: { followerCount: -1 } });
    
    logger.info(`用户 ${userId} 取消关注用户 ${followingId}`);
    Response.success(res, null, '取消关注成功');
  } catch (error) {
    logger.error('取消关注失败：', error);
    Response.error(res, '取消关注失败', 500);
  }
};

// 获取关注列表
exports.getFollowing = async (req, res) => {
  try {
    const { userId } = req.query;
    
    const follows = await Follow.find({
      followerId: userId,
      status: 'active'
    }).sort({ createTime: -1 });
    
    const followingIds = follows.map(f => f.followingId);
    
    // 获取用户详细信息
    const users = await User.find({ _id: { $in: followingIds } })
      .select('nickname avatar school grade');
    
    const result = users.map(user => {
      const follow = follows.find(f => f.followingId === user._id.toString());
      return {
        id: user._id,
        nickname: user.nickname,
        avatar: user.avatar,
        school: user.school,
        grade: user.grade,
        followTime: follow.createTime
      };
    });
    
    Response.success(res, result, '获取关注列表成功');
  } catch (error) {
    logger.error('获取关注列表失败：', error);
    Response.error(res, '获取关注列表失败', 500);
  }
};

// 获取粉丝列表
exports.getFollowers = async (req, res) => {
  try {
    const { userId } = req.query;
    
    const follows = await Follow.find({
      followingId: userId,
      status: 'active'
    }).sort({ createTime: -1 });
    
    const followerIds = follows.map(f => f.followerId);
    
    // 获取用户详细信息
    const users = await User.find({ _id: { $in: followerIds } })
      .select('nickname avatar school grade');
    
    const result = users.map(user => {
      const follow = follows.find(f => f.followerId === user._id.toString());
      return {
        id: user._id,
        nickname: user.nickname,
        avatar: user.avatar,
        school: user.school,
        grade: user.grade,
        followTime: follow.createTime
      };
    });
    
    Response.success(res, result, '获取粉丝列表成功');
  } catch (error) {
    logger.error('获取粉丝列表失败：', error);
    Response.error(res, '获取粉丝列表失败', 500);
  }
};

// 检查关注状态
exports.checkFollowStatus = async (req, res) => {
  try {
    const { userId, targetUserId } = req.query;
    
    const isFollowing = await Follow.findOne({
      followerId: userId,
      followingId: targetUserId,
      status: 'active'
    });
    
    const isFollower = await Follow.findOne({
      followerId: targetUserId,
      followingId: userId,
      status: 'active'
    });
    
    Response.success(res, {
      isFollowing: !!isFollowing,
      isFollower: !!isFollower,
      isMutual: !!isFollowing && !!isFollower
    });
  } catch (error) {
    logger.error('检查关注状态失败：', error);
    Response.error(res, '检查关注状态失败', 500);
  }
};

// 获取关注的人的问题
exports.getFollowingQuestions = async (req, res) => {
  try {
    const { userId } = req.query;
    
    // 获取关注列表
    const follows = await Follow.find({
      followerId: userId,
      status: 'active'
    });
    
    const followingIds = follows.map(f => f.followingId);
    
    // 获取关注的人的问题
    const questions = await Question.find({
      userId: { $in: followingIds }
    }).sort({ createTime: -1 }).limit(50);
    
    Response.success(res, questions, '获取关注的人的问题成功');
  } catch (error) {
    logger.error('获取关注的人的问题失败：', error);
    Response.error(res, '获取关注的人的问题失败', 500);
  }
};

// 获取用户主页信息
exports.getUserProfile = async (req, res) => {
  try {
    const targetUserId = req.params.userId;
    const { currentUserId } = req.query;
    
    // 获取用户基本信息
    const user = await User.findById(targetUserId)
      .select('nickname avatar school grade subjects');
    
    if (!user) {
      return Response.notFound(res, '用户不存在');
    }
    
    // 统计数据
    const questionCount = await Question.countDocuments({ userId: targetUserId });
    const followingCount = await Follow.countDocuments({ 
      followerId: targetUserId, 
      status: 'active' 
    });
    const followerCount = await Follow.countDocuments({ 
      followingId: targetUserId, 
      status: 'active' 
    });
    
    // 检查当前用户与目标用户的关注关系
    let followStatus = {
      isFollowing: false,
      isFollower: false,
      isMutual: false
    };
    
    if (currentUserId && currentUserId !== targetUserId) {
      const isFollowing = await Follow.findOne({
        followerId: currentUserId,
        followingId: targetUserId,
        status: 'active'
      });
      
      const isFollower = await Follow.findOne({
        followerId: targetUserId,
        followingId: currentUserId,
        status: 'active'
      });
      
      followStatus = {
        isFollowing: !!isFollowing,
        isFollower: !!isFollower,
        isMutual: !!isFollowing && !!isFollower
      };
    }
    
    // 获取最近问题
    const recentQuestions = await Question.find({ userId: targetUserId })
      .sort({ createTime: -1 })
      .limit(5)
      .select('title createTime solved tags');
    
    const profile = {
      id: user._id,
      nickname: user.nickname,
      avatar: user.avatar,
      school: user.school,
      grade: user.grade,
      subjects: user.subjects,
      stats: {
        questionCount,
        followingCount,
        followerCount
      },
      followStatus,
      recentQuestions
    };
    
    Response.success(res, profile, '获取用户主页成功');
  } catch (error) {
    logger.error('获取用户主页失败：', error);
    Response.error(res, '获取用户主页失败', 500);
  }
};
