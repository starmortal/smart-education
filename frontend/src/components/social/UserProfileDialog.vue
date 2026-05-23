<template>
  <el-dialog
    v-model="visible"
    :title="profile ? `${profile.nickname}的主页` : '用户主页'"
    width="600px"
    center
    class="blue-border-dialog user-profile-dialog"
    @close="handleClose"
  >
    <div v-if="profile" class="profile-container" v-loading="loading">
      <!-- 用户头部信息 -->
      <div class="profile-header">
        <el-avatar :size="80" :src="profile.avatar" />
        <div class="profile-info">
          <div class="profile-name">{{ profile.nickname }}</div>
          <div class="profile-meta">
            <span>{{ profile.school || '未设置学校' }}</span>
            <span class="meta-dot">·</span>
            <span>{{ getGradeLabel(profile.grade) }}</span>
          </div>
          <div class="profile-subjects" v-if="profile.subjects && profile.subjects.length">
            <el-tag
              v-for="subject in profile.subjects"
              :key="subject"
              size="small"
              type="primary"
            >
              {{ subject }}
            </el-tag>
          </div>
        </div>
      </div>

      <!-- 统计数据 -->
      <div class="profile-stats">
        <div class="stat-item">
          <div class="stat-value">{{ profile.stats?.questionCount || 0 }}</div>
          <div class="stat-label">提问</div>
        </div>
        <div class="stat-divider"></div>
        <div class="stat-item">
          <div class="stat-value">{{ profile.stats?.followingCount || 0 }}</div>
          <div class="stat-label">关注</div>
        </div>
        <div class="stat-divider"></div>
        <div class="stat-item">
          <div class="stat-value">{{ profile.stats?.followerCount || 0 }}</div>
          <div class="stat-label">粉丝</div>
        </div>
      </div>

      <!-- 操作按钮 -->
      <div class="profile-actions" v-if="profile.id !== currentUserId">
        <FollowButton
          :target-user-id="profile.id"
          :is-following="profile.followStatus?.isFollowing"
          :is-mutual="profile.followStatus?.isMutual"
          size="default"
          @follow-change="handleFollowChange"
        />
      </div>

      <!-- 最近提问 -->
      <div class="recent-questions" v-if="profile.recentQuestions && profile.recentQuestions.length">
        <div class="section-title">
          <el-icon><Document /></el-icon>
          <span>最近提问</span>
        </div>
        <div class="question-list">
          <div
            v-for="question in profile.recentQuestions"
            :key="question._id"
            class="question-item"
            @click="handleQuestionClick(question._id)"
          >
            <div class="question-title">{{ question.title }}</div>
            <div class="question-meta">
              <el-tag :type="question.solved ? 'success' : 'warning'" size="small">
                {{ question.solved ? '已解决' : '待解决' }}
              </el-tag>
              <span class="question-time">{{ formatTime(question.createTime) }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </el-dialog>
</template>

<script setup>
import { ref, watch } from 'vue';
import { Document } from '@element-plus/icons-vue';
import axios from 'axios';
import FollowButton from './FollowButton.vue';

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },
  userId: {
    type: String,
    required: true
  }
});

const emit = defineEmits(['update:modelValue', 'questionClick', 'followChange']);

const visible = ref(props.modelValue);
const loading = ref(false);
const profile = ref(null);
const currentUserId = localStorage.getItem('edu-user-id') || '';

watch(() => props.modelValue, (val) => {
  visible.value = val;
  if (val && props.userId) {
    profile.value = null; // 重置数据
    loadProfile();
  }
});

watch(visible, (val) => {
  emit('update:modelValue', val);
});

const loadProfile = async () => {
  loading.value = true;
  try {
    const res = await axios.get(`http://localhost:3001/api/social/user-profile/${props.userId}`, {
      params: { currentUserId }
    });
    profile.value = res.data.data;
  } catch (error) {
    console.error('加载用户主页失败：', error);
  } finally {
    loading.value = false;
  }
};

const handleClose = () => {
  visible.value = false;
};

const handleFollowChange = (isFollowing) => {
  if (profile.value?.followStatus) {
    profile.value.followStatus.isFollowing = isFollowing;
    if (!isFollowing) {
      profile.value.followStatus.isMutual = false;
    }
  }
  emit('followChange', isFollowing, props.userId);
  loadProfile();
};

const handleQuestionClick = (questionId) => {
  emit('questionClick', questionId);
  visible.value = false;
};

const getGradeLabel = (grade) => {
  const gradeMap = {
    'primary_1': '一年级', 'primary_2': '二年级', 'primary_3': '三年级',
    'primary_4': '四年级', 'primary_5': '五年级', 'primary_6': '六年级',
    'junior_1': '初一', 'junior_2': '初二', 'junior_3': '初三',
    'senior_1': '高一', 'senior_2': '高二', 'senior_3': '高三'
  };
  return gradeMap[grade] || '未设置';
};

const formatTime = (timeStr) => {
  if (!timeStr) return '';
  const time = new Date(timeStr);
  const now = new Date();
  const diff = Math.floor((now - time) / 1000);
  
  if (diff < 60) return '刚刚';
  if (diff < 3600) return `${Math.floor(diff / 60)}分钟前`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}小时前`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}天前`;
  
  return timeStr.split(' ')[0];
};
</script>

<style scoped>
.profile-container {
  padding: 10px;
}

.profile-header {
  display: flex;
  gap: 20px;
  align-items: center;
  margin-bottom: 24px;
}

.profile-info {
  flex: 1;
}

.profile-name {
  font-size: 20px;
  font-weight: 600;
  color: #1a1a1a;
  margin-bottom: 8px;
}

.profile-meta {
  font-size: 14px;
  color: #6b7280;
  margin-bottom: 8px;
  display: flex;
  align-items: center;
  gap: 6px;
}

.meta-dot {
  color: #d1d5db;
}

.profile-subjects {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.profile-stats {
  display: flex;
  justify-content: space-around;
  padding: 20px;
  background: #f9fafb;
  border-radius: 12px;
  margin-bottom: 20px;
}

.stat-item {
  text-align: center;
}

.stat-value {
  font-size: 24px;
  font-weight: 600;
  color: #1a1a1a;
  margin-bottom: 4px;
}

.stat-label {
  font-size: 13px;
  color: #6b7280;
}

.stat-divider {
  width: 1px;
  background: #e5e7eb;
}

.profile-actions {
  display: flex;
  justify-content: center;
  margin-bottom: 24px;
}

.recent-questions {
  border-top: 1px solid #e5e7eb;
  padding-top: 20px;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 16px;
  font-weight: 600;
  color: #1a1a1a;
  margin-bottom: 16px;
}

.question-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.question-item {
  padding: 12px;
  background: #f9fafb;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.question-item:hover {
  background: #f3f4f6;
  transform: translateX(4px);
}

.question-title {
  font-size: 14px;
  font-weight: 500;
  color: #1a1a1a;
  margin-bottom: 8px;
}

.question-meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.question-time {
  font-size: 12px;
  color: #9ca3af;
}
</style>
