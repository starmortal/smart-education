<template>
  <div class="ai-chat-container">
    <!-- 左侧面板（标签切换） -->
    <div class="left-panel">
      <el-tabs v-model="activeTab" class="panel-tabs">
        <el-tab-pane label="助手" name="assistants">
          <div class="panel-header">
            <el-button type="primary" :icon="Plus" @click="handleCreateAssistant" style="width: 100%;">
              新建助手
            </el-button>
          </div>

          <div class="item-list">
            <div
              v-for="assistant in assistants"
              :key="assistant._id"
              :class="['list-item', { active: selectedAssistantForTopics?._id === assistant._id }]"
              @click="selectAssistantAndSwitchToTopics(assistant)"
            >
              <div class="item-info">
                <div class="item-name">{{ assistant.name }}</div>
                <div class="item-meta">{{ getTopicCount(assistant._id) }} 个对话</div>
              </div>
              <el-dropdown trigger="click" @command="(cmd) => handleAssistantCommand(cmd, assistant)">
                <el-icon class="more-icon" @click.stop>
                  <MoreFilled />
                </el-icon>
                <template #dropdown>
                  <el-dropdown-menu>
                    <el-dropdown-item command="edit">编辑</el-dropdown-item>
                    <el-dropdown-item command="delete" divided>删除</el-dropdown-item>
                  </el-dropdown-menu>
                </template>
              </el-dropdown>
            </div>
          </div>
        </el-tab-pane>

        <el-tab-pane label="对话" name="topics">
          <div class="panel-header">
            <el-button
              type="primary"
              :icon="Plus"
              @click="handleCreateTopic"
              :disabled="!selectedAssistantForTopics"
              style="width: 100%;"
            >
              新建对话
            </el-button>
          </div>

          <div v-if="selectedAssistantForTopics" class="assistant-info-bar">
            <el-icon><Cpu /></el-icon>
            <span>{{ selectedAssistantForTopics.name }}</span>
          </div>

          <div class="item-list">
            <div
              v-for="topic in topics"
              :key="topic._id"
              :class="['list-item', { active: currentTopic?._id === topic._id }]"
              @click="selectTopic(topic)"
            >
              <div class="item-info">
                <div class="item-name">{{ topic.title }}</div>
                <div class="item-meta">{{ formatTime(topic.updatedAt) }}</div>
              </div>
              <el-dropdown trigger="click" @command="(cmd) => handleTopicCommand(cmd, topic)">
                <el-icon class="more-icon" @click.stop>
                  <MoreFilled />
                </el-icon>
                <template #dropdown>
                  <el-dropdown-menu>
                    <el-dropdown-item command="rename">重命名</el-dropdown-item>
                    <el-dropdown-item command="clear">清空消息</el-dropdown-item>
                    <el-dropdown-item command="delete" divided>删除</el-dropdown-item>
                  </el-dropdown-menu>
                </template>
              </el-dropdown>
            </div>

            <div v-if="topics.length === 0 && selectedAssistantForTopics" class="empty-state">
              <el-icon :size="48" color="#e4e7ed"><ChatDotRound /></el-icon>
              <p>还没有对话</p>
              <el-button type="primary" size="small" @click="handleCreateTopic">
                创建新对话
              </el-button>
            </div>

            <div v-if="!selectedAssistantForTopics" class="empty-state">
              <el-icon :size="48" color="#e4e7ed"><Cpu /></el-icon>
              <p>请先选择一个助手</p>
            </div>
          </div>
        </el-tab-pane>
      </el-tabs>
    </div>

    <!-- 右侧对话区域 -->
    <div class="chat-panel">
      <div v-if="!currentTopic" class="empty-chat">
        <el-icon :size="80" color="#e4e7ed"><ChatDotRound /></el-icon>
        <p>选择或创建一个对话开始聊天</p>
      </div>

      <template v-else>
        <!-- 消息列表 -->
        <div class="message-list" ref="messageListRef">
          <div
            v-for="(message, index) in messages"
            :key="index"
            :class="['message-item', message.role]"
          >
            <div class="message-avatar">
              <el-avatar v-if="message.role === 'user'" :size="36" :src="userAvatar" />
              <el-icon v-else :size="36" color="#0969da"><Cpu /></el-icon>
            </div>
            <div class="message-content">
              <div class="message-text" v-html="renderMarkdown(message.content)"></div>
              <div class="message-time">{{ formatMessageTime(message.timestamp) }}</div>
            </div>
          </div>

          <div v-if="isLoading" class="message-item assistant">
            <div class="message-avatar">
              <el-icon :size="36" color="#0969da"><Cpu /></el-icon>
            </div>
            <div class="message-content">
              <div class="loading-dots">
                <span></span><span></span><span></span>
              </div>
            </div>
          </div>
        </div>

        <!-- 输入区域 -->
        <div class="input-area">
          <el-input
            v-model="inputMessage"
            type="textarea"
            :rows="3"
            placeholder="输入消息... (Ctrl+Enter 发送)"
            @keydown.ctrl.enter="handleSendMessage"
          />
          <div class="input-actions">
            <el-button type="primary" :icon="Promotion" @click="handleSendMessage" :loading="isLoading">
              发送
            </el-button>
          </div>
        </div>
      </template>
    </div>

    <!-- 创建/编辑助手对话框 -->
    <el-dialog
      v-model="assistantDialogVisible"
      :title="isEditingAssistant ? '编辑助手' : '创建助手'"
      width="500px"
    >
      <el-form :model="assistantForm" label-width="80px">
        <el-form-item label="助手名称">
          <el-input v-model="assistantForm.name" placeholder="请输入助手名称" />
        </el-form-item>
        <el-form-item label="提示词">
          <el-input
            v-model="assistantForm.prompt"
            type="textarea"
            :rows="4"
            placeholder="请输入系统提示词（可选）"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="assistantDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSaveAssistant">确定</el-button>
      </template>
    </el-dialog>

    <!-- 重命名话题对话框 -->
    <el-dialog v-model="renameDialogVisible" title="重命名对话" width="400px">
      <el-input v-model="renameTitle" placeholder="请输入新标题" />
      <template #footer>
        <el-button @click="renameDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleRenameTopic">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, nextTick, watch } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Plus, MoreFilled, ChatDotRound, Cpu, Promotion } from '@element-plus/icons-vue';
