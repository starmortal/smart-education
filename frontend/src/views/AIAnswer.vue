<!-- AIAnswer.vue :: 豆包风格布局 - 历史记录侧边栏 + 对话区 -->
<template>
  <!-- 主容器 -->
  <div class="ai-container">
    <!-- 左侧：历史记录侧边栏 -->
    <div class="sidebar">
      <div class="history-list" v-loading="historyLoading">
        <!-- 新对话按钮作为第一项 -->
        <div 
          :class="['history-item', 'new-chat-item', { active: !currentHistoryId }]"
          @click="startNewChat"
        >
          <div class="history-content">
            <el-icon class="new-chat-icon"><Plus /></el-icon>
            <div class="history-title">新对话</div>
          </div>
        </div>

        <!-- 历史记录列表 -->
        <div 
          v-for="item in historyList" 
          :key="item.id"
          :class="['history-item', { active: currentHistoryId === item.id }]"
          @click="loadHistoryChat(item.id)"
        >
          <div class="history-content">
            <div class="history-title">{{ item.title }}</div>
          </div>
          <el-button
            size="small"
            type="danger"
            :icon="Delete"
            circle
            @click.stop="deleteHistory(item.id)"
            class="delete-btn"
          />
        </div>
        
        <el-empty 
          v-if="historyList.length === 0" 
          description="暂无历史记录" 
          :image-size="60"
          class="empty-history"
        />
      </div>
    </div>

    <!-- 右侧：对话区 -->
    <div class="chat-area">
      <!-- 消息列表 -->
      <div class="chat-list" ref="chatList">
        <div v-if="messages.length === 0" class="empty-chat">
          <h1 class="welcome-text">你好，我是你的AI学习助手</h1>
          
          <!-- 快捷问题 -->
          <div class="quick-questions">
            <div 
              v-for="(q, index) in quickQuestions" 
              :key="index"
              class="quick-question-item"
            >
              {{ q }}
            </div>
          </div>
        </div>

        <div
          v-for="(msg, i) in messages"
          :key="i"
          :class="['msg', msg.isMine ? 'mine' : 'ai']"
        >
          <div class="bubble">
            <!-- 文件预览 -->
            <div v-if="msg.files && msg.files.length > 0" class="msg-files">
              <div v-for="(file, idx) in msg.files" :key="idx" class="msg-file-item">
                <img v-if="file.isImage" :src="file.preview" class="msg-file-img" />
                <div v-else class="msg-file-doc">
                  <el-icon><Document /></el-icon>
                  <span>{{ file.name }}</span>
                </div>
              </div>
            </div>
            
            <!-- 消息文本 -->
            <div class="msg-text">
              {{ msg.text }}
              <span v-if="msg.streaming" class="streaming-cursor">|</span>
            </div>
            
            <!-- AI回答添加保存到笔记按钮 -->
            <div v-if="!msg.isMine && msg.question" class="msg-actions">
              <el-button 
                size="small" 
                type="primary" 
                :icon="Document"
                @click="saveToNote(msg)"
                plain
              >
                保存到笔记
              </el-button>
            </div>
          </div>
        </div>
      </div>

      <!-- 输入栏容器 -->
      <div class="input-bar-container">
        <div class="input-bar">
          <div class="input-wrapper">
            <div class="input-tools">
              <el-upload
                ref="uploadRef"
                :auto-upload="false"
                :show-file-list="false"
                :on-change="handleFileChange"
                accept="image/*,.pdf,.doc,.docx,.txt"
                multiple
              >
                <el-button link class="tool-btn" title="上传文件">
                  <el-icon size="20"><Paperclip /></el-icon>
                </el-button>
              </el-upload>
              
              <el-upload
                ref="imageUploadRef"
                :auto-upload="false"
                :show-file-list="false"
                :on-change="handleImageChange"
                accept="image/*"
                multiple
              >
                <el-button link class="tool-btn" title="上传图片">
                  <el-icon size="20"><Picture /></el-icon>
                </el-button>
              </el-upload>
            </div>
            
            <el-input
              v-model="inputText"
              type="textarea"
              :rows="1"
              :autosize="{ minRows: 1, maxRows: 4 }"
              placeholder="输入问题，按 Enter 快速发送，Shift + Enter 换行"
              class="chat-input"
              @keydown.enter.exact.prevent="sendText"
              @paste="handlePaste"
            />
            
            <el-button 
              type="primary" 
              :class="['send-btn', { active: inputText.trim() || uploadedFiles.length > 0 }]"
              @click="sendText"
              :disabled="!inputText.trim() && uploadedFiles.length === 0"
            >
              <el-icon><Promotion /></el-icon>
            </el-button>
          </div>
          
          <!-- 已上传文件预览 -->
          <div v-if="uploadedFiles.length > 0" class="uploaded-files">
            <div 
              v-for="(file, index) in uploadedFiles" 
              :key="index"
              class="file-item"
            >
              <img v-if="file.isImage" :src="file.preview" class="file-preview-img" />
              <div v-else class="file-preview-doc">
                <el-icon size="24"><Document /></el-icon>
                <span class="file-name">{{ file.name }}</span>
              </div>
              <el-button 
                circle 
                size="small" 
                class="remove-file-btn"
                @click="removeFile(index)"
              >
                <el-icon><Close /></el-icon>
              </el-button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- 保存到笔记对话框 -->
  <el-dialog
    v-model="showNoteDialog"
    title="保存到笔记"
    width="500px"
    :close-on-click-modal="false"
  >
    <el-form label-width="80px">
      <el-form-item label="笔记标题">
        <el-input 
          v-model="noteForm.title" 
          placeholder="请输入笔记标题"
          maxlength="100"
          show-word-limit
        />
      </el-form-item>
      
      <el-form-item label="笔记分类">
        <el-select v-model="noteForm.category" style="width: 100%">
          <el-option label="📝 习题解析" value="exercise_analysis" />
          <el-option label="📚 知识总结" value="knowledge_summary" />
          <el-option label="✏️ 课堂笔记" value="class_note" />
          <el-option label="💡 复习心得" value="review_experience" />
        </el-select>
      </el-form-item>
      
      <el-form-item label="笔记标签">
        <div class="tag-selector">
          <div class="tag-options">
            <el-checkbox-group v-model="noteForm.tags" :max="2">
              <!-- 固定标签放在前面 -->
              <el-checkbox label="重点" value="key_point" />
              <el-checkbox label="难点" value="difficult_point" />
              <el-checkbox label="AI解答" value="ai_answer" />
              <!-- 动态科目标签 -->
              <el-checkbox 
                v-for="subject in userSubjects" 
                :key="subject"
                :label="subject" 
                :value="getSubjectCode(subject)" 
              />
            </el-checkbox-group>
          </div>
          <div class="tag-limit-hint">最多选择2个标签</div>
          <div v-if="!hasUserSubjects(userSubjects)" style="margin-top: 8px; font-size: 12px; color: #f56c6c;">
            请先在个人中心设置学习科目
          </div>
        </div>
      </el-form-item>
      
      <el-form-item label="内容预览">
        <div class="note-preview">
          <div class="preview-section">
            <div class="preview-label">问题：</div>
            <div class="preview-text">{{ currentSaveMsg?.question }}</div>
          </div>
          <div class="preview-section">
            <div class="preview-label">解答：</div>
            <div class="preview-text">{{ currentSaveMsg?.answer }}</div>
          </div>
        </div>
      </el-form-item>
    </el-form>
    
    <template #footer>
      <el-button @click="showNoteDialog = false">取消</el-button>
      <el-button 
        type="primary" 
        @click="confirmSaveNote"
        :loading="noteDialogLoading"
        :icon="Document"
      >
        保存
      </el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, nextTick, onMounted, reactive } from "vue";
