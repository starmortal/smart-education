<!-- Home.vue :: 登录后首页 – 深海蓝主题 + 固定卡片 + 背景图可调 -->
<template>
  <div class="home-container">
    <!-- 主内容区：左右分栏 + 固定卡片 -->
    <el-main class="main-content">
      <!-- 左侧：欢迎语（中文大头） -->
      <div class="left-panel">
        <h1 class="welcome-title">智慧教育，点亮未来</h1>
        <h2 class="sub-title">AI 助教 · 梦开始的地方</h2>
        <p class="desc">
          我们不仅传授知识，更培养面向未来的能力，<br />
          在这里，发现更好的自己。
        </p>
        <el-button type="primary" size="large" @click="goToPage('ai-answer')">
          立即体验 AI 答疑
        </el-button>
      </div>

      <!-- 右侧：固定卡片（无滑动） -->
      <div class="right-fixed">
        <!-- 卡片 1：今日学习计划 -->
        <div class="fixed-card plan-card">
          <div class="plan-header">
            <el-icon size="18"><Calendar /></el-icon>
            <span>今日学习计划</span>
          </div>
          <div class="plan-content" v-if="displayedPlans.length > 0">
            <div 
              v-for="(plan, index) in displayedPlans" 
              :key="plan.id"
              class="plan-item"
              :class="{ completed: plan.completed }"
            >
              <div class="plan-checkbox" @click="togglePlan(plan.id, index)">
                <el-icon v-if="plan.completed" size="16" color="#67c23a">
                  <Check />
                </el-icon>
              </div>
              <div class="plan-info">
                <div class="plan-title">{{ plan.title }}</div>
                <div class="plan-time">
                  <el-icon size="12"><Clock /></el-icon>
                  {{ plan.time }}
                </div>
              </div>
            </div>
          </div>
          <div class="plan-empty" v-else>
            <el-icon size="48" color="#e4e7ed"><Document /></el-icon>
            <p>今天还没有学习计划</p>
            <el-button type="primary" size="small" @click="goToPage('study-plan')">
              创建计划
            </el-button>
          </div>
        </div>

        <!-- 卡片 2：实时时间 -->
        <div class="fixed-card hot-card">
          <div class="hot-header">北京时间</div>
          <div class="time-display">
            <div class="time-date-row">
              <span class="time-date">{{ currentDate }}</span>
              <span class="time-weekday">{{ currentWeekday }}</span>
            </div>
            <div class="time-clock">{{ currentTime }}</div>
          </div>
        </div>
      </div>
    </el-main>

    <!-- 背景图 layer（透明度可调） -->
    <div class="bg-layer" :style="bgStyle"></div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from "vue";
import { useRouter } from "vue-router";
import { ElMessage } from 'element-plus';
import { Calendar, Check, Document, Clock } from '@element-plus/icons-vue';
import axios from 'axios';

const router = useRouter();

onMounted(() => {
  startTimeUpdate();
  loadTodayPlans();
});

// 页面销毁时清理定时器
onUnmounted(() => {
  stopTimeUpdate();
});

/* ====== 背景图透明度可调 ====== */
// 放图路径：/public/assets/bg/home-bg.jpg  尺寸建议 1920×1080
const bgSrc = "/images/Home-001.png"; // ← 放图后改为 '/assets/bg/home-bg.jpg'
const bgOpacity = ref(0.2); // ★ 这里调透明度 0-1
const bgStyle = computed(() =>
  bgSrc
    ? {
        backgroundImage: `url(${bgSrc})`,
        opacity: bgOpacity.value,
      }
    : {}
);

/* ====== 今日学习计划 ====== */
const todayPlans = ref([]);

// 计算属性：只显示最新的3个计划
const displayedPlans = computed(() => {
  // 按创建时间排序（最新的在前）
  const sorted = [...todayPlans.value].sort((a, b) => {
    return new Date(b.createTime || 0) - new Date(a.createTime || 0);
  });
  // 只取前3个
  return sorted.slice(0, 3);
});

