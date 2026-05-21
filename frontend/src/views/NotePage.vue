<template>
  <div class="note-page-container">
        <!-- 实时数据统计 -->
    <div class="stats-bar">
      <div class="stat-item">
        <el-icon size="24" color="#0969da"><Notebook /></el-icon>
        <div class="stat-content">
          <div class="stat-value">{{ stats.totalNotes || 0 }}</div>
          <div class="stat-label">笔记总数</div>
        </div>
      </div>
      <div class="stat-item">
        <el-icon size="24" color="#35b778"><TrendCharts /></el-icon>
        <div class="stat-content">
          <div class="stat-value">{{ stats.thisWeekNotes || 0 }}</div>
          <div class="stat-label">本周新增</div>
        </div>
      </div>
      <div class="stat-item">
        <el-icon size="24" color="#ffc107"><Trophy /></el-icon>
        <div class="stat-content">
          <div class="stat-value">{{ stats.studyDays || 0 }}</div>
          <div class="stat-label">连续学习天数</div>
        </div>
      </div>
    </div>

    <!-- 主内容区 -->
    <div class="note-content">
      <!-- 左侧：笔记列表 -->
      <div class="left-section">
        <div class="notes-container">
          <div class="section-header">
            <div class="header-left">
              <el-icon size="20"><Document /></el-icon>
              <span>我的笔记</span>
              <span v-if="selectedCategory" class="filter-hint">
                （{{ getCategoryText(selectedCategory) }}）
              </span>
            </div>
            <div class="header-actions">
              <!-- 分页控制 -->
              <el-pagination
                v-if="filteredNotes.length > notePageSize"
                v-model:current-page="noteCurrentPage"
                :page-size="notePageSize"
                :total="filteredNotes.length"
                layout="prev, pager, next"
                small
                @current-change="handleNotePageChange"
              />
              <el-button 
                type="primary" 
                size="small" 
                :icon="Setting" 
                @click="showManageDialog = true"
              >
                管理
              </el-button>
              <el-button 
                type="primary" 
                size="small" 
                :icon="Plus" 
                @click="handleAddNote"
              >
                新增笔记
              </el-button>
            </div>
          </div>
          
          <div class="note-list" v-loading="loading">
            <div class="note-grid">
              <div 
                v-for="(note, index) in paginatedNotes" 
                :key="note.id"
                class="note-card"
                :style="{ background: getCardColor(index) }"
              >
                <div class="card-content" @click="handleNoteDetail(note)">
                  <div class="card-header-row">
                    <div class="card-category">
                      {{ getCategoryText(note.noteCategory) }}
                    </div>
                    <div class="card-time">{{ formatTime(note.createTime) }}</div>
                  </div>
                  
                  <div class="card-title">{{ note.noteTitle }}</div>
                  
                  <div class="card-footer">
                    <div class="card-tags">
                      <span 
                        v-for="tag in note.noteTag" 
                        :key="tag"
                        class="card-tag"
                      >
                        {{ getTagText(tag) }}
                      </span>
                    </div>
                    <div class="card-edit-icon" @click.stop="handleEditNote(note)" title="编辑笔记">
                      <el-icon><Edit /></el-icon>
                      <span>编辑</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <el-empty v-if="filteredNotes.length === 0 && !loading" description="暂无笔记，快去创建第一篇吧！" />
          </div>
        </div>
      </div>

      <!-- 右侧：用户信息和分类统计 -->
      <div class="right-section">
        <!-- 用户信息卡片 -->
        <div class="user-info-card">
          <div class="user-info-header">
            <el-avatar :size="70" :src="userInfo.avatar" />
          </div>
          <div class="user-motto-section" @click="showMottoDialog = true">
            <div class="motto-text">{{ userInfo.motto || '点击设置你的座右铭' }}</div>
            <el-icon class="motto-edit-icon">
              <Edit />
            </el-icon>
          </div>
        </div>

        <!-- 笔记分类统计 -->
        <div class="category-stats-box">
          <div class="box-header">
            <div class="header-left">
              <el-icon size="18"><DataAnalysis /></el-icon>
              <span>分类统计</span>
            </div>
            <el-button 
              v-if="selectedCategory"
              size="small" 
              type="primary" 
              text
              @click="clearCategoryFilter"
            >
              清除筛选
            </el-button>
          </div>
          <div class="category-stats-list">
            <div 
              class="category-stat-item"
              :class="{ active: selectedCategory === 'knowledge_summary' }"
              @click="filterByCategory('knowledge_summary')"
            >
              <div class="category-stat-label">
                <span class="category-dot" style="background: #0969da;"></span>
                知识点总结
              </div>
              <div class="category-stat-value">{{ categoryStats.knowledge_summary || 0 }}</div>
            </div>
            <div 
              class="category-stat-item"
              :class="{ active: selectedCategory === 'exercise_analysis' }"
              @click="filterByCategory('exercise_analysis')"
            >
              <div class="category-stat-label">
                <span class="category-dot" style="background: #35b778;"></span>
                练习题解析
              </div>
              <div class="category-stat-value">{{ categoryStats.exercise_analysis || 0 }}</div>
            </div>
            <div 
              class="category-stat-item"
              :class="{ active: selectedCategory === 'class_note' }"
              @click="filterByCategory('class_note')"
            >
              <div class="category-stat-label">
                <span class="category-dot" style="background: #ffc107;"></span>
                课堂笔记
              </div>
              <div class="category-stat-value">{{ categoryStats.class_note || 0 }}</div>
            </div>
            <div 
              class="category-stat-item"
              :class="{ active: selectedCategory === 'review_experience' }"
              @click="filterByCategory('review_experience')"
            >
              <div class="category-stat-label">
                <span class="category-dot" style="background: #e74c3c;"></span>
                复习心得
              </div>
              <div class="category-stat-value">{{ categoryStats.review_experience || 0 }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 6. 新增/编辑弹框 -->
    <el-dialog
      v-model="showNoteDialog"
      :title="isEdit ? '编辑学习笔记' : '新增学习笔记'"
      width="800px"
      center
      :close-on-click-modal="true"
      class="blue-border-dialog"
    >
      <el-form
        :model="noteForm"
        class="note-form"
        label-width="100px"
        :rules="noteFormRules"
        ref="noteFormRef"
      >
        <el-form-item prop="noteTitle">
          <template #label>
            <div class="form-label-tag">笔记标题</div>
          </template>
          <el-input
            v-model="noteForm.noteTitle"
            placeholder="请输入笔记标题（如：Vue生命周期详解）"
            maxlength="100"
            show-word-limit
          />
        </el-form-item>
        <el-form-item prop="noteCategory">
          <template #label>
            <div class="form-label-tag">笔记分类</div>
          </template>
          <el-select
            v-model="noteForm.noteCategory"
            placeholder="请选择笔记分类"
          >
            <el-option label="知识点总结" value="knowledge_summary" />
            <el-option label="练习题解析" value="exercise_analysis" />
            <el-option label="课堂笔记" value="class_note" />
            <el-option label="复习心得" value="review_experience" />
          </el-select>
        </el-form-item>
        <el-form-item prop="noteTag">
          <template #label>
            <div class="form-label-tag">笔记标签</div>
          </template>
          <div class="tag-selector">
            <div class="tag-options">
              <el-checkbox-group v-model="noteForm.noteTag" :max="2">
                <!-- 固定标签放在前面 -->
                <el-checkbox label="重点" value="key_point" />
                <el-checkbox label="难点" value="difficult_point" />
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
        <el-form-item prop="noteContent">
          <template #label>
            <div class="form-label-tag">笔记内容</div>
          </template>
          <el-input
            v-model="noteForm.noteContent"
            type="textarea"
            placeholder="请输入笔记详细内容（支持Markdown格式，后续可扩展）"
            rows="6"
            maxlength="2000"
            show-word-limit
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showNoteDialog = false">取消</el-button>
        <el-button type="primary" @click="handleSaveNote">确认保存</el-button>
      </template>
    </el-dialog>

    <!-- 7. 设置座右铭弹框 -->
    <el-dialog
      v-model="showMottoDialog"
      title="设置我的座右铭"
      width="600px"
      center
      :close-on-click-modal="true"
      class="blue-border-dialog"
    >
      <el-form label-width="80px">
        <el-form-item label="座右铭">
          <el-input
            v-model="mottoInput"
            type="textarea"
            :rows="3"
            placeholder="输入一句激励你学习的名人名言或座右铭..."
            maxlength="100"
            show-word-limit
          />
        </el-form-item>
        <el-form-item label="推荐">
          <div class="motto-suggestions">
            <el-tag 
              v-for="(motto, index) in mottoSuggestions" 
              :key="index"
              class="motto-tag"
              @click="mottoInput = motto"
            >
              {{ motto }}
            </el-tag>
          </div>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showMottoDialog = false">取消</el-button>
        <el-button type="primary" @click="saveMotto">保存</el-button>
      </template>
    </el-dialog>

    <!-- 9. 笔记详情对话框 -->
    <el-dialog
      v-model="showNoteDetailDialog"
      title="笔记详情"
      width="900px"
      center
      :close-on-click-modal="true"
      :show-close="true"
      class="blue-border-dialog"
    >
      <div v-if="currentNoteDetail" class="note-detail-content">
        <div class="detail-time-only">
          创建时间：{{ formatBeijingTime(currentNoteDetail.createTime) }}
        </div>
        
        <div class="detail-content-only">
          {{ currentNoteDetail.noteContent }}
        </div>
      </div>
    </el-dialog>

    <!-- 10. 管理笔记对话框 -->
    <el-dialog
      v-model="showManageDialog"
      title="管理笔记"
      width="900px"
      center
      :close-on-click-modal="true"
      class="blue-border-dialog"
    >
      <div class="manage-dialog-content">
        <div class="manage-toolbar-dialog">
          <el-checkbox 
            v-model="selectAll"
            @change="handleSelectAll"
            :indeterminate="isIndeterminate"
          >
            全选
          </el-checkbox>
          <el-button 
            v-if="selectedNotes.length > 0"
            type="danger" 
            size="small"
            :icon="Delete" 
            @click="batchDeleteNotes"
            :disabled="selectedNotes.length === 0"
          >
            删除选中 ({{ selectedNotes.length }})
          </el-button>
        </div>
        
        <div class="notes-list-manage">
          <div 
            v-for="note in noteList" 
            :key="note.id"
            class="note-manage-item"
          >
            <el-checkbox 
              :model-value="selectedNotes.includes(note.id)"
              @change="(val) => handleNoteCheckChange(val, note.id)"
            />
            <div class="note-manage-content" @click="handleNoteDetail(note)">
              <div class="note-manage-title">{{ note.noteTitle }}</div>
              <div class="note-manage-meta">
                <el-tag size="small" :type="getCategoryTagType(note.noteCategory)">
                  {{ getCategoryText(note.noteCategory) }}
                </el-tag>
                <span class="note-manage-tags">
                  <el-tag 
                    v-for="tag in note.noteTag.slice(0, 2)" 
                    :key="tag"
                    size="small"
                    style="margin-right: 4px;"
                  >
                    {{ getTagText(tag) }}
                  </el-tag>
                  <span v-if="note.noteTag.length > 2" style="font-size: 12px; color: #999;">
                    +{{ note.noteTag.length - 2 }}
                  </span>
                </span>
                <span class="note-manage-time">{{ formatBeijingTime(note.createTime) }}</span>
              </div>
            </div>
            <div class="note-manage-actions">
              <el-button 
                type="primary" 
                size="small"
                @click="handleEditNote(note)"
              >
                编辑
              </el-button>
            </div>
          </div>
        </div>
        
        <el-empty 
          v-if="noteList.length === 0" 
          description="暂无笔记" 
          :image-size="100"
        />
      </div>
      
      <template #footer>
        <el-button @click="showManageDialog = false">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
/* ============== 依赖引入 ============== */
import { ref, reactive, onMounted, computed, watch } from "vue";
import { useRouter } from "vue-router";
import { ElMessage, ElMessageBox } from "element-plus";
import {
  Plus,
  Edit,
  Delete,
  Notebook,
  Document,
  TrendCharts,
  Trophy,
  Medal,
  DataAnalysis,
  Setting
} from "@element-plus/icons-vue";
import axios from "axios";
// 【新增】引入用户科目工具
import { getUserSubjects, getSubjectCode, hasUserSubjects } from "@/utils/userSubjects";

/* ============== 基础变量 ============== */
const router = useRouter();
const loading = ref(false);
const showNoteDialog = ref(false);
const isEdit = ref(false);
const noteFormRef = ref(null);

// 分页
const noteCurrentPage = ref(1);
const notePageSize = ref(8); // 每页显示8条笔记（4列2行）

// 查看笔记详情
const showNoteDetailDialog = ref(false);
const currentNoteDetail = ref(null);

// 管理模式
const showManageDialog = ref(false);
const selectedNotes = ref([]);

// 当前选择的分类筛选
const selectedCategory = ref('');

// 彩色背景色数组（更饱和的颜色）
const cardColors = [
  'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
  'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
  'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
  'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
  'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
  'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)',
  'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)',
  'linear-gradient(135deg, #ff6e7f 0%, #bfe9ff 100%)',
  'linear-gradient(135deg, #e0c3fc 0%, #8ec5fc 100%)',
  'linear-gradient(135deg, #f77062 0%, #fe5196 100%)',
  'linear-gradient(135deg, #30cfd0 0%, #330867 100%)'
];

// 为每个笔记分配颜色
function getCardColor(index) {
  return cardColors[index % cardColors.length];
}

const filterForm = reactive({
  noteCategory: "",
  noteTag: [],
  createTimeRange: [],
});

const noteForm = reactive({
  id: "",
  noteTitle: "",
  noteCategory: "",
  noteTag: [],
  noteContent: "",
});

const noteFormRules = {
  noteTitle: [
    { required: true, message: "请输入学习笔记标题", trigger: "blur" },
  ],
  noteCategory: [
    { required: true, message: "请选择笔记分类", trigger: "change" },
  ],
  noteTag: [
    { required: true, message: "请至少选择一个笔记标签", trigger: "change" },
  ],
  noteContent: [
    { required: true, message: "请输入笔记详细内容", trigger: "blur" },
  ],
};

const noteList = ref([]);

// 【新增】用户科目相关
const userSubjects = ref([]);

// 用户信息
const userInfo = reactive({
  nickname: localStorage.getItem('edu-nickname') || '智慧学习者',
  avatar: localStorage.getItem('edu-avatar') || 'https://cube.elemecdn.com/3/7c/3ea6beec64369c2642b92c6726f1epng.png',
  motto: localStorage.getItem('edu-motto') || '书山有路勤为径，学海无涯苦作舟'
});

// 统计数据
const stats = reactive({
  totalNotes: 0,
  thisWeekNotes: 0,
  studyDays: 0
});

// 分类统计
const categoryStats = reactive({
  knowledge_summary: 0,
  exercise_analysis: 0,
  class_note: 0,
  review_experience: 0
});

/* 弹窗开关 */
const showMottoDialog = ref(false);
const mottoInput = ref('');

// 全选状态
const selectAll = ref(false);
const isIndeterminate = ref(false);

// 名人名言推荐
const mottoSuggestions = [
  '书山有路勤为径，学海无涯苦作舟',
  '天才是1%的灵感加99%的汗水',
  '读书破万卷，下笔如有神',
  '学而不思则罔，思而不学则殆',
  '知识就是力量，学习改变命运',
  '活到老，学到老',
  '业精于勤，荒于嬉',
  '温故而知新，可以为师矣'
];

/* 计算属性 */
const paginatedNotes = computed(() => {
  const start = (noteCurrentPage.value - 1) * notePageSize.value;
  const end = start + notePageSize.value;
  return filteredNotes.value.slice(start, end);
});

// 根据分类筛选笔记
const filteredNotes = computed(() => {
  if (!selectedCategory.value) {
    return noteList.value;
  }
  return noteList.value.filter(note => note.noteCategory === selectedCategory.value);
});

/* 生命周期 */
onMounted(async () => {
  // 先加载用户科目
  userSubjects.value = await getUserSubjects();
  // 再加载笔记列表
  loadNoteList();
  calculateStats();
  loadUserMotto();
});

/* 时间格式化 */
function formatTime(timeStr) {
  if (!timeStr) return '';
  
  const time = new Date(timeStr.replace(' ', 'T'));
  const now = new Date();
  
  const diff = Math.floor((now - time) / 1000);
  
  if (diff < 60) return '刚刚';
  if (diff < 3600) return `${Math.floor(diff / 60)}分钟前`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}小时前`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}天前`;
  return timeStr.split(' ')[0];
}

