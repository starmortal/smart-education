<template>
  <div class="landing-page">
    <!-- Hero Section -->
    <section class="hero-section">
      <div class="hero-content">
        <div class="hero-text">
          <h1 class="hero-title animate-fade-in">
            智慧教育，点亮未来
          </h1>
          <p class="hero-subtitle animate-fade-in-delay">
            AI 驱动的个性化学习平台，让每个学生都能找到最适合自己的学习方式
          </p>
          <div class="hero-buttons animate-fade-in-delay-2">
            <el-button type="primary" size="large" @click="showRegister = true">
              <el-icon><Promotion /></el-icon>
              立即开始学习
            </el-button>
            <el-button size="large" @click="scrollToFeatures">
              <el-icon><Reading /></el-icon>
              了解更多
            </el-button>
          </div>
          <div class="hero-stats animate-fade-in-delay-3">
            <div class="stat-item">
              <div class="stat-number">{{ animatedUsers }}+</div>
              <div class="stat-label">活跃用户</div>
            </div>
            <div class="stat-item">
              <div class="stat-number">{{ animatedQuestions }}+</div>
              <div class="stat-label">问题解答</div>
            </div>
            <div class="stat-item">
              <div class="stat-number">{{ animatedSatisfaction }}%</div>
              <div class="stat-label">满意度</div>
            </div>
          </div>
        </div>
        <div class="hero-visual animate-float">
          <div class="visual-card card-1"></div>
          <div class="visual-card card-2"></div>
          <div class="visual-card card-3"></div>
        </div>
      </div>
      <div class="hero-wave">
        <svg viewBox="0 0 1440 120" xmlns="http://www.w3.org/2000/svg">
          <path d="M0,64L48,69.3C96,75,192,85,288,80C384,75,480,53,576,48C672,43,768,53,864,58.7C960,64,1056,64,1152,58.7C1248,53,1344,43,1392,37.3L1440,32L1440,120L1392,120C1344,120,1248,120,1152,120C1056,120,960,120,864,120C768,120,672,120,576,120C480,120,384,120,288,120C192,120,96,120,48,120L0,120Z" fill="#ffffff"/>
        </svg>
      </div>
      
      <!-- 顶部导航栏 -->
      <header class="top-nav">
        <div class="nav-left">
          <img class="logo" src="../assets/logo.png" alt="logo" />
          <span class="brand">智慧教育平台</span>
        </div>
        <div class="nav-right">
          <el-button text @click="showLogin = true">登录</el-button>
          <el-button type="primary" @click="showRegister = true">注册</el-button>
        </div>
      </header>
    </section>

    <!-- Features Section -->
    <section id="features" class="features-section">
      <div class="container">
        <div class="section-header">
          <h2 class="section-title">核心功能</h2>
          <p class="section-subtitle">全方位的智能学习解决方案</p>
        </div>
        <div class="features-grid">
          <div 
            v-for="(feature, index) in features" 
            :key="index"
            class="feature-card"
            :class="{ 'in-view': featuresInView }"
            :style="{ animationDelay: `${index * 0.1}s` }"
          >
            <div class="feature-icon" :style="{ background: feature.color }">
              <component :is="feature.icon" />
            </div>
            <h3 class="feature-title">{{ feature.title }}</h3>
            <p class="feature-desc">{{ feature.desc }}</p>
          </div>
        </div>
      </div>
    </section>

    <!-- Why Choose Us Section -->
    <section id="why-section" class="why-section" :class="{ 'in-view': whyInView }">
      <div class="container">
        <div class="section-header">
          <h2 class="section-title">为什么选择我们</h2>
          <p class="section-subtitle">让学习更高效、更有趣</p>
        </div>
        <div class="why-grid">
          <div 
            v-for="(reason, index) in reasons" 
            :key="index"
            class="why-card"
            :style="{ animationDelay: `${index * 0.15}s` }"
          >
            <div class="why-number">{{ String(index + 1).padStart(2, '0') }}</div>
            <h3 class="why-title">{{ reason.title }}</h3>
            <p class="why-desc">{{ reason.desc }}</p>
          </div>
        </div>
      </div>
    </section>

    <!-- FAQ Section -->
    <section id="faq-section" class="faq-section" :class="{ 'in-view': faqInView }">
      <div class="container">
        <div class="section-header">
          <h2 class="section-title">常见问题</h2>
          <p class="section-subtitle">解答你的疑惑</p>
        </div>
        <div class="faq-list">
          <div 
            v-for="(faq, index) in faqs" 
            :key="index"
            class="faq-item"
            :class="{ active: activeFaq === index }"
            :style="{ animationDelay: `${index * 0.1}s` }"
            @click="toggleFaq(index)"
          >
            <div class="faq-question">
              <span>{{ faq.question }}</span>
              <el-icon class="faq-icon">
                <ArrowDown v-if="activeFaq !== index" />
                <ArrowUp v-else />
              </el-icon>
            </div>
            <transition name="faq-answer">
              <div v-if="activeFaq === index" class="faq-answer">
                {{ faq.answer }}
              </div>
            </transition>
          </div>
        </div>
      </div>
    </section>

    <!-- CTA Section -->
    <section id="cta-section" class="cta-section" :class="{ 'in-view': ctaInView }">
      <div class="container">
        <div class="cta-content">
          <h2 class="cta-title">准备好开始你的学习之旅了吗？</h2>
          <p class="cta-subtitle">加入我们，体验 AI 驱动的智慧教育</p>
          <div class="cta-buttons">
            <el-button type="primary" size="large" @click="showRegister = true">
              <el-icon><User /></el-icon>
              立即注册
            </el-button>
            <el-button size="large" plain @click="showLogin = true">
              <el-icon><ChatDotRound /></el-icon>
              立即登录
            </el-button>
          </div>
          <div class="cta-features">
            <div class="cta-feature-item">
              <el-icon><Check /></el-icon>
              <span>AI 智能答疑</span>
            </div>
            <div class="cta-feature-item">
              <el-icon><Check /></el-icon>
              <span>个性化学习</span>
            </div>
            <div class="cta-feature-item">
              <el-icon><Check /></el-icon>
              <span>学习社区</span>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Footer -->
    <footer class="footer">
      <div class="container">
        <div class="footer-content">
          <div class="footer-info">
            <h3>智慧教育平台</h3>
            <p>让每个学生都能享受优质的教育资源</p>
          </div>
          <div class="footer-links">
            <div class="footer-column">
              <h4>导航</h4>
              <a @click="goToPage('privacy-policy')">隐私政策</a>
              <a @click="goToPage('terms-of-service')">服务条款</a>
              <a @click="goToPage('user-guide')">使用文档</a>
            </div>
            <div class="footer-column">
              <h4>产品</h4>
              <a @click="handleProductClick('ai-chat')">AI 助手</a>
              <a @click="handleProductClick('study-plan')">学习计划</a>
              <a @click="handleProductClick('error-book')">错题本</a>
            </div>
            <div class="footer-column">
              <h4>支持</h4>
              <a @click="handleFeedbackClick()">反馈建议</a>
              <a @click="goToPage('changelog')">更新日志</a>
              <a @click="handleContactClick()">联系我们</a>
            </div>
          </div>
        </div>
        <div class="footer-bottom">
          <p>&copy; 2026 智慧教育平台</p>
        </div>
      </div>
    </footer>

    <!-- 登录弹窗 -->
    <el-dialog
      v-model="showLogin"
      width="400px"
      align-center
      :show-close="false"
      class="auth-dialog"
    >
      <template #header>
        <div class="dialog-header">用户登录</div>
      </template>
      <el-form :model="loginForm" :rules="loginRules" ref="loginRef" label-width="0" @keyup.enter="doLogin">
        <el-form-item prop="email">
          <el-input
            v-model="loginForm.email"
            placeholder="请输入您的邮箱"
            prefix-icon="Message"
            size="large"
          />
        </el-form-item>
        
        <el-form-item prop="password">
          <el-input
            v-model="loginForm.password"
            type="password"
            placeholder="请输入您的密码"
            prefix-icon="Lock"
            size="large"
            show-password
          />
        </el-form-item>
        
        <div class="forgot-password" @click="showForgotPassword = true; showLogin = false;">
          忘记密码？
        </div>
        
        <div class="terms-agreement">
          <el-checkbox v-model="loginAgreed" size="small">
            我已阅读并同意
            <a @click.stop="goToPage('privacy-policy')" class="terms-link">《隐私政策》</a>
            和
            <a @click.stop="goToPage('terms-of-service')" class="terms-link">《服务条款》</a>
          </el-checkbox>
        </div>
        
        <el-form-item>
          <el-button type="primary" class="submit-btn" @click="doLogin">
            立即登录
          </el-button>
        </el-form-item>
        
        <div class="switch-auth">
          还没有账号？<a @click="showLogin = false; showRegister = true;">立即注册</a>
        </div>
      </el-form>
    </el-dialog>

    <!-- 注册弹窗 -->
    <el-dialog
      v-model="showRegister"
      width="450px"
      align-center
      :show-close="false"
      class="auth-dialog"
    >
      <template #header>
        <div class="dialog-header">新用户注册</div>
      </template>
      <el-form :model="regForm" :rules="regRules" ref="regRef" label-width="0">
        <el-form-item prop="nickname">
          <el-input
            v-model="regForm.nickname"
            placeholder="请输入用户名（必填）"
            prefix-icon="User"
            size="large"
          />
        </el-form-item>

        <el-form-item prop="email">
          <el-input
            v-model="regForm.email"
            placeholder="请输入您的邮箱"
            prefix-icon="Message"
            size="large"
          />
        </el-form-item>

        <el-form-item prop="password">
          <el-input
            v-model="regForm.password"
            type="password"
            placeholder="密码需8位以上，含大小写字母、数字、特殊字符"
            prefix-icon="Lock"
            size="large"
            show-password
          />
        </el-form-item>
        
        <div class="password-strength" v-if="regForm.password">
          <div class="strength-bar">
            <div 
              class="strength-fill" 
              :class="passwordStrength.level"
              :style="{ width: passwordStrength.percent + '%' }"
            ></div>
          </div>
          <div class="strength-text" :class="passwordStrength.level">
            {{ passwordStrength.text }}
          </div>
        </div>
        
        <el-form-item prop="confirm">
          <el-input
            v-model="regForm.confirm"
            type="password"
            placeholder="请再次输入您的密码"
            prefix-icon="Lock"
            size="large"
            show-password
          />
        </el-form-item>
        
        <el-form-item prop="code">
          <div style="display: flex; gap: 8px;">
            <el-input
              v-model="regForm.code"
              placeholder="请输入验证码"
              prefix-icon="Key"
              size="large"
              style="flex: 1;"
            />
            <el-button 
              size="large" 
              :disabled="codeCountdown > 0"
              @click="sendCode"
            >
              {{ codeCountdown > 0 ? `${codeCountdown}秒` : '发送验证码' }}
            </el-button>
          </div>
        </el-form-item>
        
        <div class="terms-agreement">
          <el-checkbox v-model="registerAgreed" size="small">
            我已阅读并同意
            <a @click.stop="goToPage('privacy-policy')" class="terms-link">《隐私政策》</a>
            和
            <a @click.stop="goToPage('terms-of-service')" class="terms-link">《服务条款》</a>
          </el-checkbox>
        </div>
        
        <el-form-item>
          <el-button type="primary" class="submit-btn" @click="doReg">
            完成注册
          </el-button>
        </el-form-item>
        
        <div class="switch-auth">
          已有账号？<a @click="showRegister = false; showLogin = true;">立即登录</a>
        </div>
      </el-form>
    </el-dialog>

    <!-- 忘记密码弹窗 -->
    <el-dialog
      v-model="showForgotPassword"
      width="450px"
      align-center
      :show-close="false"
      class="auth-dialog"
    >
      <template #header>
        <div class="dialog-header">找回密码</div>
      </template>
      <el-form :model="forgotForm" :rules="forgotRules" ref="forgotRef" label-width="0">
        <el-form-item prop="email">
          <el-input
            v-model="forgotForm.email"
            placeholder="请输入您的邮箱"
            prefix-icon="Message"
            size="large"
          />
        </el-form-item>
        
        <el-form-item prop="code">
          <div style="display: flex; gap: 8px;">
            <el-input
              v-model="forgotForm.code"
              placeholder="请输入验证码"
              prefix-icon="Key"
              size="large"
              style="flex: 1;"
            />
            <el-button 
              size="large" 
              :disabled="forgotCodeCountdown > 0"
              @click="sendForgotCode"
            >
              {{ forgotCodeCountdown > 0 ? `${forgotCodeCountdown}秒` : '发送验证码' }}
            </el-button>
          </div>
        </el-form-item>
        
        <el-form-item prop="newPassword">
          <el-input
            v-model="forgotForm.newPassword"
            type="password"
            placeholder="请输入新密码（8位以上，含大小写、数字、特殊字符）"
            prefix-icon="Lock"
            size="large"
            show-password
          />
        </el-form-item>
        
        <el-form-item prop="confirmPassword">
          <el-input
            v-model="forgotForm.confirmPassword"
            type="password"
            placeholder="请再次输入新密码"
            prefix-icon="Lock"
            size="large"
            show-password
          />
        </el-form-item>
        
        <el-form-item>
          <el-button type="primary" class="submit-btn" @click="doResetPassword">
            重置密码
          </el-button>
        </el-form-item>
        
        <div class="back-to-login" @click="showForgotPassword = false; showLogin = true;">
          返回登录
        </div>
      </el-form>
    </el-dialog>

    <!-- 拼图验证码弹窗 -->
    <el-dialog
      v-model="showSlideVerify"
      width="420px"
      align-center
      :show-close="true"
      class="verify-dialog"
      @close="handleVerifyClose"
    >
      <SlideVerify 
        ref="slideVerifyRef"
        @success="handleVerifySuccess" 
        @fail="handleVerifyFail"
      />
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import { 
  Promotion, Reading, ArrowRight, ArrowDown, ArrowUp, 
  User, ChatDotRound, ChatLineRound, Calendar, 
  Document, TrendCharts, Connection, Check, 
  Notebook, DataAnalysis, EditPen,
  Trophy, Users, BookOpen, ChatSquare
} from '@element-plus/icons-vue';
import axios from 'axios';
import SlideVerify from '@/components/SlideVerify.vue';

