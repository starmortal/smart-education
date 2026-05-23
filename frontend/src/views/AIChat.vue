<template>
  <div class="ai-chat-container">
    <!-- 左侧面板（标签切换） -->
    <div class="left-panel" :class="{ collapsed: sidebarCollapsed }">
      <!-- 顶部标题栏 -->
      <div class="panel-header">
        <div class="section-title">
          <el-icon size="16"><Cpu /></el-icon>
          <span v-if="!sidebarCollapsed">助手管理</span>
        </div>
      </div>

      <!-- 自定义标签按钮 -->
      <div v-if="!sidebarCollapsed" class="tab-buttons">
        <button 
          :class="['tab-btn', { active: activeTab === 'assistants' }]"
          @click="activeTab = 'assistants'"
        >
          助手
        </button>
        <button 
          :class="['tab-btn', { active: activeTab === 'topics' }]"
          @click="activeTab = 'topics'"
        >
          对话
        </button>
      </div>

      <!-- 助手标签内容 -->
      <div v-show="activeTab === 'assistants'" class="tab-content">
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
              <div class="item-name">
                {{ assistant.name }}
                <el-tag v-if="assistant.isSystem" type="info" size="small" style="margin-left: 8px;">系统</el-tag>
              </div>
            </div>
            <el-dropdown trigger="click" @command="(cmd) => handleAssistantCommand(cmd, assistant)">
              <el-icon class="more-icon" @click.stop>
                <MoreFilled />
              </el-icon>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item command="edit">编辑助手</el-dropdown-item>
                  <el-dropdown-item v-if="!assistant.isSystem" command="delete" divided>删除助手</el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </div>
        </div>
      </div>

      <!-- 对话标签内容 -->
      <div v-show="activeTab === 'topics'" class="tab-content">
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

        <div class="item-list">
          <div
            v-for="topic in topics"
            :key="topic._id"
            :class="['list-item', { active: currentTopic?._id === topic._id }]"
            @click="selectTopic(topic)"
          >
            <div class="item-info">
              <div class="item-name">{{ topic.title }}</div>
            </div>
            <el-dropdown trigger="click" @command="(cmd) => handleTopicCommand(cmd, topic)">
              <el-icon class="more-icon" @click.stop>
                <MoreFilled />
              </el-icon>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item command="rename">重新命名</el-dropdown-item>
                  <el-dropdown-item command="clear">清空消息</el-dropdown-item>
                  <el-dropdown-item command="delete" divided>删除对话</el-dropdown-item>
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
      </div>
    </div>

    <!-- 右侧对话区域 -->
    <div class="chat-panel" :class="{ expanded: sidebarCollapsed }">
      <!-- 对话框顶部标题栏 -->
      <div class="editor-header">
        <el-button 
          :icon="sidebarCollapsed ? DArrowRight : DArrowLeft" 
          circle 
          size="small"
          @click="toggleSidebar"
        />
        <span class="file-name">{{ selectedAssistantForTopics ? selectedAssistantForTopics.name : 'AI 对话' }}</span>
        <div class="header-spacer"></div>
      </div>

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
              <el-avatar v-else :size="36" :src="require('@/assets/logo.png')" class="ai-avatar-img" />
            </div>
            <div class="message-content">
              <div class="message-text" v-html="renderMarkdown(message.content)"></div>
              <!-- AI 消息快捷操作按钮 -->
              <div v-if="message.role === 'assistant'" class="message-actions">
                <el-tooltip content="保存到笔记" placement="top">
                  <el-button 
                    size="small" 
                    :icon="Document" 
                    @click="saveToNote(message.content)"
                    text
                    circle
                  />
                </el-tooltip>
                <el-tooltip content="保存到知识库" placement="top">
                  <el-button 
                    size="small" 
                    :icon="FolderOpened" 
                    @click="saveToKnowledge(message.content)"
                    text
                    circle
                  />
                </el-tooltip>
                <el-tooltip content="复制" placement="top">
                  <el-button 
                    size="small" 
                    :icon="CopyDocument" 
                    @click="copyMessage(message.content)"
                    text
                    circle
                  />
                </el-tooltip>
              </div>
              <!-- 附件显示 -->
              <div v-if="message.attachments && message.attachments.length > 0" class="message-attachments">
                <div
                  v-for="(attachment, idx) in message.attachments"
                  :key="idx"
                  class="attachment-item"
                >
                  <img
                    v-if="attachment.type.startsWith('image/')"
                    :src="`http://localhost:3001${attachment.url}`"
                    :alt="attachment.filename"
                    class="attachment-image"
                    @click="previewImage(`http://localhost:3001${attachment.url}`)"
                  />
                  <a
                    v-else
                    :href="`http://localhost:3001${attachment.url}`"
                    target="_blank"
                    class="attachment-document"
                  >
                    <el-icon :size="24"><Document /></el-icon>
                    <span>{{ attachment.filename }}</span>
                  </a>
                </div>
              </div>
            </div>
          </div>

          <div v-if="isLoading" class="message-item assistant">
            <div class="message-avatar">
              <el-avatar :size="36" :src="require('@/assets/logo.png')" class="ai-avatar-img" />
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
          <div class="input-wrapper">
            <!-- 文件预览区域 -->
            <div v-if="selectedFiles.length > 0" class="file-preview-area">
              <div
                v-for="(fileInfo, index) in selectedFiles"
                :key="index"
                class="file-preview-item"
              >
                <div v-if="fileInfo.type.startsWith('image/')" class="image-preview">
                  <img :src="fileInfo.preview" :alt="fileInfo.name" />
                  <el-icon class="remove-file" @click="removeFile(index)"><Close /></el-icon>
                </div>
                <div v-else class="document-preview">
                  <el-icon :size="32" color="#409eff"><Document /></el-icon>
                  <div class="file-info">
                    <div class="file-name">{{ fileInfo.name }}</div>
                    <div class="file-size">{{ formatFileSize(fileInfo.size) }}</div>
                  </div>
                  <el-icon class="remove-file" @click="removeFile(index)"><Close /></el-icon>
                </div>
              </div>
            </div>

            <el-input
              v-model="inputMessage"
              type="textarea"
              :rows="2"
              placeholder="输入消息... (Enter 发送，Shift+Enter 换行)"
              @keydown="handleKeyDown"
              class="message-input"
            />
            <div class="input-actions">
              <div class="input-tools">
                <el-tooltip content="上传文件或图片" placement="top">
                  <el-button 
                    :icon="Paperclip" 
                    circle 
                    size="small"
                    @click="handleUploadClick"
                  />
                </el-tooltip>
                <input
                  ref="fileInputRef"
                  type="file"
                  accept="image/*,.pdf,.doc,.docx,.txt"
                  multiple
                  style="display: none"
                  @change="handleFileChange"
                />
                <!-- 对话级别知识库选择按钮 -->
                <el-popover
                  v-if="selectedAssistantForTopics"
                  placement="top"
                  :width="300"
                  trigger="click"
                >
                  <template #reference>
                    <el-badge 
                      :value="temporaryKnowledgeBases.length || null" 
                      :hidden="temporaryKnowledgeBases.length === 0"
                      type="primary"
                    >
                      <el-tooltip content="选择知识库" placement="top">
                        <el-button 
                          :icon="FolderOpened" 
                          circle 
                          size="small"
                        />
                      </el-tooltip>
                    </el-badge>
                  </template>
                  <div class="knowledge-popover">
                    <div class="popover-title">选择知识库</div>
                    <el-select
                      v-model="temporaryKnowledgeBases"
                      multiple
                      filterable
                      placeholder="为本次对话选择知识库"
                      style="width: 100%"
                      clearable
                    >
                      <el-option
                        v-for="kb in knowledgeBases"
                        :key="kb._id"
                        :label="kb.name"
                        :value="kb._id"
                      >
                        <span>{{ kb.name }}</span>
                        <span style="float: right; color: #8492a6; font-size: 12px">
                          {{ kb.fileCount }}个文件
                        </span>
                      </el-option>
                    </el-select>
                    <div 
                      v-if="selectedAssistantForTopics.knowledgeBases && selectedAssistantForTopics.knowledgeBases.length > 0" 
                      class="assistant-kb-hint"
                    >
                      <el-icon><Cpu /></el-icon>
                      <span>助手默认: {{ selectedAssistantForTopics.knowledgeBases.length }}个知识库</span>
                    </div>
                  </div>
                </el-popover>
                <!-- 新建对话按钮 -->
                <el-tooltip content="新建对话" placement="top">
                  <el-button 
                    :icon="Plus" 
                    circle 
                    size="small"
                    @click="handleCreateTopicQuick"
                    :disabled="!selectedAssistantForTopics"
                  />
                </el-tooltip>
              </div>
              <el-button type="primary" :icon="Promotion" @click="handleSendMessage" :loading="isLoading">
                发送
              </el-button>
            </div>
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
      <el-form :model="assistantForm" label-width="100px">
        <el-form-item label="助手名称">
          <el-input v-model="assistantForm.name" placeholder="请输入助手名称" />
        </el-form-item>
        <el-form-item label="系统提示词">
          <el-input
            v-model="assistantForm.prompt"
            type="textarea"
            :rows="8"
            placeholder="请输入系统提示词（可选）"
            :readonly="assistantForm.isSystem"
            :disabled="assistantForm.isSystem"
          />
          <div v-if="assistantForm.isSystem" style="color: #909399; font-size: 12px; margin-top: 4px;">
            <el-icon><Lock /></el-icon>
            系统助手的提示词不可修改
          </div>
        </el-form-item>
        <el-form-item label="关联知识库">
          <el-select
            v-model="assistantForm.knowledgeBases"
            multiple
            filterable
            placeholder="选择默认使用的知识库"
            style="width: 100%"
            :disabled="assistantForm.isSystem"
          >
            <el-option
              v-for="kb in knowledgeBases"
              :key="kb._id"
              :label="`${kb.name} (${kb.fileCount}个文件)`"
              :value="kb._id"
            />
          </el-select>
          <div v-if="assistantForm.isSystem" style="color: #909399; font-size: 12px; margin-top: 4px;">
            <el-icon><Lock /></el-icon>
            系统助手的知识库不可修改
          </div>
          <div v-else style="color: #909399; font-size: 12px; margin-top: 4px;">
            使用此助手时将自动检索这些知识库
          </div>
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

    <!-- 保存到知识库对话框 -->
    <el-dialog
      v-model="knowledgeDialogVisible"
      title="保存到知识库"
      width="500px"
    >
      <el-form label-width="100px">
        <el-form-item label="选择知识库">
          <el-select
            v-model="selectedKnowledgeBase"
            placeholder="请选择知识库"
            style="width: 100%"
          >
            <el-option
              v-for="kb in knowledgeBases"
              :key="kb._id"
              :label="kb.name"
              :value="kb._id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="文件名">
          <el-input
            v-model="knowledgeFileName"
            placeholder="请输入文件名"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="knowledgeDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="confirmSaveToKnowledge">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick, watch } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Plus, MoreFilled, ChatDotRound, Cpu, Promotion, Paperclip, Close, Document, FolderOpened, DArrowLeft, DArrowRight, CopyDocument, Lock } from '@element-plus/icons-vue';