import { useRouter } from "vue-router";
import { ElMessage, ElMessageBox } from "element-plus";
import { 
  Delete, 
  Promotion,
  ChatDotRound,
  Document,
  Paperclip,
  Picture,
  Close,
  Plus
} from "@element-plus/icons-vue";
import axios from "axios";
// 【新增】引入用户科目工具
import { getUserSubjects, hasUserSubjects, getSubjectCode } from "@/utils/userSubjects";

const router = useRouter();

// 【新增】用户科目
const userSubjects = ref([]);

// 配置axios
const apiClient = axios.create({
  baseURL: "http://localhost:3001/api",
  timeout: 30000,
});

apiClient.interceptors.request.use((config) => {
  const userId = localStorage.getItem("edu-user-id");
  if (userId) {
    config.headers["x-user-id"] = userId;
  }
  
  const token = localStorage.getItem("edu-token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  
  return config;
}, (error) => {
  console.error("请求错误：", error);
  return Promise.reject(error);
});

/* ========= 侧边栏控制 ========= */
const historyList = ref([]);
const historyLoading = ref(false);
const currentHistoryId = ref(null); // 当前会话ID
const currentSessionId = ref(null); // 当前会话ID（用于追加消息）

// 加载历史记录列表
async function loadHistory(force = false) {
  if (historyLoading.value && !force) return;

  historyLoading.value = true;
  try {
    const res = await apiClient.get("/ai/history", {
      params: { page: 1, limit: 50 },
    });
    historyList.value = res.data.list || [];
  } catch (error) {
    console.error("加载历史记录失败：", error);
  } finally {
    historyLoading.value = false;
  }
}

// 加载历史对话
async function loadHistoryChat(id) {
  try {
    currentHistoryId.value = id;
    currentSessionId.value = id; // 设置当前会话ID
    const res = await apiClient.get(`/ai/history/${id}`);
    const detail = res.data;
    
    // 将多轮对话转换为消息列表
    messages.value = [];
    detail.messages.forEach(msg => {
      messages.value.push({ text: msg.question, isMine: true });
      messages.value.push({ 
        text: msg.answer, 
        isMine: false,
        question: msg.question,
        answer: msg.answer
      });
    });
    
    scrollToBottom();
  } catch (error) {
    console.error("加载历史详情失败：", error);
    ElMessage.error("加载历史详情失败");
  }
}

// 开始新对话
const startNewChat = () => {
  currentHistoryId.value = null;
  currentSessionId.value = null; // 清空会话ID
  messages.value = [];
  inputText.value = "";
}

// 删除历史记录
async function deleteHistory(id) {
  try {
    await ElMessageBox.confirm("确定删除这条历史记录吗？", "提示", {
      confirmButtonText: "确定",
      cancelButtonText: "取消",
      type: "warning",
    });
    
    await apiClient.delete(`/ai/history/${id}`);
    historyList.value = historyList.value.filter(item => item.id !== id);
    
    // 如果删除的是当前对话，清空消息
    if (currentHistoryId.value === id) {
      startNewChat();
    }
    
    ElMessage.success("删除成功");
  } catch (error) {
    if (error !== "cancel") {
      console.error("删除历史记录失败：", error);
      ElMessage.error("删除失败");
    }
  }
}

// 已移除 addHistoryItem 函数，改用 loadHistory 刷新列表

/* ========= 对话功能 ========= */
const messages = ref([]);
const inputText = ref("");
const chatList = ref();
const uploadedFiles = ref([]);
const uploadRef = ref();
const imageUploadRef = ref();

// 快捷问题列表（仅展示）
const quickQuestions = [
  "如何提高数学成绩？",
  "英语语法有哪些重点？",
  "物理公式怎么记忆？",
  "化学方程式配平技巧",
  "历史事件如何梳理？",
  "生物知识点总结方法",
  "如何制定学习计划？",
  "考试前如何复习？",
  "如何提高学习效率？"
];

const scrollToBottom = () => {
  nextTick(() => {
    if (chatList.value) {
      chatList.value.scrollTop = chatList.value.scrollHeight;
    }
  });
}

// 处理文件上传
const handleFileChange = (file) => {
  const maxSize = 10 * 1024 * 1024; // 10MB
  if (file.size > maxSize) {
    ElMessage.warning('文件大小不能超过10MB');
    return;
  }
  
  const reader = new FileReader();
  reader.onload = (e) => {
    uploadedFiles.value.push({
      name: file.name,
      file: file.raw,
      isImage: false,
      preview: null
    });
  };
  reader.readAsDataURL(file.raw);
}

// 处理图片上传
const handleImageChange = (file) => {
  const maxSize = 5 * 1024 * 1024; // 5MB
  if (file.size > maxSize) {
    ElMessage.warning('图片大小不能超过5MB');
    return;
  }
  
  const reader = new FileReader();
  reader.onload = (e) => {
    uploadedFiles.value.push({
      name: file.name,
      file: file.raw,
      isImage: true,
      preview: e.target.result
    });
  };
  reader.readAsDataURL(file.raw);
}

// 移除文件
const removeFile = (index) => {
  uploadedFiles.value.splice(index, 1);
}

// 处理粘贴事件（支持粘贴图片）
const handlePaste = (event) => {
  const items = event.clipboardData?.items;
  if (!items) return;

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    
    // 检查是否为图片
    if (item.type.indexOf('image') !== -1) {
      event.preventDefault(); // 阻止默认粘贴行为
      
      const file = item.getAsFile();
      if (!file) continue;
      
      const maxSize = 5 * 1024 * 1024; // 5MB
      if (file.size > maxSize) {
        ElMessage.warning('图片大小不能超过5MB');
        continue;
      }
      
      // 读取图片并添加到上传列表
      const reader = new FileReader();
      reader.onload = (e) => {
        uploadedFiles.value.push({
          name: file.name || `粘贴图片-${Date.now()}.png`,
          file: file,
          isImage: true,
          preview: e.target.result
        });
        ElMessage.success('图片已添加');
      };
      reader.readAsDataURL(file);
    }
  }
}