const router = useRouter();

// 动画数字
const animatedUsers = ref(0);
const animatedQuestions = ref(0);
const animatedSatisfaction = ref(0);

// 功能列表
const features = ref([
  {
    icon: ChatDotRound,
    title: 'AI 智能答疑',
    desc: '24/7 在线 AI 助教，即时解答学习疑问，提供详细的解题思路和知识点讲解',
    color: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
  },
  {
    icon: Trophy,
    title: '个性化学习计划',
    desc: '根据你的学习进度和目标，智能生成专属学习计划，科学安排学习时间',
    color: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)'
  },
  {
    icon: Notebook,
    title: '智能错题本',
    desc: '自动收集整理错题，分析薄弱知识点，针对性推送练习题，巩固学习效果',
    color: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)'
  },
  {
    icon: TrendCharts,
    title: '学习数据分析',
    desc: '可视化学习数据，追踪学习进度，发现学习规律，优化学习策略',
    color: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)'
  },
  {
    icon: ChatSquare,
    title: '学习社区',
    desc: '与同学交流学习心得，分享学习资源，互相帮助，共同进步',
    color: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)'
  },
  {
    icon: Document,
    title: '智能笔记',
    desc: '支持富文本编辑，自动整理知识点，构建个人知识体系',
    color: 'linear-gradient(135deg, #30cfd0 0%, #330867 100%)'
  }
]);

