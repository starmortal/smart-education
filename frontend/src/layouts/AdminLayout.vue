<template>
  <div class="admin-layout">
    <aside class="admin-sidebar">
      <div class="brand" @click="router.push('/admin/dashboard')">
        <img src="@/assets/logo.png" alt="logo" class="brand-logo" />
        <div class="brand-text">
          <span class="brand-title">智慧教育</span>
          <span class="brand-sub">管理控制台</span>
        </div>
      </div>

      <el-menu
        :default-active="activeMenu"
        class="admin-menu"
        router
        background-color="#0f172a"
        text-color="#94a3b8"
        active-text-color="#ffffff"
      >
        <el-menu-item index="/admin/dashboard">
          <el-icon><DataAnalysis /></el-icon>
          <span>数据概览</span>
        </el-menu-item>
        <el-menu-item index="/admin/feedback">
          <el-icon><ChatLineSquare /></el-icon>
          <span>反馈管理</span>
        </el-menu-item>
        <el-menu-item index="/admin/announcement">
          <el-icon><Bell /></el-icon>
          <span>系统公告</span>
        </el-menu-item>
        <el-menu-item index="/admin/demo-data">
          <el-icon><Coin /></el-icon>
          <span>演示数据</span>
        </el-menu-item>
      </el-menu>

      <div class="sidebar-footer">
        <el-button text class="back-user-btn" @click="router.push('/ai-chat')">
          返回用户端
        </el-button>
      </div>
    </aside>

    <div class="admin-main">
      <header class="admin-topbar">
        <div class="topbar-left">
          <h1 class="page-heading">{{ pageTitle }}</h1>
        </div>
        <div class="topbar-right">
          <el-tag type="info" effect="plain" round>管理员：{{ adminName }}</el-tag>
          <el-button type="danger" plain size="small" :icon="SwitchButton" @click="handleLogout">
            退出
          </el-button>
        </div>
      </header>
      <main class="admin-page-content">
        <router-view />
      </main>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { DataAnalysis, ChatLineSquare, Bell, Coin, SwitchButton } from '@element-plus/icons-vue';

const route = useRoute();
const router = useRouter();

const activeMenu = computed(() => route.path);

const pageTitle = computed(() => {
  const map = {
    '/admin/dashboard': '数据概览',
    '/admin/feedback': '反馈管理',
    '/admin/announcement': '系统公告',
    '/admin/demo-data': '演示数据',
  };
  return map[route.path] || '管理后台';
});

const adminName = computed(() => localStorage.getItem('admin-username') || 'admin');

const handleLogout = () => {
  localStorage.removeItem('admin-token');
  localStorage.removeItem('admin-username');
  router.push('/admin/login');
};
</script>

<style scoped>
.admin-layout {
  display: flex;
  min-height: 100vh;
  background: #f1f5f9;
}

.admin-sidebar {
  width: 168px;
  flex-shrink: 0;
  background: linear-gradient(180deg, #0f172a 0%, #1e293b 100%);
  display: flex;
  flex-direction: column;
  box-shadow: 2px 0 16px rgba(15, 23, 42, 0.12);
}

.brand {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 14px 12px;
  cursor: pointer;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}

.brand-logo {
  width: 28px;
  height: 28px;
  border-radius: 6px;
  object-fit: contain;
  background: #fff;
  padding: 3px;
}

.brand-text {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.brand-title {
  color: #f8fafc;
  font-size: 13px;
  font-weight: 700;
}

.brand-sub {
  color: #64748b;
  font-size: 11px;
  margin-top: 1px;
}

.admin-menu {
  border-right: none;
  flex: 1;
  padding-top: 6px;
}

.admin-menu :deep(.el-menu-item) {
  height: 38px;
  line-height: 38px;
  font-size: 13px;
  padding-left: 14px !important;
  margin: 2px 8px;
  border-radius: 6px;
}

.admin-menu :deep(.el-menu-item .el-icon) {
  font-size: 15px;
  margin-right: 6px;
}

.admin-menu :deep(.el-menu-item.is-active) {
  background: linear-gradient(90deg, rgba(59, 130, 246, 0.25), transparent) !important;
  border-left: 3px solid #3b82f6;
}

.sidebar-footer {
  padding: 10px;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
}

.back-user-btn {
  width: 100%;
  color: #94a3b8 !important;
  font-size: 12px;
  height: 32px;
}

.admin-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.admin-topbar {
  height: 48px;
  background: #fff;
  border-bottom: 1px solid #e2e8f0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 16px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
}

.page-heading {
  margin: 0;
  font-size: 15px;
  font-weight: 600;
  color: #0f172a;
}

.topbar-right {
  display: flex;
  align-items: center;
  gap: 10px;
}

.topbar-right :deep(.el-tag) {
  font-size: 12px;
  height: 24px;
  padding: 0 8px;
}

.admin-page-content {
  flex: 1;
  padding: 14px 16px;
  overflow: auto;
  font-size: 13px;
}

/* 子页面 Element Plus 组件统一缩小 */
.admin-page-content :deep(.el-card__header) {
  padding: 10px 14px;
  font-size: 13px;
}

.admin-page-content :deep(.el-card__body) {
  padding: 12px 14px;
}

.admin-page-content :deep(.el-form-item) {
  margin-bottom: 14px;
}

.admin-page-content :deep(.el-form-item__label) {
  font-size: 12px;
  padding-bottom: 4px;
}

.admin-page-content :deep(.el-alert) {
  padding: 8px 12px;
}

.admin-page-content :deep(.el-alert__title) {
  font-size: 12px;
}

.admin-page-content :deep(.el-empty__description) {
  font-size: 12px;
}
</style>
