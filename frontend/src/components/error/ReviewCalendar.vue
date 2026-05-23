<template>
  <div class="review-calendar">
    <div class="calendar-header">
      <h3 class="calendar-title">📅 复习日历</h3>
      <div class="view-tabs">
        <el-button 
          :type="activeView === 'week' ? 'primary' : ''" 
          size="small"
          @click="changeView('week')"
        >
          本周
        </el-button>
        <el-button 
          :type="activeView === 'month' ? 'primary' : ''" 
          size="small"
          @click="changeView('month')"
        >
          本月
        </el-button>
      </div>
    </div>

    <div class="calendar-content">
      <div v-if="activeView === 'week'" class="week-view">
        <div 
          v-for="day in weekDays" 
          :key="day.date"
          class="day-item"
          :class="{ 
            today: day.isToday, 
            completed: day.completed === day.count,
            hasReview: day.count > 0
          }"
          @click="handleDayClick(day)"
        >
          <div class="day-header">
            <span class="day-name">{{ day.dayName }}</span>
            <span class="day-date">{{ day.dateStr }}</span>
          </div>
          <div class="day-body">
            <div class="review-count">
              <span class="count-number">{{ day.count }}</span>
              <span class="count-label">题</span>
            </div>
            <div v-if="day.count > 0" class="review-status">
              <span v-if="day.completed === day.count" class="status-icon">✓✓✓</span>
              <span v-else-if="day.isToday" class="status-text">待复习</span>
              <span v-else-if="day.isFuture" class="status-text">计划</span>
              <span v-else class="status-text">未完成</span>
            </div>
            <div v-else class="review-status">
              <span class="status-text">{{ day.isToday ? '无任务' : '休息' }}</span>
            </div>
          </div>
        </div>
      </div>

      <div v-else class="month-view">
        <div class="month-header">
          <el-button :icon="ArrowLeft" circle size="small" @click="prevMonth" />
          <span class="month-title">{{ currentMonthTitle }}</span>
          <el-button :icon="ArrowRight" circle size="small" @click="nextMonth" />
        </div>
        
        <div class="month-grid">
          <div v-for="weekday in weekdays" :key="weekday" class="weekday-label">
            {{ weekday }}
          </div>
          
          <div 
            v-for="day in monthDays" 
            :key="day.date"
            class="month-day"
            :class="{ 
              today: day.isToday,
              'other-month': day.isOtherMonth,
              'has-review': day.count > 0,
              completed: day.completed === day.count && day.count > 0
            }"
            @click="handleDayClick(day)"
          >
            <div class="day-number">{{ day.day }}</div>
            <div v-if="day.count > 0" class="day-indicator">
              <span class="indicator-dot" :class="{ completed: day.completed === day.count }">
                {{ day.count }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { ArrowLeft, ArrowRight } from '@element-plus/icons-vue';
import dayjs from 'dayjs';
import weekday from 'dayjs/plugin/weekday';
import isoWeek from 'dayjs/plugin/isoWeek';
import axios from 'axios';

dayjs.extend(weekday);
dayjs.extend(isoWeek);

const props = defineProps({
  userId: {
    type: String,
    required: true
  }
});

const emit = defineEmits(['day-click', 'data-loaded']);

const activeView = ref('week');
const currentMonth = ref(dayjs());
const calendarData = ref({});

const weekdays = ['一', '二', '三', '四', '五', '六', '日'];

// 本周数据
const weekDays = computed(() => {
  const today = dayjs();
  const startOfWeek = today.startOf('isoWeek');
  
  return Array.from({ length: 7 }, (_, i) => {
    const date = startOfWeek.add(i, 'day');
    const dateKey = date.format('YYYY-MM-DD');
    const data = calendarData.value[dateKey] || { count: 0, completed: 0 };
    
    return {
      date: dateKey,
      dayName: weekdays[i],
      dateStr: date.format('MM/DD'),
      isToday: date.isSame(today, 'day'),
      isFuture: date.isAfter(today, 'day'),
      count: data.count,
      completed: data.completed
    };
  });
});

// 本月数据
const monthDays = computed(() => {
  const firstDay = currentMonth.value.startOf('month');
  const lastDay = currentMonth.value.endOf('month');
  const startDate = firstDay.startOf('isoWeek');
  const endDate = lastDay.endOf('isoWeek');
  
  const days = [];
  let current = startDate;
  
  while (current.isBefore(endDate) || current.isSame(endDate, 'day')) {
    const dateKey = current.format('YYYY-MM-DD');
    const data = calendarData.value[dateKey] || { count: 0, completed: 0 };
    
    days.push({
      date: dateKey,
      day: current.date(),
      isToday: current.isSame(dayjs(), 'day'),
      isOtherMonth: !current.isSame(currentMonth.value, 'month'),
      count: data.count,
      completed: data.completed
    });
    
    current = current.add(1, 'day');
  }
  
  return days;
});

// 当前月份标题
const currentMonthTitle = computed(() => {
  return currentMonth.value.format('YYYY年MM月');
});

// 切换视图
function changeView(view) {
  activeView.value = view;
}

// 上一月
function prevMonth() {
  currentMonth.value = currentMonth.value.subtract(1, 'month');
  fetchCalendarData();
}

// 下一月
function nextMonth() {
  currentMonth.value = currentMonth.value.add(1, 'month');
  fetchCalendarData();
}

// 点击日期
function handleDayClick(day) {
  if (day.count > 0) {
    emit('day-click', day);
  }
}

// 获取日历数据
async function fetchCalendarData() {
  try {
    const year = currentMonth.value.year();
    const month = currentMonth.value.month() + 1;
    
    const response = await axios.get(
      `http://localhost:3001/api/error-book/calendar/${props.userId}`,
      {
        params: { year, month },
        timeout: 10000
      }
    );
    
    const data = response.data?.data || response.data;
    const dates = data?.dates || [];
    
    // 转换为对象格式
    const dataMap = {};
    dates.forEach(item => {
      dataMap[item.date] = {
        count: item.count || 0,
        completed: item.completed || 0,
        status: item.status || 'pending'
      };
    });
    
    calendarData.value = dataMap;
    emit('data-loaded', dataMap);
    
  } catch (error) {
    console.error('获取日历数据失败：', error);
    // 降级方案：生成模拟数据
    generateMockData();
  }
}

// 生成模拟数据（降级方案）
function generateMockData() {
  const today = dayjs();
  const dataMap = {};
  
  // 生成过去7天和未来7天的数据
  for (let i = -7; i <= 7; i++) {
    const date = today.add(i, 'day');
    const dateKey = date.format('YYYY-MM-DD');
    
    if (i < 0) {
      // 过去的日期：随机生成已完成的数据
      const count = Math.floor(Math.random() * 8) + 1;
      dataMap[dateKey] = {
        count,
        completed: Math.floor(Math.random() * count),
        status: 'completed'
      };
    } else if (i === 0) {
      // 今天：待复习
      dataMap[dateKey] = {
        count: 8,
        completed: 0,
        status: 'pending'
      };
    } else {
      // 未来：计划
      const count = Math.floor(Math.random() * 5);
      dataMap[dateKey] = {
        count,
        completed: 0,
        status: 'planned'
      };
    }
  }
  
  calendarData.value = dataMap;
}

onMounted(() => {
  fetchCalendarData();
});
</script>

<style scoped>
.review-calendar {
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.calendar-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 2px solid #f0f0f0;
}

.calendar-title {
  font-size: 18px;
  font-weight: 600;
  color: #333;
  margin: 0;
}

.view-tabs {
  display: flex;
  gap: 8px;
}

/* 周视图 */
.week-view {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 12px;
}

.day-item {
  background: #f5f7fa;
  border-radius: 8px;
  padding: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
  border: 2px solid transparent;
}

.day-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.day-item.today {
  border-color: #409eff;
  background: linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%);
}