import { marked } from 'marked';

// 配置 marked 选项
marked.setOptions({
  breaks: true, // 支持 GitHub 风格的换行
  gfm: true, // 启用 GitHub 风格的 Markdown
  headerIds: false, // 禁用标题 ID
  mangle: false // 禁用邮箱混淆
});

import {
  getAssistants,
  createAssistant,
  updateAssistant,
  deleteAssistant,
  initSystemAssistants
} from '@/api/assistant';
import {
  getTopics,
  createTopic,
  getTopic,
  updateTopic,
  deleteTopic,
  sendMessage,
  clearMessages,
  uploadFile
} from '@/api/chat';
import { getKnowledgeBases, addText } from '@/api/knowledge';
import { addNote } from '@/api/note';

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
const fileInputRef = ref(null);
const selectedFiles = ref([]);
const knowledgeBases = ref([]); // 知识库列表
const temporaryKnowledgeBases = ref([]); // 对话级别选择的知识库

// 标签状态
const activeTab = ref('assistants');

// 侧边栏折叠状态
const sidebarCollapsed = ref(false);

// 切换侧边栏
const toggleSidebar = () => {
  sidebarCollapsed.value = !sidebarCollapsed.value;
};

// 对话框
const assistantDialogVisible = ref(false);
const isEditingAssistant = ref(false);
const assistantForm = ref({ 
  name: '', 
  prompt: '',
  knowledgeBases: []
});
const editingAssistantId = ref(null);