// 格式化为北京时间
function formatBeijingTime(timeStr) {
  if (!timeStr) return '';
  
  const time = new Date(timeStr.replace(' ', 'T'));
  
  // 格式化为北京时间：YYYY-MM-DD HH:mm:ss
  const year = time.getFullYear();
  const month = String(time.getMonth() + 1).padStart(2, '0');
  const day = String(time.getDate()).padStart(2, '0');
  const hours = String(time.getHours()).padStart(2, '0');
  const minutes = String(time.getMinutes()).padStart(2, '0');
  const seconds = String(time.getSeconds()).padStart(2, '0');
  
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

/* 核心业务 */
async function loadNoteList() {
  loading.value = true;
  try {
    const userId = localStorage.getItem("edu-user-id") || "default-user";
    const res = await axios.get("http://localhost:3001/api/note/list", {
      params: {
        userId,
        pageNum: 1,
        pageSize: 999, // 获取所有笔记用于前端分页和统计
      },
      timeout: 10000,
    });
    noteList.value = res.data?.notes || [];
    calculateStats();
  } catch (error) {
    console.error("获取笔记列表失败：", error);
    ElMessage.error(
      error.response?.data?.message || "获取笔记列表失败，请检查后端服务"
    );
    noteList.value = [];
  } finally {
    loading.value = false;
  }
}

// 按分类筛选
function filterByCategory(category) {
  if (selectedCategory.value === category) {
    // 如果点击的是当前分类，则取消筛选
    selectedCategory.value = '';
  } else {
    selectedCategory.value = category;
  }
  noteCurrentPage.value = 1; // 重置到第一页
}

// 清除分类筛选
function clearCategoryFilter() {
  selectedCategory.value = '';
  noteCurrentPage.value = 1;
}

// 处理笔记选择变化
function handleNoteCheckChange(checked, noteId) {
  if (checked) {
    if (!selectedNotes.value.includes(noteId)) {
      selectedNotes.value.push(noteId);
    }
  } else {
    const index = selectedNotes.value.indexOf(noteId);
    if (index > -1) {
      selectedNotes.value.splice(index, 1);
    }
  }
}

// 全选/取消全选
function handleSelectAll(val) {
  if (val) {
    selectedNotes.value = noteList.value.map(note => note.id);
  } else {
    selectedNotes.value = [];
  }
  isIndeterminate.value = false;
}

// 监听选中项变化，更新全选状态
watch(selectedNotes, (newVal) => {
  const checkedCount = newVal.length;
  const totalCount = noteList.value.length;
  
  selectAll.value = checkedCount === totalCount && totalCount > 0;
  isIndeterminate.value = checkedCount > 0 && checkedCount < totalCount;
});

// 批量删除笔记
async function batchDeleteNotes() {
  if (selectedNotes.value.length === 0) {
    ElMessage.warning('请选择要删除的笔记');
    return;
  }
  
  try {
    await ElMessageBox.confirm(
      `确定删除选中的 ${selectedNotes.value.length} 篇笔记吗？删除后无法恢复。`,
      '批量删除确认',
      {
        type: 'warning',
        confirmButtonText: '确定删除',
        cancelButtonText: '取消'
      }
    );
    
    loading.value = true;
    
    // 批量删除
    for (const noteId of selectedNotes.value) {
      await axios.delete(`http://localhost:3001/api/note/delete/${noteId}`, {
        timeout: 10000,
      });
    }
    
    ElMessage.success(`成功删除 ${selectedNotes.value.length} 篇笔记`);
    selectedNotes.value = [];
    selectAll.value = false;
    isIndeterminate.value = false;
    showManageDialog.value = false;
    loadNoteList();
  } catch (error) {
    if (error !== 'cancel') {
      console.error("批量删除笔记失败：", error);
      ElMessage.error("删除失败，请重试");
    }
  } finally {
    loading.value = false;
  }
}

// 计算统计数据
function calculateStats() {
  stats.totalNotes = noteList.value.length;
  
  // 计算本周新增
  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  stats.thisWeekNotes = noteList.value.filter(note => {
    const noteTime = new Date(note.createTime);
    return noteTime >= weekAgo;
  }).length;
  
  // 计算真正的连续学习天数
  stats.studyDays = calculateContinuousDays();
  
  // 计算分类统计
  categoryStats.knowledge_summary = noteList.value.filter(n => n.noteCategory === 'knowledge_summary').length;
  categoryStats.exercise_analysis = noteList.value.filter(n => n.noteCategory === 'exercise_analysis').length;
  categoryStats.class_note = noteList.value.filter(n => n.noteCategory === 'class_note').length;
  categoryStats.review_experience = noteList.value.filter(n => n.noteCategory === 'review_experience').length;
}

// 计算真正的连续学习天数（从最近的日期往前推算）
function calculateContinuousDays() {
  if (noteList.value.length === 0) return 0;
  
  // 1. 提取所有笔记的日期（只保留日期部分，去除时间）
  const dates = noteList.value.map(note => {
    const dateStr = note.createTime.split(' ')[0]; // 格式：YYYY-MM-DD
    return new Date(dateStr);
  });
  
  // 2. 去重并排序（从最新到最旧）
  const uniqueDates = [...new Set(dates.map(d => d.getTime()))]
    .sort((a, b) => b - a)
    .map(timestamp => new Date(timestamp));
  
  if (uniqueDates.length === 0) return 0;
  
  // 3. 从最新的日期开始，往前检查是否连续
  let continuousDays = 1; // 至少有1天（最新的那天）
  const today = new Date();
  today.setHours(0, 0, 0, 0); // 重置为当天0点
  
  const latestDate = new Date(uniqueDates[0]);
  latestDate.setHours(0, 0, 0, 0);
  
  // 检查最新的笔记日期是否是今天或昨天，如果超过1天则从0开始
  const daysDiff = Math.floor((today - latestDate) / (1000 * 60 * 60 * 24));
  if (daysDiff > 1) {
    return 0; // 超过1天没有学习，连续天数归零
  }
  
  // 4. 从第二个日期开始检查连续性
  for (let i = 1; i < uniqueDates.length; i++) {
    const currentDate = new Date(uniqueDates[i]);
    const previousDate = new Date(uniqueDates[i - 1]);
    
    currentDate.setHours(0, 0, 0, 0);
    previousDate.setHours(0, 0, 0, 0);
    
    // 计算两个日期之间的天数差
    const diff = Math.floor((previousDate - currentDate) / (1000 * 60 * 60 * 24));
    
    if (diff === 1) {
      // 连续的日期，天数+1
      continuousDays++;
    } else {
      // 日期不连续，停止计算
      break;
    }
  }
  
  return continuousDays;
}

function handleNotePageChange(page) {
  noteCurrentPage.value = page;
}

function handleNoteDetail(row) {
  currentNoteDetail.value = row;
  showNoteDetailDialog.value = true;
}

function handleAddNote() {
  isEdit.value = false;
  Object.assign(noteForm, {
    id: "",
    noteTitle: "",
    noteCategory: "",
    noteTag: [],
    noteContent: "",
  });
  showNoteDialog.value = true;
}

function handleEditNote(row) {
  isEdit.value = true;
  Object.assign(noteForm, {
    id: row.id,
    noteTitle: row.noteTitle,
    noteCategory: row.noteCategory,
    noteTag: row.noteTag,
    noteContent: row.noteContent,
  });
  showNoteDialog.value = true;
}

async function handleSaveNote() {
  try {
    await noteFormRef.value.validate();
    loading.value = true;
    
    const userId = localStorage.getItem("edu-user-id") || "default-user";
    const noteData = {
      userId,
      noteTitle: noteForm.noteTitle,
      noteCategory: noteForm.noteCategory,
      noteTag: noteForm.noteTag,
      noteContent: noteForm.noteContent,
    };
    
    if (isEdit.value) {
      await axios.put(
        `http://localhost:3001/api/note/update/${noteForm.id}`,
        noteData,
        { timeout: 10000 }
      );
      ElMessage.success("编辑成功");
    } else {
      await axios.post("http://localhost:3001/api/note/add", noteData, {
        timeout: 10000,
      });
      ElMessage.success("新增成功");
    }
    
    showNoteDialog.value = false;
    loadNoteList();
  } catch (error) {
    console.error("保存笔记失败：", error);
    ElMessage.error(
      error.response?.data?.message || "保存失败，请重试"
    );
  } finally {
    loading.value = false;
  }
}

function handleDeleteNote(id) {
  ElMessageBox.confirm("确定删除这篇笔记吗？", "提示", { 
    type: "warning",
    confirmButtonText: '确定',
    cancelButtonText: '取消'
  })
    .then(async () => {
      try {
        loading.value = true;
        await axios.delete(`http://localhost:3001/api/note/delete/${id}`, {
          timeout: 10000,
        });
        ElMessage.success("删除成功");
        loadNoteList();
      } catch (error) {
        console.error("删除笔记失败：", error);
        ElMessage.error(
          error.response?.data?.message || "删除失败，请重试"
        );
      } finally {
        loading.value = false;
      }
    })
    .catch(() => {});
}

// 加载用户座右铭
function loadUserMotto() {
  const savedMotto = localStorage.getItem('edu-motto');
  if (savedMotto) {
    userInfo.motto = savedMotto;
  }
}

// 保存座右铭
async function saveMotto() {
  if (!mottoInput.value.trim()) {
    ElMessage.warning('请输入座右铭');
    return;
  }
  
  try {
    userInfo.motto = mottoInput.value.trim();
    localStorage.setItem('edu-motto', userInfo.motto);
    
    // 可选：同步到后端用户信息
    const userId = localStorage.getItem("edu-user-id");
    if (userId) {
      await axios.put(`http://localhost:3001/api/user/profile/${userId}`, {
        nickname: userInfo.nickname,
        avatar: userInfo.avatar,
        motto: userInfo.motto
      });
    }
    
    ElMessage.success('座右铭设置成功！');
    showMottoDialog.value = false;
    mottoInput.value = '';
  } catch (error) {
    console.error('保存座右铭失败：', error);
    // 即使后端保存失败，本地也已保存
    ElMessage.success('座右铭已保存到本地');
    showMottoDialog.value = false;
    mottoInput.value = '';
  }
}

// 从详情页编辑
function editFromDetail() {
  showNoteDetailDialog.value = false;
  handleEditNote(currentNoteDetail.value);
}

// 从详情页删除
function deleteFromDetail() {
  showNoteDetailDialog.value = false;
  handleDeleteNote(currentNoteDetail.value.id);
}

// 移除标签
function removeTag(tag) {
  const index = noteForm.noteTag.indexOf(tag);
  if (index > -1) {
    noteForm.noteTag.splice(index, 1);
  }
}

/* 辅助函数 */
const getCategoryText = (c) =>
  ({
    knowledge_summary: "知识点总结",
    exercise_analysis: "练习题解析",
    class_note: "课堂笔记",
    review_experience: "复习心得",
  }[c] || "未知分类");

const getCategoryTagType = (c) =>
  ({
    knowledge_summary: "primary",
    exercise_analysis: "success",
    class_note: "warning",
    review_experience: "danger",
  }[c] || "info");

const getTagText = (t) =>
  ({
    math: "数学",
    chinese: "语文",
    english: "英语",
    physics: "物理",
    chemistry: "化学",
    biology: "生物",
    history: "历史",
    geography: "地理",
    politics: "政治",
    key_point: "重点",
    difficult_point: "难点",
  }[t] || t);
</script>

<style scoped>
.note-page-container {
  min-height: 100vh;
  background: #f5f7fa;
}

/* 实时数据统计 */
.stats-bar {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
  padding: 20px 40px;
  background: #f8f9fa;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 24px;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  transition: all 0.3s;
  border: 2px solid #e4e7ed;
}

.stat-item:nth-child(1) {
  border-color: #0969da;
}

.stat-item:nth-child(2) {
  border-color: #35b778;
}

.stat-item:nth-child(3) {
  border-color: #ffc107;
}

.stat-item:hover {
  transform: translateY(-3px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
}

.stat-content {
  flex: 1;
}

.stat-value {
  font-size: 28px;
  font-weight: 700;
  color: #2c3e50;
  line-height: 1;
  margin-bottom: 6px;
}

.stat-label {
  font-size: 13px;
  color: #666;
  font-weight: 500;
}

/* 主内容区 */
.note-content {
  display: grid;
  grid-template-columns: 3fr 1fr;
  gap: 20px;
  padding: 24px 40px 40px;
  max-width: 1920px;
  margin: 0 auto;
}

/* 左侧：笔记列表 */
.left-section {
  display: flex;
  flex-direction: column;
}

.notes-container {
  background: #fff;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  display: flex;
  flex-direction: column;
  border: 2px solid #0969da;
  height: 520px;
  max-height: 520px;
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
  padding-bottom: 12px;
  border-bottom: 2px solid #e4e7ed;
  flex-shrink: 0;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 18px;
  font-weight: 600;
  color: #2c3e50;
}

.header-actions {
  display: flex;
  gap: 10px;
  align-items: center;
}

.header-actions .el-pagination {
  margin-right: 10px;
}

/* 笔记列表 */
.note-list {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
  overflow: hidden;
}

/* 笔记网格布局（2行4列，每个占1/8） */
.note-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  grid-template-rows: repeat(2, 1fr);
  gap: 16px;
  height: 100%;
}

/* 彩色卡片样式 */
.note-card {
  border-radius: 16px;
  transition: all 0.3s;
  position: relative;
  height: 100%;
  overflow: visible;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.note-card:hover {
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.15);
}

.card-content {
  padding: 16px;
  color: #fff;
  height: 100%;
  display: flex;
  flex-direction: column;
  cursor: pointer;
  gap: 10px;
}

.card-header-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.card-category {
  display: inline-block;
  padding: 5px 12px;
  background: #fff;
  border-radius: 16px;
  font-size: 12px;
  font-weight: 700;
  width: fit-content;
  color: #000;
  text-shadow: none;
  border: 2px solid rgba(0, 0, 0, 0.15);
  flex-shrink: 0;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.card-time {
  display: inline-block;
  padding: 5px 12px;
  background: #fff;
  border-radius: 16px;
  font-size: 12px;
  font-weight: 700;
  width: fit-content;
  color: #000;
  text-shadow: none;
  border: 2px solid rgba(0, 0, 0, 0.15);
  flex-shrink: 0;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  white-space: nowrap;
}

.card-title {
  font-size: 18px;
  font-weight: 700;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
  letter-spacing: 0.3px;
  flex: 1;
  display: flex;
  align-items: center;
  color: #000;
}

.card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: auto;
  flex-shrink: 0;
  gap: 8px;
}

.card-tags {
  display: flex;
  gap: 6px;
  align-items: center;
  flex-wrap: wrap;
  flex: 1;
}

.card-tag {
  padding: 4px 10px;
  background: rgba(255, 255, 255, 0.95);
  border-radius: 14px;
  font-size: 11px;
  font-weight: 600;
  border: 1px solid rgba(0, 0, 0, 0.1);
  color: rgba(0, 0, 0, 0.75);
  text-shadow: none;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.card-edit-icon {
  cursor: pointer;
  transition: all 0.3s;
  padding: 6px 16px;
  border-radius: 8px;
  background: #fff;
  color: #0969da;
  border: 2px solid #0969da;
  flex-shrink: 0;
  box-shadow: 0 2px 6px rgba(9, 105, 218, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  font-size: 13px;
  font-weight: 600;
  white-space: nowrap;
}

.card-edit-icon .el-icon {
  font-size: 16px;
}

.card-edit-icon:hover {
  background: #0969da;
  color: #fff;
  transform: scale(1.05);
  box-shadow: 0 4px 12px rgba(9, 105, 218, 0.5);
}

.card-time {
  font-size: 11px;
  font-weight: 600;
  background: rgba(255, 255, 255, 0.25);
  padding: 3px 8px;
  border-radius: 12px;
  white-space: nowrap;
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.3);
  backdrop-filter: blur(5px);
}

.filter-hint {
  font-size: 13px;
  color: #0969da;
  font-weight: 500;
  margin-left: 8px;
}

.more-tags {
  font-size: 11px;
  opacity: 0.9;
}

.note-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.note-category {
  padding: 4px 12px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 600;
  color: #fff;
}

.category-knowledge_summary {
  background: linear-gradient(135deg, #0969da 0%, #4dabf7 100%);
}

.category-exercise_analysis {
  background: linear-gradient(135deg, #35b778 0%, #2a9664 100%);
}

.category-class_note {
  background: linear-gradient(135deg, #ffc107 0%, #ff9800 100%);
}

.category-review_experience {
  background: linear-gradient(135deg, #e74c3c 0%, #c0392b 100%);
}

.note-time {
  font-size: 12px;
  color: #999;
}

.note-title {
  font-size: 16px;
  font-weight: 600;
  color: #2c3e50;
  line-height: 1.5;
  margin-bottom: 8px;
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.note-content-preview {
  font-size: 14px;
  color: #666;
  line-height: 1.6;
  margin-bottom: 12px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.note-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: auto;
}

.note-tags {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
  align-items: center;
}

/* 管理对话框样式 */
.manage-dialog-content {
  max-height: 600px;
  overflow-y: auto;
}

.manage-toolbar-dialog {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  background: #f8f9fa;
  border-radius: 8px;
  margin-bottom: 16px;
}

.notes-list-manage {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.note-manage-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  background: #fff;
  border: 2px solid #e4e7ed;
  border-radius: 8px;
  transition: all 0.3s;
}

.note-manage-item:hover {
  border-color: #0969da;
  box-shadow: 0 2px 8px rgba(9, 105, 218, 0.1);
}

.note-manage-content {
  flex: 1;
  cursor: pointer;
  min-width: 0;
}

.note-manage-title {
  font-size: 15px;
  font-weight: 600;
  color: #2c3e50;
  margin-bottom: 8px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  line-height: 1.5;
}

.note-manage-title:hover {
  color: #0969da;
}

.note-manage-meta {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 13px;
  color: #666;
  flex-wrap: wrap;
}

.note-manage-tags {
  display: flex;
  align-items: center;
  gap: 4px;
}

.note-manage-time {
  color: #999;
  font-size: 12px;
}

.note-manage-actions {
  display: flex;
  gap: 8px;
  flex-shrink: 0;
}

/* 右侧：用户信息和统计 */
.right-section {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.user-info-card {
  background: radial-gradient(ellipse at center, rgba(144, 202, 249, 0.15) 0%, rgba(144, 202, 249, 0.08) 40%, rgba(255, 255, 255, 0.95) 80%);
  border-radius: 12px;
  padding: 20px;
  color: #1e293b;
  box-shadow: 0 4px 12px rgba(9, 105, 218, 0.3);
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.user-info-header {
  display: flex;
  justify-content: center;
  align-items: center;
}

.user-info-header .el-avatar {
  border: 3px solid rgba(30, 41, 59, 0.2);
  flex-shrink: 0;
}

.user-motto-section {
  padding: 14px 16px;
  border-radius: 8px;
  background: rgba(144, 202, 249, 0.1);
  border: 1px dashed rgba(30, 41, 59, 0.2);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  cursor: pointer;
  transition: all 0.3s;
  position: relative;
}

.user-motto-section:hover {
  background: rgba(255, 255, 255, 0.25);
  border-color: rgba(255, 255, 255, 0.5);
  transform: translateY(-2px);
}

.motto-text {
  font-size: 14px;
  line-height: 1.6;
  opacity: 0.95;
  font-weight: 500;
  flex: 1;
  text-align: center;
}

.motto-edit-icon {
  font-size: 18px;
  opacity: 0.8;
  transition: all 0.3s;
  flex-shrink: 0;
}

.user-motto-section:hover .motto-edit-icon {
  opacity: 1;
  transform: scale(1.15);
}

/* 分类统计 */
.category-stats-box {
  background: #fff;
  border-radius: 12px;
  padding: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  border: 2px solid #35b778;
  flex-shrink: 0;
}

.box-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 6px;
  font-size: 15px;
  font-weight: 600;
  color: #2c3e50;
  margin-bottom: 12px;
  flex-shrink: 0;
}

.category-stats-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.category-stat-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 14px;
  background: #f8f9fa;
  border-radius: 6px;
  transition: all 0.3s;
  cursor: pointer;
}

.category-stat-item:hover {
  background: #e8f4ed;
  transform: translateX(4px);
}

.category-stat-item.active {
  background: #e8f4fd;
  border: 2px solid #0969da;
  transform: translateX(4px);
}

.category-stat-label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: #2c3e50;
}

.category-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.category-stat-value {
  font-size: 16px;
  font-weight: 600;
  color: #2c3e50;
}

/* 座右铭设置弹框 */
.motto-suggestions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.motto-tag {
  cursor: pointer;
  transition: all 0.3s;
}

.motto-tag:hover {
  transform: translateY(-2px);
  box-shadow: 0 2px 8px rgba(9, 105, 218, 0.2);
}

/* 笔记详情样式 */
.note-detail-content {
  padding: 10px;
}

.detail-time-only {
  font-size: 14px;
  color: #666;
  margin-bottom: 20px;
  padding: 12px;
  background: #f8f9fa;
  border-radius: 8px;
  border-left: 4px solid #0969da;
}

.detail-content-only {
  font-size: 16px;
  color: #333;
  line-height: 2;
  white-space: pre-wrap;
  background: #fff;
  padding: 24px;
  border-radius: 8px;
  border: 1px solid #e4e7ed;
  min-height: 300px;
  max-height: 500px;
  overflow-y: auto;
}

.detail-content-only::-webkit-scrollbar {
  width: 6px;
}

.detail-content-only::-webkit-scrollbar-thumb {
  background: #dcdfe6;
  border-radius: 3px;
}

.detail-content-only::-webkit-scrollbar-thumb:hover {
  background: #c0c4cc;
}

.tag-selector {
  width: 100%;
}

.tag-options {
  padding: 10px 12px;
  background: #f8f9fa;
  border-radius: 8px;
  border: 1px solid #e4e7ed;
}

.tag-options :deep(.el-checkbox-group) {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 8px 10px;
}

.tag-options :deep(.el-checkbox) {
  margin-right: 0;
  white-space: nowrap;
}

.tag-options :deep(.el-checkbox__label) {
  font-size: 13px;
  padding-left: 6px;
}

.tag-options :deep(.el-checkbox__input) {
  transform: scale(0.9);
}

.tag-limit-hint {
  margin-top: 8px;
  font-size: 12px;
  color: #f56c6c;
  font-weight: 500;
}

/* 蓝色描边对话框 */
:deep(.blue-border-dialog .el-dialog) {
  border: 3px solid #0969da;
  box-shadow: 0 4px 20px rgba(9, 105, 218, 0.3);
}

/* 响应式 */
@media (max-width: 1199px) {
  .note-content {
    grid-template-columns: 2.5fr 1fr;
  }
  
  .notes-container {
    height: 480px;
    max-height: 480px;
  }
}

@media (max-width: 992px) {
  .stats-bar {
    grid-template-columns: repeat(3, 1fr);
    padding: 16px 20px;
  }
  
  .note-content {
    grid-template-columns: 1fr;
    padding: 16px 20px;
  }
  
  .notes-container {
    height: auto;
    min-height: 400px;
    max-height: none;
  }
}

@media (max-width: 576px) {
  .stats-bar {
    grid-template-columns: 1fr;
  }
}

/* 蓝色框框标签样式 */
.form-label-tag {
  display: inline-block;
  padding: 4px 10px;
  background: rgba(9, 105, 218, 0.85);
  color: #fff;
  border-radius: 4px;
  font-size: 13px;
  font-weight: 500;
  box-shadow: 0 1px 4px rgba(9, 105, 218, 0.2);
  white-space: nowrap;
  line-height: 1.2;
}

/* 隐藏所有表单项左侧的红色必填标记 */
.el-form-item.is-required:not(.is-no-asterisk) > .el-form-item__label:before,
.el-form-item.is-required:not(.is-no-asterisk).asterisk-left > .el-form-item__label:before {
  display: none !important;
}
</style>