// 选择我们的理由
const reasons = ref([
  {
    title: 'AI 驱动的个性化学习',
    desc: '利用先进的人工智能技术，为每位学生提供量身定制的学习方案，让学习更高效'
  },
  {
    title: '全方位的学习支持',
    desc: '从答疑、计划到数据分析，提供完整的学习闭环，全面提升学习效果'
  },
  {
    title: '随时随地学习',
    desc: '支持多端访问，无论在家还是在外，都能随时开启学习之旅'
  },
  {
    title: '专业的教研团队',
    desc: '由经验丰富的教师和 AI 专家组成的团队，确保内容质量和技术先进性'
  }
]);

// 常见问题
const faqs = ref([
  {
    question: '这个平台适合哪些学生使用？',
    answer: '我们的平台适合所有年龄段的学生，从小学到大学，涵盖各个学科。无论你是需要课后辅导，还是想要提前预习，都能在这里找到合适的学习资源。'
  },
  {
    question: 'AI 答疑的准确率如何？',
    answer: '我们的 AI 答疑系统基于先进的大语言模型，经过大量教育数据训练，准确率超过 95%。对于复杂问题，系统会提供详细的解题步骤和知识点讲解。'
  },
  {
    question: '如何制定个性化学习计划？',
    answer: '系统会根据你的学习目标、当前水平和可用时间，智能生成学习计划。你也可以根据实际情况随时调整计划，系统会自动优化后续安排。'
  },
  {
    question: '学习数据会被保密吗？',
    answer: '我们非常重视用户隐私，所有学习数据都经过加密存储，仅用于个性化学习推荐。我们承诺不会将你的数据分享给第三方。'
  },
  {
    question: '平台是否收费？',
    answer: '我们提供免费的基础功能，包括 AI 答疑、学习计划等。高级功能如深度数据分析、专属学习顾问等需要订阅会员。'
  }
]);

const activeFaq = ref(null);
const featuresInView = ref(false);
const whyInView = ref(false);
const faqInView = ref(false);
const ctaInView = ref(false);

// 认证相关
const showLogin = ref(false);
const showRegister = ref(false);
const showForgotPassword = ref(false);

const loginRef = ref(null);
const regRef = ref(null);
const forgotRef = ref(null);

const loginForm = reactive({ 
  email: "",
  password: "" 
});

const regForm = reactive({ 
  email: "",
  password: "", 
  confirm: "",
  code: "",
  nickname: ""
});

// 条款勾选状态
const loginAgreed = ref(false);
const registerAgreed = ref(false);

const forgotForm = reactive({
  email: '',
  code: '',
  newPassword: '',
  confirmPassword: ''
});