const renameDialogVisible = ref(false);
const renameTitle = ref('');
const renamingTopicId = ref(null);

// 保存到知识库对话框
const knowledgeDialogVisible = ref(false);
const selectedKnowledgeBase = ref('');
const knowledgeFileName = ref('');
const pendingSaveContent = ref('');

onMounted(async () => {
  await loadAssistants();
  await loadKnowledgeBases();
  
  // 初始化系统学科助手
  try {
    await initSystemAssistants(userId.value);
    await loadAssistants(); // 重新加载助手列表
  } catch (error) {
    console.error('初始化系统助手失败:', error);
  }
  
  // 默认选择第一个助手并切换到对话标签
  if (assistants.value.length > 0) {
    await selectAssistantAndSwitchToTopics(assistants.value[0]);
    
    // 如果没有对话，自动创建一个
    if (topics.value.length === 0) {
      await handleCreateTopic();
    } else {
      // 选择第一个对话
      await selectTopic(topics.value[0]);
    }
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
    console.log('加载助手响应:', res);
    if (res.code === 200) {
      assistants.value = res.data;
    }
  } catch (error) {
    console.error('加载助手失败:', error);
    ElMessage.error('加载助手失败');
  }
};

// 加载知识库列表
const loadKnowledgeBases = async () => {
  try {
    const res = await getKnowledgeBases(userId.value);
    console.log('加载知识库响应:', res);
    if (res.code === 200) {
      knowledgeBases.value = res.data;
    }
  } catch (error) {
    console.error('加载知识库失败:', error);
  }
};

// 选择助手并切换到对话标签
const selectAssistantAndSwitchToTopics = async (assistant) => {
  selectedAssistantForTopics.value = assistant;
  currentTopic.value = null;
  messages.value = [];
  temporaryKnowledgeBases.value = []; // 清空对话级别的知识库选择
  await loadTopics(assistant._id);
  activeTab.value = 'topics'; // 切换到对话标签
  
  // 如果没有对话，自动创建一个
  if (topics.value.length === 0) {
    await handleCreateTopic();
  } else {
    // 选择第一个对话
    await selectTopic(topics.value[0]);
  }
};

// 加载话题列表
const loadTopics = async (assistantId) => {
  try {
    const res = await getTopics(assistantId);
    if (res.code === 200) {
      topics.value = res.data;
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
    if (res.code === 200) {
      messages.value = res.data.messages || [];
    }
  } catch (error) {
    console.error('加载消息失败:', error);
  }
};

// 创建助手
const handleCreateAssistant = () => {
  isEditingAssistant.value = false;
  assistantForm.value = { 
    name: '', 
    prompt: '',
    knowledgeBases: [],
    isSystem: false
  };
  assistantDialogVisible.value = true;
};

// 保存助手
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
      prompt: assistant.prompt || '',
      knowledgeBases: assistant.knowledgeBases || [],
      isSystem: assistant.isSystem || false
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
    if (res.code === 200) {
      await loadTopics(selectedAssistantForTopics.value._id);
      await selectTopic(res.data);
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
  if (!inputMessage.value.trim() && selectedFiles.value.length === 0) {
    ElMessage.warning('请输入消息或选择文件');
    return;
  }

  if (!currentTopic.value) {
    ElMessage.warning('请先选择或创建对话');
    return;
  }

  const message = inputMessage.value.trim();
  const attachments = [];
  
  // 上传文件
  if (selectedFiles.value.length > 0) {
    isLoading.value = true;
    try {
      for (const fileInfo of selectedFiles.value) {
        const res = await uploadFile(fileInfo.file);
        if (res.code === 200) {
          attachments.push(res.data);
        }
      }
    } catch (error) {
      console.error('文件上传失败:', error);
      ElMessage.error('文件上传失败');
      isLoading.value = false;
      return;
    }
  }
  
  // 立即显示用户消息（优化用户体验）
  const userMessage = {
    role: 'user',
    content: message,
    attachments: attachments,
    timestamp: new Date()
  };
  messages.value.push(userMessage);
  
  // 清空输入框和文件选择
  inputMessage.value = '';
  selectedFiles.value = [];
  isLoading.value = true;

  try {
    const res = await sendMessage(
      currentTopic.value._id, 
      message, 
      attachments,
      temporaryKnowledgeBases.value
    );
    if (res.code === 200) {
      // 只添加AI回复消息（用户消息已经显示）
      messages.value.push(res.data.assistantMessage);
      
      // 更新话题标题
      if (res.data.topic) {
        currentTopic.value.title = res.data.topic.title;
        await loadTopics(selectedAssistantForTopics.value._id);
      }
    }
  } catch (error) {
    console.error('发送消息失败:', error);
    ElMessage.error('发送失败，请重试');
    // 发送失败，移除已显示的用户消息
    messages.value.pop();
  } finally {
    isLoading.value = false;
  }
};

// 处理键盘事件
const handleKeyDown = (event) => {
  // Enter 发送，Shift+Enter 换行
  if (event.key === 'Enter' && !event.shiftKey) {
    event.preventDefault();
    handleSendMessage();
  }
};

// 处理文件上传点击
const handleUploadClick = () => {
  if (fileInputRef.value) {
    fileInputRef.value.click();
  }
};

// 处理文件选择
const handleFileChange = async (event) => {
  const files = Array.from(event.target.files);
  
  for (const file of files) {
    // 检查文件大小（限制为 10MB）
    if (file.size > 10 * 1024 * 1024) {
      ElMessage.error(`文件 ${file.name} 大小超过 10MB`);
      continue;
    }
    
    // 检查文件类型
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 
                          'application/pdf', 'application/msword', 
                          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                          'text/plain'];
    
    if (!allowedTypes.includes(file.type)) {
      ElMessage.error(`不支持的文件类型: ${file.name}`);
      continue;
    }
    
    // 创建文件预览
    const fileInfo = {
      file,
      name: file.name,
      size: file.size,
      type: file.type,
      preview: null
    };
    
    // 如果是图片，生成预览
    if (file.type.startsWith('image/')) {
      try {
        const preview = await readFileAsDataURL(file);
        fileInfo.preview = preview;
      } catch (error) {
        console.error('读取图片失败:', error);
        ElMessage.error(`读取图片 ${file.name} 失败`);
        continue;
      }
    }
    
    selectedFiles.value.push(fileInfo);
  }
  
  // 清空文件输入
  if (fileInputRef.value) {
    fileInputRef.value.value = '';
  }
};

// 读取文件为 DataURL
const readFileAsDataURL = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target.result);
    reader.onerror = (e) => reject(e);
    reader.readAsDataURL(file);
  });
};