const sendText = async () => {
  if (!inputText.value.trim() && uploadedFiles.value.length === 0) return;

  const question = inputText.value || '请分析这些文件';
  const hasFiles = uploadedFiles.value.length > 0;
  
  // 显示用户消息
  const userMessage = {
    text: question,
    isMine: true,
    files: hasFiles ? [...uploadedFiles.value] : null
  };
  messages.value.push(userMessage);
  
  inputText.value = "";
  const filesToSend = [...uploadedFiles.value];
  uploadedFiles.value = [];
  scrollToBottom();

  // 添加一个空的AI消息用于流式更新
  const aiMessageIndex = messages.value.length;
  messages.value.push({ 
    text: '', 
    isMine: false,
    question: question,
    answer: '',
    streaming: true
  });
  
  try {
    let fullAnswer = '';
    let receivedSessionId = null;

    if (hasFiles) {
      // 如果有文件，使用 FormData
      const formData = new FormData();
      formData.append('question', question);
      if (currentSessionId.value) {
        formData.append('sessionId', currentSessionId.value);
      }
      
      filesToSend.forEach((fileObj) => {
        formData.append('files', fileObj.file);
      });
      
      // 使用 fetch 进行流式请求
      const response = await fetch('http://localhost:3001/api/ai/text-answer-stream', {
        method: 'POST',
        headers: {
          'x-user-id': localStorage.getItem('edu-user-id'),
          'Authorization': `Bearer ${localStorage.getItem('edu-token')}`
        },
        body: formData
      });

      if (!response.ok) {
        throw new Error('请求失败');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              
              if (data.error) {
                throw new Error(data.error);
              }
              
              if (data.content) {
                fullAnswer += data.content;
                messages.value[aiMessageIndex].text = fullAnswer;
                messages.value[aiMessageIndex].answer = fullAnswer;
                scrollToBottom();
              }
              
              if (data.sessionId) {
                receivedSessionId = data.sessionId;
              }
            } catch (e) {
              // 忽略JSON解析错误
            }
          }
        }
      }
    } else {
      // 纯文本提问
      const response = await fetch('http://localhost:3001/api/ai/text-answer-stream', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': localStorage.getItem('edu-user-id'),
          'Authorization': `Bearer ${localStorage.getItem('edu-token')}`
        },
        body: JSON.stringify({
          question,
          sessionId: currentSessionId.value
        })
      });

      if (!response.ok) {
        throw new Error('请求失败');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              
              if (data.error) {
                throw new Error(data.error);
              }
              
              if (data.content) {
                fullAnswer += data.content;
                messages.value[aiMessageIndex].text = fullAnswer;
                messages.value[aiMessageIndex].answer = fullAnswer;
                scrollToBottom();
              }
              
              if (data.sessionId) {
                receivedSessionId = data.sessionId;
              }
            } catch (e) {
              // 忽略JSON解析错误
            }
          }
        }
      }
    }

    // 标记流式输出完成
    messages.value[aiMessageIndex].streaming = false;

    // 更新当前会话ID
    if (receivedSessionId) {
      currentSessionId.value = receivedSessionId;
      
      // 如果是新会话（第一次提问），刷新历史记录列表
      if (messages.value.filter(m => m.isMine).length === 1) {
        setTimeout(() => {
          loadHistory(true);
        }, 300);
      }
    }

    // 如果没有收到任何内容，显示默认消息
    if (!fullAnswer) {
      messages.value[aiMessageIndex].text = "AI 暂时没有给出答案，可以换个问法或者稍后再试一次~";
      messages.value[aiMessageIndex].answer = messages.value[aiMessageIndex].text;
    }
  } catch (error) {
    console.error("文字答题接口错误：", error);
    ElMessage.error(error.message || "AI 答题失败");
    
    // 更新AI消息为错误提示
    if (messages.value[aiMessageIndex]) {
      messages.value[aiMessageIndex].text = "抱歉，AI 暂时无法回答这个问题。";
      messages.value[aiMessageIndex].answer = messages.value[aiMessageIndex].text;
      messages.value[aiMessageIndex].streaming = false;
    }
  } finally {
    scrollToBottom();
  }
}