import { marked } from 'marked';
import {
  getAssistants,
  createAssistant,
  updateAssistant,
  deleteAssistant,
  createDefaultAssistant
} from '@/api/assistant';
import {
  getTopics,
  createTopic,
  getTopic,
  updateTopic,
  deleteTopic,
  sendMessage,
  clearMessages
} from '@/api/chat';

const userId = ref(localStorage.getItem('edu-user-id'));
const userAvatar = ref(localStorage.getItem('edu-avatar') || 'https://cube.elemecdn.com/3/7c/3ea6beec64369c2642b92c6726f1epng.png');

// 数据
const assistants = ref([]);
const topics = ref([]);
const messages = ref([]);
const selectedAssistantForTopics = ref(null); // 对话标签下选中的助手
const currentTopic = ref(null);
const inputMessage = ref('');
const isLoading = ref(false);
const messageListRef = ref(null);

// 标签状态
const activeTab = ref('assistants');

// 对话框
const assistantDialogVisible = ref(false);
const isEditingAssistant = ref(false);
const assistantForm = ref({ name: '', prompt: '' });
const editingAssistantId = ref(null);

const renameDialogVisible = ref(false);
const renameTitle = ref('');
const renamingTopicId = ref(null);

onMounted(async () => {
  await loadAssistants();
  // 默认选择第一个助手并切换到对话标签
  if (assistants.value.length > 0) {
    await selectAssistantAndSwitchToTopics(assistants.value[0]);
  }
});

// 监听当前话题变化，自动滚动到底部
watch(() => messages.value.length, () => {
  nextTick(() => {
    scrollToBottom();
  });
});

// 加载助手列表
const loadAssistants = async () => {
  try {
    const res = await getAssistants(userId.value);
    if (res.data.code === 200) {
      assistants.value = res.data.data;
      
      // 如果没有助手，创建默认助手
      if (assistants.value.length === 0) {
        await createDefaultAssistant(userId.value);
        await loadAssistants();
      }
    }
  } catch (error) {
    console.error('加载助手失败:', error);
    ElMessage.error('加载助手失败');
  }
};

// 选择助手并切换到对话标签
const selectAssistantAndSwitchToTopics = async (assistant) => {
  selectedAssistantForTopics.value = assistant;
  currentTopic.value = null;
  messages.value = [];
  await loadTopics(assistant._id);
  activeTab.value = 'topics'; // 切换到对话标签
};

// 加载话题列表
const loadTopics = async (assistantId) => {
  try {
    const res = await getTopics(assistantId);
    if (res.data.code === 200) {
      topics.value = res.data.data;
    }
  } catch (error) {
    console.error('加载话题失败:', error);
  }
};

// 选择话题
const selectTopic = async (topic) => {
  currentTopic.value = topic;
  await loadMessages(topic._id);
};

// 加载消息
const loadMessages = async (topicId) => {
  try {
    const res = await getTopic(topicId);
    if (res.data.code === 200) {
      messages.value = res.data.data.messages || [];
    }
  } catch (error) {
    console.error('加载消息失败:', error);
  }
};