// 移除选中的文件
const removeFile = (index) => {
  selectedFiles.value.splice(index, 1);
};

// 格式化文件大小
const formatFileSize = (bytes) => {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
};

// 工具函数
const renderMarkdown = (content) => {
  return marked(content);
};

const scrollToBottom = () => {
  if (messageListRef.value) {
    messageListRef.value.scrollTop = messageListRef.value.scrollHeight;
  }
};

// 预览图片
const previewImage = (url) => {
  window.open(url, '_blank');
};

// 快速新建对话
const handleCreateTopicQuick = async () => {
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
    if (res.code === 200) {
      await loadTopics(selectedAssistantForTopics.value._id);
      await selectTopic(res.data);
      ElMessage.success('新对话已创建');
    }
  } catch (error) {
    console.error('创建对话失败:', error);
    ElMessage.error('创建失败');
  }
};

// 保存到笔记
const saveToNote = async (content) => {
  try {
    const res = await addNote({
      userId: userId.value,
      noteTitle: '来自 AI 对话',
      noteContent: content,
      noteTags: ['AI对话'],
      isFolder: false
    });
    if (res.code === 200) {
      ElMessage.success('已保存到笔记');
    }
  } catch (error) {
    console.error('保存到笔记失败:', error);
    ElMessage.error('保存失败');
  }
};

