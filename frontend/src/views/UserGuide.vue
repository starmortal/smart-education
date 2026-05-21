<template>
  <div class="user-guide-page">
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
    <div class="guide-container">
      <div class="guide-header">
        <h1>使用文档</h1>
        <p class="subtitle">智慧教育平台功能介绍与使用教程</p>
      </div>

      <!-- 功能导航 -->
      <div class="function-nav">
        <div 
          v-for="(section, index) in sections" 
          :key="index"
          :class="['nav-item', { active: activeSection === index }]"
          @click="scrollToSection(index)"
        >
          <el-icon><component :is="section.icon" /></el-icon>
          <span>{{ section.title }}</span>
        </div>
      </div>

      <!-- 功能介绍内容 -->
      <div class="guide-content">
        <!-- AI答疑功能 -->
        <div class="section" id="section-0">
          <div class="section-header">
            <el-icon class="section-icon" color="#409eff"><ChatDotRound /></el-icon>
            <h2>AI答疑</h2>
          </div>
          <div class="section-content">
            <div class="feature-intro">
              <p>AI答疑是平台的核心功能，基于先进的DeepSeek AI技术，为学生提供24小时智能学习助手服务。</p>
            </div>
            
            <div class="usage-steps">
              <h3>使用步骤：</h3>
              <div class="step-list">
                <div class="step-item">
                  <div class="step-number">1</div>
                  <div class="step-content">
                    <h4>进入AI答疑页面</h4>
                    <p>点击顶部导航栏的"AI答疑"按钮进入对话界面</p>
                  </div>
                </div>
                <div class="step-item">
                  <div class="step-number">2</div>
                  <div class="step-content">
                    <h4>输入问题</h4>
                    <p>在输入框中输入你的学习问题，支持文字、图片上传</p>
                  </div>
                </div>
                <div class="step-item">
                  <div class="step-number">3</div>
                  <div class="step-content">
                    <h4>获得解答</h4>
                    <p>AI会实时流式输出详细解答，包含解题步骤和知识点说明</p>
                  </div>
                </div>
                <div class="step-item">
                  <div class="step-number">4</div>
                  <div class="step-content">
                    <h4>保存笔记</h4>
                    <p>点击"保存到笔记"按钮，可将AI解答保存为学习笔记</p>
                  </div>
                </div>
              </div>
            </div>

            <div class="feature-highlights">
              <h3>功能特色：</h3>
              <ul>
                <li>🤖 基于DeepSeek AI，回答准确专业</li>
                <li>⚡ 流式输出，实时显示回答过程</li>
                <li>📁 支持文件上传，图片识别解题</li>
                <li>💾 一键保存到笔记，便于复习</li>
                <li>📚 历史记录管理，随时查看对话</li>
              </ul>
            </div>
          </div>
        </div>

        <!-- 错题集功能 -->
        <div class="section" id="section-1">
          <div class="section-header">
            <el-icon class="section-icon" color="#f56c6c"><Warning /></el-icon>
            <h2>错题集</h2>
          </div>
          <div class="section-content">
            <div class="feature-intro">
              <p>错题集帮助学生系统管理错题，通过针对性复习提高学习效率，是查漏补缺的重要工具。</p>
            </div>
            
            <div class="usage-steps">
              <h3>使用步骤：</h3>
              <div class="step-list">
                <div class="step-item">
                  <div class="step-number">1</div>
                  <div class="step-content">
                    <h4>添加错题</h4>
                    <p>点击"添加错题"按钮，填写题目、科目、错误原因等信息</p>
                  </div>
                </div>
                <div class="step-item">
                  <div class="step-number">2</div>
                  <div class="step-content">
                    <h4>查看统计</h4>
                    <p>顶部显示错题总数、未掌握、已掌握的全局统计数据</p>
                  </div>
                </div>
                <div class="step-item">
                  <div class="step-number">3</div>
                  <div class="step-content">
                    <h4>筛选复习</h4>
                    <p>可按掌握状态、科目筛选错题，重点复习薄弱环节</p>
                  </div>
                </div>
                <div class="step-item">
                  <div class="step-number">4</div>
                  <div class="step-content">
                    <h4>标记掌握</h4>
                    <p>复习后点击错题卡片，标记为"已掌握"状态</p>
                  </div>
                </div>
              </div>
            </div>

            <div class="feature-highlights">
              <h3>功能特色：</h3>
              <ul>
                <li>📊 全局统计，掌握学习进度</li>
                <li>🔍 多维度筛选，精准定位问题</li>
                <li>📝 详细记录错误原因和解析</li>
                <li>✅ 掌握状态管理，跟踪复习效果</li>
                <li>📱 响应式设计，支持移动端使用</li>
              </ul>
            </div>
          </div>
        </div>
        <!-- 学习计划功能 -->
        <div class="section" id="section-2">
          <div class="section-header">
            <el-icon class="section-icon" color="#67c23a"><Calendar /></el-icon>
            <h2>学习计划</h2>
          </div>
          <div class="section-content">
            <div class="feature-intro">
              <p>学习计划功能帮助学生制定和管理学习目标，通过科学的计划安排提高学习效率。</p>
            </div>
            
            <div class="usage-steps">
              <h3>使用步骤：</h3>
              <div class="step-list">
                <div class="step-item">
                  <div class="step-number">1</div>
                  <div class="step-content">
                    <h4>创建计划</h4>
                    <p>点击"添加计划"，填写计划标题、科目、截止时间等信息</p>
                  </div>
                </div>
                <div class="step-item">
                  <div class="step-number">2</div>
                  <div class="step-content">
                    <h4>设置进度</h4>
                    <p>拖动进度条设置完成进度，系统自动识别计划状态</p>
                  </div>
                </div>
                <div class="step-item">
                  <div class="step-number">3</div>
                  <div class="step-content">
                    <h4>查看统计</h4>
                    <p>顶部显示计划总数、进行中、已完成的全局统计</p>
                  </div>
                </div>
                <div class="step-item">
                  <div class="step-number">4</div>
                  <div class="step-content">
                    <h4>管理计划</h4>
                    <p>支持编辑、删除、批量操作等计划管理功能</p>
                  </div>
                </div>
              </div>
            </div>

            <div class="feature-highlights">
              <h3>功能特色：</h3>
              <ul>
                <li>🎯 智能状态识别：0%=未开始，1-99%=进行中，100%=已完成</li>
                <li>📈 全局统计视图，不受筛选影响</li>
                <li>⏰ 截止时间提醒，避免计划延期</li>
                <li>🔄 批量管理操作，提高效率</li>
                <li>📊 进度可视化，直观了解完成情况</li>
              </ul>
            </div>
          </div>
        </div>

        <!-- 我的笔记功能 -->
        <div class="section" id="section-3">
          <div class="section-header">
            <el-icon class="section-icon" color="#e6a23c"><Notebook /></el-icon>
            <h2>我的笔记</h2>
          </div>
          <div class="section-content">
            <div class="feature-intro">
              <p>我的笔记是知识管理中心，支持创建、编辑、分类管理学习笔记，是知识积累的重要工具。</p>
            </div>
            
            <div class="usage-steps">
              <h3>使用步骤：</h3>
              <div class="step-list">
                <div class="step-item">
                  <div class="step-number">1</div>
                  <div class="step-content">
                    <h4>创建笔记</h4>
                    <p>点击"添加笔记"，填写标题、选择分类和标签</p>
                  </div>
                </div>
                <div class="step-item">
                  <div class="step-number">2</div>
                  <div class="step-content">
                    <h4>编写内容</h4>
                    <p>在编辑器中输入笔记内容，支持Markdown格式</p>
                  </div>
                </div>
                <div class="step-item">
                  <div class="step-number">3</div>
                  <div class="step-content">
                    <h4>分类管理</h4>
                    <p>通过分类和标签系统，有序管理不同类型的笔记</p>
                  </div>
                </div>
                <div class="step-item">
                  <div class="step-number">4</div>
                  <div class="step-content">
                    <h4>搜索查找</h4>
                    <p>使用搜索功能快速找到需要的笔记内容</p>
                  </div>
                </div>
              </div>
            </div>

            <div class="feature-highlights">
              <h3>功能特色：</h3>
              <ul>
                <li>📝 支持Markdown格式，排版美观</li>
                <li>🏷️ 标签分类系统，便于整理</li>
                <li>🔍 全文搜索功能，快速定位</li>
                <li>💾 AI答疑一键保存，知识积累</li>
                <li>📱 响应式设计，随时随地记录</li>
              </ul>
            </div>
          </div>
        </div>
        <!-- 学习社区功能 -->
        <div class="section" id="section-4">
          <div class="section-header">
            <el-icon class="section-icon" color="#909399"><Users /></el-icon>
            <h2>学习社区</h2>
          </div>
          <div class="section-content">
            <div class="feature-intro">
              <p>学习社区是同学们互相交流学习的平台，遇到AI无法理解的复杂问题时，可以在这里与同学们互相讨论，集思广益找到答案。</p>
            </div>
            
            <div class="usage-steps">
              <h3>使用步骤：</h3>
              <div class="step-list">
                <div class="step-item">
                  <div class="step-number">1</div>
                  <div class="step-content">
                    <h4>发起提问</h4>
                    <p>点击"发起提问"按钮，填写问题标题、描述和相关标签</p>
                  </div>
                </div>
                <div class="step-item">
                  <div class="step-number">2</div>
                  <div class="step-content">
                    <h4>浏览问题</h4>
                    <p>查看其他同学的问题，可按状态筛选待解决或已解决的问题</p>
                  </div>
                </div>
                <div class="step-item">
                  <div class="step-number">3</div>
                  <div class="step-content">
                    <h4>参与回答</h4>
                    <p>点击问题卡片查看详情，在回答区域输入你的解答</p>
                  </div>
                </div>
                <div class="step-item">
                  <div class="step-number">4</div>
                  <div class="step-content">
                    <h4>收藏管理</h4>
                    <p>收藏有价值的问题，在右侧收藏区域统一管理</p>
                  </div>
                </div>
              </div>
            </div>

            <div class="feature-highlights">
              <h3>功能特色：</h3>
              <ul>
                <li>🤝 同伴互助，共同进步</li>
                <li>💬 实时问答，快速响应</li>
                <li>⭐ 点赞收藏，优质内容推荐</li>
                <li>🏆 最佳答案机制，激励参与</li>
                <li>📊 统计数据，了解社区活跃度</li>
              </ul>
            </div>
          </div>
        </div>

        <!-- 个人中心功能 -->
        <div class="section" id="section-5">
          <div class="section-header">
            <el-icon class="section-icon" color="#f56c6c"><User /></el-icon>
            <h2>个人中心</h2>
          </div>
          <div class="section-content">
            <div class="feature-intro">
              <p>个人中心是用户信息管理和学习数据分析的中心，提供完整的学习轨迹和成绩分析功能。</p>
            </div>
            
            <div class="usage-steps">
              <h3>使用步骤：</h3>
              <div class="step-list">
                <div class="step-item">
                  <div class="step-number">1</div>
                  <div class="step-content">
                    <h4>完善资料</h4>
                    <p>点击"编辑资料"完善个人信息，设置学习科目</p>
                  </div>
                </div>
                <div class="step-item">
                  <div class="step-number">2</div>
                  <div class="step-content">
                    <h4>添加考试</h4>
                    <p>录入考试成绩，建立学习数据档案</p>
                  </div>
                </div>
                <div class="step-item">
                  <div class="step-number">3</div>
                  <div class="step-content">
                    <h4>AI分析</h4>
                    <p>使用AI成绩分析功能，获得专业的学习建议</p>
                  </div>
                </div>
                <div class="step-item">
                  <div class="step-number">4</div>
                  <div class="step-content">
                    <h4>查看历史</h4>
                    <p>在AI分析历史中查看过往的分析记录</p>
                  </div>
                </div>
              </div>
            </div>

            <div class="feature-highlights">
              <h3>功能特色：</h3>
              <ul>
                <li>🤖 AI智能分析，专业学习建议</li>
                <li>📈 成绩趋势图表，直观了解进步</li>
                <li>📚 学习科目管理，个性化设置</li>
                <li>💾 分析历史记录，随时回顾</li>
                <li>🎯 个性化推荐，精准提升</li>
              </ul>
            </div>
          </div>
        </div>

        <!-- 意见反馈功能 -->
        <div class="section" id="section-6">
          <div class="section-header">
            <el-icon class="section-icon" color="#909399"><ChatDotRound /></el-icon>
            <h2>意见反馈</h2>
          </div>
          <div class="section-content">
            <div class="feature-intro">
              <p>意见反馈是用户与平台沟通的桥梁，我们重视每一条反馈，持续优化用户体验。</p>
            </div>
            
            <div class="usage-steps">
              <h3>使用步骤：</h3>
              <div class="step-list">
                <div class="step-item">
                  <div class="step-number">1</div>
                  <div class="step-content">
                    <h4>选择类型</h4>
                    <p>选择反馈类型：功能建议、问题报告或其他</p>
                  </div>
                </div>
                <div class="step-item">
                  <div class="step-number">2</div>
                  <div class="step-content">
                    <h4>详细描述</h4>
                    <p>详细描述遇到的问题或建议，可上传截图</p>
                  </div>
                </div>
                <div class="step-item">
                  <div class="step-number">3</div>
                  <div class="step-content">
                    <h4>提交反馈</h4>
                    <p>提交后系统会自动发送邮件通知管理员</p>
                  </div>
                </div>
                <div class="step-item">
                  <div class="step-number">4</div>
                  <div class="step-content">
                    <h4>查看回复</h4>
                    <p>在反馈历史中查看管理员的回复内容</p>
                  </div>
                </div>
              </div>
            </div>

            <div class="feature-highlights">
              <h3>功能特色：</h3>
              <ul>
                <li>📧 邮件通知，及时响应</li>
                <li>📷 支持截图，问题描述更清晰</li>
                <li>💬 在线回复，双向沟通</li>
                <li>📋 历史记录，跟踪处理进度</li>
                <li>🔄 状态管理，透明处理流程</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import { 
  ChatDotRound, 
  Warning, 
  Calendar, 
  Notebook, 
  Users, 
  User 
} from '@element-plus/icons-vue';