const codeCountdown = ref(0);
const forgotCodeCountdown = ref(0);
let codeTimer = null;
let forgotCodeTimer = null;

// 计算密码强度
const passwordStrength = computed(() => {
  const pwd = regForm.password;
  if (!pwd) return { level: '', percent: 0, text: '' };
  
  let score = 0;
  const checks = {
    length: pwd.length >= 8,
    upper: /[A-Z]/.test(pwd),
    lower: /[a-z]/.test(pwd),
    number: /\d/.test(pwd),
    special: /[!@#$%^&*(),.?":{}|<>]/.test(pwd)
  };
  
  Object.values(checks).forEach(check => {
    if (check) score += 20;
  });
  
  if (score <= 40) return { level: 'weak', percent: score, text: '弱' };
  if (score <= 60) return { level: 'medium', percent: score, text: '中等' };
  if (score <= 80) return { level: 'strong', percent: score, text: '强' };
  return { level: 'very-strong', percent: 100, text: '非常强' };
});

// 表单验证规则
const emailRule = [
  { required: true, message: "请输入邮箱", trigger: "blur" },
  { pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: "邮箱格式错误", trigger: "blur" },
];

const pwdRule = [
  { required: true, message: "请输入密码", trigger: "blur" },
  { min: 8, message: "密码至少8位", trigger: "blur" },
  { 
    validator: (_, val, cb) => {
      if (!val) return cb();
      const hasUpper = /[A-Z]/.test(val);
      const hasLower = /[a-z]/.test(val);
      const hasNumber = /\d/.test(val);
      const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(val);
      
      if (!hasUpper) return cb(new Error("密码必须包含大写字母"));
      if (!hasLower) return cb(new Error("密码必须包含小写字母"));
      if (!hasNumber) return cb(new Error("密码必须包含数字"));
      if (!hasSpecial) return cb(new Error("密码必须包含特殊字符"));
      
      cb();
    },
    trigger: "blur"
  },
];

const loginRules = {
  email: emailRule,
  password: pwdRule,
};

const regRules = {
  nickname: [
    { required: true, message: "请输入用户名", trigger: "blur" },
    { 
      pattern: /^[a-zA-Z0-9\u4e00-\u9fa5]+$/, 
      message: "用户名只能包含文字、数字、字母", 
      trigger: "blur" 
    }
  ],
  email: [
    { required: true, message: "请输入邮箱", trigger: "blur" },
    { 
      pattern: /^[0-9]+@qq\.com$/, 
      message: "请使用QQ邮箱", 
      trigger: "blur" 
    }
  ],
  password: pwdRule,
  code: [{ required: true, message: "请输入验证码", trigger: "blur" }],
  confirm: [
    { required: true, message: "请确认密码", trigger: "blur" },
    {
      validator: (_, val, cb) =>
        val === regForm.password ? cb() : cb(new Error("两次不一致")),
      trigger: "blur",
    },
  ],
};

const forgotRules = {
  email: emailRule,
  code: [{ required: true, message: "请输入验证码", trigger: "blur" }],
  newPassword: pwdRule,
  confirmPassword: [
    { required: true, message: "请确认密码", trigger: "blur" },
    {
      validator: (_, val, cb) =>
        val === forgotForm.newPassword ? cb() : cb(new Error("两次密码不一致")),
      trigger: "blur",
    },
  ],
};

// 切换 FAQ
function toggleFaq(index) {
  activeFaq.value = activeFaq.value === index ? null : index;
}

// 滚动到功能区
function scrollToFeatures() {
  const element = document.getElementById('features');
  if (element) {
    element.scrollIntoView({ behavior: 'smooth' });
  }
}

// 页面跳转
function goToPage(path) {
  router.push('/' + path);
}

// 处理产品功能点击
function handleProductClick(productType) {
  // 产品功能需要登录后使用，显示注册弹窗
  showRegister.value = true;
}

// 处理反馈建议点击
function handleFeedbackClick() {
  ElMessage({
    message: '请登录后使用反馈功能',
    type: 'warning',
    duration: 3000,
    showClose: true
  });
}

// 处理联系我们点击
function handleContactClick() {
  ElMessage({
    message: '联系邮箱：2169702639@qq.com',
    type: 'success',
    duration: 3000,
    showClose: true
  });
}

// 拼图验证码状态
const showSlideVerify = ref(false);
const slideVerifyRef = ref(null);

// 验证成功
const handleVerifySuccess = () => {
  setTimeout(() => {
    showSlideVerify.value = false;
    sendCodeRequest();
  }, 800);
};

// 验证失败
const handleVerifyFail = () => {
  ElMessage.warning('验证失败，请重试');
};

// 关闭验证弹窗
const handleVerifyClose = () => {
  if (slideVerifyRef.value) {
    slideVerifyRef.value.refresh();
  }
};

// 发送验证码请求
const sendCodeRequest = async () => {
  try {
    const response = await axios.post(
      "http://localhost:3001/api/user/send-code",
      { email: regForm.email }
    );
    
    ElMessage.success(response.data.message || "验证码已发送，请查收邮件");
    
    codeCountdown.value = 60;
    codeTimer = setInterval(() => {
      codeCountdown.value--;
      if (codeCountdown.value <= 0) {
        clearInterval(codeTimer);
      }
    }, 1000);
  } catch (error) {
    ElMessage.error(error.response?.data?.message || "发送验证码失败");
  }
};

// 发送验证码（注册）
const sendCode = async () => {
  // 1. 检查密码是否输入
  if (!regForm.password) {
    ElMessage.warning("请先输入密码");
    return;
  }
  
  // 2. 检查密码是否符合规则
  if (regForm.password.length < 8) {
    ElMessage.warning("密码至少需要8位");
    return;
  }
  
  const hasUpper = /[A-Z]/.test(regForm.password);
  const hasLower = /[a-z]/.test(regForm.password);
  const hasNumber = /\d/.test(regForm.password);
  const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(regForm.password);
  
  if (!hasUpper || !hasLower || !hasNumber || !hasSpecial) {
    ElMessage.warning("密码必须包含大小写字母、数字和特殊字符");
    return;
  }
  
  // 3. 检查确认密码是否输入
  if (!regForm.confirm) {
    ElMessage.warning("请先输入确认密码");
    return;
  }
  
  // 4. 检查两次密码是否一致
  if (regForm.password !== regForm.confirm) {
    ElMessage.warning("两次密码输入不一致");
    return;
  }
  
  // 5. 检查邮箱
  if (!regForm.email) {
    ElMessage.warning("请先输入邮箱");
    return;
  }
  
  // 【调试】输出邮箱值和长度
  console.log("=== 邮箱调试信息 ===");
  console.log("邮箱值:", regForm.email);
  console.log("邮箱长度:", regForm.email.length);
  console.log("邮箱字符码:", [...regForm.email].map(c => c.charCodeAt(0)));
  console.log("邮箱JSON:", JSON.stringify(regForm.email));
  
  const qqEmailRegex = /^[0-9]+@qq\.com$/;
  const testResult = qqEmailRegex.test(regForm.email);
  console.log("正则测试结果:", testResult);
  
  if (!testResult) {
    ElMessage.warning("请使用QQ邮箱");
    return;
  }
  
  // 6. 显示拼图验证码
  showSlideVerify.value = true;
};

// 发送验证码（忘记密码）
const sendForgotCode = async () => {
  if (!forgotForm.email) {
    ElMessage.warning("请先输入邮箱");
    return;
  }
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(forgotForm.email)) {
    ElMessage.warning("邮箱格式不正确");
    return;
  }
  
  try {
    const response = await axios.post(
      "http://localhost:3001/api/user/send-reset-code",
      { email: forgotForm.email }
    );
    
    ElMessage.success(response.data.message || "验证码已发送，请查收邮件");
    
    forgotCodeCountdown.value = 60;
    forgotCodeTimer = setInterval(() => {
      forgotCodeCountdown.value--;
      if (forgotCodeCountdown.value <= 0) {
        clearInterval(forgotCodeTimer);
      }
    }, 1000);
  } catch (error) {
    ElMessage.error(error.response?.data?.message || "发送验证码失败");
  }
};