// 保存到知识库
const saveToKnowledge = (content) => {
  if (knowledgeBases.value.length === 0) {
    ElMessage.warning('暂无知识库，请先创建知识库');
    return;
  }
  pendingSaveContent.value = content;
  knowledgeFileName.value = `AI对话_${new Date().toLocaleString('zh-CN', { 
    year: 'numeric', 
    month: '2-digit', 
    day: '2-digit', 
    hour: '2-digit', 
    minute: '2-digit' 
  }).replace(/\//g, '-').replace(/:/g, '-')}`;
  knowledgeDialogVisible.value = true;
};

// 确认保存到知识库
const confirmSaveToKnowledge = async () => {
  if (!selectedKnowledgeBase.value) {
    ElMessage.warning('请选择知识库');
    return;
  }
  if (!knowledgeFileName.value) {
    ElMessage.warning('请输入文件名');
    return;
  }

  try {
    const res = await addText(selectedKnowledgeBase.value, {
      title: knowledgeFileName.value,
      content: pendingSaveContent.value
    });
    if (res.code === 200 || res.status === 200) {
      ElMessage.success('已保存到知识库');
      knowledgeDialogVisible.value = false;
      selectedKnowledgeBase.value = '';
      knowledgeFileName.value = '';
      pendingSaveContent.value = '';
    }
  } catch (error) {
    console.error('保存到知识库失败:', error);
    ElMessage.error('保存失败');
  }
};

