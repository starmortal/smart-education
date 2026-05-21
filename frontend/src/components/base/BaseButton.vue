<template>
  <button 
    :class="buttonClasses"
    :disabled="disabled || loading"
    :type="nativeType"
    @click="handleClick"
  >
    <span v-if="loading" class="button-loading">
      <svg class="loading-icon" viewBox="0 0 1024 1024">
        <path d="M512 64C264.6 64 64 264.6 64 512s200.6 448 448 448 448-200.6 448-448S759.4 64 512 64zm0 820c-205.4 0-372-166.6-372-372s166.6-372 372-372 372 166.6 372 372-166.6 372-372 372z" fill="currentColor" opacity="0.3"/>
        <path d="M512 64C264.6 64 64 264.6 64 512h80c0-205.4 166.6-372 372-372V64z" fill="currentColor">
          <animateTransform attributeName="transform" type="rotate" from="0 512 512" to="360 512 512" dur="1s" repeatCount="indefinite"/>
        </path>
      </svg>
    </span>
    <span v-if="icon && !loading" class="button-icon">
      <component :is="icon" />
    </span>
    <span class="button-content">
      <slot></slot>
    </span>
  </button>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  type: {
    type: String,
    default: 'primary',
    validator: (value) => ['primary', 'success', 'warning', 'danger', 'info', 'default'].includes(value)
  },
  size: {
    type: String,
    default: 'medium',
    validator: (value) => ['small', 'medium', 'large'].includes(value)
  },
  plain: Boolean,
  round: Boolean,
  circle: Boolean,
  disabled: Boolean,
  loading: Boolean,
  icon: [String, Object],
  nativeType: {
    type: String,
    default: 'button',
    validator: (value) => ['button', 'submit', 'reset'].includes(value)
  }
})

const emit = defineEmits(['click'])

const buttonClasses = computed(() => {
  return [
    'base-button',
    `base-button--${props.type}`,
    `base-button--${props.size}`,
    {
      'is-plain': props.plain,
      'is-round': props.round,
      'is-circle': props.circle,
      'is-disabled': props.disabled,
      'is-loading': props.loading
    }
  ]
})

const handleClick = (event) => {
  if (!props.disabled && !props.loading) {
    emit('click', event)
  }
}
</script>

<style scoped>
.base-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  border: 1px solid transparent;
  border-radius: var(--radius-md);
  font-weight: var(--font-weight-medium);
  cursor: pointer;
  transition: all var(--duration-base) var(--easing-standard);
  user-select: none;
  white-space: nowrap;
}

.base-button:focus {
  outline: none;
}

.base-button:active:not(.is-disabled):not(.is-loading) {
  transform: scale(0.98);
}

/* 尺寸 */
.base-button--small {
  padding: 6px 12px;
  font-size: var(--font-size-sm);
  height: 32px;
}

.base-button--medium {
  padding: 10px 20px;
  font-size: var(--font-size-base);
  height: 40px;
}

.base-button--large {
  padding: 14px 28px;
  font-size: var(--font-size-lg);
  height: 48px;
}

/* 类型 - 主要按钮 */
.base-button--primary {
  background: var(--color-primary);
  color: white;
}

.base-button--primary:hover:not(.is-disabled):not(.is-loading) {
  background: var(--color-primary-light);
  box-shadow: var(--shadow-md);
  transform: translateY(-2px);
}

.base-button--primary.is-plain {
  background: var(--color-primary-bg);
  color: var(--color-primary);
  border-color: var(--color-primary);
}

.base-button--primary.is-plain:hover:not(.is-disabled):not(.is-loading) {
  background: var(--color-primary);
  color: white;
}

/* 类型 - 成功按钮 */
.base-button--success {
  background: var(--color-success);
  color: white;
}

.base-button--success:hover:not(.is-disabled):not(.is-loading) {
  background: var(--color-success-light);
  box-shadow: var(--shadow-md);
  transform: translateY(-2px);
}

.base-button--success.is-plain {
  background: var(--color-success-bg);
  color: var(--color-success);
  border-color: var(--color-success);
}

.base-button--success.is-plain:hover:not(.is-disabled):not(.is-loading) {
  background: var(--color-success);
  color: white;
}

/* 类型 - 警告按钮 */
.base-button--warning {
  background: var(--color-warning);
  color: white;
}

.base-button--warning:hover:not(.is-disabled):not(.is-loading) {
  background: var(--color-warning-light);
  box-shadow: var(--shadow-md);
  transform: translateY(-2px);
}

.base-button--warning.is-plain {
  background: var(--color-warning-bg);
  color: var(--color-warning);
  border-color: var(--color-warning);
}

.base-button--warning.is-plain:hover:not(.is-disabled):not(.is-loading) {
  background: var(--color-warning);
  color: white;
}

/* 类型 - 危险按钮 */
.base-button--danger {
  background: var(--color-danger);
  color: white;
}

.base-button--danger:hover:not(.is-disabled):not(.is-loading) {
  background: var(--color-danger-light);
  box-shadow: var(--shadow-md);
  transform: translateY(-2px);
}

.base-button--danger.is-plain {
  background: var(--color-danger-bg);
  color: var(--color-danger);
  border-color: var(--color-danger);
}

.base-button--danger.is-plain:hover:not(.is-disabled):not(.is-loading) {
  background: var(--color-danger);
  color: white;
}

/* 类型 - 默认按钮 */
.base-button--default {
  background: var(--color-bg-primary);
  color: var(--color-text-primary);
  border-color: var(--color-border);
}

.base-button--default:hover:not(.is-disabled):not(.is-loading) {
  color: var(--color-primary);
  border-color: var(--color-primary);
  box-shadow: var(--shadow-sm);
}

/* 圆角 */
.base-button.is-round {
  border-radius: var(--radius-full);
}

/* 圆形 */
.base-button.is-circle {
  border-radius: 50%;
  padding: 10px;
}

.base-button.is-circle.base-button--small {
  width: 32px;
  height: 32px;
  padding: 0;
}

.base-button.is-circle.base-button--medium {
  width: 40px;
  height: 40px;
  padding: 0;
}

.base-button.is-circle.base-button--large {
  width: 48px;
  height: 48px;
  padding: 0;
}

/* 禁用状态 */
.base-button.is-disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* 加载状态 */
.base-button.is-loading {
  cursor: not-allowed;
}

.button-loading {
  display: inline-flex;
  align-items: center;
}

.loading-icon {
  width: 16px;
  height: 16px;
}

.button-icon {
  display: inline-flex;
  align-items: center;
  font-size: 1.2em;
}

.button-content {
  display: inline-flex;
  align-items: center;
}
</style>
