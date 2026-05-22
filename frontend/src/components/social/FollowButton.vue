<template>
  <el-button
    :class="['follow-btn', followClass]"
    :size="size"
    :loading="loading"
    @click.stop="handleClick"
  >
    <el-icon v-if="!loading"><component :is="iconComponent" /></el-icon>
    <span>{{ buttonText }}</span>
  </el-button>
</template>

<script setup>
import { ref, computed } from 'vue';
import { Plus, Check, UserFilled } from '@element-plus/icons-vue';
import { ElMessage } from 'element-plus';
import axios from 'axios';

const props = defineProps({
  targetUserId: {
    type: String,
    required: true
  },
  isFollowing: {
    type: Boolean,
    default: false
  },
  isMutual: {
    type: Boolean,
    default: false
  },
  size: {
    type: String,
    default: 'small'
  }
});

const emit = defineEmits(['update:isFollowing', 'followChange']);

const loading = ref(false);
const userId = localStorage.getItem('edu-user-id') || '';

const followClass = computed(() => {
  if (props.isMutual) return 'mutual';
  if (props.isFollowing) return 'following';
  return 'not-following';
});

const buttonText = computed(() => {
  if (props.isMutual) return '互相关注';
  if (props.isFollowing) return '已关注';
  return '关注';
});

const iconComponent = computed(() => {
  if (props.isMutual) return UserFilled;
  if (props.isFollowing) return Check;
  return Plus;
});

const handleClick = async () => {
  if (loading.value) return;
  
  loading.value = true;
  
  try {
    if (props.isFollowing) {
      // 取消关注
      await axios.delete(`http://localhost:3001/api/social/follow/${props.targetUserId}`, {
        data: { userId }
      });
      ElMessage.success('已取消关注');
      emit('update:isFollowing', false);
      emit('followChange', false);
    } else {
      // 关注
      await axios.post(`http://localhost:3001/api/social/follow/${props.targetUserId}`, {
        userId
      });
      ElMessage.success('关注成功');
      emit('update:isFollowing', true);
      emit('followChange', true);
    }
  } catch (error) {
    console.error('关注操作失败：', error);
    ElMessage.error(error.response?.data?.message || '操作失败');
  } finally {
    loading.value = false;
  }
};
</script>

<style scoped>
.follow-btn {
  border-radius: 12px;
  font-weight: 500;
  transition: all 0.2s;
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.follow-btn.not-following {
  background: #3b82f6;
  color: white;
  border-color: #3b82f6;
}

.follow-btn.not-following:hover {
  background: #2563eb;
  border-color: #2563eb;
}

.follow-btn.following {
  background: #f3f4f6;
  color: #6b7280;
  border-color: #e5e7eb;
}

.follow-btn.following:hover {
  background: #fee2e2;
  color: #dc2626;
  border-color: #fecaca;
}

.follow-btn.following:hover span::after {
  content: '取消关注';
  position: absolute;
  left: 0;
  right: 0;
}

.follow-btn.following span {
  position: relative;
}

.follow-btn.mutual {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  color: white;
  border-color: #10b981;
}

.follow-btn.mutual:hover {
  background: linear-gradient(135deg, #059669 0%, #047857 100%);
}
</style>