// 创建助手
const handleCreateAssistant = () => {
  isEditingAssistant.value = false;
  assistantForm.value = { name: '', prompt: '' };
  assistantDialogVisible.value = true;
};

// 保存助手
const handleSaveAssistant = async () => {
  if (!assistantForm.value.name) {
    ElMessage.warning('请输入助手名称');
    return;
  }

  try {
    if (isEditingAssistant.value) {
      await updateAssistant(editingAssistantId.value, assistantForm.value);
      ElMessage.success('助手更新成功');
    } else {
      await createAssistant({
        userId: userId.value,
        ...assistantForm.value
      });
      ElMessage.success('助手创建成功');
    }
    assistantDialogVisible.value = false;
    await loadAssistants();
  } catch (error) {
    console.error('保存助手失败:', error);
    ElMessage.error('操作失败');
  }
};

// 助手操作
const handleAssistantCommand = async (command, assistant) => {
  if (command === 'edit') {
    isEditingAssistant.value = true;
    editingAssistantId.value = assistant._id;
    assistantForm.value = {
      name: assistant.name,
      prompt: assistant.prompt || ''
    };
    assistantDialogVisible.value = true;
  } else if (command === 'delete') {
    try {
      await ElMessageBox.confirm('确定要删除这个助手吗？', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      });
      await deleteAssistant(assistant._id);
      ElMessage.success('助手已删除');
      await loadAssistants();
      if (selectedAssistantForTopics.value?._id === assistant._id) {
        selectedAssistantForTopics.value = null;
        currentTopic.value = null;
        topics.value = [];
        messages.value = [];
      }
    } catch (error) {
      if (error !== 'cancel') {
        console.error('删除助手失败:', error);
        ElMessage.error('删除失败');
      }
    }
  }
};

// 创建话题
const handleCreateTopic = async () => {
  if (!selectedAssistantForTopics.value) {
    ElMessage.warning('请先选择助手');
    return;
  }

  try {
    const res = await createTopic({
      assistantId: selectedAssistantForTopics.value._id,
      userId: userId.value,
      title: '新对话'
    });
    if (res.data.code === 200) {
      await loadTopics(selectedAssistantForTopics.value._id);
      await selectTopic(res.data.data);
      ElMessage.success('对话创建成功');
    }
  } catch (error) {
    console.error('创建话题失败:', error);
    ElMessage.error('创建失败');
  }
};

// 话题操作
const handleTopicCommand = async (command, topic) => {
  if (command === 'rename') {
    renamingTopicId.value = topic._id;
    renameTitle.value = topic.title;
    renameDialogVisible.value = true;
  } else if (command === 'clear') {
    try {
      await ElMessageBox.confirm('确定要清空这个对话的所有消息吗？', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      });
      await clearMessages(topic._id);
      ElMessage.success('消息已清空');
      if (currentTopic.value?._id === topic._id) {
        messages.value = [];
      }
    } catch (error) {
      if (error !== 'cancel') {
        console.error('清空消息失败:', error);
        ElMessage.error('操作失败');
      }
    }
  } else if (command === 'delete') {
    try {
      await ElMessageBox.confirm('确定要删除这个对话吗？', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      });
      await deleteTopic(topic._id);
      ElMessage.success('对话已删除');
      await loadTopics(selectedAssistantForTopics.value._id);
      if (currentTopic.value?._id === topic._id) {
        currentTopic.value = null;
        messages.value = [];
      }
    } catch (error) {
      if (error !== 'cancel') {
        console.error('删除话题失败:', error);
        ElMessage.error('删除失败');
      }
    }
  }
};

// 重命名话题
const handleRenameTopic = async () => {
  if (!renameTitle.value) {
    ElMessage.warning('请输入标题');
    return;
  }

  try {
    await updateTopic(renamingTopicId.value, renameTitle.value);
    ElMessage.success('重命名成功');
    renameDialogVisible.value = false;
    await loadTopics(selectedAssistantForTopics.value._id);
    if (currentTopic.value?._id === renamingTopicId.value) {
      currentTopic.value.title = renameTitle.value;
    }
  } catch (error) {
    console.error('重命名失败:', error);
    ElMessage.error('重命名失败');
  }
};