// 复制消息
const copyMessage = (content) => {
  // 移除 HTML 标签，只保留纯文本
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = content;
  const plainText = tempDiv.textContent || tempDiv.innerText || '';
  
  navigator.clipboard.writeText(plainText).then(() => {
    ElMessage.success('已复制到剪贴板');
  }).catch(() => {
    ElMessage.error('复制失败');
  });
};
</script>

<style scoped>
.ai-chat-container {
  display: block;
  height: 100vh;
  background: #f5f7fa;
  overflow: hidden;
  position: relative;
}

/* 左侧面板 */
.left-panel {
  width: 280px;
  background: #ffffff;
  border-right: 1px solid #e4e7ed;
  display: flex;
  flex-direction: column;
  position: fixed;
  left: 60px;
  top: 0;
  bottom: 0;
  z-index: 100;
  transition: transform 0.3s;
}

.left-panel.collapsed {
  transform: translateX(-280px);
}

.left-panel.collapsed .tab-buttons,
.left-panel.collapsed .tab-content .panel-header .el-button,
.left-panel.collapsed .item-list {
  display: none;
}

.panel-header {
  padding: 16px;
  border-bottom: 1px solid #e4e7ed;
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 56px;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 600;
  color: #333;
}

/* 自定义标签按钮 */
.tab-buttons {
  display: flex;
  padding: 12px;
  gap: 0;
  background: #ffffff;
  border-bottom: 1px solid #e4e7ed;
}

