<template>
  <div class="thread-node" :class="depth > 0 ? 'is-nested' : 'is-root'">
    <div class="answer-item">
      <el-avatar :size="avatarSize" :src="answer.userAvatar" class="answer-avatar" />
      <div class="answer-content-wrapper">
        <div class="answer-header">
          <span class="answer-username">{{ answer.userName }}</span>
          <el-tag v-if="answer.isBest && depth === 0" type="success" size="small" class="best-tag">
            <el-icon><Medal /></el-icon> 最佳
          </el-tag>
          <span class="answer-time">{{ formatTime(answer.createTime) }}</span>
        </div>
        <div class="answer-content">
          <span v-if="depth > 0 && answer.replyToUserName" class="reply-to">
            回复 <span class="reply-at">@{{ answer.replyToUserName }}</span>：
          </span>
          <span v-html="renderMarkdown(answer.content)"></span>
        </div>
        <div class="answer-actions">
          <el-button
            text
            size="small"
            :type="answer.liked ? 'primary' : 'default'"
            @click="$emit('like-answer', answer.id)"
          >
            <el-icon><Star /></el-icon>
            {{ answer.likeCount || 0 }}
          </el-button>
          <el-button text size="small" @click="$emit('start-reply', answer)">回复</el-button>
          <el-button
            v-if="depth === 0 && !answer.isBest && !question.solved && question.userId === currentUserId"
            text
            size="small"
            type="success"
            @click="$emit('mark-best', answer.id)"
          >
            <el-icon><Medal /></el-icon>
            最佳
          </el-button>
        </div>

        <div v-if="replyingToId === answer.id" class="nested-reply-box">
          <el-input
            :model-value="nestedReplyContent"
            type="textarea"
            :autosize="{ minRows: 1, maxRows: 4 }"
            :placeholder="`回复 @${answer.userName}`"
            maxlength="500"
            @update:model-value="$emit('update:nestedReplyContent', $event)"
            @keydown.enter.exact.prevent="$emit('submit-nested-reply')"
          />
          <div class="nested-reply-actions">
            <el-button size="small" @click="$emit('cancel-reply')">取消</el-button>
            <el-button
              type="primary"
              size="small"
              :disabled="!nestedReplyContent.trim()"
              @click="$emit('submit-nested-reply')"
            >
              发送
            </el-button>
          </div>
        </div>
      </div>
    </div>

    <div v-if="answer.children?.length" class="children-list">
      <CommunityAnswerThread
        v-for="child in answer.children"
        :key="child.id"
        :answer="child"
        :depth="depth + 1"
        :question="question"
        :current-user-id="currentUserId"
        :format-time="formatTime"
        :replying-to-id="replyingToId"
        :nested-reply-content="nestedReplyContent"
        @like-answer="$emit('like-answer', $event)"
        @mark-best="$emit('mark-best', $event)"
        @start-reply="$emit('start-reply', $event)"
        @cancel-reply="$emit('cancel-reply')"
        @submit-nested-reply="$emit('submit-nested-reply')"
        @update:nested-reply-content="$emit('update:nestedReplyContent', $event)"
      />
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { Medal, Star } from '@element-plus/icons-vue';
import { marked } from 'marked';
import CommunityAnswerThread from './CommunityAnswerThread.vue';

const props = defineProps({
  answer: { type: Object, required: true },
  depth: { type: Number, default: 0 },
  question: { type: Object, required: true },
  currentUserId: { type: String, default: '' },
  formatTime: { type: Function, required: true },
  replyingToId: { type: String, default: '' },
  nestedReplyContent: { type: String, default: '' }
});

defineEmits([
  'like-answer',
  'mark-best',
  'start-reply',
  'cancel-reply',
  'submit-nested-reply',
  'update:nestedReplyContent'
]);

const avatarSize = computed(() => (props.depth > 0 ? 18 : 28));

function renderMarkdown(content) {
  return marked(content || '');
}
</script>

<style scoped>
.thread-node.is-root {
  margin-bottom: 2px;
}

.thread-node.is-root > .answer-item {
  padding: 8px 10px;
  background: #f8f9fa;
  border-radius: 6px;
}

.thread-node.is-nested {
  margin-top: 4px;
}

.thread-node.is-nested > .answer-item {
  padding: 5px 7px;
  background: #f3f4f6;
  border-radius: 5px;
}

.answer-item {
  display: flex;
  gap: 6px;
}

.children-list {
  margin-left: 12px;
  padding-left: 6px;
  border-left: 1px solid #ebedf0;
}

.is-nested .answer-username {
  font-size: 10px;
}

.is-root .answer-username {
  font-size: 12px;
  font-weight: 600;
  color: #2c3e50;
}

.is-nested .answer-username {
  font-weight: 500;
  color: #4b5563;
}

.answer-header {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 2px;
  flex-wrap: wrap;
}

.best-tag {
  flex-shrink: 0;
  transform: scale(0.88);
  transform-origin: left center;
}

.answer-time {
  font-size: 9px;
  color: #9ca3af;
  margin-left: auto;
}

.is-root .answer-content {
  font-size: 12px;
  line-height: 1.5;
  color: #333;
}

.is-nested .answer-content {
  font-size: 10px;
  line-height: 1.4;
  color: #6b7280;
}

.is-nested .reply-to {
  font-size: 10px;
}

.reply-to {
  color: #9ca3af;
  margin-right: 2px;
}

.reply-at {
  color: #3b82f6;
  font-weight: 500;
}

.answer-actions {
  display: flex;
  align-items: center;
  gap: 0;
  margin-top: 2px;
}

.is-root .answer-actions :deep(.el-button) {
  font-size: 11px;
  padding: 0 3px;
  height: 22px;
}

.is-root .answer-actions :deep(.el-icon) {
  font-size: 12px;
}

.is-nested .answer-actions :deep(.el-button) {
  font-size: 10px;
  padding: 0 2px;
  height: 20px;
}

.is-nested .answer-actions :deep(.el-icon) {
  font-size: 11px;
}

.nested-reply-box {
  margin-top: 6px;
  padding: 6px;
  background: #fff;
  border-radius: 5px;
  border: 1px solid #ebedf0;
}

.is-nested .nested-reply-box {
  padding: 5px;
}

.is-root .nested-reply-box :deep(.el-textarea__inner) {
  font-size: 12px;
  padding: 4px 8px;
}

.is-nested .nested-reply-box :deep(.el-textarea__inner) {
  font-size: 10px;
  padding: 3px 6px;
}

.nested-reply-actions {
  display: flex;
  justify-content: flex-end;
  gap: 6px;
  margin-top: 6px;
}

.nested-reply-actions :deep(.el-button) {
  font-size: 11px;
  padding: 4px 8px;
  height: 24px;
}
</style>
