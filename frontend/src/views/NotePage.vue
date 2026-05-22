<template>
  <div class="note-page">
    <SideNavBar />
    
    <!-- 笔记列表区 -->
    <div class="note-sidebar" :class="{ collapsed: sidebarCollapsed }">
      <!-- 顶部工具栏 -->
      <div class="sidebar-header">
        <el-tooltip content="新建笔记" placement="bottom">
          <el-button :icon="DocumentAdd" circle size="small" @click="handleAddNote" />
        </el-tooltip>
        
        <el-tooltip content="新建文件夹" placement="bottom">
          <el-button :icon="FolderAdd" circle size="small" @click="handleAddFolder" />
        </el-tooltip>
        
        <el-tooltip content="排序" placement="bottom">
          <el-button :icon="Sort" circle size="small" @click="toggleSort" />
        </el-tooltip>
        
        <el-tooltip content="搜索" placement="bottom">
          <el-button :icon="Search" circle size="small" @click="toggleSearch" />
        </el-tooltip>
      </div>

      <!-- 搜索框 -->
      <div class="search-box" v-show="showSearch">
        <el-input
          v-model="searchKey"
          placeholder="搜索笔记..."
          :prefix-icon="Search"
          clearable
          size="small"
          @input="handleSearch"
        />
      </div>

      <!-- 标签筛选 -->
      <div class="filter-box" v-if="tags.length > 0">
        <el-select
          v-model="selectedTags"
          placeholder="筛选标签"
          multiple
          clearable
          size="small"
          @change="loadNoteList"
        >
          <el-option
            v-for="tag in tags"
            :key="tag"
            :label="tag"
            :value="tag"
          />
        </el-select>
      </div>

      <!-- 树形笔记列表 -->
      <div class="note-tree" v-loading="loading">
        <el-tree
          ref="treeRef"
          :data="treeData"
          node-key="id"
          :props="{ label: 'noteTitle', children: 'children' }"
          :expand-on-click-node="false"
          :highlight-current="true"
          :current-node-key="currentNote?.id"
          @node-click="handleNodeClick"
          @node-contextmenu="handleContextMenu"
        >
          <template #default="{ node, data }">
            <span class="tree-node" @contextmenu.prevent="(e) => handleContextMenu(e, data, node)">
              <el-icon v-if="data.isFolder"><Folder /></el-icon>
              <el-icon v-else><Document /></el-icon>
              <span class="node-label">{{ node.label }}</span>
            </span>
          </template>
        </el-tree>

        <el-empty 
          v-if="treeData.length === 0 && !loading" 
          description="暂无笔记"
          :image-size="60"
        />
      </div>
    </div>

    <!-- 编辑区 -->
    <div class="editor-container" :class="{ expanded: sidebarCollapsed }">
      <div v-if="!currentNote" class="editor-empty">
        <el-empty description="请选择或创建一篇笔记" :image-size="120" />
      </div>

      <div v-else class="editor-content">
        <!-- 顶部栏 -->
        <div class="editor-header">
          <el-button 
            :icon="sidebarCollapsed ? DArrowRight : DArrowLeft" 
            circle 
            size="small"
            @click="toggleSidebar"
          />
          <span class="file-name">{{ currentNote.noteTitle || '无标题笔记' }}</span>
        </div>

        <!-- Markdown编辑器 -->
        <div class="editor-wrapper" v-if="!currentNote.isFolder">
          <MdEditor
            v-model="currentNote.noteContent"
            language="zh-CN"
            :toolbars="toolbars"
            @onChange="handleContentChange"
            placeholder="输入/调用命令"
          />
        </div>

        <!-- 文件夹提示 -->
        <div v-else class="folder-tip">
          <el-empty description="这是一个文件夹" :image-size="100" />
        </div>
      </div>
    </div>

    <!-- 右键菜单 -->
    <vue-context-menu
      v-model:show="showContextMenu"
      :options="contextMenuOptions"
      @select="handleContextMenuSelect"
    >
      <template v-if="contextMenuNode && !contextMenuNode.isFolder">
        <context-menu-item label="重命名" :value="'rename'">
          <template #icon><el-icon><Edit /></el-icon></template>
        </context-menu-item>
        <context-menu-item label="编辑标签" :value="'tags'">
          <template #icon><el-icon><PriceTag /></el-icon></template>
        </context-menu-item>
        <context-menu-sperator />
        <context-menu-item label="删除" :value="'delete'" class="danger">
          <template #icon><el-icon><Delete /></el-icon></template>
        </context-menu-item>
      </template>
      <template v-else-if="contextMenuNode">
        <context-menu-item label="重命名" :value="'rename'">
          <template #icon><el-icon><Edit /></el-icon></template>
        </context-menu-item>
        <context-menu-sperator />
        <context-menu-item label="删除" :value="'delete'" class="danger">
          <template #icon><el-icon><Delete /></el-icon></template>
        </context-menu-item>
      </template>
    </vue-context-menu>

    <!-- 自定义右键菜单 -->
    <div 
      v-show="showContextMenu" 
      class="custom-context-menu"
      :style="{ left: contextMenuPos.x + 'px', top: contextMenuPos.y + 'px' }"
      @click.stop
    >
      <div class="menu-item" @click="handleRename">
        <el-icon><Edit /></el-icon>
        <span>重命名</span>
      </div>
      <div 
        v-if="contextMenuNode && !contextMenuNode.isFolder" 
        class="menu-item" 
        @click="handleEditTags"
      >
        <el-icon><PriceTag /></el-icon>
        <span>编辑标签</span>
      </div>
      <div class="menu-divider"></div>
      <div class="menu-item danger" @click="handleDelete">
        <el-icon><Delete /></el-icon>
        <span>删除</span>
      </div>
    </div>

    <!-- 重命名对话框 -->
    <el-dialog
      v-model="showRenameDialog"
      title="重命名"
      width="400px"
    >
      <el-input
        v-model="renameValue"
        placeholder="请输入名称"
        @keydown.enter="confirmRename"
      />
      <template #footer>
        <el-button @click="showRenameDialog = false">取消</el-button>
        <el-button type="primary" @click="confirmRename">确定</el-button>
      </template>
    </el-dialog>

    <!-- 编辑标签对话框 -->
    <el-dialog
      v-model="showTagsDialog"
      title="编辑标签"
      width="500px"
    >
      <el-select
        v-model="editingTags"
        placeholder="添加标签"
        multiple
        filterable
        allow-create
        style="width: 100%"
      >
        <el-option
          v-for="tag in tags"
          :key="tag"
          :label="tag"
          :value="tag"
        />
      </el-select>
      <template #footer>
        <el-button @click="showTagsDialog = false">取消</el-button>
        <el-button type="primary" @click="confirmEditTags">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, nextTick } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { 
  DocumentAdd, 
  FolderAdd, 
  Sort, 
  Search,
  DArrowLeft,
  DArrowRight,
  Folder,
  Document,
  Edit,
  Delete,
  PriceTag
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
const selectedTags = ref([]);
const tags = ref([]);
const showSearch = ref(false);
const sidebarCollapsed = ref(false);
const sortOrder = ref('updateTime');

// 右键菜单
const showContextMenu = ref(false);
const contextMenuPos = ref({ x: 0, y: 0 });
const contextMenuNode = ref(null);
const contextMenuRef = ref(null);

// 重命名
const showRenameDialog = ref(false);
const renameValue = ref('');

// 编辑标签
const showTagsDialog = ref(false);
const editingTags = ref([]);

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

// 构建树形数据
const treeData = computed(() => {
  const buildTree = (items, parentId = null) => {
    return items
      .filter(item => item.parentId === parentId)
      .map(item => ({
        ...item,
        children: buildTree(items, item.id)
      }));
  };
  
  return buildTree(noteList.value);
});

// 切换侧边栏
function toggleSidebar() {
  sidebarCollapsed.value = !sidebarCollapsed.value;
}

// 切换搜索框
function toggleSearch() {
  showSearch.value = !showSearch.value;
  if (!showSearch.value) {
    searchKey.value = '';
    loadNoteList();
  }
}

// 切换排序
function toggleSort() {
  const orders = ['updateTime', 'createTime', 'noteTitle'];
  const currentIndex = orders.indexOf(sortOrder.value);
  sortOrder.value = orders[(currentIndex + 1) % orders.length];
  
  const sortNames = {
    updateTime: '按更新时间',
    createTime: '按创建时间',
    noteTitle: '按标题'
  };
  
  ElMessage.success(`${sortNames[sortOrder.value]}排序`);
  sortNoteList();
}

// 排序笔记列表
function sortNoteList() {
  if (sortOrder.value === 'noteTitle') {
    noteList.value.sort((a, b) => a.noteTitle.localeCompare(b.noteTitle));
  } else if (sortOrder.value === 'createTime') {
    noteList.value.sort((a, b) => new Date(b.createTime) - new Date(a.createTime));
  } else {
    noteList.value.sort((a, b) => new Date(b.updateTime) - new Date(a.updateTime));
  }
}

// 加载笔记列表
async function loadNoteList() {
  try {
    loading.value = true;
    const userId = localStorage.getItem('edu-user-id');
    
    const params = { userId };
    
    if (searchKey.value) {
      params.searchKey = searchKey.value;
    }
    
    if (selectedTags.value.length > 0) {
      params.noteTags = selectedTags.value;
    }
    
    const res = await noteApi.getList(params);
    noteList.value = res.data?.notes || [];
    sortNoteList();
  } catch (error) {
    console.error('获取笔记列表失败：', error);
    ElMessage.error('获取笔记列表失败');
    noteList.value = [];
  } finally {
    loading.value = false;
  }
}

// 加载标签
async function loadTags() {
  try {
    const userId = localStorage.getItem('edu-user-id');
    const res = await noteApi.getTags({ userId });
    tags.value = res.data?.tags || [];
  } catch (error) {
    console.error('获取标签失败：', error);
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
      noteTags: [],
      isFolder: false,
      parentId: currentNote.value?.isFolder ? currentNote.value.id : currentNote.value?.parentId || null,
    };
    
    const res = await noteApi.add(noteData);
    ElMessage.success('新建成功');
    
    await loadNoteList();
    
    // 自动选中新创建的笔记
    const newNote = noteList.value.find(n => n.id === res.data?.noteId);
    if (newNote) {
      currentNote.value = { ...newNote };
    }
  } catch (error) {
    console.error('新建笔记失败：', error);
    ElMessage.error(`新建笔记失败：${error.response?.data?.message || error.message || '未知错误'}`);
  }
}

