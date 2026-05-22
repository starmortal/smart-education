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
    path: "/privacy-policy", 
    component: () => import("../views/PrivacyPolicy.vue"), 
    name: "隐私政策",
    meta: { title: "隐私政策 - 智慧教育平台" }
  },
  { 
    path: "/terms-of-service", 
    component: () => import("../views/TermsOfService.vue"), 
    name: "服务条款",
    meta: { title: "服务条款 - 智慧教育平台" }
  },
  { 
    path: "/user-guide", 
    component: () => import("../views/UserGuide.vue"), 
    name: "使用文档",
    meta: { title: "使用文档 - 智慧教育平台" }
  },
  { 
    path: "/profile", 
    component: () => import("../views/ProfilePage.vue"), 
    name: "个人中心",
    meta: { title: "个人中心 - 智慧教育平台", requiresAuth: true }
  },
  // 管理员路由
  { 
    path: "/admin/login", 
    component: () => import("../views/AdminLogin.vue"), 
    name: "管理员登录",
    meta: { title: "管理员登录 - 智慧教育平台" }
  },
  { 
    path: "/admin/feedback", 
    component: () => import("../views/AdminFeedback.vue"), 
    name: "反馈管理",
    meta: { title: "反馈管理 - 智慧教育平台" }
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
  
  next();
});

// 导出路由器
export default router;