/* ========= 保存到笔记 ========= */
const showNoteDialog = ref(false);
const noteDialogLoading = ref(false);
const currentSaveMsg = ref(null);
const noteForm = reactive({
  title: '',
  category: 'exercise_analysis',
  tags: ['ai_answer']
});

async function saveToNote(msg) {
  currentSaveMsg.value = msg;
  noteForm.title = msg.question.substring(0, 50);
  noteForm.category = 'exercise_analysis';
  noteForm.tags = ['ai_answer']; // 重置标签，默认选中AI解答
  showNoteDialog.value = true;
}

async function confirmSaveNote() {
  if (!noteForm.title.trim()) {
    ElMessage.warning('请输入笔记标题');
    return;
  }

  if (!noteForm.tags || noteForm.tags.length === 0) {
    ElMessage.warning('请至少选择一个标签');
    return;
  }

  noteDialogLoading.value = true;
  
  try {
    const userId = localStorage.getItem('edu-user-id');
    const noteContent = `问题：\n${currentSaveMsg.value.question}\n\n解答：\n${currentSaveMsg.value.answer}`;
    
    await apiClient.post('/note/add', {
      userId,
      noteTitle: noteForm.title,
      noteCategory: noteForm.category,
      noteTag: noteForm.tags,
      noteContent,
    });
    
    ElMessage.success('已保存到笔记！');
    showNoteDialog.value = false;
  } catch (error) {
    console.error('保存笔记失败：', error);
    ElMessage.error(error.response?.data?.message || '保存失败，请重试');
  } finally {
    noteDialogLoading.value = false;
  }
}

