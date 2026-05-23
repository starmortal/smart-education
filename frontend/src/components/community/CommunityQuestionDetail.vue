<template>
  <div v-if="question" class="question-detail">
    <div class="detail-header">
      <el-avatar :size="50" :src="question.userAvatar" />
      <div class="detail-user-info">
        <div class="detail-username">{{ question.userName }}</div>
        <div class="detail-meta">{{ question.userSchool }} · {{ gradeLabel }}</div>
        <div class="detail-time">{{ formatTime(question.createTime) }}</div>
      </div>
      <el-tag :type="question.solved ? 'success' : 'warning'">
        {{ question.solved ? '已解决' : '待解决' }}
      </el-tag>
    </div>

    <div class="detail-title">{{ question.title }}</div>
    <div class="detail-content">{{ question.content }}</div>

    <div class="detail-tags">
      <el-tag v-for="(tag, idx) in question.tags" :key="idx" size="small" type="primary">
        {{ tag }}
      </el-tag>
    </div>

    <div class="detail-actions" v-if="question.userId === currentUserId">
      <el-button
        v-if="!question.solved"
        type="success"
        size="small"
        @click="$emit('mark-solved', questionId)"
      >
        标记已解决
      </el-button>
      <el-button
        v-else
        type="warning"
        size="small"
        @click="$emit('mark-unsolved', questionId)"
      >
        标记未解决
      </el-button>
      <el-button type="danger" size="small" @click="$emit('delete-question', questionId)">
        删除问题
      </el-button>
    </div>

    <div class="answers-section">
      <div class="section-title">
        <el-icon><ChatDotRound /></el-icon>
        <span>回答 {{ totalAnswerCount }}</span>
      </div>

      <div class="answers-list">
        <CommunityAnswerThread
          v-for="answer in answerTree"
          :key="answer.id"
          :answer="answer"
          :depth="0"
          :question="question"
          :current-user-id="currentUserId"
          :format-time="formatTime"
          :replying-to-id="replyingToId"
          :nested-reply-content="nestedReplyContent"
          @like-answer="$emit('like-answer', $event)"
          @mark-best="$emit('mark-best', $event)"
          @start-reply="handleStartReply"
          @cancel-reply="handleCancelReply"
          @submit-nested-reply="handleSubmitNestedReply"
          @update:nested-reply-content="nestedReplyContent = $event"
        />
        <el-empty v-if="totalAnswerCount === 0" description="暂无回答" :image-size="80" />
      </div>

      <div class="answer-input-section">
        <div class="answer-input-bar">
          <el-input
            :model-value="answerContent"
            type="textarea"
            :autosize="{ minRows: 2, maxRows: 6 }"
            placeholder="写下你的回答，Enter 发送"
            maxlength="500"
            show-word-limit
            @update:model-value="$emit('update:answerContent', $event)"
            @keydown.enter.exact.prevent="handleSubmitRoot"
          />
          <el-button type="primary" :disabled="!answerContent.trim()" @click="handleSubmitRoot">
            发送
          </el-button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue';
import { ChatDotRound } from '@element-plus/icons-vue';
import CommunityAnswerThread from './CommunityAnswerThread.vue';
import { buildAnswerTree, countAllAnswers } from '@/utils/answerTree';

const props = defineProps({
  question: { type: Object, default: null },
  answers: { type: Array, default: () => [] },
  answerContent: { type: String, default: '' },
  currentUserId: { type: String, default: '' },
  gradeLabel: { type: String, default: '未设置' },
  formatTime: { type: Function, required: true }
});

const emit = defineEmits([
  'update:answerContent',
  'submit-answer',
  'like-answer',
  'mark-best',
  'mark-solved',
  'mark-unsolved',
  'delete-question'
]);

const questionId = computed(() => props.question?.id || props.question?._id);
const answerTree = computed(() => buildAnswerTree(props.answers));
const totalAnswerCount = computed(() => countAllAnswers(props.answers));

const replyingToId = ref('');
const replyingTarget = ref(null);
const nestedReplyContent = ref('');

watch(
  () => props.answers,
  () => {
    handleCancelReply();
  }
);

function handleStartReply(answer) {
  replyingToId.value = answer.id;
  replyingTarget.value = answer;
  nestedReplyContent.value = '';
}

function handleCancelReply() {
  replyingToId.value = '';
  replyingTarget.value = null;
  nestedReplyContent.value = '';
}

function handleSubmitRoot() {
  emit('submit-answer', { content: props.answerContent });
}

function handleSubmitNestedReply() {
  if (!nestedReplyContent.value.trim() || !replyingTarget.value) return;

  const target = replyingTarget.value;
  emit('submit-answer', {
    content: nestedReplyContent.value,
    parentId: target.id,
    replyToUserId: target.userId,
    replyToUserName: target.userName
  });
}
</script>

<style scoped>
.question-detail {
  padding: 10px 0;
}

.detail-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  background: #f8f9fa;
  border-radius: 8px;
  margin-bottom: 20px;
}

.detail-user-info {
  flex: 1;
}

.detail-username {
  font-size: 16px;
  font-weight: 600;
  color: #2c3e50;
}

.detail-meta {
  font-size: 13px;
  color: #666;
  margin-top: 4px;
}

.detail-time {
  font-size: 12px;
  color: #909399;
  margin-top: 2px;
}

.detail-title {
  font-size: 20px;
  font-weight: 700;
  color: #2c3e50;
  margin-bottom: 16px;
}

.detail-content {
  font-size: 15px;
  color: #333;
  line-height: 1.8;
  white-space: pre-wrap;
  margin-bottom: 16px;
}

.detail-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 16px;
}

.detail-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 20px;
}

.answers-section {
  border-top: 1px solid #e4e7ed;
  padding-top: 20px;
}

.answers-section .section-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 16px;
  font-weight: 600;
  color: #2c3e50;
}

.answers-list {
  margin-top: 10px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.answers-section .section-title {
  font-size: 13px;
}

.answer-input-section {
  margin-top: 14px;
}

.answer-input-bar {
  display: flex;
  gap: 8px;
  align-items: flex-end;
}

.answer-input-bar :deep(.el-textarea) {
  flex: 1;
}

.answer-input-bar :deep(.el-textarea__inner) {
  font-size: 12px;
  padding: 6px 10px;
}

.answer-input-bar .el-button {
  flex-shrink: 0;
  min-width: 56px;
  height: 30px;
  font-size: 12px;
  padding: 0 12px;
}
</style>
