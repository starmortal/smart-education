<template>
  <!-- 路由出口：所有页面都会渲染到这里 -->
  <router-view />
</template>

<script setup>
// 根组件无需额外逻辑，仅作为路由容器
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
}
</style>

<!-- 【修改指南】 -->
<!-- 1. 添加全局导航栏：在<router-view>上方添加导航组件 -->
<!-- 2. 修改全局样式：修改style中的body背景色、字体等 -->
<!-- 3. 添加全局loading：在<router-view>外添加loading组件 -->
