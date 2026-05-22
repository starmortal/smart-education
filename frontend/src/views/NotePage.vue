<template>
  <div class="note-page">
    <SideNavBar />
    
    <!-- 笔记列表区 -->
    <div class="note-sidebar">
      <!-- 顶部工具栏 - 图标样式 -->
      <div class="sidebar-header">
        <div class="toolbar-icons">
          <el-tooltip content="新建笔记" placement="bottom">
            <el-button 
              :icon="DocumentAdd" 
              circle
              @click="handleAddNote"
            />
          </el-tooltip>
          
          <el-tooltip content="新建文件夹" placement="bottom">
            <el-button 
              :icon="FolderAdd" 
              circle
              @click="showCategoryDialog = true"
            />
          </el-tooltip>
          
          <el-tooltip content="排序" placement="bottom">
            <el-button 
              :icon="Sort" 
              circle
              @click="toggleSort"
            />
          </el-tooltip>
          
          <el-tooltip content="收藏" placement="bottom">
            <el-button 
              :icon="Star" 
              circle
              @click="toggleFavorite"
            />
          </el-tooltip>
          
          <el-tooltip content="搜索" placement="bottom">
            <el-button 
              :icon="Search" 
              circle
              @click="toggleSearch"
            />
          </el-tooltip>
        </div>
      </div>

      <!-- 搜索框（可展开） -->
      <div class="search-box" v-show="showSearch">
        <el-input
          v-model="searchKey"
          placeholder="搜索笔记..."
          :prefix-icon="Search"
          clearable
          @input="handleSearch"
        />
      </div>

      <!-- 分类和标签筛选 -->
      <div class="filter-box">
        <el-select
          v-model="selectedCategory"
          placeholder="选择分类"
          clearable
          @change="loadNoteList"
          style="width: 100%; margin-bottom: 8px"
          size="small"
        >
          <el-option label="全部分类" value="全部" />
          <el-option
            v-for="cat in categories"
            :key="cat"
            :label="cat"
            :value="cat"
          />
        </el-select>

        <el-select
          v-model="selectedTags"
          placeholder="选择标签"
          multiple
          clearable
          @change="loadNoteList"
          style="width: 100%"
          size="small"
        >
          <el-option
            v-for="tag in tags"
            :key="tag"
            :label="tag"
            :value="tag"
          />
        </el-select>
      </div>

      <!-- 笔记列表 -->
      <div class="note-list" v-loading="loading">
        <div
          v-for="note in noteList"
          :key="note.id"
          :class="['note-item', { active: currentNote?.id === note.id }]"
          @click="handleSelectNote(note)"
        >
          <div class="note-item-header">
            <span class="note-title">{{ note.noteTitle || '无标题笔记' }}</span>
          </div>
          <div class="note-item-meta">
            <el-tag size="small" type="info">{{ note.noteCategory }}</el-tag>
            <span class="note-time">{{ formatTime(note.updateTime) }}</span>
          </div>
          <div class="note-item-preview">
            {{ getPreviewText(note.noteContent) }}
          </div>
          <div class="note-item-tags" v-if="note.noteTags && note.noteTags.length">
            <el-tag
              v-for="tag in note.noteTags.slice(0, 3)"
              :key="tag"
              size="small"
              effect="plain"
            >
              {{ tag }}
            </el-tag>
          </div>
        </div>

        <el-empty 
          v-if="noteList.length === 0 && !loading" 
          description="暂无笔记"
          :image-size="80"
        />
      </div>
    </div>

    <!-- 编辑区 -->
    <div class="editor-container">
      <div v-if="!currentNote" class="editor-empty">
        <el-empty description="请选择或创建一篇笔记" :image-size="120" />
      </div>

      <div v-else class="editor-content">
        <!-- 标题栏 -->
        <div class="editor-header">
          <el-input
            v-model="currentNote.noteTitle"
            placeholder="无标题笔记"
            class="title-input"
            @input="handleTitleChange"
          />
          <div class="header-actions">
            <el-button :icon="Delete" @click="handleDeleteNote" text>
              删除
            </el-button>
          </div>
        </div>

        <!-- 分类和标签 -->
        <div class="editor-meta">
          <el-select
            v-model="currentNote.noteCategory"
            placeholder="选择分类"
            style="width: 200px; margin-right: 12px"
            @change="handleMetaChange"
          >
            <el-option label="未分类" value="未分类" />
            <el-option
              v-for="cat in categories"
              :key="cat"
              :label="cat"
              :value="cat"
            />
            <el-option label="+ 新建分类" value="__new__" />
          </el-select>

          <el-select
            v-model="currentNote.noteTags"
            placeholder="选择标签"
            multiple
            filterable
            allow-create
            style="flex: 1"
            @change="handleMetaChange"
          >
            <el-option
              v-for="tag in tags"
              :key="tag"
              :label="tag"
              :value="tag"
            />
          </el-select>
        </div>

        <!-- Markdown编辑器 -->
        <div class="editor-wrapper">
          <MdEditor
            v-model="currentNote.noteContent"
            language="zh-CN"
            :toolbars="toolbars"
            @onChange="handleContentChange"
            placeholder="输入/调用命令"
          />
        </div>
      </div>
    </div>

    <!-- 新建分类对话框 -->
    <el-dialog
      v-model="showCategoryDialog"
      title="新建分类"
      width="400px"
    >
      <el-input
        v-model="newCategory"
        placeholder="请输入分类名称"
        @keydown.enter="handleAddCategory"
      />
      <template #footer>
        <el-button @click="showCategoryDialog = false">取消</el-button>
        <el-button type="primary" @click="handleAddCategory">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { 
  DocumentAdd, 
  FolderAdd, 
  Sort, 
  Star, 
  Search, 
  Delete 
} from '@element-plus/icons-vue';
import { MdEditor } from 'md-editor-v3';
import 'md-editor-v3/lib/style.css';
import SideNavBar from '@/components/SideNavBar.vue';
import { noteApi } from '@/api/index';