// 新建文件夹
async function handleAddFolder() {
  try {
    const userId = localStorage.getItem('edu-user-id');
    
    const folderData = {
      userId,
      noteTitle: '新建文件夹',
      noteContent: '',
      noteTags: [],
      isFolder: true,
      parentId: currentNote.value?.isFolder ? currentNote.value.id : currentNote.value?.parentId || null,
    };
    
    const res = await noteApi.add(folderData);
    ElMessage.success('新建文件夹成功');
    
    await loadNoteList();
    
    // 自动选中新创建的文件夹
    const newFolder = noteList.value.find(n => n.id === res.data?.noteId);
    if (newFolder) {
      currentNote.value = { ...newFolder };
    }
  } catch (error) {
    console.error('新建文件夹失败：', error);
    ElMessage.error(`新建文件夹失败：${error.response?.data?.message || error.message || '未知错误'}`);
  }
}

// 节点点击
function handleNodeClick(data) {
  // 保存当前笔记
  if (currentNote.value && saveTimer) {
    clearTimeout(saveTimer);
    saveCurrentNote();
  }
  
  currentNote.value = { ...data };
}

// 右键菜单
function handleContextMenu(event, data, node) {
  event.preventDefault();
  event.stopPropagation();
  
  contextMenuNode.value = data;
  contextMenuPos.value = { x: event.clientX, y: event.clientY };
  showContextMenu.value = true;
  
  // 点击其他地方关闭菜单
  nextTick(() => {
    const closeMenu = (e) => {
      showContextMenu.value = false;
      document.removeEventListener('click', closeMenu);
    };
    setTimeout(() => {
      document.addEventListener('click', closeMenu);
    }, 100);
  });
}

