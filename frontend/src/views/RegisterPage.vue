<template>
  <div class="register-container">
    <!-- 顶部Logo区域 -->
    <div class="register-header">
      <div class="logo-section" @click="goToHome">
        <img src="@/assets/logo.png" alt="智慧教育平台" class="register-logo" />
        <div class="logo-info">
          <h1 class="title">智慧教育平台</h1>
          <p class="subtitle">新用户注册</p>
        </div>
      </div>
    </div>
    <el-form
      :model="registerForm"
      :rules="registerRules"
      ref="registerFormRef"
      label-width="80px"
      class="register-form"
    >
      <el-form-item label="邮箱" prop="email">
        <el-input
          v-model="registerForm.email"
          type="email"
          placeholder="请输入QQ邮箱（例如：123456@qq.com）"
        >
          <template #suffix>
            <el-icon v-if="isQQEmail" color="#67c23a"><CircleCheck /></el-icon>
          </template>
        </el-input>
      </el-form-item>
      <el-form-item label="验证码" prop="verifyCode">
        <div class="verify-code-wrapper">
          <el-input
            v-model="registerForm.verifyCode"
            placeholder="请输入邮箱验证码"
            maxlength="6"
          ></el-input>
          <el-button
            type="primary"
            :disabled="countdown > 0"
            @click="handleGetVerifyCode"
            class="verify-code-btn"
          >
            {{ countdown > 0 ? `${countdown}秒后重试` : '获取验证码' }}
          </el-button>
        </div>
      </el-form-item>
      <el-form-item label="密码" prop="password">
        <el-input
          v-model="registerForm.password"
          type="password"
          placeholder="请输入密码（不少于6位）"
        ></el-input>
      </el-form-item>
      <el-form-item label="确认密码" prop="confirmPassword">
        <el-input
          v-model="registerForm.confirmPassword"
          type="password"
          placeholder="请再次输入密码"
        ></el-input>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="handleRegister" class="register-btn"
          >注册</el-button
        >
      </el-form-item>
      <div class="login-link">
        已有账号？<el-link @click="goToLogin">立即登录</el-link>
      </div>
    </el-form>
  </div>
</template>

<script setup>
import { useRouter } from "vue-router";
import { ElMessage } from "element-plus";
import { ref, computed } from "vue";
import { CircleCheck } from "@element-plus/icons-vue";
// 【新增1】导入axios（前提：项目已安装axios，安装命令：npm install axios）
// 如果项目有封装的请求工具（如request.js），请替换成项目的请求工具导入方式
import axios from "axios";

const router = useRouter();
const registerFormRef = ref(null);

// 回到首页
const goToHome = () => {
  router.push('/');
};

// 注册表单数据
const registerForm = ref({
  email: "",
  verifyCode: "",
  password: "",
  confirmPassword: "",
});

// 倒计时
const countdown = ref(0);
let countdownTimer = null;

// 判断是否为QQ邮箱
const isQQEmail = computed(() => {
  const email = registerForm.value.email;
  return /^[0-9]+@qq\.com$/.test(email);
});

// 自定义校验：QQ邮箱验证
const qqEmailValidator = (rule, value, callback) => {
  if (!value) {
    callback(new Error("请输入邮箱"));
  } else if (!/^[0-9]+@qq\.com$/.test(value)) {
    callback(new Error("请使用QQ邮箱注册（格式：数字@qq.com）"));
  } else {
    callback();
  }
};

// 自定义校验：两次密码一致
const confirmPasswordValidator = (rule, value, callback) => {
  if (value !== registerForm.value.password) {
    callback(new Error("两次密码输入不一致"));
  } else {
    callback();
  }
};

// 注册表单校验规则
const registerRules = ref({
  email: [
    { required: true, message: "请输入邮箱", trigger: "blur" },
    {
      validator: qqEmailValidator,
      trigger: "blur",
    },
  ],
  verifyCode: [
    { required: true, message: "请输入验证码", trigger: "blur" },
    { len: 6, message: "验证码为6位数字", trigger: "blur" },
  ],
  password: [
    { required: true, message: "请输入密码", trigger: "blur" },
    { min: 6, message: "密码长度不能少于6位", trigger: "blur" },
  ],
  confirmPassword: [
    { required: true, message: "请确认密码", trigger: "blur" },
    {
      validator: confirmPasswordValidator,
      message: "两次密码输入不一致",
      trigger: "blur",
    },
  ],
});

