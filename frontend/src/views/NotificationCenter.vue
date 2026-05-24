<template>
  <div class="notification-center">
    <!-- 头部 -->
    <div class="header">
      <div class="header-left">
        <el-icon size="24" color="#0969da"><Bell /></el-icon>
        <h1>通知中心</h1>
      </div>
      <div class="header-right">
        <el-button 
          :icon="Setting" 
          @click="showSettings = true"
          type="primary"
          text
        >
          设置
        </el-button>
      </div>
    </div>

    <!-- 标签页 -->
    <el-tabs v-model="activeTab" @tab-change="handleTabChange">
      <el-tab-pane label="全部" name="all">
        <template #label>
          <span>全部</span>
          <el-badge 
            v-if="totalCount > 0" 
            :value="totalCount" 
            :max="99" 
            class="tab-badge"
          />
        </template>
      </el-tab-pane>
      <el-tab-pane label="未读" name="unread">
        <template #label>
          <span>未读</span>
          <el-badge 
            v-if="unreadCount > 0" 
            :value="unreadCount" 
            :max="99" 
            class="tab-badge"
          />
        </template>
      </el-tab-pane>
      <el-tab-pane label="已读" name="read">
        <span>已读</span>
      </el-tab-pane>
    </el-tabs>

    <!-- 操作栏 -->
    <div class="action-bar" v-if="notifications.length > 0">
      <el-button 
        :icon="Check" 
        @click="handleMarkAllRead"
        :disabled="unreadCount === 0"
        size="small"
      >
        全部已读
      </el-button>
      <el-button 
        :icon="Delete" 
        @click="handleClearAll"
        size="small"
      >
        清空通知
      </el-button>
    </div>

    <!-- 通知列表 -->
    <div class="notification-list" v-loading="loading">
      <div 
        v-for="notification in notifications" 
        :key="notification._id"
        :class="['notification-item', { unread: !notification.isRead }]"
        @click="handleNotificationClick(notification)"
      >
        <div class="notification-icon">
          {{ getNotificationIcon(notification.type) }}
        </div>
        <div class="notification-content">
          <div class="notification-title">{{ notification.title }}</div>
          <div class="notification-text">{{ formatPreview(notification.content) }}</div>
          <div class="notification-time">{{ formatTime(notification.createTime) }}</div>
        </div>
        <div class="notification-actions">
          <el-button 
            v-if="!notification.isRead"
            :icon="Check" 
            @click.stop="handleMarkRead(notification._id)"
            size="small"
            text
          >
            标记已读
          </el-button>
          <el-button 
            :icon="Delete" 
            @click.stop="handleDelete(notification._id)"
            size="small"
            text
            type="danger"
          >
            删除
          </el-button>
        </div>
      </div>

      <!-- 空状态 -->
      <el-empty 
        v-if="!loading && notifications.length === 0" 
        description="暂无通知"
        :image-size="120"
      />

      <!-- 分页 -->
      <div class="pagination" v-if="total > pageSize">
        <el-pagination
          v-model:current-page="currentPage"
          :page-size="pageSize"
          :total="total"
          layout="prev, pager, next"
          @current-change="handlePageChange"
        />
      </div>
    </div>

    <!-- 系统公告详情 -->
    <el-dialog
      v-model="detailVisible"
      :title="currentDetail?.title || '系统公告'"
      width="520px"
      class="announcement-detail-dialog"
      destroy-on-close
    >
      <div v-if="currentDetail" class="announcement-detail">
        <el-tag type="primary" size="small" effect="plain" class="detail-tag">系统公告</el-tag>
        <div class="detail-content" v-html="currentDetail.content"></div>
        <div class="detail-time">
          发布时间：{{ formatDetailTime(currentDetail.createTime) }}
        </div>
      </div>
      <template #footer>
        <el-button type="primary" @click="detailVisible = false">知道了</el-button>
      </template>
    </el-dialog>

    <!-- 设置抽屉 -->
    <el-drawer
      v-model="showSettings"
      title="通知设置"
      size="400px"
      direction="rtl"
    >
      <div class="settings-content" v-loading="settingsLoading">
        <!-- 邮箱通知总开关 -->
        <div class="setting-item">
          <div class="setting-label">
            <el-icon><Message /></el-icon>
            <span>邮箱通知</span>
          </div>
          <div class="setting-desc">接收重要通知的邮件提醒</div>
          <el-switch 
            v-model="settings.emailEnabled" 
            @change="handleSettingsChange"
          />
        </div>

        <el-divider />

        <!-- 通知类型设置 -->
        <div class="setting-section">
          <h3>通知类型设置</h3>
          <div class="setting-item" v-for="(label, key) in notificationTypes" :key="key">
            <div class="setting-label">
              <span>{{ label }}</span>
            </div>
            <el-switch 
              v-model="settings.notificationTypes[key]" 
              @change="handleSettingsChange"
            />
          </div>
        </div>
      </div>
    </el-drawer>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage, ElMessageBox } from 'element-plus';