// 登录
const doLogin = async () => {
  try {
    // 检查是否同意条款
    if (!loginAgreed.value) {
      ElMessage.warning("请先阅读并同意隐私政策和服务条款");
      return;
    }

    await loginRef.value.validate();

    const email = String(loginForm.email || "").trim();
    const password = String(loginForm.password || "").trim();
    
    if (!email || !password) {
      ElMessage.warning("请输入邮箱和密码");
      return;
    }

    const response = await axios.post(
      "http://localhost:3001/api/user/login",
      {
        account: email,
        password: password,
      },
      {
        headers: { "Content-Type": "application/json" },
        timeout: 10000,
      }
    );

    const data = response.data;
    localStorage.setItem("edu-token", data.token || "");  // 保存 token
    localStorage.setItem("edu-user-id", data.userId || "");
    localStorage.setItem("edu-nickname", data.nickname || "");
    localStorage.setItem("edu-avatar", data.avatar || "");
    localStorage.setItem("edu-email", email);
    ElMessage.success(data.message || "登录成功！即将跳转到首页");
    showLogin.value = false;
    setTimeout(() => router.push("/ai-chat"), 600);
  } catch (error) {
    if (error.name === "ValidationError") {
      ElMessage.warning("请填写正确的登录信息");
    } else {
      const errorMsg = error.response?.data?.message || "网络异常，请检查后端服务是否启动";
      ElMessage.error(errorMsg);
    }
  }
};

// 注册
const doReg = async () => {
  try {
    // 检查是否同意条款
    if (!registerAgreed.value) {
      ElMessage.warning("请先阅读并同意隐私政策和服务条款");
      return;
    }

    await regRef.value.validate();
    
    if (!regForm.nickname || !regForm.nickname.trim()) {
      ElMessage.warning("请输入用户名");
      return;
    }

    if (!regForm.email) {
      ElMessage.warning("请输入邮箱");
      return;
    }
    if (!regForm.code) {
      ElMessage.warning("请输入验证码");
      return;
    }
    
    const response = await axios.post(
      "http://localhost:3001/api/user/register-email",
      {
        email: regForm.email,
        password: regForm.password,
        code: regForm.code,
        nickname: regForm.nickname.trim()
      },
      {
        headers: { "Content-Type": "application/json" },
        timeout: 10000,
      }
    );

    const data = response.data;
    ElMessage.success(data.message || "注册成功，请登录！");
    localStorage.setItem("edu-token", data.token || "");  // 保存 token
    localStorage.setItem("edu-user-id", data.userId || "");
    localStorage.setItem("edu-nickname", data.nickname || "");
    localStorage.setItem("edu-avatar", data.avatar || "");
    localStorage.setItem("edu-email", regForm.email);
    showRegister.value = false;
    
    loginForm.email = String(regForm.email || "");
    
    regForm.email = "";
    regForm.password = "";
    regForm.confirm = "";
    regForm.code = "";
    regForm.nickname = "";
  } catch (error) {
    if (error.name === "ValidationError") {
      ElMessage.warning("请填写正确的注册信息");
    } else {
      const errorMsg =
        error.response?.data?.message || "网络异常，请检查后端服务是否启动";
      ElMessage.error("注册失败：" + errorMsg);
    }
  }
};

// 重置密码
const doResetPassword = async () => {
  try {
    await forgotRef.value.validate();
    
    const response = await axios.post(
      "http://localhost:3001/api/user/reset-password",
      {
        email: forgotForm.email,
        code: forgotForm.code,
        newPassword: forgotForm.newPassword
      }
    );
    
    ElMessage.success(response.data.message || "密码重置成功，请登录");
    showForgotPassword.value = false;
    
    forgotForm.email = '';
    forgotForm.code = '';
    forgotForm.newPassword = '';
    forgotForm.confirmPassword = '';
    
    showLogin.value = true;
    loginForm.email = forgotForm.email;
  } catch (error) {
    if (error.name !== "ValidationError") {
      ElMessage.error(error.response?.data?.message || "重置密码失败");
    }
  }
};

// 数字动画
function animateNumber(target, duration, callback) {
  const start = 0;
  const increment = target / (duration / 16);
  let current = start;
  
  const timer = setInterval(() => {
    current += increment;
    if (current >= target) {
      current = target;
      clearInterval(timer);
    }
    callback(Math.floor(current));
  }, 16);
}