onMounted(async () => {
  // 确保默认选中新对话
  currentHistoryId.value = null;
  currentSessionId.value = null;
  messages.value = [];
  inputText.value = "";
  
  // 【新增】加载用户科目
  userSubjects.value = await getUserSubjects();
  
  loadHistory(true);
});
</script>

<style scoped>
/* 主容器 */
.ai-container {
  display: flex;
  height: calc(100vh - 60px);
  background: #f5f7fa;
  position: relative;
}

/* 左侧边栏 */
.sidebar {
  width: 280px;
  background: #f5f5f7;
  border-right: 1px solid #e0e0e0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.history-list {
  flex: 1;
  overflow-y: auto;
  padding: 12px 8px;
}

/* 自定义滚动条样式 */
.history-list::-webkit-scrollbar {
  width: 6px;
}

.history-list::-webkit-scrollbar-track {
  background: transparent;
}

.history-list::-webkit-scrollbar-thumb {
  background: #d0d0d0;
  border-radius: 3px;
}

.history-list::-webkit-scrollbar-thumb:hover {
  background: #b0b0b0;
}

.chat-list::-webkit-scrollbar {
  width: 6px;
}

.chat-list::-webkit-scrollbar-track {
  background: transparent;
}

.chat-list::-webkit-scrollbar-thumb {
  background: #d0d0d0;
  border-radius: 3px;
}

