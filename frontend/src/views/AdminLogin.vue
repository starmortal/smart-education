<!-- AdminLogin.vue :: 管理员登录页面 -->
<template>
  <div class="admin-login-container">
    <div class="login-card">
      <div class="login-header">
        <div class="logo-container">
          <img src="@/assets/logo.png" alt="智慧教育平台" class="login-logo" />
          <div class="logo-info">
            <h2>管理员登录</h2>
            <p>智慧教育平台 - 管理控制台</p>
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
        <el-form-item prop="username">
          <el-input
            v-model="loginForm.username"
            placeholder="管理员账号"
            size="large"
            :prefix-icon="User"
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
import { Lock, User } from '@element-plus/icons-vue';
import { adminLogin } from '@/api/admin';

const router = useRouter();
const loginFormRef = ref(null);
const loginLoading = ref(false);

const loginForm = reactive({
  username: '',
  password: ''
});

const loginRules = {
  username: [
    { required: true, message: '请输入管理员账号', trigger: 'blur' }
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
    
    const res = await adminLogin(loginForm.username, loginForm.password);
    const { token, username } = res.data || {};
    localStorage.setItem('admin-token', token || 'admin-authenticated');
    localStorage.setItem('admin-username', username || loginForm.username);
    ElMessage.success('登录成功');
    router.push('/admin/dashboard');
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
  background: linear-gradient(135deg, #0f172a 0%, #1e3a5f 50%, #3b82f6 100%);
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