.day-item.completed {
  background: linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%);
}

.day-item.hasReview:not(.completed) {
  background: linear-gradient(135deg, #fff9e6 0%, #ffe6b3 100%);
}

.day-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.day-name {
  font-size: 12px;
  color: #666;
  font-weight: 600;
}

.day-date {
  font-size: 12px;
  color: #999;
}

.day-body {
  text-align: center;
}

.review-count {
  margin-bottom: 4px;
}

.count-number {
  font-size: 24px;
  font-weight: 600;
  color: #409eff;
}

.count-label {
  font-size: 12px;
  color: #666;
  margin-left: 2px;
}

.review-status {
  font-size: 12px;
  color: #666;
}

.status-icon {
  color: #67c23a;
  font-size: 14px;
}

.status-text {
  color: #999;
}

/* 月视图 */
.month-view {
  width: 100%;
}

.month-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.month-title {
  font-size: 16px;
  font-weight: 600;
  color: #333;
}

.month-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 8px;
}

.weekday-label {
  text-align: center;
  font-size: 12px;
  font-weight: 600;
  color: #666;
  padding: 8px 0;
}

.month-day {
  aspect-ratio: 1;
  background: #f5f7fa;
  border-radius: 8px;
  padding: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.month-day:hover {
  background: #e3f2fd;
  transform: scale(1.05);
}

.month-day.today {
  background: linear-gradient(135deg, #409eff 0%, #66b1ff 100%);
  color: white;
}

.month-day.today .day-number {
  color: white;
}

.month-day.other-month {
  opacity: 0.3;
}

.month-day.has-review {
  background: #fff9e6;
}

.month-day.completed {
  background: #e8f5e9;
}

.day-number {
  font-size: 14px;
  font-weight: 600;
  color: #333;
}

.day-indicator {
  margin-top: 4px;
}

.indicator-dot {
  display: inline-block;
  min-width: 20px;
  height: 20px;
  line-height: 20px;
  background: #409eff;
  color: white;
  border-radius: 10px;
  font-size: 10px;
  padding: 0 4px;
  text-align: center;
}

.indicator-dot.completed {
  background: #67c23a;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .week-view {
    grid-template-columns: repeat(7, 1fr);
    gap: 4px;
  }
  
  .day-item {
    padding: 8px 4px;
  }
  
  .count-number {
    font-size: 18px;
  }
  
  .month-grid {
    gap: 4px;
  }
  
  .month-day {
    padding: 4px;
  }
}
</style>
