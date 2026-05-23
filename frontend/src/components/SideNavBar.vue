<template>
  <div class="side-nav-bar">
    <!-- Logo区域 -->
    <div class="logo-section" @click="goToHome">
      <img src="@/assets/logo.png" alt="Logo" class="nav-logo" />
    </div>

    <!-- 导航项 -->
    <div class="nav-items">
      <el-tooltip
        v-for="item in navItems"
        :key="item.path"
        :content="item.label"
        placement="right"
      >
        <div
          :class="['nav-item', { active: currentPath === item.path }]"
          @click="goToPage(item.path)"
        >
          <el-badge 
            v-if="item.badge && unreadCount > 0" 
            :value="unreadCount" 
            :max="99"
            class="nav-badge"
          >
            <el-icon :size="18">
              <component :is="item.icon" />
            </el-icon>
          </el-badge>
          <el-icon v-else :size="18">
            <component :is="item.icon" />
          </el-icon>
        </div>
      </el-tooltip>
    </div>

    <!-- 底部用户头像 -->
    <div class="user-section">
      <el-avatar :size="32" :src="userAvatar" />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import {
  ChatDotRound,
  Notebook,
  Calendar,
  Document,
  DataAnalysis,
  ChatLineRound,
  User,
  SwitchButton,
  FolderOpened,
  Bell
} from '@element-plus/icons-vue';
import eventBus from '@/utils/eventBus';
import { getUnreadCount } from '@/api/notification';
import socketClient from '@/utils/socket';

const router = useRouter();
const route = useRoute();

const userAvatar = ref('https://cube.elemecdn.com/3/7c/3ea6beec64369c2642b92c6726f1epng.png');
const unreadCount = ref(0);

// 导航项配置
const navItems = [
  { path: '/ai-chat', label: 'AI助手', icon: ChatDotRound },
  { path: '/knowledge-base', label: '知识库', icon: FolderOpened },
  { path: '/error-book', label: '错题集', icon: Notebook },
  { path: '/study-plan', label: '学习计划', icon: Calendar },
  { path: '/note', label: '我的笔记', icon: Document },
  { path: '/study-community', label: '学习社区', icon: DataAnalysis },
  { path: '/feedback', label: '意见反馈', icon: ChatLineRound },
  { path: '/profile', label: '个人中心', icon: User },
  { path: '/notification-center', label: '通知中心', icon: Bell, badge: true },
  { path: 'logout', label: '退出登录', icon: SwitchButton }
];

const currentPath = computed(() => route.path);

onMounted(() => {
  loadUserInfo();
  loadUnreadCount();
  eventBus.on('userInfoUpdated', loadUserInfo);
  
  // 监听实时通知更新未读数量
  socketClient.on('notification:new', loadUnreadCount);
});

onBeforeUnmount(() => {
  eventBus.off('userInfoUpdated', loadUserInfo);
  socketClient.off('notification:new', loadUnreadCount);
});

const loadUserInfo = () => {
  const savedAvatar = localStorage.getItem('edu-avatar');
  if (savedAvatar) userAvatar.value = savedAvatar;
};

// 加载未读通知数量
const loadUnreadCount = async () => {
  try {
    const response = await getUnreadCount();
    if (response.code === 200) {
      unreadCount.value = response.data.count || 0;
    }
  } catch (error) {
    console.error('加载未读通知数量失败：', error);
  }
};

const goToPage = (path) => {
  if (path === 'logout') {
    handleLogout();
  } else {
    router.push(path);
  }
};

const goToHome = () => {
  router.push('/ai-chat');
};

const handleLogout = () => {
  localStorage.removeItem('edu-user-id');
  localStorage.removeItem('edu-nickname');
  localStorage.removeItem('edu-avatar');
  router.push('/login');
};
</script>

<style scoped>
.side-nav-bar {
  width: 60px;
  height: 100vh;
  background: #0969da;
  display: flex;
  flex-direction: column;
  align-items: center;
  position: fixed;
  left: 0;
  top: 0;
  z-index: 1000;
  box-shadow: 2px 0 8px rgba(0, 0, 0, 0.1);
}

.logo-section {
  width: 100%;
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  transition: all 0.3s;
}

.logo-section:hover {
  background: rgba(255, 255, 255, 0.1);
}

.nav-logo {
  width: 28px;
  height: 28px;
  border-radius: 6px;
  object-fit: contain;
}

.nav-items {
  flex: 1;
  width: 100%;
  padding: 20px 0;
  overflow-y: auto;
  overflow-x: hidden;
}

.nav-items::-webkit-scrollbar {
  width: 4px;
}

.nav-items::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.3);
  border-radius: 2px;
}

.nav-item {
  width: 100%;
  height: 50px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: rgba(255, 255, 255, 0.85);
  cursor: pointer;
  transition: all 0.3s;
  position: relative;
}

.nav-item:hover {
  background: rgba(255, 255, 255, 0.1);
  color: #ffffff;
}

.nav-item.active {
  background: rgba(255, 255, 255, 0.15);
  color: #ffffff;
}

.nav-item.active::before {
  content: '';
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  width: 4px;
  height: 30px;
  background: #ffffff;
  border-radius: 0 2px 2px 0;
}

.user-section {
  width: 100%;
  padding: 15px 0;
  display: flex;
  align-items: center;
  justify-content: center;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.nav-badge {
  display: flex;
  align-items: center;
  justify-content: center;
}

.nav-badge :deep(.el-badge__content) {
  transform: translateY(-50%) translateX(50%);
  top: 8px;
  right: 8px;
}

/* 移动端适配 */
@media (max-width: 768px) {
  .side-nav-bar {
    width: 55px;
  }

  .logo-section {
    height: 55px;
  }

  .nav-logo {
    width: 24px;
    height: 24px;
  }

  .nav-item {
    height: 45px;
  }

  .user-section {
    padding: 12px 0;
  }
}
</style>
