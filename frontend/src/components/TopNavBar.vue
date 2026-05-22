<template>
  <header class="top-nav-bar">
    <div class="nav-left">
      <!-- Logo区域 -->
      <div class="logo-section" @click="goToHome">
        <img src="@/assets/logo.png" alt="智慧教育平台" class="nav-logo" />
        <span class="logo-text">智慧教育</span>
      </div>
      
      <!-- 移动端菜单按钮 -->
      <el-icon 
        class="mobile-menu-btn" 
        size="24" 
        color="#fff"
        @click="showMobileMenu = true"
      >
        <Menu />
      </el-icon>
    </div>
    
    <div class="nav-center">
      <span 
        v-for="item in navItems" 
        :key="item.path"
        :class="['nav-item', { active: currentPath === item.path }]"
        @click="goToPage(item.path)"
      >
        {{ item.label }}
      </span>
    </div>
    
    <div class="nav-right">
      <!-- 用户下拉菜单 -->
      <el-dropdown>
        <div class="user-display">
          <el-avatar :size="36" :src="userAvatar" />
          <span class="user-name">{{ nickname }}</span>
        </div>
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item @click="handleLogout">
              <el-icon><SwitchButton /></el-icon>
              退出登录
            </el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
    </div>
  </header>
  
  <!-- 移动端抽屉菜单 -->
  <el-drawer
    v-model="showMobileMenu"
    title="导航菜单"
    direction="ltr"
    size="280px"
  >
    <div class="mobile-menu-content">
      <!-- 用户信息 -->
      <div class="mobile-user-info">
        <img src="@/assets/logo.png" alt="智慧教育平台" class="mobile-logo" />
        <el-avatar :size="60" :src="userAvatar" />
        <div class="mobile-user-name">{{ nickname }}</div>
        <div class="mobile-platform-name">智慧教育平台</div>
      </div>
      
      <!-- 导航列表 -->
      <div class="mobile-nav-list">
        <div 
          v-for="item in navItems" 
          :key="item.path"
          :class="['mobile-nav-item', { active: currentPath === item.path }]"
          @click="goToPageMobile(item.path)"
        >
          <el-icon size="20">
            <component :is="getNavIcon(item.path)" />
          </el-icon>
          <span>{{ item.label }}</span>
        </div>
      </div>
      
      <!-- 底部操作 -->
      <div class="mobile-menu-footer">
        <el-button 
          :icon="SwitchButton" 
          @click="handleLogout"
          style="width: 100%;"
        >
          退出登录
        </el-button>
      </div>
    </div>
  </el-drawer>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { 
  House, 
  ChatDotRound, 
  Notebook, 
  Calendar, 
  Document,
  User,
  SwitchButton,
  DataAnalysis,
  ChatLineRound,
  Menu
} from '@element-plus/icons-vue';
import eventBus from '@/utils/eventBus';

const router = useRouter();
const route = useRoute();

const props = defineProps({
  // 移除不需要的props，保持组件简洁
});

const nickname = ref('默认用户');
const userAvatar = ref('https://cube.elemecdn.com/3/7c/3ea6beec64369c2642b92c6726f1epng.png');

const navItems = [
  { path: '/error-book', label: '错题集' },
  { path: '/study-plan', label: '学习计划' },
  { path: '/note', label: '我的笔记' },
  { path: '/study-community', label: '学习社区' },
  { path: '/feedback', label: '意见反馈' },
];

const currentPath = computed(() => route.path);

// 移动端菜单控制
const showMobileMenu = ref(false);

onMounted(() => {
  loadUserInfo();
  
  // 监听用户信息更新事件
  eventBus.on('userInfoUpdated', loadUserInfo);
});

onBeforeUnmount(() => {
  // 移除事件监听
  eventBus.off('userInfoUpdated', loadUserInfo);
});

// 加载用户信息
const loadUserInfo = () => {
  const savedNickname = localStorage.getItem('edu-nickname');
  const savedAvatar = localStorage.getItem('edu-avatar');
  if (savedNickname) nickname.value = savedNickname;
  if (savedAvatar) userAvatar.value = savedAvatar;
};

const goToPage = (path) => {
  router.push(path);
};

const goToHome = () => {
  router.push('/ai-chat');
};

const goToPageMobile = (path) => {
  router.push(path);
  showMobileMenu.value = false; // 跳转后关闭菜单
};

const getNavIcon = (path) => {
  const iconMap = {
    '/error-book': Notebook,
    '/study-plan': Calendar,
    '/note': Document,
    '/study-community': DataAnalysis,
    '/feedback': ChatLineRound
  };
  return iconMap[path] || House;
};