const router = useRouter();
const activeSection = ref(0);

// 功能导航数据
const sections = [
  { title: 'AI答疑', icon: ChatDotRound },
  { title: '错题集', icon: Warning },
  { title: '学习计划', icon: Calendar },
  { title: '我的笔记', icon: Notebook },
  { title: '学习社区', icon: Users },
  { title: '个人中心', icon: User },
  { title: '意见反馈', icon: ChatDotRound }
];

function goHome() {
  router.push('/login');
}

function goBack() {
  router.back();
}

function scrollToSection(index) {
  activeSection.value = index;
  const element = document.getElementById(`section-${index}`);
  if (element) {
    element.scrollIntoView({ 
      behavior: 'smooth',
      block: 'start'
    });
  }
}

// 监听滚动，更新活跃导航
function handleScroll() {
  const sections = document.querySelectorAll('.section');
  const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
  
  sections.forEach((section, index) => {
    const offsetTop = section.offsetTop - 100;
    const offsetBottom = offsetTop + section.offsetHeight;
    
    if (scrollTop >= offsetTop && scrollTop < offsetBottom) {
      activeSection.value = index;
    }
  });
}

onMounted(() => {
  window.addEventListener('scroll', handleScroll);
});

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll);
});
</script>
<style scoped>
/* ========== 全局样式 ========== */
.user-guide-page {
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
.guide-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 140px 24px 80px;
}