// 重命名
function handleRename() {
  if (!contextMenuNode.value) return;
  
  showContextMenu.value = false;
  renameValue.value = contextMenuNode.value.noteTitle;
  showRenameDialog.value = true;
}

// 编辑标签
function handleEditTags() {
  if (!contextMenuNode.value) return;
  
  showContextMenu.value = false;
  editingTags.value = [...(contextMenuNode.value.noteTags || [])];
  showTagsDialog.value = true;
}

// 确认编辑标签
async function confirmEditTags() {
  if (!contextMenuNode.value) return;
  
  try {
    await noteApi.update(contextMenuNode.value.id, {
      noteTitle: contextMenuNode.value.noteTitle,
      noteTags: editingTags.value,
      noteContent: contextMenuNode.value.noteContent,
      parentId: contextMenuNode.value.parentId,
    });
    
    ElMessage.success('标签更新成功');
    showTagsDialog.value = false;
    
    await loadNoteList();
    await loadTags();
    
    // 如果编辑的是当前笔记，更新当前笔记
    if (currentNote.value?.id === contextMenuNode.value.id) {
      currentNote.value.noteTags = [...editingTags.value];
    }
  } catch (error) {
    console.error('更新标签失败：', error);
    ElMessage.error('更新标签失败');
  }
}

// 确认重命名
async function confirmRename() {
  if (!renameValue.value.trim()) {
    ElMessage.warning('名称不能为空');
    return;
  }
  
  try {
    await noteApi.update(contextMenuNode.value.id, {
      noteTitle: renameValue.value.trim(),
      noteTags: contextMenuNode.value.noteTags,
      noteContent: contextMenuNode.value.noteContent,
      parentId: contextMenuNode.value.parentId,
    });
    
    ElMessage.success('重命名成功');
    showRenameDialog.value = false;
    
    await loadNoteList();
    
    // 如果重命名的是当前笔记，更新当前笔记
    if (currentNote.value?.id === contextMenuNode.value.id) {
      currentNote.value.noteTitle = renameValue.value.trim();
    }
  } catch (error) {
    console.error('重命名失败：', error);
    ElMessage.error('重命名失败');
  }
}