// 监听滚动
function handleScroll() {
  const sections = [
    { id: 'features', ref: featuresInView },
    { id: 'why-section', ref: whyInView },
    { id: 'faq-section', ref: faqInView },
    { id: 'cta-section', ref: ctaInView }
  ];
  
  sections.forEach(section => {
    const element = document.getElementById(section.id);
    if (element && !section.ref.value) {
      const rect = element.getBoundingClientRect();
      if (rect.top < window.innerHeight * 0.8) {
        section.ref.value = true;
      }
    }
  });
}

onMounted(() => {
  setTimeout(() => {
    animateNumber(10000, 2000, (val) => animatedUsers.value = val);
    animateNumber(50000, 2000, (val) => animatedQuestions.value = val);
    animateNumber(98, 2000, (val) => animatedSatisfaction.value = val);
  }, 500);
  
  window.addEventListener('scroll', handleScroll);
  handleScroll();
});

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll);
  if (codeTimer) clearInterval(codeTimer);
  if (forgotCodeTimer) clearInterval(forgotCodeTimer);
});
</script>


<style scoped>
/* ========== 全局样式 ========== */
.landing-page {
  width: 100%;
  overflow-x: hidden;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 24px;
}

/* ========== 顶部导航 ========== */
.top-nav {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 1000;
  height: 70px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 60px;
  background: rgba(255, 255, 255, 0.98);
  backdrop-filter: blur(12px);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  transition: all 0.3s ease;
}

.nav-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.logo {
  width: 40px;
  height: 40px;
  border-radius: 8px;
  object-fit: cover;
}

.brand {
  font-size: 20px;
  font-weight: 700;
  color: #1e293b;
}

.nav-right {
  display: flex;
  gap: 12px;
}

.nav-right .el-button {
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
  color: white;
  border: none;
  padding: 10px 24px;
  font-weight: 500;
}

.nav-right .el-button:hover {
  background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
}

/* ========== Hero Section ========== */
.hero-section {
  position: relative;
  min-height: 100vh;
  background: #ffffff;
  display: flex;
  align-items: center;
  overflow: hidden;
  padding-top: 70px;
}

.hero-section::before {
  content: '';
  position: absolute;
  top: 20%;
  left: 10%;
  width: 600px;
  height: 600px;
  background: radial-gradient(circle, rgba(59, 130, 246, 0.25) 0%, transparent 70%);
  pointer-events: none;
  z-index: 0;
}

.hero-section::after {
  content: '';
  position: absolute;
  bottom: 10%;
  right: 15%;
  width: 500px;
  height: 500px;
  background: radial-gradient(circle, rgba(96, 165, 250, 0.22) 0%, transparent 70%);
  pointer-events: none;
  z-index: 0;
}

.hero-content {
  position: relative;
  z-index: 2;
  max-width: 1200px;
  margin: 0 auto;
  padding: 80px 24px;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 60px;
  align-items: center;
}

.hero-text {
  color: #1e293b;
}

.hero-title {
  font-size: 56px;
  font-weight: 700;
  line-height: 1.2;
  margin-bottom: 24px;
  color: #1e293b;
}

.hero-subtitle {
  font-size: 20px;
  line-height: 1.6;
  color: #475569;
  margin-bottom: 40px;
}

.hero-buttons {
  display: flex;
  gap: 16px;
  margin-bottom: 60px;
}

.hero-buttons .el-button {
  padding: 16px 32px;
  font-size: 16px;
  border-radius: 12px;
}

.hero-stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 32px;
}

.stat-item {
  text-align: center;
}

.stat-number {
  font-size: 36px;
  font-weight: 700;
  margin-bottom: 8px;
  color: #0969da;
}

.stat-label {
  font-size: 14px;
  color: #64748b;
}

.hero-visual {
  position: relative;
  height: 500px;
}

.visual-card {
  position: absolute;
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.9);
  border-radius: 20px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.06);
}

.card-1 {
  width: 280px;
  height: 200px;
  top: 50px;
  left: 50px;
  animation: float 6s ease-in-out infinite;
}

.card-2 {
  width: 240px;
  height: 180px;
  top: 150px;
  right: 80px;
  animation: float 6s ease-in-out infinite 2s;
}

.card-3 {
  width: 200px;
  height: 160px;
  bottom: 80px;
  left: 120px;
  animation: float 6s ease-in-out infinite 4s;
}

.hero-wave {
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  z-index: 1;
}

.hero-wave svg {
  display: block;
  width: 100%;
  height: 120px;
}

/* ========== Animations ========== */
@keyframes fade-in {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes float {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-20px);
  }
}

.animate-fade-in {
  animation: fade-in 1s ease-out;
}

.animate-fade-in-delay {
  animation: fade-in 1s ease-out 0.2s both;
}

.animate-fade-in-delay-2 {
  animation: fade-in 1s ease-out 0.4s both;
}

.animate-fade-in-delay-3 {
  animation: fade-in 1s ease-out 0.6s both;
}

.animate-float {
  animation: float 6s ease-in-out infinite;
}

/* ========== Section Common Styles ========== */
.section-header {
  text-align: center;
  margin-bottom: 60px;
}

.section-title {
  font-size: 42px;
  font-weight: 700;
  color: #24292f;
  margin-bottom: 16px;
}

.section-subtitle {
  font-size: 18px;
  color: #57606a;
}

/* ========== Features Section ========== */
.features-section {
  padding: 100px 0;
  background: white;
}

.features-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 32px;
}

.feature-card {
  padding: 40px 32px;
  background: white;
  border: 1px solid #e5e9ed;
  border-radius: 16px;
  transition: all 0.3s ease;
  opacity: 0;
  transform: translateY(30px);
}

.feature-card.in-view {
  animation: fade-in 0.6s ease-out forwards;
}

.feature-card:hover {
  transform: translateY(-8px);
  box-shadow: 0 12px 24px rgba(0, 0, 0, 0.1);
  border-color: #0969da;
}

.feature-icon {
  width: 64px;
  height: 64px;
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 24px;
  font-size: 28px;
  color: white;
}

.feature-title {
  font-size: 20px;
  font-weight: 600;
  color: #24292f;
  margin-bottom: 12px;
}