import { 
  Bell, 
  Setting, 
  Check, 
  Delete, 
  Message 
} from '@element-plus/icons-vue';
import {
  getNotificationList,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  clearAllNotifications,
  getNotificationSettings,
  updateNotificationSettings,
} from '@/api/notification';
import socketClient from '@/utils/socket';

const router = useRouter();

// 数据
const activeTab = ref('all');
const notifications = ref([]);
const loading = ref(false);
const currentPage = ref(1);
const pageSize = ref(20);
const total = ref(0);
const totalCount = ref(0);
const unreadCount = ref(0);

// 设置
const showSettings = ref(false);
const detailVisible = ref(false);
const currentDetail = ref(null);
const settingsLoading = ref(false);
const settings = ref({
  emailEnabled: true,
  notificationTypes: {
    register: true,
    login: true,
    reply: true,
    like: true,
    follow: true,
    system: true,
    aiPlan: true,
  },
});

const notificationTypes = {
  register: '注册欢迎通知',
  login: '登录提醒',
  reply: '社区回复通知',
  like: '点赞通知',
  follow: '关注通知',
  system: '系统公告',
  aiPlan: 'AI 计划生成通知',
};

// 获取通知图标
const getNotificationIcon = (type) => {
  const icons = {
    register: '🎉',
    login: '👋',
    reply: '💬',
    like: '❤️',
    follow: '👥',
    system: '📢',
    aiPlan: '📅',
  };
  return icons[type] || '📬';
};

// 格式化详情时间
const formatDetailTime = (time) => {
  if (!time) return '';
  return new Date(time).toLocaleString('zh-CN');
};

// 列表摘要（去掉 HTML 标签）
const formatPreview = (content) => {
  if (!content) return '';
  return content
    .replace(/<br\s*\/?>/gi, ' ')
    .replace(/<[^>]+>/g, '')
    .trim();
};

// 是否为系统公告
const isSystemAnnouncement = (notification) => {
  return notification.type === 'system'
    || notification.relatedData?.source === 'admin_broadcast';
};

// 格式化时间
const formatTime = (time) => {
  const now = new Date();
  const notificationTime = new Date(time);
  const diff = now - notificationTime;
  
  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;
  
  if (diff < minute) {
    return '刚刚';
  } else if (diff < hour) {
    return `${Math.floor(diff / minute)}分钟前`;
  } else if (diff < day) {
    return `${Math.floor(diff / hour)}小时前`;
  } else if (diff < 7 * day) {
    return `${Math.floor(diff / day)}天前`;
  } else {
    return notificationTime.toLocaleDateString('zh-CN');
  }
};