// 获取验证码
const handleGetVerifyCode = async () => {
  // 先验证邮箱格式
  if (!registerForm.value.email) {
    ElMessage.warning("请先输入邮箱");
    return;
  }
  
  // 验证是否为QQ邮箱
  if (!isQQEmail.value) {
    ElMessage.error("请使用QQ邮箱注册");
    return;
  }
  
  try {
    // 调用后端发送验证码接口
    await axios.post(
      "http://localhost:3001/api/user/send-verify-code",
      {
        email: registerForm.value.email,
      },
      {
        headers: {
          "Content-Type": "application/json",
        },
        timeout: 10000,
      }
    );
    
    ElMessage.success("验证码已发送到您的邮箱，请查收");
    
    // 开始倒计时
    countdown.value = 60;
    countdownTimer = setInterval(() => {
      countdown.value--;
      if (countdown.value <= 0) {
        clearInterval(countdownTimer);
      }
    }, 1000);
  } catch (error) {
    ElMessage.error(
      error.response?.data?.message || "发送验证码失败，请重试"
    );
    console.error("发送验证码失败：", error);
  }
};

// 注册按钮点击事件
const handleRegister = async () => {
  try {
    // 第一步：先校验表单格式（邮箱、密码长度、两次密码一致）
    await registerFormRef.value.validate();

    // 额外验证：确保是QQ邮箱
    if (!isQQEmail.value) {
      ElMessage.error("请使用QQ邮箱注册");
      return;
    }

    // 【已对齐】第二步：调用后端真实注册接口 /api/user/register（见 backend/routes/user.js）
    // 传邮箱、验证码和密码
    const requestData = {
      email: registerForm.value.email,
      verifyCode: registerForm.value.verifyCode,
      password: registerForm.value.password,
    };

    const response = await axios.post(
      "http://localhost:3001/api/user/register",
      requestData,
      {
        headers: {
          "Content-Type": "application/json", // 默认JSON格式，多数后端需要
        },
        timeout: 10000,
      }
    );

    // 3. 处理后端返回的结果（根据实际后端格式修改）
    // 当前后端返回：{ message, userId, nickname }
    const data = response.data;
    ElMessage.success(data.message || "注册成功！即将跳转到登录页");
    // 【新增】可选：缓存一份用户基础信息，供后续首页等页面使用
    localStorage.setItem("edu-user-id", data.userId || "");
    localStorage.setItem("edu-nickname", data.nickname || "");
    // 跳转到登录页
    router.push("/login");
  } catch (error) {
    // 错误分两种：表单校验失败 / 接口请求失败
    if (error.name === "ValidationError") {
      // 表单校验失败（前端校验）
      ElMessage.error("请检查表单填写是否正确");
    } else {
      // 接口请求失败（网络错误、后端500等）
      ElMessage.error(
        "注册失败：" +
          (error.response?.data?.message || "网络异常，请检查后端服务")
      );
      console.error("注册接口请求失败详情：", error); // 控制台打印详细错误，方便调试
    }
  }
};

// 跳转到登录页
const goToLogin = () => {
  router.push("/login");
};
</script>

<style scoped>
.register-container {
  width: 100%;
  height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
}

.register-header {
  margin-bottom: 30px;
}

.logo-section {
  display: flex;
  align-items: center;
  gap: 16px;
  cursor: pointer;
  padding: 12px 20px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  transition: all 0.3s;
  backdrop-filter: blur(10px);
}

.logo-section:hover {
  background: rgba(255, 255, 255, 0.2);
  transform: translateY(-2px);
}

.register-logo {
  width: 48px;
  height: 48px;
  border-radius: 8px;
  object-fit: contain;
}

.logo-info {
  color: white;
}

.title {
  margin: 0 0 4px 0;
  font-size: 24px;
  font-weight: 700;
  letter-spacing: 0.5px;
}

.subtitle {
  margin: 0;
  font-size: 14px;
  opacity: 0.9;
}
.register-form {
  width: 350px;
  padding: 20px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
}
.register-btn {
  width: 100%;
}
.login-link {
  margin-top: 15px;
  text-align: center;
}

.verify-code-wrapper {
  display: flex;
  gap: 10px;
}

.verify-code-wrapper .el-input {
  flex: 1;
}

.verify-code-btn {
  flex-shrink: 0;
  white-space: nowrap;
}
</style>
