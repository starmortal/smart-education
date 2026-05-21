<template>
  <div class="terms-page">
    <!-- 顶部导航栏 -->
    <header class="top-nav">
      <div class="nav-left">
        <img class="logo" src="../assets/logo.png" alt="logo" @click="goHome" style="cursor: pointer;" />
        <span class="brand" @click="goHome" style="cursor: pointer;">智慧教育平台</span>
      </div>
      <div class="nav-right">
        <el-button text @click="goBack">返回</el-button>
      </div>
    </header>

    <!-- 主内容区 -->
    <div class="terms-container">
      <div class="terms-header">
        <h1>服务条款</h1>
        <p class="subtitle">最后更新日期：2026年3月10日</p>
      </div>

      <div class="terms-content">
        <section class="terms-section">
          <h2>1. 服务说明</h2>
          <p>智慧教育平台（以下简称"本平台"）为用户提供在线学习服务，包括但不限于：</p>
          <ul>
            <li>AI 智能答疑服务</li>
            <li>个性化学习计划制定</li>
            <li>错题本管理</li>
            <li>学习数据分析</li>
            <li>学习社区交流</li>
            <li>智能笔记管理</li>
          </ul>
        </section>

        <section class="terms-section">
          <h2>2. 用户注册</h2>
          <p>使用本平台服务需要注册账户，您需要：</p>
          <ul>
            <li>提供真实、准确的注册信息</li>
            <li>妥善保管账户密码，对账户活动负责</li>
            <li>及时更新个人信息，确保信息准确性</li>
            <li>不得将账户转让或出借给他人使用</li>
            <li>发现账户被盗用时立即通知我们</li>
          </ul>
        </section>

        <section class="terms-section">
          <h2>3. 用户行为规范</h2>
          <p>使用本平台时，您不得：</p>
          <ul>
            <li>发布违法、违规、虚假或有害信息</li>
            <li>侵犯他人知识产权或其他合法权益</li>
            <li>利用平台进行商业推广或广告宣传</li>
            <li>干扰或破坏平台正常运行</li>
            <li>使用自动化工具或脚本访问平台</li>
            <li>尝试未经授权访问系统或数据</li>
          </ul>
        </section>

        <section class="terms-section">
          <h2>4. 知识产权</h2>
          <p>关于平台内容的知识产权：</p>
          <ul>
            <li>平台所有内容（包括但不限于文字、图片、软件）的知识产权归本平台所有</li>
            <li>用户创建的内容（笔记、问题等）的知识产权归用户所有</li>
            <li>用户授权本平台使用其内容以提供和改进服务</li>
            <li>未经许可，不得复制、传播或商业使用平台内容</li>
          </ul>
        </section>

        <section class="terms-section">
          <h2>5. 服务变更与中断</h2>
          <p>我们保留以下权利：</p>
          <ul>
            <li>随时修改或中断部分或全部服务</li>
            <li>对服务内容、功能进行调整和优化</li>
            <li>在必要时暂停服务进行维护升级</li>
            <li>对违规用户限制或终止服务</li>
          </ul>
          <p>我们会尽力提前通知重大变更，但不对服务中断造成的损失承担责任。</p>
        </section>

        <section class="terms-section">
          <h2>6. 免责声明</h2>
          <p>以下情况我们不承担责任：</p>
          <ul>
            <li>因不可抗力导致的服务中断或数据丢失</li>
            <li>因用户自身原因（如密码泄露）造成的损失</li>
            <li>因第三方服务（如网络服务商）故障导致的问题</li>
            <li>AI 答疑内容仅供参考，不保证绝对准确</li>
            <li>用户基于平台内容做出的决策及其后果</li>
          </ul>
        </section>

        <section class="terms-section">
          <h2>7. 账户终止</h2>
          <p>以下情况下，我们有权终止您的账户：</p>
          <ul>
            <li>违反本服务条款或相关法律法规</li>
            <li>长期未使用账户（超过1年）</li>
            <li>提供虚假信息或恶意注册</li>
            <li>从事危害平台安全的行为</li>
          </ul>
          <p>账户终止后，相关数据将按照隐私政策进行处理。</p>
        </section>

        <section class="terms-section">
          <h2>8. 争议解决</h2>
          <p>如发生争议：</p>
          <ul>
            <li>首先通过友好协商解决</li>
            <li>协商不成的，提交至本平台所在地人民法院诉讼解决</li>
            <li>本条款的解释、效力及纠纷解决适用中华人民共和国法律</li>
          </ul>
        </section>

        <section class="terms-section">
          <h2>9. 条款修改</h2>
          <p>我们保留随时修改本服务条款的权利。修改后的条款将在平台上公布，继续使用服务即表示您接受修改后的条款。</p>
        </section>

        <section class="terms-section">
          <h2>10. 联系方式</h2>
          <p>如对本服务条款有任何疑问，请联系我们：</p>
          <ul>
            <li>电子邮箱：2169702639@qq.com</li>
            <li>平台反馈：登录后访问"意见反馈"页面</li>
          </ul>
        </section>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router';

const router = useRouter();

const goHome = () => {
  router.push('/login');
};

const goBack = () => {
  router.back();
};
</script>

<style scoped>
/* ========== 全局样式 ========== */
.terms-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #f0f9ff 0%, #faf5ff 50%, #fef3f2 100%);
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

/* ========== 主内容区 ========== */
.terms-container {
  max-width: 900px;
  margin: 0 auto;
  padding: 120px 24px 80px;
}

.terms-header {
  text-align: center;
  margin-bottom: 60px;
}

.terms-header h1 {
  font-size: 28px;
  font-weight: 700;
  color: #1e293b;
  margin-bottom: 10px;
}

.subtitle {
  font-size: 14px;
  color: #64748b;
}

/* ========== 内容区 ========== */
.terms-content {
  background: white;
  border-radius: 12px;
  padding: 40px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  border: 1px solid #e5e7eb;
}

.terms-section {
  margin-bottom: 32px;
}

.terms-section:last-child {
  margin-bottom: 0;
}

.terms-section h2 {
  font-size: 20px;
  font-weight: 600;
  color: #1e293b;
  margin-bottom: 16px;
}

.terms-section p {
  font-size: 15px;
  line-height: 1.8;
  color: #475569;
  margin-bottom: 12px;
}

.terms-section ul {
  list-style: none;
  padding: 0;
  margin: 0;
}

.terms-section ul li {
  font-size: 15px;
  line-height: 1.8;
  color: #475569;
  padding-left: 24px;
  position: relative;
  margin-bottom: 8px;
}

.terms-section ul li::before {
  content: "•";
  position: absolute;
  left: 8px;
  color: #3b82f6;
  font-weight: bold;
}

/* ========== 响应式 ========== */
@media (max-width: 768px) {
  .top-nav {
    padding: 0 20px;
  }
  
  .logo {
    width: 32px;
    height: 32px;
  }
  
  .brand {
    font-size: 16px;
  }
  
  .terms-container {
    padding: 100px 16px 60px;
  }
  
  .terms-content {
    padding: 24px;
  }
  
  .terms-header h1 {
    font-size: 24px;
  }
  
  .terms-section h2 {
    font-size: 18px;
  }
}
</style>
