// 导入Vue Router核心函数
import { createRouter, createWebHistory } from "vue-router";

// 路由懒加载：使用动态import，按需加载组件，提升首屏加载速度
// 登录页保持直接导入（首屏需要）
import LoginPage from "../views/LoginPage.vue";

// 路由规则：使用懒加载优化性能
const routes = [
  { 
    path: "/", 
    redirect: "/ai-chat" 
  },
  { 
    path: "/login", 
    component: LoginPage, 
    name: "登录页",
    meta: { title: "登录 - 智慧教育平台" }
  },
  { 
    path: "/ai-chat", 
    component: () => import("../views/AIChat.vue"), 
    name: "AI助手",
    meta: { title: "AI助手 - 智慧教育平台", requiresAuth: true }
  },
  { 
    path: "/register", 
    component: () => import("../views/RegisterPage.vue"), 
    name: "注册页",
    meta: { title: "注册 - 智慧教育平台" }
  },
  // 暂时注释万能计算器页面
  // { 
  //   path: "/resource", 
  //   component: () => import("../views/ResourcePage.vue"), 
  //   name: "学习资源",
  //   meta: { title: "学习资源 - 智慧教育平台", requiresAuth: true }
  // },
  { 
    path: "/error-book", 
    component: () => import("../views/ErrorBook.vue"), 
    name: "错题集",
    meta: { title: "错题集 - 智慧教育平台", requiresAuth: true }
  },
  { 
    path: "/study-plan", 
    component: () => import("../views/StudyPlan.vue"), 
    name: "学习计划",
    meta: { title: "学习计划 - 智慧教育平台", requiresAuth: true }
  },

  { 
    path: "/note", 
    component: () => import("../views/NotePage.vue"), 
    name: "我的笔记",
    meta: { title: "我的笔记 - 智慧教育平台", requiresAuth: true }
  },
  { 
    path: "/study-community", 
    component: () => import("../views/StudyCommunity.vue"), 
    name: "学习社区",
    meta: { title: "学习社区 - 智慧教育平台", requiresAuth: true }
  },
  { 
    path: "/feedback", 
    component: () => import("../views/FeedbackPage.vue"), 
    name: "意见反馈",
    meta: { title: "意见反馈 - 智慧教育平台", requiresAuth: true }
  },
  { 
    path: "/knowledge-base", 
    component: () => import("../views/KnowledgeBase.vue"), 
    name: "知识库",
    meta: { title: "知识库 - 智慧教育平台", requiresAuth: true }
  },
  { 
    path: "/changelog", 
    component: () => import("../views/ChangelogPage.vue"), 
    name: "更新日志",
    meta: { title: "更新日志 - 智慧教育平台" }
  },
  {
    path: "/platform-docs",
    component: () => import("../views/PlatformDocsPage.vue"),
    name: "平台文档",
    meta: { title: "平台文档 - 智慧教育平台" },
  },
  {
    path: "/privacy-policy",
    redirect: (to) => ({ path: "/platform-docs", query: { doc: "privacy-policy", ...to.query } }),
  },
  {
    path: "/terms-of-service",
    redirect: (to) => ({ path: "/platform-docs", query: { doc: "terms-of-service", ...to.query } }),
  },
  {
    path: "/user-guide",
    redirect: (to) => ({ path: "/platform-docs", query: { doc: "user-guide", ...to.query } }),
  },
  { 
    path: "/profile", 
    component: () => import("../views/ProfilePage.vue"), 
    name: "个人中心",
    meta: { title: "个人中心 - 智慧教育平台", requiresAuth: true }
  },
  { 
    path: "/notification-center", 
    component: () => import("../views/NotificationCenter.vue"), 
    name: "通知中心",
    meta: { title: "通知中心 - 智慧教育平台", requiresAuth: true }
  },
  // 管理员路由
  {
    path: "/admin/login",
    component: () => import("../views/AdminLogin.vue"),
    name: "管理员登录",
    meta: { title: "管理员登录 - 智慧教育平台" },
  },
  {
    path: "/admin",
    component: () => import("../layouts/AdminLayout.vue"),
    redirect: "/admin/dashboard",
    children: [
      {
        path: "dashboard",
        component: () => import("../views/admin/AdminOverview.vue"),
        name: "管理概览",
        meta: { title: "数据概览 - 管理后台", requiresAdmin: true },
      },
      {
        path: "feedback",
        component: () => import("../views/AdminFeedback.vue"),
        name: "反馈管理",
        meta: { title: "反馈管理 - 管理后台", requiresAdmin: true },
      },
      {
        path: "announcement",
        component: () => import("../views/admin/AdminBroadcast.vue"),
        name: "系统公告",
        meta: { title: "系统公告 - 管理后台", requiresAdmin: true },
      },
      {
        path: "demo-data",
        component: () => import("../views/admin/AdminDemoData.vue"),
        name: "演示数据",
        meta: { title: "演示数据 - 管理后台", requiresAdmin: true },
      },
    ],
  },
];

// 创建路由实例
const router = createRouter({
  history: createWebHistory(),
  routes,
});

// 路由守卫：设置页面标题
router.beforeEach((to, from, next) => {
  // 设置页面标题
  if (to.meta.title) {
    document.title = to.meta.title;
  }
  
  // 检查是否需要登录
  if (to.meta.requiresAuth) {
    const userId = localStorage.getItem('edu-user-id');
    if (!userId) {
      // 未登录，跳转到登录页
      next('/login');
      return;
    }
  }

  if (to.meta.requiresAdmin) {
    const adminToken = localStorage.getItem('admin-token');
    if (!adminToken || adminToken !== 'admin-authenticated') {
      next('/admin/login');
      return;
    }
  }

  if (to.path === '/admin/login') {
    const adminToken = localStorage.getItem('admin-token');
    if (adminToken === 'admin-authenticated') {
      next('/admin/dashboard');
      return;
    }
  }
  
  next();
});

// 导出路由器
export default router;