// 加载今日学习计划（从后端API获取）
async function loadTodayPlans() {
  try {
    const userId = localStorage.getItem('edu-user-id');
    if (!userId) {
      console.log('用户未登录，显示空计划');
      todayPlans.value = [];
      return;
    }
    
    // 获取今天的日期范围
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    // 调用后端API获取学习计划
    const response = await axios.get('http://localhost:3001/api/study-plan/list', {
      params: {
        userId: userId,
        pageNum: 1,
        pageSize: 100 // 获取所有计划
      },
      timeout: 10000
    });
    
    if (response.data && response.data.plans) {
      // 筛选今天的计划（开始时间在今天，或者跨越今天的计划）
      const allPlans = response.data.plans;
      const filteredPlans = allPlans.filter(plan => {
        const startTime = new Date(plan.startTime);
        const endTime = new Date(plan.endTime);
        
        // 计划开始时间在今天，或者计划跨越今天
        return (startTime <= tomorrow && endTime >= today);
      });
      
      // 转换为显示格式
      todayPlans.value = filteredPlans.map(plan => {
        const startTime = new Date(plan.startTime);
        const endTime = new Date(plan.endTime);
        
        // 格式化时间显示
        let timeDisplay = '';
        if (startTime.toDateString() === today.toDateString()) {
          // 今天开始的计划
          timeDisplay = `${formatTime(startTime)} - ${formatTime(endTime)}`;
        } else if (endTime.toDateString() === today.toDateString()) {
          // 今天结束的计划
          timeDisplay = `截止 ${formatTime(endTime)}`;
        } else {
          // 跨越今天的计划
          timeDisplay = '全天';
        }
        
        return {
          id: plan.id,
          title: plan.planTitle,
          time: timeDisplay,
          subject: plan.subject,
          completed: plan.planStatus === 'completed',
          createTime: plan.createTime || plan.startTime // 保存创建时间用于排序
        };
      });
      
      console.log('今日学习计划：', todayPlans.value);
    } else {
      todayPlans.value = [];
    }
  } catch (error) {
    console.error('获取学习计划失败：', error);
    todayPlans.value = [];
  }
}

// 格式化时间
function formatTime(date) {
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}

// 切换计划完成状态
async function togglePlan(planId, displayIndex) {
  // 在原始数组中找到对应的计划
  const planIndex = todayPlans.value.findIndex(p => p.id === planId);
  if (planIndex === -1) return;
  
  const plan = todayPlans.value[planIndex];
  const newStatus = !plan.completed;
  
  try {
    if (newStatus) {
      // 标记为完成
      await axios.put(
        `http://localhost:3001/api/study-plan/mark-completed/${plan.id}`,
        {},
        { timeout: 10000 }
      );
      ElMessage.success('已标记为完成');
    } else {
      // 取消完成状态
      await axios.put(
        `http://localhost:3001/api/study-plan/unmark-completed/${plan.id}`,
        {},
        { timeout: 10000 }
      );
      ElMessage.success('已取消完成');
    }
    
    // 更新本地状态
    todayPlans.value[planIndex].completed = newStatus;
  } catch (error) {
    console.error('更新计划状态失败：', error);
    ElMessage.error('更新失败，请重试');
  }
}

/* ====== 实时时间 ====== */
const currentDate = ref("");
const currentTime = ref("");
const currentWeekday = ref("");
let timeTimer = null;

function updateTime() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  const hours = String(now.getHours()).padStart(2, "0");
  const minutes = String(now.getMinutes()).padStart(2, "0");
  const seconds = String(now.getSeconds()).padStart(2, "0");
  const weekdays = ["星期日", "星期一", "星期二", "星期三", "星期四", "星期五", "星期六"];
  
  currentDate.value = `${year}年${month}月${day}日`;
  currentTime.value = `${hours}:${minutes}:${seconds}`;
  currentWeekday.value = weekdays[now.getDay()];
}

function startTimeUpdate() {
  updateTime();
  timeTimer = setInterval(updateTime, 1000);
}

function stopTimeUpdate() {
  if (timeTimer) {
    clearInterval(timeTimer);
    timeTimer = null;
  }
}

/* ====== 跳转 ===== */
function goToPage(path) {
  if (path === "home") {
    router.push("/home");
  } else {
    router.push("/" + path);
  }
}
function handleLogout() {
  // 退出时清理本地缓存的登录信息
  localStorage.removeItem("edu-user-id");
  localStorage.removeItem("edu-nickname");
  localStorage.removeItem("edu-avatar");
  router.push("/login");
}
</script>