.chat-list::-webkit-scrollbar-thumb:hover {
  background: #b0b0b0;
}

.history-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px;
  margin-bottom: 4px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  background: transparent;
}

.history-item:hover {
  background: #e8e8ea;
}

.history-item.active {
  background: #ffffff;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  border: 2px solid #0969da;
}

/* 新对话按钮样式 */
.new-chat-item {
  margin-bottom: 8px;
  border-bottom: 1px solid #e0e0e0;
  padding-bottom: 12px;
}

.new-chat-item .history-content {
  display: flex;
  align-items: center;
  gap: 8px;
}

.new-chat-icon {
  font-size: 16px;
  color: #0969da;
}

.new-chat-item:hover .new-chat-icon {
  color: #0550ae;
}

.history-content {
  flex: 1;
  overflow: hidden;
  margin-right: 8px;
}

.history-title {
  font-size: 14px;
  color: #333;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.empty-history {
  margin-top: 20px;
}

.delete-btn {
  opacity: 0;
  transition: opacity 0.3s;
}

.history-item:hover .delete-btn {
  opacity: 1;
}

/* 右侧对话区 */
.chat-area {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: #ffffff;
  border-radius: 0;
  overflow: hidden;
}

.chat-list {
  flex: 1;
  padding: 30px;
  overflow-y: auto;
  scroll-behavior: smooth;
  background: #ffffff;
}

.empty-chat {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #999;
  padding: 40px 20px;
}

.welcome-text {
  margin: 0 0 40px 0;
  font-size: 32px;
  font-weight: 700;
  color: #1a1a1a;
  letter-spacing: 0.5px;
}

/* 快捷问题 */
.quick-questions {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  max-width: 900px;
  margin: 0 auto;
}

.quick-question-item {
  padding: 12px 16px;
  background: #f5f7fa;
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  font-size: 14px;
  color: #333;
  text-align: center;
}

.msg {
  display: flex;
  margin-bottom: 24px;
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.msg.mine {
  justify-content: flex-end;
}

.msg.ai {
  justify-content: flex-start;
}

.bubble {
  max-width: 70%;
  padding: 14px 18px;
  border-radius: 16px;
  font-size: 15px;
  line-height: 1.7;
  word-break: break-all;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  transition: all 0.3s ease;
}

.bubble:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
}

.msg.mine .bubble {
  background: #0969da;
  color: #ffffff;
  border-bottom-right-radius: 4px;
}

.msg.ai .bubble {
  background: #f5f5f7;
  color: #333;
  border: 1px solid #e0e0e0;
  border-bottom-left-radius: 4px;
}

.msg-actions {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px dashed #d3d3d3;
  display: flex;
  justify-content: flex-end;
}

.msg-actions .el-button {
  font-size: 13px;
  border-radius: 8px;
}

/* 输入栏容器 */
.input-bar-container {
  display: flex;
  justify-content: center;
  padding: 24px 30px;
  background: #ffffff;
}