// 数据状态
const noteList = ref([]);
const currentNote = ref(null);
const loading = ref(false);
const searchKey = ref('');
const selectedCategory = ref('全部');
const selectedTags = ref([]);
const categories = ref([]);
const tags = ref([]);
const showCategoryDialog = ref(false);
const newCategory = ref('');
const showSearch = ref(false);
const sortOrder = ref('updateTime'); // updateTime, createTime, title

// 自动保存定时器
let saveTimer = null;

// 编辑器工具栏配置
const toolbars = [
  'bold', 'underline', 'italic', 'strikeThrough',
  '-',
  'title', 'sub', 'sup', 'quote', 'unorderedList', 'orderedList',
  '-',
  'codeRow', 'code', 'link', 'image', 'table',
  '-',
  'revoke', 'next',
  '=',
  'pageFullscreen', 'fullscreen', 'preview', 'catalog'
];

// 切换搜索框显示
function toggleSearch() {
  showSearch.value = !showSearch.value;
  if (!showSearch.value) {
    searchKey.value = '';
    loadNoteList();
  }
}

// 切换排序
function toggleSort() {
  const orders = ['updateTime', 'createTime', 'title'];
  const currentIndex = orders.indexOf(sortOrder.value);
  sortOrder.value = orders[(currentIndex + 1) % orders.length];
  
  const sortNames = {
    updateTime: '按更新时间',
    createTime: '按创建时间',
    title: '按标题'
  };
  
  ElMessage.success(`${sortNames[sortOrder.value]}排序`);
  sortNoteList();
}

// 排序笔记列表
function sortNoteList() {
  if (sortOrder.value === 'title') {
    noteList.value.sort((a, b) => a.noteTitle.localeCompare(b.noteTitle));
  } else if (sortOrder.value === 'createTime') {
    noteList.value.sort((a, b) => new Date(b.createTime) - new Date(a.createTime));
  } else {
    noteList.value.sort((a, b) => new Date(b.updateTime) - new Date(a.updateTime));
  }
}

// 切换收藏（预留功能）
function toggleFavorite() {
  ElMessage.info('收藏功能开发中...');
}

// 加载笔记列表
async function loadNoteList() {
  try {
    loading.value = true;
    const userId = localStorage.getItem('edu-user-id');
    
    const params = {
      userId,
      pageNum: 1,
      pageSize: 999,
    };
    
    if (searchKey.value) {
      params.searchKey = searchKey.value;
    }
    
    if (selectedCategory.value && selectedCategory.value !== '全部') {
      params.noteCategory = selectedCategory.value;
    }
    
    if (selectedTags.value.length > 0) {
      params.noteTags = selectedTags.value;
    }
    
    const res = await noteApi.getList(params);
    noteList.value = res.data?.notes || [];
  } catch (error) {
    console.error('获取笔记列表失败：', error);
    ElMessage.error('获取笔记列表失败');
    noteList.value = [];
  } finally {
    loading.value = false;
  }
}

