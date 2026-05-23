<template>
  <div class="slide-panel slide-panel-detail">
    <div class="inline-detail-topbar">
      <el-button :icon="ArrowLeft" text type="primary" @click="$emit('back')">
        {{ backLabel }}
      </el-button>
    </div>
    <div v-loading="loading" class="inline-detail-body main-manage-list">
      <slot />
    </div>
  </div>
</template>

<script setup>
import { ArrowLeft } from '@element-plus/icons-vue';

defineProps({
  backLabel: { type: String, default: '返回列表' },
  loading: { type: Boolean, default: false }
});

defineEmits(['back']);
</script>