/* 输入栏 */
.input-bar {
  width: 100%;
  max-width: 900px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.input-wrapper {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  background: #f5f7fa;
  border-radius: 16px;
  border: 2px solid transparent;
  transition: all 0.3s ease;
}

.input-wrapper:focus-within {
  border-color: #0969da;
  background: #ffffff;
  box-shadow: 0 2px 12px rgba(9, 105, 218, 0.15);
}

.input-tools {
  display: flex;
  gap: 4px;
  align-items: center;
}

.tool-btn {
  color: #666;
  padding: 4px;
  transition: all 0.2s;
}

.tool-btn:hover {
  color: #0969da;
  background: rgba(9, 105, 218, 0.1);
  border-radius: 6px;
}

.chat-input {
  flex: 1;
}

.chat-input :deep(.el-textarea__inner) {
  border: none;
  background: transparent;
  box-shadow: none;
  padding: 0;
  font-size: 15px;
  line-height: 1.6;
  resize: none;
}

.chat-input :deep(.el-textarea__inner:focus) {
  box-shadow: none;
}

.chat-input :deep(.el-textarea__inner::placeholder) {
  color: #999;
}

.send-btn {
  height: 36px;
  width: 36px;
  border-radius: 8px;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #d3d3d3;
  border: none;
  transition: all 0.2s ease;
  flex-shrink: 0;
}

.send-btn.active {
  background: #0969da;
}

.send-btn.active:hover:not(:disabled) {
  background: #0550ae;
  transform: scale(1.05);
}

.send-btn:disabled {
  background: #d3d3d3;
  cursor: not-allowed;
}

/* 已上传文件预览 */
.uploaded-files {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  padding: 8px 0 0 0;
}

.file-item {
  position: relative;
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid #e4e7ed;
  background: #ffffff;
}

.file-preview-img {
  width: 80px;
  height: 80px;
  object-fit: cover;
  display: block;
}

.file-preview-doc {
  width: 120px;
  height: 80px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  padding: 8px;
  background: #f5f7fa;
}

.file-preview-doc .file-name {
  font-size: 12px;
  color: #666;
  text-align: center;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  width: 100%;
}

.remove-file-btn {
  position: absolute;
  top: 4px;
  right: 4px;
  width: 20px;
  height: 20px;
  padding: 0;
  background: rgba(0, 0, 0, 0.6);
  border: none;
  color: #ffffff;
}

.remove-file-btn:hover {
  background: rgba(0, 0, 0, 0.8);
}

/* 消息中的文件 */
.msg-files {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  margin-bottom: 8px;
}

.msg-file-item {
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.3);
}

.msg-file-img {
  width: 120px;
  height: 120px;
  object-fit: cover;
  display: block;
}

.msg-file-doc {
  width: 100px;
  height: 80px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  padding: 8px;
  background: rgba(255, 255, 255, 0.1);
  font-size: 12px;
}

.msg-text {
  white-space: pre-wrap;
  word-break: break-word;
}

/* 流式输出光标动画 */
.streaming-cursor {
  display: inline-block;
  margin-left: 2px;
  animation: blink 1s infinite;
  font-weight: bold;
}

@keyframes blink {
  0%, 50% {
    opacity: 1;
  }
  51%, 100% {
    opacity: 0;
  }
}

/* 保存笔记对话框 */
.note-preview {
  max-height: 300px;
  overflow-y: auto;
  padding: 16px;
  background: #f5f7fa;
  border-radius: 8px;
  border: 1px solid #e4e7ed;
}

.preview-section {
  margin-bottom: 16px;
}

.preview-section:last-child {
  margin-bottom: 0;
}

.preview-label {
  font-size: 14px;
  font-weight: 600;
  color: #0969da;
  margin-bottom: 8px;
}

.preview-text {
  font-size: 14px;
  color: #333;
  line-height: 1.6;
  white-space: pre-wrap;
  word-break: break-all;
}

/* 响应式 */
@media (max-width: 768px) {
  .sidebar {
    width: 240px;
  }
  
  .quick-questions {
    grid-template-columns: 1fr;
  }
  
  .input-bar {
    max-width: 100%;
  }
}

/* 标签选择器样式 */
.tag-selector {
  width: 100%;
}

.tag-options {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 8px;
}

.tag-limit-hint {
  font-size: 12px;
  color: #909399;
  margin-top: 4px;
}

.note-preview {
  background: #f8f9fa;
  border-radius: 8px;
  padding: 16px;
  border: 1px solid #e4e7ed;
  max-height: 300px;
  overflow-y: auto;
}

.preview-section {
  margin-bottom: 16px;
}

.preview-section:last-child {
  margin-bottom: 0;
}

.preview-label {
  font-weight: 600;
  color: #2c3e50;
  margin-bottom: 8px;
}

.preview-text {
  color: #666;
  line-height: 1.6;
  white-space: pre-wrap;
}
</style>
