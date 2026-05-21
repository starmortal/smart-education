<template>
  <div class="app-container">
    <!-- 左侧导航栏（登录后显示） -->
    <SideNavBar v-if="showSideNav" />
    
    <!-- 主内容区域 -->
    <div :class="['main-container', { 'with-sidebar': showSideNav }]">
      <router-view />
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import SideNavBar from '@/components/SideNavBar.vue';

const route = useRoute();

// 不显示侧边栏的页面
const noSidebarPages = ['/login', '/register', '/admin/login'];

const showSideNav = computed(() => {
  return !noSidebarPages.includes(route.path);
});
</script>

<style>
/* 全局样式：所有页面都生效 */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
  font-family: "Microsoft YaHei", sans-serif;
}

body {
  background-color: #f5f5f5;
  overflow-x: hidden;
}

.app-container {
  width: 100%;
  min-height: 100vh;
  display: flex;
}

.main-container {
  flex: 1;
  width: 100%;
  min-height: 100vh;
  transition: all 0.3s;
}

.main-container.with-sidebar {
  margin-left: 70px;
  width: calc(100% - 70px);
}

@media (max-width: 768px) {
  .main-container.with-sidebar {
    margin-left: 60px;
    width: calc(100% - 60px);
  }
}
</style>