<style scoped>
/* ---------- 全局容器 + 背景层 ---------- */
.home-container {
  position: relative;
  width: 100%;
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: #f5fafe;
}
.bg-layer {
  position: absolute;
  inset: 0;
  background-size: cover;
  background-position: center;
  z-index: 0;
}

/* ---------- 主内容区（左右分栏） ---------- */
.main-content {
  position: relative;
  z-index: 1;
  flex: 1;
  display: flex;
  gap: 40px;
  padding: 60px;
  overflow: hidden;
}

/* 左侧：欢迎语（中文大头） */
.left-panel {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: 20px;
}
.welcome-title {
  font-size: 48px;
  font-weight: 700;
  color: #0969da;
  line-height: 1.2;
}
.sub-title {
  margin-top: 16px;
  font-size: 24px;
  color: #2c3e50;
}
.desc {
  margin-top: 20px;
  font-size: 16px;
  color: #555;
  line-height: 1.8;
}
.el-button {
  margin-top: 32px;
  letter-spacing: 1px;
}

/* 右侧：固定卡片（无滑动） */
.right-fixed {
  width: 380px;
  display: flex;
  flex-direction: column;
  gap: 24px;
}
.fixed-card {
  background: #ffffff;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  overflow: hidden;
}

/* 卡片1：今日学习计划 */
.plan-card {
  max-height: 400px;
  display: flex;
  flex-direction: column;
}
.plan-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 16px;
  font-size: 16px;
  font-weight: 500;
  color: #0969da;
  border-bottom: 1px solid #e4e7ed;
  flex-shrink: 0;
}
.plan-content {
  flex: 1;
  overflow-y: auto;
  padding: 12px;
}
.plan-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 12px;
  margin-bottom: 8px;
  background: #f5f7fa;
  border-radius: 8px;
  transition: all 0.3s;
  cursor: pointer;
}
.plan-item:hover {
  background: #e8f4ff;
}
.plan-item.completed {
  opacity: 0.6;
}
.plan-item.completed .plan-title {
  text-decoration: line-through;
  color: #999;
}
.plan-checkbox {
  width: 20px;
  height: 20px;
  border: 2px solid #dcdfe6;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: all 0.3s;
}
.plan-item.completed .plan-checkbox {
  background: #67c23a;
  border-color: #67c23a;
}
.plan-info {
  flex: 1;
}
.plan-title {
  font-size: 14px;
  color: #333;
  font-weight: 500;
  margin-bottom: 4px;
}
.plan-time {
  font-size: 12px;
  color: #999;
  display: flex;
  align-items: center;
  gap: 4px;
}
.plan-empty {
  padding: 40px 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}
.plan-empty p {
  font-size: 14px;
  color: #999;
  margin: 0;
}

/* 卡片2：实时时间 */
.hot-header {
  padding: 16px;
  font-size: 16px;
  font-weight: 500;
  color: #0969da;
  border-bottom: 1px solid #e4e7ed;
}
.time-display {
  padding: 20px 16px;
  text-align: center;
  min-height: 160px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 12px;
}
.time-date-row {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  flex-wrap: nowrap;
}
.time-date {
  font-size: 16px;
  color: #666;
  white-space: nowrap;
}
.time-clock {
  font-size: 36px;
  font-weight: 700;
  color: #0969da;
  font-family: "Courier New", monospace;
  letter-spacing: 2px;
  white-space: nowrap;
}
.time-weekday {
  font-size: 15px;
  color: #0969da;
  font-weight: 500;
  white-space: nowrap;
}

/* ---------- 响应式 ---------- */
@media (max-width: 992px) {
  .main-content {
    flex-direction: column;
    padding: 40px 20px;
  }
  .right-fixed {
    width: 100%;
  }
  .welcome-title {
    font-size: 36px;
  }
  .sub-title {
    font-size: 20px;
  }
}

@media (max-width: 768px) {
  .main-content {
    padding: 20px 15px;
  }
  .welcome-title {
    font-size: 28px;
  }
  .sub-title {
    font-size: 18px;
  }
  .desc {
    font-size: 14px;
  }
  .fixed-card {
    margin-bottom: 16px;
  }
}
</style>
