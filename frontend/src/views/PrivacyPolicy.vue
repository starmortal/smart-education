<template>
  <div class="policy-page">
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
    <div class="policy-container">
      <div class="policy-header">
        <h1>隐私政策</h1>
        <p class="subtitle">最后更新日期：2026年3月10日</p>
      </div>

      <div class="policy-content">
        <section class="policy-section">
          <h2>1. 信息收集</h2>
          <p>我们收集以下类型的信息：</p>
          <ul>
            <li>账户信息：邮箱、用户名、密码（加密存储）</li>
            <li>个人资料：年级、学校、学习科目等</li>
            <li>学习数据：学习计划、错题记录、笔记内容、AI对话记录</li>
            <li>使用数据：访问时间、使用功能、操作记录</li>
          </ul>
        </section>

        <section class="policy-section">
          <h2>2. 信息使用</h2>
          <p>我们使用收集的信息用于：</p>
          <ul>
            <li>提供和改进平台服务</li>
            <li>个性化学习推荐和内容定制</li>
            <li>生成学习数据分析和报告</li>
            <li>发送重要通知和更新信息</li>
            <li>保障平台安全和防止欺诈</li>
          </ul>
        </section>

        <section class="policy-section">
          <h2>3. 信息保护</h2>
          <p>我们采取以下措施保护您的信息安全：</p>
          <ul>
            <li>使用加密技术存储敏感信息</li>
            <li>采用 HTTPS 协议传输数据</li>
            <li>定期进行安全审计和漏洞扫描</li>
            <li>严格限制员工访问用户数据的权限</li>
            <li>建立数据备份和灾难恢复机制</li>
          </ul>
        </section>

        <section class="policy-section">
          <h2>4. 信息共享</h2>
          <p>我们承诺：</p>
          <ul>
            <li>不会出售您的个人信息给第三方</li>
            <li>不会将您的学习数据用于商业营销</li>
            <li>仅在法律要求或获得您同意的情况下共享信息</li>
            <li>与第三方服务商合作时，要求其遵守严格的保密协议</li>
          </ul>
        </section>

        <section class="policy-section">
          <h2>5. 您的权利</h2>
          <p>您有权：</p>
          <ul>
            <li>访问和更新您的个人信息</li>
            <li>删除您的账户和相关数据</li>
            <li>导出您的学习数据</li>
            <li>拒绝接收营销信息</li>
            <li>撤回对数据处理的同意</li>
          </ul>
        </section>

        <section class="policy-section">
          <h2>6. Cookie 使用</h2>
          <p>我们使用 Cookie 和类似技术来：</p>
          <ul>
            <li>保持您的登录状态</li>
            <li>记住您的偏好设置</li>
            <li>分析平台使用情况</li>
            <li>提供个性化内容推荐</li>
          </ul>
        </section>

        <section class="policy-section">
          <h2>7. 未成年人保护</h2>
          <p>我们特别重视未成年人的隐私保护：</p>
          <ul>
            <li>未满18岁的用户需在监护人同意下使用平台</li>
            <li>我们不会主动收集未成年人的敏感信息</li>
            <li>监护人有权查看和管理未成年人的账户信息</li>
          </ul>
        </section>

        <section class="policy-section">
          <h2>8. 政策更新</h2>
          <p>我们可能会不定期更新本隐私政策。重大变更时，我们会通过以下方式通知您：</p>
          <ul>
            <li>在平台显著位置发布公告</li>
            <li>通过邮件发送通知</li>
            <li>在您下次登录时弹窗提醒</li>
          </ul>
        </section>

        <section class="policy-section">
          <h2>9. 联系我们</h2>
          <p>如果您对本隐私政策有任何疑问或建议，请通过以下方式联系我们：</p>
          <ul>
            <li>电子邮箱：2169702639@qq.com</li>
            <li>平台反馈功能：登录后访问"意见反馈"页面</li>
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
.policy-page {
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
.policy-container {
  max-width: 900px;
  margin: 0 auto;
  padding: 120px 24px 80px;
}

.policy-header {
  text-align: center;
  margin-bottom: 60px;
}

.policy-header h1 {
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
.policy-content {
  background: white;
  border-radius: 12px;
  padding: 40px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  border: 1px solid #e5e7eb;
}

.policy-section {
  margin-bottom: 32px;
}

.policy-section:last-child {
  margin-bottom: 0;
}

.policy-section h2 {
  font-size: 20px;
  font-weight: 600;
  color: #1e293b;
  margin-bottom: 16px;
}

.policy-section p {
  font-size: 15px;
  line-height: 1.8;
  color: #475569;
  margin-bottom: 12px;
}

.policy-section ul {
  list-style: none;
  padding: 0;
  margin: 0;
}

.policy-section ul li {
  font-size: 15px;
  line-height: 1.8;
  color: #475569;
  padding-left: 24px;
  position: relative;
  margin-bottom: 8px;
}

.policy-section ul li::before {
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
  
  .policy-container {
    padding: 100px 16px 60px;
  }
  
  .policy-content {
    padding: 24px;
  }
  
  .policy-header h1 {
    font-size: 24px;
  }
  
  .policy-section h2 {
    font-size: 18px;
  }
}
</style>