// 删除
async function handleDelete() {
  if (!contextMenuNode.value) return;
  
  try {
    const message = contextMenuNode.value.isFolder 
      ? '确定要删除这个文件夹吗？文件夹内的所有内容也会被删除。' 
      : '确定要删除这篇笔记吗？';
    
    await ElMessageBox.confirm(message, '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    });
    
    await noteApi.delete(contextMenuNode.value.id);
    ElMessage.success('删除成功');
    
    // 如果删除的是当前笔记，清空当前笔记
    if (currentNote.value?.id === contextMenuNode.value.id) {
      currentNote.value = null;
    }
    
    await loadNoteList();
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除失败：', error);
      ElMessage.error('删除失败');
    }
  }
}

// 标签变化
function handleMetaChange() {
  triggerAutoSave();
  loadTags();
}

// 内容变化
function handleContentChange() {
  triggerAutoSave();
}

// 触发自动保存
function triggerAutoSave() {
  if (saveTimer) {
    clearTimeout(saveTimer);
  }
  
  saveTimer = setTimeout(() => {
    saveCurrentNote();
  }, 1000);
}

// 保存当前笔记
async function saveCurrentNote() {
  if (!currentNote.value || currentNote.value.isFolder) return;
  
  try {
    await noteApi.update(currentNote.value.id, {
      noteTitle: currentNote.value.noteTitle || '无标题笔记',
      noteTags: currentNote.value.noteTags,
      noteContent: currentNote.value.noteContent,
      parentId: currentNote.value.parentId,
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

// 搜索处理
let searchTimer = null;
function handleSearch() {
  if (searchTimer) {
    clearTimeout(searchTimer);
  }
  
  searchTimer = setTimeout(() => {
    loadNoteList();
  }, 500);
}

// 页面加载
onMounted(() => {
  loadNoteList();
  loadTags();
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
  transition: transform 0.3s;
}

.note-sidebar.collapsed {
  transform: translateX(-300px);
}

.sidebar-header {
  padding: 16px;
  border-bottom: 1px solid #e4e7ed;
  background: #fff;
  display: flex;
  gap: 8px;
  justify-content: center;
  flex-shrink: 0;
}

.search-box {
  padding: 12px;
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
  padding: 0 12px 12px 12px;
  border-bottom: 1px solid #e4e7ed;
  background: #fff;
}

.note-tree {
  flex: 1;
  overflow-y: auto;
  padding: 12px;
  background: #fafafa;
}

.note-tree::-webkit-scrollbar {
  width: 6px;
}

.note-tree::-webkit-scrollbar-thumb {
  background: #dcdfe6;
  border-radius: 3px;
}

.note-tree :deep(.el-tree-node__content) {
  height: 36px;
  padding: 0 8px;
  border-radius: 6px;
  transition: all 0.2s;
}

.note-tree :deep(.el-tree-node__content:hover) {
  background: #f0f2f5;
}

.note-tree :deep(.el-tree-node.is-current > .el-tree-node__content) {
  background: #e8f4ff;
  color: #0969da;
  font-weight: 500;
}

.note-tree :deep(.el-tree-node.is-current > .el-tree-node__content:hover) {
  background: #d0e8ff;
}

.tree-node {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  width: 100%;
}

.node-label {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* 自定义右键菜单 */
.custom-context-menu {
  position: fixed;
  background: #fff;
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  padding: 6px;
  min-width: 160px;
  z-index: 9999;
  animation: fadeIn 0.15s ease;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(-4px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.menu-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  color: #303133;
  transition: all 0.2s;
  user-select: none;
}

.menu-item:hover {
  background: #f0f2f5;
}

.menu-item.danger {
  color: #f56c6c;
}

.menu-item.danger:hover {
  background: #fef0f0;
}

.menu-divider {
  height: 1px;
  background: #e4e7ed;
  margin: 6px 0;
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
  transition: left 0.3s;
}

.editor-container.expanded {
  left: 60px;
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
  padding: 16px 20px;
  border-bottom: 1px solid #e4e7ed;
  background: #fff;
  gap: 12px;
  flex-shrink: 0;
}

.file-name {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.editor-meta {
  display: flex;
  align-items: center;
  padding: 12px 20px;
  border-bottom: 1px solid #e4e7ed;
  background: #fafafa;
  gap: 8px;
  flex-wrap: wrap;
}

.meta-label {
  font-size: 14px;
  color: #606266;
  font-weight: 500;
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

.folder-tip {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #fafafa;
}
</style>
