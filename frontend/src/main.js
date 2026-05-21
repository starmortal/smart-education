// 导入Vue核心函数
import { createApp } from "vue";
// 导入根组件
import App from "./App.vue";
// 导入路由配置
import router from "./router";
// 导入Element Plus（UI组件库）和样式
import ElementPlus from "element-plus";
import "element-plus/dist/index.css";
// 导入Element Plus中文语言包
import zhCn from 'element-plus/dist/locale/zh-cn.mjs';
// 导入Element Plus图标
import * as ElementPlusIconsVue from "@element-plus/icons-vue";
// 导入设计令牌（全局样式变量）
import "./styles/design-tokens.css";

// 创建Vue应用实例
const app = createApp(App);

// 注册Element Plus图标（全局可用）
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component);
}

// 应用路由和UI组件库（配置中文）
app.use(router).use(ElementPlus, {
  locale: zhCn,
});

// 挂载到页面的#app元素
app.mount("#app");