const handleLogout = () => {
  localStorage.removeItem('edu-user-id');
  localStorage.removeItem('edu-nickname');
  localStorage.removeItem('edu-avatar');
  router.push('/login');
};
</script>

<style scoped>
.top-nav-bar {
  height: 60px;
  background: #0969da;
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 40px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  position: sticky;
  top: 0;
  z-index: 1000;
}

.nav-left {
  display: flex;
  align-items: center;
  gap: 20px;
  min-width: 200px;
}

.logo-section {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 6px;
  transition: all 0.3s;
  min-width: 120px;
}

.logo-section:hover {
  background: rgba(255, 255, 255, 0.1);
}

.nav-logo {
  width: 32px;
  height: 32px;
  border-radius: 6px;
  object-fit: contain;
}

.logo-text {
  font-size: 16px;
  font-weight: 700;
  color: #ffffff;
  letter-spacing: 0.5px;
}

.nav-center {
  display: flex;
  align-items: center;
  gap: 32px;
  flex: 1;
  justify-content: flex-start; /* 改为左对齐 */
  margin-left: 40px; /* 添加左边距 */
}

.nav-item {
  font-size: 15px;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.85);
  cursor: pointer;
  position: relative;
  transition: all 0.3s;
  padding: 4px 8px;
  border-radius: 4px;
}

.nav-item:hover {
  color: #ffffff;
  background: rgba(255, 255, 255, 0.1);
}

.nav-item.active {
  color: #ffffff;
  background: rgba(255, 255, 255, 0.15);
  font-weight: 600;
}

.nav-item.active::after {
  content: '';
  position: absolute;
  bottom: -8px;
  left: 50%;
  transform: translateX(-50%);
  width: 20px;
  height: 3px;
  background: #ffffff;
  border-radius: 2px;
}

.nav-right {
  min-width: 200px;
  display: flex;
  align-items: center;
  gap: 16px;
  justify-content: flex-end;
}

.user-display {
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  padding: 4px 12px;
  border-radius: 20px;
  transition: all 0.3s;
}

.user-display:hover {
  background: rgba(255, 255, 255, 0.1);
}

.user-name {
  font-size: 15px;
  font-weight: 600;
  color: #ffffff;
}

@media (max-width: 1200px) {
  .nav-center {
    gap: 20px;
  }
  .nav-item {
    font-size: 14px;
  }
}

/* 移动端菜单按钮 - 默认隐藏 */
.mobile-menu-btn {
  display: none;
  cursor: pointer;
  margin-right: 12px;
}

@media (max-width: 992px) {
  .top-nav-bar {
    padding: 0 20px;
  }
  
  .mobile-menu-btn {
    display: block; /* 显示汉堡菜单按钮 */
  }
  
  .nav-center {
    display: none; /* 小屏幕隐藏中间导航 */
  }
  
  .nav-left {
    min-width: auto;
    gap: 16px;
  }
  
  .logo-section {
    min-width: 100px;
  }
  
  .logo-text {
    font-size: 14px;
  }
}

@media (max-width: 768px) {
  .top-nav-bar {
    padding: 0 15px;
  }
  
  .user-name {
    display: none; /* 手机端只显示头像 */
  }
  
  .user-display {
    padding: 4px;
  }
}

/* 移动端抽屉菜单样式 */
.mobile-menu-content {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.mobile-user-info {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 30px 20px;
  background: linear-gradient(135deg, #0969da 0%, #0550ae 100%);
  color: #fff;
  margin: -20px -20px 20px -20px;
}

.mobile-logo {
  width: 40px;
  height: 40px;
  border-radius: 8px;
  margin-bottom: 12px;
  object-fit: contain;
}

.mobile-user-name {
  margin-top: 12px;
  font-size: 18px;
  font-weight: 600;
}

.mobile-platform-name {
  margin-top: 4px;
  font-size: 14px;
  opacity: 0.9;
}

.mobile-nav-list {
  flex: 1;
  overflow-y: auto;
}

.mobile-nav-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px 20px;
  font-size: 16px;
  color: #333;
  cursor: pointer;
  transition: all 0.3s;
  border-left: 3px solid transparent;
}

.mobile-nav-item:hover {
  background: #f5f7fa;
  border-left-color: #0969da;
}

.mobile-nav-item.active {
  background: #e8f4ff;
  color: #0969da;
  font-weight: 600;
  border-left-color: #0969da;
}

.mobile-menu-footer {
  padding: 20px;
  border-top: 1px solid #e4e7ed;
}
</style>