// 发送消息
const handleSendMessage = async () => {
  if (!inputMessage.value.trim()) {
    ElMessage.warning('请输入消息');
    return;
  }

  if (!currentTopic.value) {
    ElMessage.warning('请先选择或创建对话');
    return;
  }

  const message = inputMessage.value.trim();
  inputMessage.value = '';
  isLoading.value = true;

  try {
    const res = await sendMessage(currentTopic.value._id, message);
    if (res.data.code === 200) {
      messages.value.push(res.data.data.userMessage);
      messages.value.push(res.data.data.assistantMessage);
      
      // 更新话题标题
      if (res.data.data.topic) {
        currentTopic.value.title = res.data.data.topic.title;
        await loadTopics(selectedAssistantForTopics.value._id);
      }
    }
  } catch (error) {
    console.error('发送消息失败:', error);
    ElMessage.error('发送失败，请重试');
  } finally {
    isLoading.value = false;
  }
};

// 工具函数
const getTopicCount = (assistantId) => {
  return topics.value.filter(t => t.assistantId === assistantId).length;
};

const formatTime = (time) => {
  const date = new Date(time);
  const now = new Date();
  const diff = now - date;
  
  if (diff < 60000) return '刚刚';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}分钟前`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}小时前`;
  if (diff < 604800000) return `${Math.floor(diff / 86400000)}天前`;
  
  return `${date.getMonth() + 1}/${date.getDate()}`;
};

const formatMessageTime = (time) => {
  const date = new Date(time);
  return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
};

const renderMarkdown = (content) => {
  return marked(content);
};

const scrollToBottom = () => {
  if (messageListRef.value) {
    messageListRef.value.scrollTop = messageListRef.value.scrollHeight;
  }
};
</script>

<style scoped>
.ai-chat-container {
  display: flex;
  height: 100vh;
  background: #f5f7fa;
}

/* 左侧面板 */
.left-panel {
  width: 260px;
  background: #ffffff;
  border-right: 1px solid #e4e7ed;
  display: flex;
  flex-direction: column;
}

.panel-tabs {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.panel-tabs :deep(.el-tabs__header) {
  margin: 0;
  padding: 12px 16px 0;
  background: #ffffff;
}

.panel-tabs :deep(.el-tabs__content) {
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.panel-tabs :deep(.el-tab-pane) {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.assistant-info-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background: #f5f7fa;
  border-bottom: 1px solid #e4e7ed;
  font-size: 14px;
  color: #666;
}

.panel-header {
  padding: 16px;
  border-bottom: 1px solid #e4e7ed;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.header-title {
  font-size: 16px;
  font-weight: 600;
  color: #333;
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.item-list {
  flex: 1;
  overflow-y: auto;
  padding: 8px;
}

.list-item {
  padding: 12px;
  margin-bottom: 4px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.list-item:hover {
  background: #f5f7fa;
}

.list-item.active {
  background: #e8f4ff;
}

.item-info {
  flex: 1;
  overflow: hidden;
}

.item-name {
  font-size: 14px;
  font-weight: 500;
  color: #333;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.item-meta {
  font-size: 12px;
  color: #999;
  margin-top: 4px;
}

.more-icon {
  color: #999;
  cursor: pointer;
  padding: 4px;
}

.more-icon:hover {
  color: #0969da;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  color: #999;
}

.empty-state p {
  margin: 12px 0;
}

/* 对话面板 */
.chat-panel {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: #ffffff;
}

.empty-chat {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #999;
}

.empty-chat p {
  margin-top: 16px;
  font-size: 16px;
}

.message-list {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
}

.message-item {
  display: flex;
  gap: 12px;
  margin-bottom: 20px;
}

.message-item.user {
  flex-direction: row-reverse;
}

.message-avatar {
  flex-shrink: 0;
}

.message-content {
  max-width: 70%;
}

.message-item.user .message-content {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
}

.message-text {
  padding: 12px 16px;
  border-radius: 8px;
  background: #f5f7fa;
  color: #333;
  line-height: 1.6;
  word-wrap: break-word;
}

.message-item.user .message-text {
  background: #0969da;
  color: #ffffff;
}

.message-time {
  font-size: 12px;
  color: #999;
  margin-top: 4px;
}

.loading-dots {
  display: flex;
  gap: 4px;
  padding: 12px 16px;
}

.loading-dots span {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #0969da;
  animation: bounce 1.4s infinite ease-in-out both;
}

.loading-dots span:nth-child(1) {
  animation-delay: -0.32s;
}

.loading-dots span:nth-child(2) {
  animation-delay: -0.16s;
}

@keyframes bounce {
  0%, 80%, 100% {
    transform: scale(0);
  }
  40% {
    transform: scale(1);
  }
}

.input-area {
  border-top: 1px solid #e4e7ed;
  padding: 16px;
}

.input-actions {
  display: flex;
  justify-content: flex-end;
  margin-top: 12px;
}

/* 响应式 */
@media (max-width: 1200px) {
  .left-panel {
    width: 220px;
  }
}

@media (max-width: 992px) {
  .left-panel {
    display: none;
  }
}
</style>