.feature-desc {
  font-size: 14px;
  color: #57606a;
  line-height: 1.6;
}

/* ========== Why Section ========== */
.why-section {
  padding: 100px 0;
  background: #f6f8fa;
  opacity: 0;
  transform: translateY(50px);
  transition: all 0.8s ease;
}

.why-section.in-view {
  opacity: 1;
  transform: translateY(0);
}

.why-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 32px;
}

.why-section.in-view .why-card {
  animation: fade-in-up 0.6s ease-out forwards;
}

.why-card {
  padding: 40px;
  background: white;
  border-radius: 16px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  transition: all 0.3s ease;
  opacity: 0;
  transform: translateY(30px);
}

@keyframes fade-in-up {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.why-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
}

.why-number {
  display: inline-block;
  width: 48px;
  height: 48px;
  background: linear-gradient(135deg, #0969da 0%, #1e40af 100%);
  color: white;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  font-weight: 700;
  margin-bottom: 20px;
}

.why-title {
  font-size: 22px;
  font-weight: 600;
  color: #24292f;
  margin-bottom: 12px;
}

.why-desc {
  font-size: 15px;
  color: #57606a;
  line-height: 1.6;
}

/* ========== FAQ Section ========== */
.faq-section {
  padding: 100px 0;
  background: white;
  opacity: 0;
  transform: translateY(50px);
  transition: all 0.8s ease;
}

.faq-section.in-view {
  opacity: 1;
  transform: translateY(0);
}

.faq-list {
  max-width: 800px;
  margin: 0 auto;
}

.faq-section.in-view .faq-item {
  animation: fade-in-up 0.6s ease-out forwards;
}

.faq-item {
  margin-bottom: 16px;
  background: white;
  border: 1px solid #e5e9ed;
  border-radius: 12px;
  overflow: hidden;
  transition: all 0.3s ease;
  cursor: pointer;
  opacity: 0;
  transform: translateY(20px);
}

.faq-item:hover {
  border-color: #0969da;
}

.faq-item.active {
  border-color: #0969da;
  box-shadow: 0 4px 12px rgba(9, 105, 218, 0.1);
}

.faq-question {
  padding: 24px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 16px;
  font-weight: 500;
  color: #24292f;
}

.faq-icon {
  font-size: 20px;
  color: #0969da;
  transition: transform 0.3s ease;
}

.faq-answer {
  padding: 0 24px 24px;
  font-size: 15px;
  color: #57606a;
  line-height: 1.6;
}

.faq-answer-enter-active,
.faq-answer-leave-active {
  transition: all 0.3s ease;
}

.faq-answer-enter-from,
.faq-answer-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

/* ========== CTA Section ========== */
.cta-section {
  padding: 120px 0;
  background: linear-gradient(135deg, #f8fafc 0%, #eff6ff 30%, #dbeafe 50%, #eff6ff 70%, #f8fafc 100%);
  color: #1e293b;
  position: relative;
  overflow: hidden;
  opacity: 0;
  transform: translateY(50px);
  transition: all 0.8s ease;
}

.cta-section.in-view {
  opacity: 1;
  transform: translateY(0);
}

.cta-section.in-view .cta-title {
  animation: fade-in-scale 0.8s ease-out 0.2s forwards;
}

.cta-section.in-view .cta-subtitle {
  animation: fade-in-scale 0.8s ease-out 0.4s forwards;
}

.cta-section.in-view .cta-buttons {
  animation: fade-in-scale 0.8s ease-out 0.6s forwards;
}

.cta-section.in-view .cta-features {
  animation: fade-in-scale 0.8s ease-out 0.8s forwards;
}

@keyframes fade-in-scale {
  from {
    opacity: 0;
    transform: scale(0.9);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

.cta-section::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 800px;
  height: 800px;
  background: radial-gradient(circle, rgba(59, 130, 246, 0.15) 0%, transparent 70%);
  pointer-events: none;
}

.cta-content {
  text-align: center;
  position: relative;
  z-index: 1;
}

.cta-title {
  font-size: 48px;
  font-weight: 700;
  margin-bottom: 20px;
  background: linear-gradient(90deg, #1e40af 0%, #3b82f6 50%, #1e40af 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  position: relative;
  display: inline-block;
  opacity: 0;
  transform: scale(0.9);
}

.cta-title::before {
  content: '准备好开始你的学习之旅了吗？';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, #1e40af 0%, #3b82f6 50%, #1e40af 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  z-index: 1;
}

.cta-title::after {
  content: '准备好开始你的学习之旅了吗？';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(
    90deg,
    transparent 0%,
    transparent 40%,
    rgba(255, 255, 255, 0.6) 50%,
    transparent 60%,
    transparent 100%
  );
  background-size: 200% 100%;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  animation: shine-text 5s ease-in-out infinite;
  z-index: 2;
}

@keyframes shine-text {
  0% {
    background-position: -100% center;
  }
  40% {
    background-position: 100% center;
  }
  100% {
    background-position: 100% center;
  }
}

.cta-subtitle {
  font-size: 18px;
  margin-bottom: 40px;
  color: #64748b;
  opacity: 0;
  transform: scale(0.9);
}

.cta-buttons {
  display: flex;
  gap: 16px;
  justify-content: center;
  margin-bottom: 40px;
  opacity: 0;
  transform: scale(0.9);
}

.cta-buttons .el-button {
  padding: 16px 40px;
  font-size: 16px;
  border-radius: 12px;
  font-weight: 600;
  transition: all 0.3s ease;
}

.cta-buttons .el-button--primary {
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
  color: white;
  border: none;
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
}

.cta-buttons .el-button--primary:hover {
  background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(59, 130, 246, 0.4);
}

.cta-buttons .el-button.is-plain {
  background: white;
  color: #3b82f6;
  border: 2px solid #3b82f6;
}

.cta-buttons .el-button.is-plain:hover {
  background: #eff6ff;
  border-color: #2563eb;
  color: #2563eb;
}

.cta-features {
  display: flex;
  gap: 40px;
  justify-content: center;
  align-items: center;
  opacity: 0;
  transform: scale(0.9);
}

.cta-feature-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: #64748b;
}

.cta-feature-item .el-icon {
  font-size: 18px;
  color: #3b82f6;
}

/* ========== Footer ========== */
.footer {
  padding: 60px 0 30px;
  background: #ffffff;
  color: #1e293b;
  border-top: 1px solid #e5e7eb;
}

.footer-content {
  display: grid;
  grid-template-columns: 1fr 2fr;
  gap: 60px;
  margin-bottom: 40px;
}

.footer-info h3 {
  font-size: 24px;
  margin-bottom: 12px;
  color: #1e293b;
}

.footer-info p {
  font-size: 14px;
  color: #64748b;
}

.footer-links {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 40px;
}

.footer-column h4 {
  font-size: 16px;
  margin-bottom: 16px;
  color: #1e293b;
}

.footer-column a {
  display: block;
  font-size: 14px;
  color: #64748b;
  margin-bottom: 12px;
  cursor: pointer;
  transition: color 0.3s ease;
  text-decoration: none;
}

.footer-column a:hover {
  color: #3b82f6;
}

.footer-bottom {
  padding-top: 30px;
  border-top: 1px solid #e5e7eb;
  text-align: center;
}

.footer-bottom p {
  font-size: 14px;
  color: #94a3b8;
}

/* ========== 认证弹窗 ========== */
.auth-dialog {
  --el-dialog-border-radius: 32px;
  border: 2px solid #0969da;
  box-shadow: 0 12px 48px rgba(0, 0, 0, 0.15);
}

:deep(.el-dialog) {
  border-radius: 32px;
}

:deep(.el-input__wrapper) {
  border-radius: 16px;
}

:deep(.el-button) {
  border-radius: 16px;
}

.dialog-header {
  text-align: center;
  font-size: 18px;
  font-weight: 600;
  background: linear-gradient(90deg, #0969da, #4dabf7);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  padding: 12px 0;
}

.submit-btn {
  width: 100%;
  letter-spacing: 1px;
}

:deep(.el-dialog__body) {
  padding: 24px 32px 32px;
}

.forgot-password,
.back-to-login {
  text-align: right;
  margin: -10px 0 16px;
  font-size: 13px;
  color: #0969da;
  cursor: pointer;
  transition: all 0.3s;
}

.forgot-password:hover,
.back-to-login:hover {
  color: #4dabf7;
  text-decoration: underline;
}

.back-to-login {
  text-align: center;
  margin-top: 16px;
}

.switch-auth {
  text-align: center;
  margin-top: 16px;
  font-size: 14px;
  color: #666;
}

.switch-auth a {
  color: #0969da;
  cursor: pointer;
  transition: all 0.3s;
}

.switch-auth a:hover {
  color: #4dabf7;
  text-decoration: underline;
}

/* 条款勾选样式 */
.terms-agreement {
  margin: 16px 0;
  font-size: 13px;
  color: #64748b;
  line-height: 1.5;
}

.terms-link {
  color: #0969da;
  text-decoration: none;
  cursor: pointer;
  transition: all 0.3s;
}

.terms-link:hover {
  color: #4dabf7;
  text-decoration: underline;
}

/* 密码强度指示器 */
.password-strength {
  margin: -10px 0 16px;
  display: flex;
  align-items: center;
  gap: 12px;
}

.strength-bar {
  flex: 1;
  height: 6px;
  background: #e4e7ed;
  border-radius: 3px;
  overflow: hidden;
}

.strength-fill {
  height: 100%;
  transition: all 0.3s;
  border-radius: 3px;
}

.strength-fill.weak {
  background: linear-gradient(90deg, #f56c6c, #ff8787);
}

.strength-fill.medium {
  background: linear-gradient(90deg, #e6a23c, #f7ba2a);
}

.strength-fill.strong {
  background: linear-gradient(90deg, #67c23a, #85ce61);
}

.strength-fill.very-strong {
  background: linear-gradient(90deg, #409eff, #66b1ff);
}

.strength-text {
  font-size: 12px;
  font-weight: 600;
  min-width: 50px;
  text-align: right;
}

.strength-text.weak {
  color: #f56c6c;
}

.strength-text.medium {
  color: #e6a23c;
}

.strength-text.strong {
  color: #67c23a;
}

.strength-text.very-strong {
  color: #409eff;
}

/* ========== 拼图验证码弹窗 ========== */
.verify-dialog {
  --el-dialog-border-radius: 32px;
}

:deep(.verify-dialog .el-dialog) {
  border-radius: 32px;
}

:deep(.verify-dialog .el-dialog__body) {
  padding: 30px 20px;
}

/* ========== 响应式设计 ========== */
@media (max-width: 992px) {
  .hero-content {
    grid-template-columns: 1fr;
    gap: 40px;
  }
  
  .hero-visual {
    height: 300px;
  }
  
  .hero-title {
    font-size: 42px;
  }
  
  .features-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .why-grid {
    grid-template-columns: 1fr;
  }
  
  .footer-content {
    grid-template-columns: 1fr;
    gap: 40px;
  }
  
  .top-nav {
    padding: 0 30px;
  }
}

@media (max-width: 768px) {
  .hero-title {
    font-size: 36px;
  }
  
  .hero-subtitle {
    font-size: 16px;
  }
  
  .hero-buttons {
    flex-direction: column;
  }
  
  .hero-stats {
    grid-template-columns: 1fr;
    gap: 24px;
  }
  
  .section-title {
    font-size: 32px;
  }
  
  .features-grid {
    grid-template-columns: 1fr;
  }
  
  .cta-title {
    font-size: 36px;
  }
  
  .cta-subtitle {
    font-size: 16px;
  }
  
  .cta-buttons {
    flex-direction: column;
    align-items: center;
  }
  
  .cta-buttons .el-button {
    width: 100%;
    max-width: 300px;
  }
  
  .cta-features {
    flex-direction: column;
    gap: 16px;
  }
  
  .footer-links {
    grid-template-columns: 1fr;
    gap: 30px;
  }
  
  .top-nav {
    padding: 0 20px;
    height: 60px;
  }
  
  .brand {
    font-size: 16px;
  }
  
  .logo {
    width: 32px;
    height: 32px;
  }
  
  .auth-dialog {
    width: 90% !important;
    max-width: 400px;
  }
}
</style>