.guide-header {
  text-align: center;
  margin-bottom: 60px;
}

.guide-header h1 {
  font-size: 32px;
  font-weight: 700;
  color: #1e293b;
  margin-bottom: 12px;
}

.subtitle {
  font-size: 16px;
  color: #64748b;
}

/* ========== 功能导航 ========== */
.function-nav {
  display: flex;
  justify-content: center;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 60px;
  padding: 20px;
  background: white;
  border-radius: 16px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  overflow: visible;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 20px;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
  font-weight: 500;
  color: #64748b;
  border: 2px solid transparent;
  white-space: nowrap;
  min-width: fit-content;
}

.nav-item:hover {
  background: #f1f5f9;
  color: #3b82f6;
}

.nav-item.active {
  background: #3b82f6;
  color: white;
  border-color: #3b82f6;
}

/* ========== 内容区域 ========== */
.guide-content {
  display: flex;
  flex-direction: column;
  gap: 60px;
}

.section {
  background: white;
  border-radius: 16px;
  padding: 40px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  border: 1px solid #e5e7eb;
}

.section-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 30px;
  padding-bottom: 20px;
  border-bottom: 2px solid #f1f5f9;
}

.section-icon {
  font-size: 28px;
}

.section-header h2 {
  font-size: 24px;
  font-weight: 700;
  color: #1e293b;
  margin: 0;
}