// 加载分类和标签
async function loadCategoriesAndTags() {
  try {
    const userId = localStorage.getItem('edu-user-id');
    
    const [catRes, tagRes] = await Promise.all([
      noteApi.getCategories({ userId }),
      noteApi.getTags({ userId }),
    ]);
    
    categories.value = catRes.data?.categories || [];
    tags.value = tagRes.data?.tags || [];
  } catch (error) {
    console.error('获取分类和标签失败：', error);
  }
}

// 新建笔记
async function handleAddNote() {
  try {
    const userId = localStorage.getItem('edu-user-id');
    
    const noteData = {
      userId,
      noteTitle: '无标题笔记',
      noteContent: '',
      noteCategory: '未分类',
      noteTags: [],
    };
    
    const res = await noteApi.add(noteData);
    ElMessage.success('新建成功');
    
    await loadNoteList();
    
    // 自动选中新创建的笔记
    const newNote = noteList.value.find(n => n.id === res.data?.noteId);
    if (newNote) {
      handleSelectNote(newNote);
    }
  } catch (error) {
    console.error('新建笔记失败：', error);
    ElMessage.error(`新建笔记失败：${error.response?.data?.message || error.message || '未知错误'}`);
  }
}

// 选择笔记
function handleSelectNote(note) {
  // 保存当前笔记
  if (currentNote.value && saveTimer) {
    clearTimeout(saveTimer);
    saveCurrentNote();
  }
  
  currentNote.value = { ...note };
}

// 删除笔记
async function handleDeleteNote() {
  try {
    await ElMessageBox.confirm('确定要删除这篇笔记吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    });
    
    await noteApi.delete(currentNote.value.id);
    ElMessage.success('删除成功');
    
    currentNote.value = null;
    await loadNoteList();
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除笔记失败：', error);
      ElMessage.error('删除失败');
    }
  }
}

// 标题变化
function handleTitleChange() {
  triggerAutoSave();
}

// 内容变化
function handleContentChange() {
  triggerAutoSave();
}

// 分类/标签变化
function handleMetaChange() {
  // 处理新建分类
  if (currentNote.value.noteCategory === '__new__') {
    showCategoryDialog.value = true;
    currentNote.value.noteCategory = '未分类';
    return;
  }
  
  triggerAutoSave();
}

// 新建分类
async function handleAddCategory() {
  if (!newCategory.value.trim()) {
    ElMessage.warning('请输入分类名称');
    return;
  }
  
  currentNote.value.noteCategory = newCategory.value.trim();
  showCategoryDialog.value = false;
  newCategory.value = '';
  
  await loadCategoriesAndTags();
  triggerAutoSave();
}

// 触发自动保存
function triggerAutoSave() {
  if (saveTimer) {
    clearTimeout(saveTimer);
  }
  
  saveTimer = setTimeout(() => {
    saveCurrentNote();
  }, 1000); // 1秒后自动保存
}

// 保存当前笔记
async function saveCurrentNote() {
  if (!currentNote.value) return;
  
  try {
    await noteApi.update(currentNote.value.id, {
      userId: localStorage.getItem('edu-user-id'),
      noteTitle: currentNote.value.noteTitle || '无标题笔记',
      noteCategory: currentNote.value.noteCategory,
      noteTags: currentNote.value.noteTags,
      noteContent: currentNote.value.noteContent,
    });
    
    // 更新列表中的笔记
    const index = noteList.value.findIndex(n => n.id === currentNote.value.id);
    if (index !== -1) {
      noteList.value[index] = { ...currentNote.value };
    }
  } catch (error) {
    console.error('保存笔记失败：', error);
  }
}

// 搜索处理（防抖）
let searchTimer = null;
function handleSearch() {
  if (searchTimer) {
    clearTimeout(searchTimer);
  }
  
  searchTimer = setTimeout(() => {
    loadNoteList();
  }, 500);
}