// 加载通知列表
const loadNotifications = async () => {
  loading.value = true;
  try {
    const params = {
      page: currentPage.value,
      pageSize: pageSize.value,
    };
    
    if (activeTab.value === 'unread') {
      params.isRead = false;
    } else if (activeTab.value === 'read') {
      params.isRead = true;
    }
    
    const response = await getNotificationList(params);
    if (response.code === 200) {
      notifications.value = response.data.list || [];
      total.value = response.data.total || 0;
      
      if (activeTab.value === 'all') {
        totalCount.value = total.value;
      }
    }
  } catch (error) {
    console.error('加载通知列表失败：', error);
    ElMessage.error('加载通知列表失败');
  } finally {
    loading.value = false;
  }
};

// 加载未读数量
const loadUnreadCount = async () => {
  try {
    const response = await getUnreadCount();
    if (response.code === 200) {
      unreadCount.value = response.data.count || 0;
    }
  } catch (error) {
    console.error('加载未读数量失败：', error);
  }
};

// 标签页切换
const handleTabChange = () => {
  currentPage.value = 1;
  loadNotifications();
};

// 分页切换
const handlePageChange = () => {
  loadNotifications();
};

// 标记单条已读
const handleMarkRead = async (id) => {
  try {
    const response = await markAsRead(id);
    if (response.code === 200) {
      ElMessage.success('已标记为已读');
      loadNotifications();
      loadUnreadCount();
    }
  } catch (error) {
    console.error('标记已读失败：', error);
    ElMessage.error('操作失败');
  }
};

// 标记全部已读
const handleMarkAllRead = async () => {
  try {
    await ElMessageBox.confirm('确定要将所有通知标记为已读吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'info',
    });
    
    const response = await markAllAsRead();
    if (response.code === 200) {
      ElMessage.success('已全部标记为已读');
      loadNotifications();
      loadUnreadCount();
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('标记全部已读失败：', error);
      ElMessage.error('操作失败');
    }
  }
};

// 删除通知
const handleDelete = async (id) => {
  try {
    await ElMessageBox.confirm('确定要删除这条通知吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    });
    
    const response = await deleteNotification(id);
    if (response.code === 200) {
      ElMessage.success('删除成功');
      loadNotifications();
      loadUnreadCount();
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除通知失败：', error);
      ElMessage.error('删除失败');
    }
  }
};

// 清空所有通知
const handleClearAll = async () => {
  try {
    await ElMessageBox.confirm('确定要清空所有通知吗？此操作不可恢复！', '警告', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    });
    
    const response = await clearAllNotifications();
    if (response.code === 200) {
      ElMessage.success('已清空所有通知');
      loadNotifications();
      loadUnreadCount();
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('清空通知失败：', error);
      ElMessage.error('操作失败');
    }
  }
};

// 点击通知
const handleNotificationClick = async (notification) => {
  // 系统公告：弹窗查看详情
  if (isSystemAnnouncement(notification)) {
    if (!notification.isRead) {
      await handleMarkRead(notification._id);
    }
    currentDetail.value = notification;
    detailVisible.value = true;
    return;
  }

  // 如果未读，先标记为已读
  if (!notification.isRead) {
    await handleMarkRead(notification._id);
  }
  
  // 根据通知类型跳转
  if (notification.type === 'aiPlan' || notification.relatedData?.source === 'ai_schedule') {
    const planId =
      notification.relatedData?.planId ||
      (notification.relatedData?.planIds && notification.relatedData.planIds[0]);
    router.push({
      path: '/study-plan',
      query: planId ? { planId: String(planId) } : {},
    });
  } else if (notification.relatedType === 'question' && notification.relatedData?.questionId) {
    router.push('/study-community');
  } else if (notification.type === 'follow' && notification.relatedType === 'user') {
    router.push('/profile');
  }
};

// 加载通知设置
const loadSettings = async () => {
  settingsLoading.value = true;
  try {
    const response = await getNotificationSettings();
    if (response.code === 200) {
      const data = response.data || {};
      settings.value = {
        emailEnabled: data.emailEnabled ?? true,
        notificationTypes: {
          register: true,
          login: true,
          reply: true,
          like: true,
          follow: true,
          system: true,
          aiPlan: true,
          ...(data.notificationTypes || {}),
        },
      };
    }
  } catch (error) {
    console.error('加载通知设置失败：', error);
  } finally {
    settingsLoading.value = false;
  }
};