.section-content {
  display: flex;
  flex-direction: column;
  gap: 30px;
}

.feature-intro {
  font-size: 16px;
  line-height: 1.8;
  color: #475569;
  background: #f8fafc;
  padding: 20px;
  border-radius: 12px;
  border-left: 4px solid #3b82f6;
}

/* ========== 使用步骤 ========== */
.usage-steps h3 {
  font-size: 18px;
  font-weight: 600;
  color: #1e293b;
  margin-bottom: 20px;
}

.step-list {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.step-item {
  display: flex;
  gap: 16px;
  align-items: flex-start;
}

.step-number {
  width: 32px;
  height: 32px;
  background: #3b82f6;
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 14px;
  flex-shrink: 0;
}

.step-content h4 {
  font-size: 16px;
  font-weight: 600;
  color: #1e293b;
  margin: 0 0 8px 0;
}

.step-content p {
  font-size: 14px;
  color: #64748b;
  line-height: 1.6;
  margin: 0;
}

/* ========== 功能特色 ========== */
.feature-highlights h3 {
  font-size: 18px;
  font-weight: 600;
  color: #1e293b;
  margin-bottom: 16px;
}

.feature-highlights ul {
  list-style: none;
  padding: 0;
  margin: 0;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 12px;
}

.feature-highlights li {
  padding: 12px 16px;
  background: #f8fafc;
  border-radius: 8px;
  font-size: 14px;
  color: #475569;
  border-left: 3px solid #10b981;
}

/* ========== 响应式设计 ========== */
@media (max-width: 768px) {
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
  
  .guide-container {
    padding: 120px 16px 60px;
  }
  
  .guide-header h1 {
    font-size: 28px;
  }
  
  .function-nav {
    flex-direction: column;
    align-items: center;
    gap: 8px;
  }
  
  .nav-item {
    width: 100%;
    justify-content: center;
    max-width: 300px;
  }
  
  .section {
    padding: 24px 20px;
  }
  
  .section-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }
  
  .feature-highlights ul {
    grid-template-columns: 1fr;
  }
}
</style>