.tab-btn {
  flex: 1;
  padding: 10px 0;
  border: 1px solid #dcdfe6;
  background: #ffffff;
  color: #606266;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s;
  outline: none;
}

.tab-btn:first-child {
  border-radius: 4px 0 0 4px;
  border-right: none;
}

.tab-btn:last-child {
  border-radius: 0 4px 4px 0;
}

.tab-btn:hover {
  color: #0969da;
  background: #f5f7fa;
}

.tab-btn.active {
  background: #0969da;
  color: #ffffff;
  border-color: #0969da;
}

.tab-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.panel-header {
  padding: 16px;
  border-bottom: 1px solid #e4e7ed;
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 56px;
  flex-shrink: 0;
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

.more-icon {
  color: #999;
  cursor: pointer;
  padding: 4px;
  font-size: 20px;
  transition: all 0.3s;
}

.more-icon:hover {
  color: #0969da;
  transform: scale(1.1);
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
  position: fixed;
  left: 340px;
  right: 0;
  top: 0;
  bottom: 0;
  display: flex;
  flex-direction: column;
  background: #ffffff;
  transition: left 0.3s;
}

.chat-panel.expanded {
  left: 60px;
}

.editor-header {
  display: flex;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid #e4e7ed;
  background: #ffffff;
  min-height: 56px;
  gap: 12px;
  flex-shrink: 0;
}

.file-name {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.header-spacer {
  flex: 1;
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
  gap: 16px;
  padding: 12px 0;
  margin-bottom: 4px;
  /* 移除背景色和边框 */
}

.message-item.user {
  /* 用户消息样式 */
}

.message-item.assistant {
  /* AI 消息样式 */
}

.message-avatar {
  flex-shrink: 0;
}

/* AI Logo 头像样式 */
.ai-avatar-img {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
}

.ai-avatar-img:hover {
  transform: scale(1.05);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.message-content {
  flex: 1;
  min-width: 0;
}

.message-text {
  line-height: 1.8;
  color: #303133;
  font-size: 13px;
  word-wrap: break-word;
}

.message-text :deep(p) {
  margin: 0 0 12px 0;
}

.message-text :deep(p:last-child) {
  margin-bottom: 0;
}

.message-text :deep(h1),
.message-text :deep(h2),
.message-text :deep(h3),
.message-text :deep(h4),
.message-text :deep(h5),
.message-text :deep(h6) {
  margin: 16px 0 12px 0;
  font-weight: 600;
  line-height: 1.4;
}

.message-text :deep(h1) { font-size: 20px; }
.message-text :deep(h2) { font-size: 18px; }
.message-text :deep(h3) { font-size: 16px; }
.message-text :deep(h4) { font-size: 14px; }
.message-text :deep(h5) { font-size: 13px; }
.message-text :deep(h6) { font-size: 12px; }

.message-text :deep(ul),
.message-text :deep(ol) {
  margin: 12px 0;
  padding-left: 24px;
}

.message-text :deep(li) {
  margin: 4px 0;
}

.message-text :deep(blockquote) {
  margin: 12px 0;
  padding: 8px 16px;
  border-left: 4px solid #0969da;
  background: #f6f8fa;
  color: #666;
}

.message-text :deep(table) {
  border-collapse: collapse;
  margin: 12px 0;
  width: 100%;
}

.message-text :deep(table th),
.message-text :deep(table td) {
  border: 1px solid #ddd;
  padding: 8px 12px;
  text-align: left;
}

.message-text :deep(table th) {
  background: #f6f8fa;
  font-weight: 600;
}

.message-text :deep(a) {
  color: #0969da;
  text-decoration: none;
}

.message-text :deep(a:hover) {
  text-decoration: underline;
}

.message-text :deep(hr) {
  border: none;
  border-top: 1px solid #e4e7ed;
  margin: 16px 0;
}

.message-text :deep(img) {
  max-width: 100%;
  border-radius: 4px;
  margin: 12px 0;
}

.message-text :deep(pre) {
  background: #f6f8fa;
  border-radius: 6px;
  padding: 16px;
  overflow-x: auto;
  margin: 12px 0;
  border: 1px solid #e4e7ed;
}

.message-text :deep(code) {
  background: #f6f8fa;
  padding: 2px 6px;
  border-radius: 3px;
  font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
  font-size: 12px;
  color: #e83e8c;
}

.message-text :deep(pre code) {
  background: transparent;
  padding: 0;
  color: #333;
}

/* AI 消息快捷操作按钮 */
.message-actions {
  display: flex;
  gap: 4px;
  margin-top: 12px;
  opacity: 0.6;
  transition: opacity 0.3s;
}

.message-item:hover .message-actions {
  opacity: 1;
}

.message-actions .el-button {
  color: #909399;
  font-size: 16px;
  width: 28px;
  height: 28px;
  padding: 0;
}

.message-actions .el-button:hover {
  color: #0969da;
  background: #f5f7fa;
}

.message-attachments {
  flex: 1;
  max-width: 80%;
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
  padding: 16px 20px;
  background: #fafafa;
}

.input-wrapper {
  background: #ffffff;
  border: 1px solid #dcdfe6;
  border-radius: 8px;
  padding: 10px 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.message-input :deep(.el-textarea__inner) {
  border: none;
  box-shadow: none;
  padding: 0;
  resize: none;
  font-size: 13px;
  line-height: 1.6;
}

.message-input :deep(.el-textarea__inner):focus {
  box-shadow: none;
}

.input-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  margin-top: 8px;
  padding-top: 8px;
  border-top: 1px solid #f0f0f0;
}

.input-tools {
  display: flex;
  gap: 8px;
  align-items: center;
  flex: 1;
}

.knowledge-popover {
  padding: 4px 0;
}

.popover-title {
  font-size: 14px;
  font-weight: 500;
  color: #333;
  margin-bottom: 12px;
  padding: 0 4px;
}

.assistant-kb-hint {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-top: 8px;
  padding: 8px 4px 0;
  border-top: 1px solid #f0f0f0;
  font-size: 12px;
  color: #909399;
}

.assistant-kb-hint .el-icon {
  font-size: 14px;
}

.file-preview-area {
  display: flex;
  gap: 12px;
  margin-bottom: 12px;
  flex-wrap: wrap;
}

.file-preview-item {
  position: relative;
}

.image-preview {
  position: relative;
  width: 100px;
  height: 100px;
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid #e4e7ed;
}

.image-preview img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.document-preview {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  background: #f5f7fa;
  position: relative;
}

.file-info {
  flex: 1;
  min-width: 0;
}

.file-name {
  font-size: 14px;
  color: #333;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 150px;
}

.file-size {
  font-size: 12px;
  color: #999;
  margin-top: 2px;
}

.remove-file {
  position: absolute;
  top: 4px;
  right: 4px;
  background: rgba(0, 0, 0, 0.5);
  color: white;
  border-radius: 50%;
  padding: 2px;
  cursor: pointer;
  font-size: 16px;
}

.remove-file:hover {
  background: rgba(0, 0, 0, 0.7);
}

.message-attachments {
  margin-top: 8px;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.attachment-item {
  max-width: 200px;
}

.attachment-image {
  max-width: 200px;
  max-height: 200px;
  border-radius: 8px;
  cursor: pointer;
  transition: transform 0.2s;
}

.attachment-image:hover {
  transform: scale(1.05);
}

.attachment-document {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  background: #f5f7fa;
  text-decoration: none;
  color: #409eff;
  transition: all 0.3s;
}

.attachment-document:hover {
  background: #e8f4ff;
  border-color: #409eff;
}

.attachment-document span {
  font-size: 14px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
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