// 更新通知设置
const handleSettingsChange = async () => {
  try {
    const response = await updateNotificationSettings(settings.value);
    if (response.code === 200) {
      ElMessage.success('设置已保存');
    }
  } catch (error) {
    console.error('更新通知设置失败：', error);
    ElMessage.error('保存失败');
  }
};

// 监听实时通知
const handleNewNotification = (data) => {
  console.log('收到新通知：', data);
  
  // 显示通知提示
  ElMessage({
    message: data.title,
    type: 'info',
    duration: 3000,
  });
  
  // 刷新列表
  loadNotifications();
  loadUnreadCount();
};

onMounted(() => {
  loadNotifications();
  loadUnreadCount();
  loadSettings();
  
  // 监听实时通知
  socketClient.on('notification:new', handleNewNotification);
});

onBeforeUnmount(() => {
  // 移除监听
  socketClient.off('notification:new', handleNewNotification);
});
</script>

<style scoped>
.notification-center {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
  background: #fff;
  min-height: calc(100vh - 60px);
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 20px;
  border-bottom: 1px solid #e4e7ed;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.header-left h1 {
  margin: 0;
  font-size: 24px;
  font-weight: 600;
  color: #333;
}

.tab-badge {
  margin-left: 8px;
}

.action-bar {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
  padding: 12px;
  background: #f5f7fa;
  border-radius: 8px;
}

.notification-list {
  min-height: 400px;
}

.notification-item {
  display: flex;
  gap: 16px;
  padding: 16px;
  border-radius: 8px;
  margin-bottom: 12px;
  background: #fff;
  border: 1px solid #e4e7ed;
  cursor: pointer;
  transition: all 0.3s;
}

.notification-item:hover {
  border-color: #0969da;
  box-shadow: 0 2px 8px rgba(9, 105, 218, 0.1);
}

.notification-item.unread {
  background: #f0f7ff;
  border-color: #0969da;
}

.notification-icon {
  font-size: 32px;
  flex-shrink: 0;
}

.notification-content {
  flex: 1;
  min-width: 0;
}

.notification-title {
  font-size: 16px;
  font-weight: 600;
  color: #333;
  margin-bottom: 8px;
}

.notification-text {
  font-size: 14px;
  color: #666;
  margin-bottom: 8px;
  line-height: 1.5;
}

.notification-time {
  font-size: 12px;
  color: #999;
}

.notification-actions {
  display: flex;
  gap: 8px;
  align-items: center;
  flex-shrink: 0;
}

.pagination {
  display: flex;
  justify-content: center;
  margin-top: 24px;
  padding-top: 24px;
  border-top: 1px solid #e4e7ed;
}

.settings-content {
  padding: 20px;
}

.setting-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 0;
  flex-wrap: wrap;
}

.setting-label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 15px;
  font-weight: 500;
  color: #333;
  flex: 1;
}

.setting-desc {
  width: 100%;
  font-size: 13px;
  color: #999;
  margin-top: 4px;
  margin-bottom: 8px;
}

.setting-section {
  margin-top: 20px;
}

.setting-section h3 {
  font-size: 16px;
  font-weight: 600;
  color: #333;
  margin-bottom: 16px;
}

.announcement-detail {
  padding: 4px 0;
}

.detail-tag {
  margin-bottom: 12px;
}

.detail-content {
  font-size: 14px;
  line-height: 1.8;
  color: #333;
  word-break: break-word;
}

.detail-time {
  margin-top: 16px;
  padding-top: 12px;
  border-top: 1px solid #ebeef5;
  font-size: 12px;
  color: #909399;
}

@media (max-width: 768px) {
  .notification-center {
    padding: 12px;
  }
  
  .notification-item {
    flex-direction: column;
    gap: 12px;
  }
  
  .notification-actions {
    justify-content: flex-end;
  }
}
</style>
