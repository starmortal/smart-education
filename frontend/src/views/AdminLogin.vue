<!-- AdminLogin.vue :: 管理员登录页面 -->
<template>
  <div class="admin-login-container">
    <div class="login-card">
      <div class="login-header">
        <div class="logo-container">
          <img src="@/assets/logo.png" alt="智慧教育平台" class="login-logo" />
          <div class="logo-info">
            <h2>管理员登录</h2>
            <p>智慧教育平台 - 反馈管理系统</p>
          </div>
        </div>
      </div>

      <el-form 
        :model="loginForm" 
        :rules="loginRules" 
        ref="loginFormRef"
        class="login-form"
        @submit.prevent="handleLogin"
      >
        <el-form-item prop="email">
          <el-input
            v-model="loginForm.email"
            placeholder="管理员邮箱"
            size="large"
            :prefix-icon="Message"
          />
        </el-form-item>

        <el-form-item prop="password">
          <el-input
            v-model="loginForm.password"
            type="password"
            placeholder="密码"
            size="large"
            :prefix-icon="Lock"
            show-password
            @keyup.enter="handleLogin"
          />
        </el-form-item>

        <el-form-item>
          <el-button 
            type="primary" 
            size="large"
            @click="handleLogin"
            :loading="loginLoading"
            class="login-btn"
          >
            登录
          </el-button>
        </el-form-item>
      </el-form>

      <div class="login-footer">
        <p>智慧教育平台 - 管理员系统</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import { Lock, Message } from '@element-plus/icons-vue';

const router = useRouter();
const loginFormRef = ref(null);
const loginLoading = ref(false);

const loginForm = reactive({
  email: '',
  password: ''
});

const loginRules = {
  email: [
    { required: true, message: '请输入邮箱', trigger: 'blur' },
    { type: 'email', message: '请输入正确的邮箱格式', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, message: '密码长度不能少于6位', trigger: 'blur' }
  ]
};

const handleLogin = async () => {
  if (!loginFormRef.value) return;
  
  try {
    await loginFormRef.value.validate();
    
    loginLoading.value = true;
    
    // 验证管理员账号
    if (loginForm.email === '2492592700@qq.com' && loginForm.password === '147258369po') {
      // 设置管理员登录状态
      localStorage.setItem('admin-token', 'admin-authenticated');
      localStorage.setItem('admin-email', loginForm.email);
      
      ElMessage.success('登录成功');
      router.push('/admin/feedback');
    } else {
      ElMessage.error('邮箱或密码错误');
    }
  } catch (error) {
    console.error('登录失败：', error);
  } finally {
    loginLoading.value = false;
  }
};
</script>

<style scoped>
.admin-login-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.login-card {
  background: white;
  border-radius: 16px;
  padding: 40px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
  width: 100%;
  max-width: 400px;
}

.login-header {
  text-align: center;
  margin-bottom: 30px;
}

.logo-container {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  margin-bottom: 20px;
}

.login-logo {
  width: 48px;
  height: 48px;
  border-radius: 8px;
  object-fit: contain;
}

.logo-info {
  text-align: left;
}

.login-header h2 {
  margin: 0 0 4px 0;
  color: #333;
  font-size: 24px;
  font-weight: 600;
}

.login-header p {
  margin: 0;
  color: #666;
  font-size: 14px;
}

.login-form {
  margin-bottom: 20px;
}

.login-btn {
  width: 100%;
  height: 48px;
  font-size: 16px;
  font-weight: 600;
}

.login-footer {
  text-align: center;
  padding-top: 20px;
  border-top: 1px solid #f0f0f0;
}

.login-footer p {
  margin: 0;
  color: #999;
  font-size: 12px;
}

@media (max-width: 480px) {
  .login-card {
    padding: 30px 20px;
  }
}
</style>