// 获取预览文本
function getPreviewText(content) {
  if (!content) return '空白笔记';
  
  const plainText = content
    .replace(/[#*`>\-\[\]()]/g, '')
    .replace(/\n+/g, ' ')
    .trim();
  
  return plainText.substring(0, 80) + (plainText.length > 80 ? '...' : '');
}

// 格式化时间
function formatTime(time) {
  if (!time) return '';
  
  const date = new Date(time);
  const now = new Date();
  const diff = now - date;
  
  if (diff < 60000) return '刚刚';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}分钟前`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}小时前`;
  if (diff < 604800000) return `${Math.floor(diff / 86400000)}天前`;
  
  return date.toLocaleDateString();
}

// 页面加载
onMounted(() => {
  loadNoteList();
  loadCategoriesAndTags();
});

// 页面卸载前保存
window.addEventListener('beforeunload', () => {
  if (currentNote.value && saveTimer) {
    clearTimeout(saveTimer);
    saveCurrentNote();
  }
});
</script>

<style scoped>
.note-page {
  display: block;
  height: 100vh;
  background: #f5f7fa;
  overflow: hidden;
  position: relative;
}

/* 笔记列表区 */
.note-sidebar {
  width: 300px;
  background: #fff;
  border-right: 1px solid #e4e7ed;
  display: flex;
  flex-direction: column;
  position: fixed;
  left: 60px;
  top: 0;
  bottom: 0;
  z-index: 100;
}

.sidebar-header {
  padding: 16px;
  border-bottom: 1px solid #e4e7ed;
  background: #fff;
}

.toolbar-icons {
  display: flex;
  justify-content: space-around;
  align-items: center;
  gap: 4px;
}

.toolbar-icons .el-button {
  width: 40px;
  height: 40px;
  padding: 0;
  border: none;
  background: transparent;
  color: #606266;
  transition: all 0.3s;
}

.toolbar-icons .el-button:hover {
  background: #f5f7fa;
  color: #0969da;
  transform: scale(1.1);
}

.toolbar-icons .el-button:active {
  transform: scale(0.95);
}

.search-box {
  padding: 12px 16px;
  background: #fff;
  border-bottom: 1px solid #e4e7ed;
  animation: slideDown 0.3s ease;
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.filter-box {
  padding: 0 16px 16px 16px;
  border-bottom: 1px solid #e4e7ed;
  background: #fff;
}

.note-list {
  flex: 1;
  overflow-y: auto;
  padding: 12px;
  background: #fafafa;
}

.note-list::-webkit-scrollbar {
  width: 6px;
}

.note-list::-webkit-scrollbar-thumb {
  background: #dcdfe6;
  border-radius: 3px;
}

.note-list::-webkit-scrollbar-thumb:hover {
  background: #c0c4cc;
}

.note-item {
  padding: 14px;
  margin-bottom: 10px;
  background: #fff;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s;
  border: 1px solid #e4e7ed;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
}

.note-item:hover {
  border-color: #0969da;
  box-shadow: 0 2px 8px rgba(9, 105, 218, 0.15);
  transform: translateY(-1px);
}

.note-item.active {
  background: #e8f4ff;
  border-color: #0969da;
  border-left: 4px solid #0969da;
  padding-left: 11px;
  box-shadow: 0 2px 8px rgba(9, 105, 218, 0.2);
}

.note-item-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.note-title {
  font-size: 15px;
  font-weight: 600;
  color: #303133;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex: 1;
}

.note-item-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
  gap: 8px;
}

.note-time {
  font-size: 12px;
  color: #909399;
  white-space: nowrap;
}

.note-item-preview {
  font-size: 13px;
  color: #606266;
  line-height: 1.6;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  margin-bottom: 10px;
  word-break: break-word;
}

.note-item-tags {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
  margin-top: 8px;
}

/* 编辑区 */
.editor-container {
  position: fixed;
  left: 360px;
  right: 0;
  top: 0;
  bottom: 0;
  display: flex;
  flex-direction: column;
  background: #fff;
}

.editor-empty {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #fafafa;
}

.editor-content {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.editor-header {
  display: flex;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid #e4e7ed;
  background: #fff;
}

.title-input {
  flex: 1;
  margin-right: 16px;
}

.title-input :deep(.el-input__wrapper) {
  box-shadow: none;
  font-size: 22px;
  font-weight: 600;
  padding: 8px 0;
}

.title-input :deep(.el-input__inner) {
  font-size: 22px;
  font-weight: 600;
}

.header-actions {
  display: flex;
  gap: 8px;
}

.editor-meta {
  display: flex;
  align-items: center;
  padding: 16px 24px;
  border-bottom: 1px solid #e4e7ed;
  background: #fafafa;
  gap: 12px;
}

.editor-wrapper {
  flex: 1;
  overflow: hidden;
  background: #fff;
}

.editor-wrapper :deep(.md-editor) {
  height: 100%;
  border: none;
}

/* 响应式适配 */
@media (max-width: 1200px) {
  .note-sidebar {
    width: 260px;
  }
  
  .editor-container {
    margin-left: 320px;
  }
}

@media (max-width: 768px) {
  .note-sidebar {
    width: 100%;
    left: 0;
    transform: translateX(-100%);
    transition: transform 0.3s;
  }
  
  .note-sidebar.show {
    transform: translateX(0);
  }
  
  .editor-container {
    margin-left: 60px;
  }
}
</style>
