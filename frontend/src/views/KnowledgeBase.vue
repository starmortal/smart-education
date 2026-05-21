<template>
  <div class="knowledge-base-container">
    <!-- 左侧知识库列表 -->
    <div class="left-panel">
      <div class="panel-header">
        <el-button type="primary" :icon="Plus" @click="handleCreateKnowledge" style="width: 100%;">
          新建知识库
        </el-button>
      </div>

      <div class="knowledge-list">
        <div
          v-for="kb in knowledgeBases"
          :key="kb._id"
          :class="['knowledge-item', { active: currentKnowledge?._id === kb._id }]"
          @click="selectKnowledge(kb)"
        >
          <div class="item-info">
            <div class="item-name">{{ kb.name }}</div>
            <div class="item-stats">
              <span>{{ kb.fileCount }} 文件</span>
              <span>{{ kb.vectorCount }} 向量</span>
            </div>
          </div>
          <el-dropdown trigger="click" @command="(cmd) => handleKnowledgeCommand(cmd, kb)">
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

        <div v-if="knowledgeBases.length === 0" class="empty-state">
          <el-icon :size="48" color="#e4e7ed"><FolderOpened /></el-icon>
          <p>还没有知识库</p>
          <el-button type="primary" size="small" @click="handleCreateKnowledge">
            创建知识库
          </el-button>
        </div>
      </div>
    </div>

    <!-- 右侧内容区域 -->
    <div class="content-panel">
      <div v-if="!currentKnowledge" class="empty-content">
        <el-icon :size="80" color="#e4e7ed"><FolderOpened /></el-icon>
        <p>选择或创建一个知识库</p>
      </div>

      <template v-else>
        <!-- 顶部操作栏 -->
        <div class="content-header">
          <div class="header-info">
            <h2>{{ currentKnowledge.name }}</h2>
            <p v-if="currentKnowledge.description">{{ currentKnowledge.description }}</p>
          </div>
          <div class="header-actions">
            <el-button :icon="Upload" @click="handleAddFile">添加文件</el-button>
            <el-button :icon="Link" @click="handleAddURL">添加链接</el-button>
            <el-button :icon="Document" @click="handleAddText">添加文本</el-button>
            <el-button :icon="Search" @click="handleSearch">搜索知识库</el-button>
          </div>
        </div>

        <!-- 文件列表 -->
        <div class="file-list">
          <el-table :data="files" style="width: 100%" v-loading="filesLoading">
            <el-table-column prop="name" label="名称" min-width="200" />
            <el-table-column prop="type" label="类型" width="100">
              <template #default="{ row }">
                <el-tag :type="getTypeTagType(row.type)" size="small">
                  {{ getTypeLabel(row.type) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="status" label="状态" width="120">
              <template #default="{ row }">
                <el-tag :type="getStatusTagType(row.status)" size="small">
                  {{ getStatusLabel(row.status) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="vectors" label="向量数" width="100">
              <template #default="{ row }">
                {{ row.vectors?.length || 0 }}
              </template>
            </el-table-column>
            <el-table-column prop="createdAt" label="创建时间" width="180">
              <template #default="{ row }">
                {{ formatDate(row.createdAt) }}
              </template>
            </el-table-column>
            <el-table-column label="操作" width="100" fixed="right">
              <template #default="{ row }">
                <el-button
                  type="danger"
                  size="small"
                  :icon="Delete"
                  @click="handleDeleteFile(row)"
                  link
                >
                  删除
                </el-button>
              </template>
            </el-table-column>
          </el-table>

          <div v-if="files.length === 0 && !filesLoading" class="empty-files">
            <el-icon :size="48" color="#e4e7ed"><Document /></el-icon>
            <p>还没有添加文件</p>
          </div>
        </div>
      </template>
    </div>

    <!-- 创建/编辑知识库对话框 -->
    <el-dialog
      v-model="knowledgeDialogVisible"
      :title="isEditingKnowledge ? '编辑知识库' : '创建知识库'"
      width="500px"
    >
      <el-form :model="knowledgeForm" label-width="100px">
        <el-form-item label="知识库名称">
          <el-input v-model="knowledgeForm.name" placeholder="请输入知识库名称" />
        </el-form-item>
        <el-form-item label="描述">
          <el-input
            v-model="knowledgeForm.description"
            type="textarea"
            :rows="3"
            placeholder="请输入描述（可选）"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="knowledgeDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSaveKnowledge">确定</el-button>
      </template>
    </el-dialog>

    <!-- 添加文本对话框 -->
    <el-dialog v-model="textDialogVisible" title="添加文本" width="600px">
      <el-form :model="textForm" label-width="80px">
        <el-form-item label="标题">
          <el-input v-model="textForm.name" placeholder="请输入标题" />
        </el-form-item>
        <el-form-item label="内容">
          <el-input
            v-model="textForm.content"
            type="textarea"
            :rows="10"
            placeholder="请输入文本内容"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="textDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSaveText" :loading="textSaving">确定</el-button>
      </template>
    </el-dialog>

    <!-- 添加链接对话框 -->
    <el-dialog v-model="urlDialogVisible" title="添加链接" width="500px">
      <el-form :model="urlForm" label-width="80px">
        <el-form-item label="名称">
          <el-input v-model="urlForm.name" placeholder="请输入名称（可选）" />
        </el-form-item>
        <el-form-item label="链接">
          <el-input v-model="urlForm.url" placeholder="请输入网页链接" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="urlDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSaveURL" :loading="urlSaving">确定</el-button>
      </template>
    </el-dialog>

    <!-- 搜索对话框 -->
    <el-dialog v-model="searchDialogVisible" title="搜索知识库" width="700px">
      <el-input
        v-model="searchQuery"
        placeholder="输入搜索内容"
        @keyup.enter="performSearch"
      >
        <template #append>
          <el-button :icon="Search" @click="performSearch" :loading="searching">搜索</el-button>
        </template>
      </el-input>

      <div v-if="searchResults.length > 0" class="search-results">
        <div v-for="(result, index) in searchResults" :key="index" class="result-item">
          <div class="result-header">
            <span class="result-score">相似度: {{ (result.score * 100).toFixed(2) }}%</span>
          </div>
          <div class="result-content">{{ result.text }}</div>
        </div>
      </div>

      <div v-else-if="searched && !searching" class="no-results">
        <el-icon :size="48" color="#e4e7ed"><Search /></el-icon>
        <p>没有找到相关内容</p>
      </div>
    </el-dialog>

    <!-- 隐藏的文件输入 -->
    <input
      ref="fileInputRef"
      type="file"
      accept=".txt,.md,.pdf,.doc,.docx"
      style="display: none"
      @change="handleFileChange"
    />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import {
  Plus,
  MoreFilled,
  FolderOpened,
  Upload,
  Link,
  Document,
  Search,
  Delete
} from '@element-plus/icons-vue';
import {
  getKnowledgeBases,
  createKnowledgeBase,
  updateKnowledgeBase,
  deleteKnowledgeBase,
  getKnowledgeFiles,
  uploadFile,
  addText,
  addURL,
  deleteFile,
  searchKnowledge
} from '@/api/knowledge';

const userId = ref(localStorage.getItem('edu-user-id'));

const knowledgeBases = ref([]);
const currentKnowledge = ref(null);
const files = ref([]);
const filesLoading = ref(false);

const knowledgeDialogVisible = ref(false);
const isEditingKnowledge = ref(false);
const knowledgeForm = ref({
  name: '',
  description: ''
});
const editingKnowledgeId = ref(null);

const textDialogVisible = ref(false);
const textForm = ref({
  name: '',
  content: ''
});
const textSaving = ref(false);

const urlDialogVisible = ref(false);
const urlForm = ref({
  name: '',
  url: ''
});
const urlSaving = ref(false);

const searchDialogVisible = ref(false);
const searchQuery = ref('');
const searchResults = ref([]);
const searching = ref(false);
const searched = ref(false);

const fileInputRef = ref(null);

onMounted(async () => {
  await loadKnowledgeBases();
  if (knowledgeBases.value.length > 0) {
    await selectKnowledge(knowledgeBases.value[0]);
  }
});

const loadKnowledgeBases = async () => {
  try {
    const res = await getKnowledgeBases(userId.value);
    if (res.data.code === 200) {
      knowledgeBases.value = res.data.data;
    }
  } catch (error) {
    console.error('加载知识库失败:', error);
    ElMessage.error('加载知识库失败');
  }
};

const selectKnowledge = async (kb) => {
  currentKnowledge.value = kb;
  await loadFiles(kb._id);
};

const loadFiles = async (knowledgeId) => {
  try {
    filesLoading.value = true;
    const res = await getKnowledgeFiles(knowledgeId);
    if (res.data.code === 200) {
      files.value = res.data.data;
    }
  } catch (error) {
    console.error('加载文件失败:', error);
    ElMessage.error('加载文件失败');
  } finally {
    filesLoading.value = false;
  }
};

const handleCreateKnowledge = () => {
  isEditingKnowledge.value = false;
  knowledgeForm.value = {
    name: '',
    description: ''
  };
  knowledgeDialogVisible.value = true;
};

const handleSaveKnowledge = async () => {
  if (!knowledgeForm.value.name) {
    ElMessage.warning('请输入知识库名称');
    return;
  }

  try {
    if (isEditingKnowledge.value) {
      await updateKnowledgeBase(editingKnowledgeId.value, knowledgeForm.value);
      ElMessage.success('知识库更新成功');
    } else {
      await createKnowledgeBase({
        userId: userId.value,
        ...knowledgeForm.value
      });
      ElMessage.success('知识库创建成功');
    }
    knowledgeDialogVisible.value = false;
    await loadKnowledgeBases();
  } catch (error) {
    console.error('保存知识库失败:', error);
    ElMessage.error('操作失败');
  }
};

const handleKnowledgeCommand = async (command, kb) => {
  if (command === 'edit') {
    isEditingKnowledge.value = true;
    editingKnowledgeId.value = kb._id;
    knowledgeForm.value = {
      name: kb.name,
      description: kb.description || ''
    };
    knowledgeDialogVisible.value = true;
  } else if (command === 'delete') {
    try {
      await ElMessageBox.confirm('确定要删除这个知识库吗？', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      });
      await deleteKnowledgeBase(kb._id);
      ElMessage.success('知识库已删除');
      await loadKnowledgeBases();
      if (currentKnowledge.value?._id === kb._id) {
        currentKnowledge.value = null;
        files.value = [];
      }
    } catch (error) {
      if (error !== 'cancel') {
        console.error('删除知识库失败:', error);
        ElMessage.error('删除失败');
      }
    }
  }
};

const handleAddFile = () => {
  if (fileInputRef.value) {
    fileInputRef.value.click();
  }
};

const handleFileChange = async (event) => {
  const file = event.target.files[0];
  if (!file) return;

  if (file.size > 10 * 1024 * 1024) {
    ElMessage.error('文件大小不能超过 10MB');
    return;
  }

  try {
    const loading = ElMessage({
      message: '正在上传文件...',
      type: 'info',
      duration: 0
    });

    await uploadFile(currentKnowledge.value._id, file);
    loading.close();
    ElMessage.success('文件上传成功，正在处理');
    await loadFiles(currentKnowledge.value._id);
    await loadKnowledgeBases();
  } catch (error) {
    console.error('上传文件失败:', error);
    ElMessage.error('上传文件失败');
  }

  if (fileInputRef.value) {
    fileInputRef.value.value = '';
  }
};

const handleAddText = () => {
  textForm.value = {
    name: '',
    content: ''
  };
  textDialogVisible.value = true;
};

const handleSaveText = async () => {
  if (!textForm.value.name || !textForm.value.content) {
    ElMessage.warning('请填写标题和内容');
    return;
  }

  try {
    textSaving.value = true;
    await addText(currentKnowledge.value._id, textForm.value);
    ElMessage.success('文本添加成功，正在处理');
    textDialogVisible.value = false;
    await loadFiles(currentKnowledge.value._id);
    await loadKnowledgeBases();
  } catch (error) {
    console.error('添加文本失败:', error);
    ElMessage.error('添加文本失败');
  } finally {
    textSaving.value = false;
  }
};

const handleAddURL = () => {
  urlForm.value = {
    name: '',
    url: ''
  };
  urlDialogVisible.value = true;
};

const handleSaveURL = async () => {
  if (!urlForm.value.url) {
    ElMessage.warning('请输入链接');
    return;
  }

  try {
    urlSaving.value = true;
    await addURL(currentKnowledge.value._id, urlForm.value);
    ElMessage.success('链接添加成功，正在处理');
    urlDialogVisible.value = false;
    await loadFiles(currentKnowledge.value._id);
    await loadKnowledgeBases();
  } catch (error) {
    console.error('添加链接失败:', error);
    ElMessage.error('添加链接失败');
  } finally {
    urlSaving.value = false;
  }
};

const handleDeleteFile = async (file) => {
  try {
    await ElMessageBox.confirm('确定要删除这个文件吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    });
    await deleteFile(file._id);
    ElMessage.success('文件已删除');
    await loadFiles(currentKnowledge.value._id);
    await loadKnowledgeBases();
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除文件失败:', error);
      ElMessage.error('删除失败');
    }
  }
};

const handleSearch = () => {
  searchQuery.value = '';
  searchResults.value = [];
  searched.value = false;
  searchDialogVisible.value = true;
};

const performSearch = async () => {
  if (!searchQuery.value.trim()) {
    ElMessage.warning('请输入搜索内容');
    return;
  }

  try {
    searching.value = true;
    const res = await searchKnowledge(currentKnowledge.value._id, searchQuery.value);
    if (res.data.code === 200) {
      searchResults.value = res.data.data;
      searched.value = true;
    }
  } catch (error) {
    console.error('搜索失败:', error);
    ElMessage.error('搜索失败');
  } finally {
    searching.value = false;
  }
};

const getTypeLabel = (type) => {
  const labels = {
    file: '文件',
    url: '链接',
    text: '文本',
    folder: '文件夹'
  };
  return labels[type] || type;
};

const getTypeTagType = (type) => {
  const types = {
    file: '',
    url: 'success',
    text: 'warning',
    folder: 'info'
  };
  return types[type] || '';
};

const getStatusLabel = (status) => {
  const labels = {
    pending: '等待中',
    processing: '处理中',
    completed: '已完成',
    failed: '失败'
  };
  return labels[status] || status;
};

const getStatusTagType = (status) => {
  const types = {
    pending: 'info',
    processing: 'warning',
    completed: 'success',
    failed: 'danger'
  };
  return types[status] || '';
};

const formatDate = (date) => {
  return new Date(date).toLocaleString('zh-CN');
};
</script>

<style scoped>
.knowledge-base-container {
  display: flex;
  height: 100vh;
  background: #f5f7fa;
}

.left-panel {
  width: 280px;
  background: #ffffff;
  border-right: 1px solid #e4e7ed;
  display: flex;
  flex-direction: column;
}

.panel-header {
  padding: 16px;
  border-bottom: 1px solid #e4e7ed;
}

.knowledge-list {
  flex: 1;
  overflow-y: auto;
  padding: 8px;
}

.knowledge-item {
  padding: 12px;
  margin-bottom: 4px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.knowledge-item:hover {
  background: #f5f7fa;
}

.knowledge-item.active {
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
  margin-bottom: 4px;
}

.item-stats {
  font-size: 12px;
  color: #999;
  display: flex;
  gap: 12px;
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

.content-panel {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: #ffffff;
  overflow: hidden;
}

.empty-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #999;
}

.empty-content p {
  margin-top: 16px;
  font-size: 16px;
}

.content-header {
  padding: 20px;
  border-bottom: 1px solid #e4e7ed;
}

.header-info h2 {
  margin: 0 0 8px 0;
  font-size: 20px;
  color: #333;
}

.header-info p {
  margin: 0;
  font-size: 14px;
  color: #666;
}

.header-actions {
  margin-top: 16px;
  display: flex;
  gap: 12px;
}

.file-list {
  flex: 1;
  padding: 20px;
  overflow-y: auto;
}

.empty-files {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  color: #999;
}

.empty-files p {
  margin-top: 12px;
}

.search-results {
  margin-top: 20px;
  max-height: 400px;
  overflow-y: auto;
}

.result-item {
  padding: 12px;
  margin-bottom: 12px;
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  background: #f5f7fa;
}

.result-header {
  margin-bottom: 8px;
}

.result-score {
  font-size: 12px;
  color: #0969da;
  font-weight: 500;
}

.result-content {
  font-size: 14px;
  color: #333;
  line-height: 1.6;
}

.no-results {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  color: #999;
}

.no-results p {
  margin-top: 12px;
}
</style>
