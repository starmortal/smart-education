<template>
  <div class="slide-verify-container">
    <div class="verify-header">
      <el-icon class="verify-icon"><Lock /></el-icon>
      <span>请完成安全验证</span>
    </div>
    
    <!-- 拼图验证区域 -->
    <div class="puzzle-container" ref="puzzleContainer">
      <canvas ref="canvasRef" :width="canvasWidth" :height="canvasHeight"></canvas>
      <canvas 
        ref="blockRef" 
        :width="blockSize + 20" 
        :height="canvasHeight"
        :style="{ left: blockLeft + 'px' }"
        class="puzzle-block"
      ></canvas>
      
      <!-- 验证成功提示 -->
      <div v-if="verifySuccess" class="verify-success-mask">
        <el-icon class="success-icon"><CircleCheck /></el-icon>
        <span>验证成功</span>
      </div>
      
      <!-- 验证失败提示 -->
      <div v-if="verifyFailed" class="verify-failed-mask">
        <el-icon class="failed-icon"><CircleClose /></el-icon>
        <span>验证失败，请重试</span>
      </div>
    </div>
    
    <!-- 滑动条 -->
    <div class="slider-container">
      <div class="slider-track" :class="{ success: verifySuccess, failed: verifyFailed }">
        <div class="slider-fill" :style="{ width: sliderLeft + 'px' }"></div>
        <div 
          class="slider-button"
          :style="{ left: sliderLeft + 'px' }"
          @mousedown="handleDragStart"
          @touchstart="handleDragStart"
        >
          <el-icon v-if="!verifySuccess && !verifyFailed"><DArrowRight /></el-icon>
          <el-icon v-if="verifySuccess" class="success-icon"><Check /></el-icon>
          <el-icon v-if="verifyFailed" class="failed-icon"><Close /></el-icon>
        </div>
        <span class="slider-text" v-if="!isDragging && !verifySuccess && !verifyFailed">
          向右滑动完成验证
        </span>
      </div>
    </div>
    
    <!-- 刷新按钮 -->
    <div class="refresh-button" @click="refreshPuzzle" title="刷新验证码">
      <el-icon><Refresh /></el-icon>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { Lock, CircleCheck, CircleClose, DArrowRight, Check, Close, Refresh } from '@element-plus/icons-vue';

const emit = defineEmits(['success', 'fail']);

// Canvas 相关
const canvasRef = ref(null);
const blockRef = ref(null);
const puzzleContainer = ref(null);
const canvasWidth = 350;
const canvasHeight = 200;

// 拼图相关
const blockSize = 50;
const blockRadius = 10;
const blockX = ref(0);
const blockY = ref(0);
const blockLeft = ref(0);

// 滑动条相关
const sliderLeft = ref(0);
const isDragging = ref(false);
const startX = ref(0);

// 验证状态
const verifySuccess = ref(false);
const verifyFailed = ref(false);

// 随机背景图片
const bgImages = [
  'https://picsum.photos/350/200?random=1',
  'https://picsum.photos/350/200?random=2',
  'https://picsum.photos/350/200?random=3',
  'https://picsum.photos/350/200?random=4',
  'https://picsum.photos/350/200?random=5',
];

// 生成拼图路径
const createPuzzlePath = (ctx, x, y, operation = 'fill') => {
  ctx.beginPath();
  // 上边
  ctx.moveTo(x, y);
  ctx.lineTo(x + blockSize / 2 - blockRadius, y);
  ctx.arc(x + blockSize / 2, y, blockRadius, Math.PI, 0, false);
  ctx.lineTo(x + blockSize, y);
  // 右边
  ctx.lineTo(x + blockSize, y + blockSize / 2 - blockRadius);
  ctx.arc(x + blockSize, y + blockSize / 2, blockRadius, 1.5 * Math.PI, 0.5 * Math.PI, false);
  ctx.lineTo(x + blockSize, y + blockSize);
  // 下边
  ctx.lineTo(x + blockSize / 2 + blockRadius, y + blockSize);
  ctx.arc(x + blockSize / 2, y + blockSize, blockRadius, 0, Math.PI, false);
  ctx.lineTo(x, y + blockSize);
  // 左边
  ctx.lineTo(x, y + blockSize / 2 + blockRadius);
  ctx.arc(x, y + blockSize / 2, blockRadius, 0.5 * Math.PI, 1.5 * Math.PI, false);
  ctx.lineTo(x, y);
  
  if (operation === 'fill') {
    ctx.fill();
  } else if (operation === 'clip') {
    ctx.clip();
  } else {
    ctx.stroke();
  }
};

// 初始化拼图
const initPuzzle = () => {
  const canvas = canvasRef.value;
  const block = blockRef.value;
  if (!canvas || !block) return;
  
  const canvasCtx = canvas.getContext('2d');
  const blockCtx = block.getContext('2d');
  
  // 清空画布
  canvasCtx.clearRect(0, 0, canvasWidth, canvasHeight);
  blockCtx.clearRect(0, 0, canvasWidth, canvasHeight);
  
  // 随机生成拼图位置（确保在右侧区域）
  blockX.value = Math.floor(Math.random() * (canvasWidth - blockSize - 100)) + 100;
  blockY.value = Math.floor(Math.random() * (canvasHeight - blockSize - 20)) + 20;
  
  // 重置滑块位置
  blockLeft.value = 0;
  
  // 加载背景图片
  const img = new Image();
  img.crossOrigin = 'Anonymous';
  img.src = bgImages[Math.floor(Math.random() * bgImages.length)];
  
  img.onload = () => {
    // 绘制主画布背景
    canvasCtx.drawImage(img, 0, 0, canvasWidth, canvasHeight);
    
    // 在目标位置绘制拼图缺口（阴影）
    canvasCtx.save();
    canvasCtx.globalCompositeOperation = 'destination-out';
    createPuzzlePath(canvasCtx, blockX.value, blockY.value, 'fill');
    canvasCtx.restore();
    
    // 绘制拼图缺口边框
    canvasCtx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
    canvasCtx.lineWidth = 2;
    createPuzzlePath(canvasCtx, blockX.value, blockY.value, 'stroke');
    
    // 在滑块画布上绘制拼图块
    // 注意：滑块画布宽度只有 blockSize + 20，所以要调整绘制位置
    blockCtx.save();
    // 裁剪出拼图形状（在滑块画布的左侧位置）
    createPuzzlePath(blockCtx, 10, blockY.value, 'clip');
    // 绘制图片，需要偏移以显示正确的部分
    blockCtx.drawImage(img, -blockX.value + 10, 0, canvasWidth, canvasHeight);
    blockCtx.restore();
    
    // 绘制滑块边框和阴影
    blockCtx.save();
    blockCtx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
    blockCtx.lineWidth = 2;
    blockCtx.shadowColor = 'rgba(0, 0, 0, 0.5)';
    blockCtx.shadowBlur = 8;
    blockCtx.shadowOffsetX = 2;
    blockCtx.shadowOffsetY = 2;
    createPuzzlePath(blockCtx, 10, blockY.value, 'stroke');
    blockCtx.restore();
  };
  
  img.onerror = () => {
    // 如果图片加载失败，使用渐变色背景
    const gradient = canvasCtx.createLinearGradient(0, 0, canvasWidth, canvasHeight);
    gradient.addColorStop(0, '#667eea');
    gradient.addColorStop(1, '#764ba2');
    canvasCtx.fillStyle = gradient;
    canvasCtx.fillRect(0, 0, canvasWidth, canvasHeight);
    
    // 绘制拼图缺口
    canvasCtx.save();
    canvasCtx.globalCompositeOperation = 'destination-out';
    createPuzzlePath(canvasCtx, blockX.value, blockY.value, 'fill');
    canvasCtx.restore();
    
    // 绘制拼图缺口边框
    canvasCtx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
    canvasCtx.lineWidth = 2;
    createPuzzlePath(canvasCtx, blockX.value, blockY.value, 'stroke');
    
    // 绘制滑块
    blockCtx.save();
    createPuzzlePath(blockCtx, 10, blockY.value, 'clip');
    const blockGradient = blockCtx.createLinearGradient(0, 0, blockSize + 20, canvasHeight);
    blockGradient.addColorStop(0, '#667eea');
    blockGradient.addColorStop(1, '#764ba2');
    blockCtx.fillStyle = blockGradient;
    blockCtx.fillRect(0, 0, blockSize + 20, canvasHeight);
    blockCtx.restore();
    
    // 绘制滑块边框和阴影
    blockCtx.save();
    blockCtx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
    blockCtx.lineWidth = 2;
    blockCtx.shadowColor = 'rgba(0, 0, 0, 0.5)';
    blockCtx.shadowBlur = 8;
    blockCtx.shadowOffsetX = 2;
    blockCtx.shadowOffsetY = 2;
    createPuzzlePath(blockCtx, 10, blockY.value, 'stroke');
    blockCtx.restore();
  };
};

// 刷新拼图
const refreshPuzzle = () => {
  verifySuccess.value = false;
  verifyFailed.value = false;
  sliderLeft.value = 0;
  blockLeft.value = 0;
  initPuzzle();
};

// 开始拖动
const handleDragStart = (e) => {
  if (verifySuccess.value || verifyFailed.value) return;
  
  isDragging.value = true;
  startX.value = e.type === 'touchstart' ? e.touches[0].clientX : e.clientX;
  
  document.addEventListener('mousemove', handleDragMove);
  document.addEventListener('mouseup', handleDragEnd);
  document.addEventListener('touchmove', handleDragMove);
  document.addEventListener('touchend', handleDragEnd);
};

// 拖动中
const handleDragMove = (e) => {
  if (!isDragging.value) return;
  
  e.preventDefault();
  const currentX = e.type === 'touchmove' ? e.touches[0].clientX : e.clientX;
  const moveX = currentX - startX.value;
  
  if (moveX < 0) return;
  
  const maxMove = canvasWidth - blockSize - 20;
  const actualMove = Math.min(moveX, maxMove);
  
  sliderLeft.value = actualMove;
  blockLeft.value = actualMove;
};

// 结束拖动
const handleDragEnd = () => {
  if (!isDragging.value) return;
  
  isDragging.value = false;
  
  document.removeEventListener('mousemove', handleDragMove);
  document.removeEventListener('mouseup', handleDragEnd);
  document.removeEventListener('touchmove', handleDragMove);
  document.removeEventListener('touchend', handleDragEnd);
  
  // 验证位置
  const tolerance = 10; // 容错范围
  if (Math.abs(blockLeft.value - blockX.value + 10) < tolerance) {
    // 验证成功（注意：blockLeft 是滑块左边缘，blockX 是缺口位置，需要加上偏移）
    verifySuccess.value = true;
    setTimeout(() => {
      emit('success');
    }, 500);
  } else {
    // 验证失败
    verifyFailed.value = true;
    setTimeout(() => {
      refreshPuzzle();
    }, 1000);
    emit('fail');
  }
};

onMounted(() => {
  initPuzzle();
});

onUnmounted(() => {
  document.removeEventListener('mousemove', handleDragMove);
  document.removeEventListener('mouseup', handleDragEnd);
  document.removeEventListener('touchmove', handleDragMove);
  document.removeEventListener('touchend', handleDragEnd);
});

defineExpose({
  refresh: refreshPuzzle
});
</script>

<style scoped>
.slide-verify-container {
  position: relative;
  user-select: none;
}

.verify-header {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin-bottom: 20px;
  font-size: 15px;
  color: #606266;
}

.verify-icon {
  font-size: 20px;
  color: #0969da;
}

.puzzle-container {
  position: relative;
  width: 350px;
  height: 200px;
  margin: 0 auto 20px;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

canvas {
  display: block;
  border-radius: 12px;
}

.puzzle-block {
  position: absolute;
  top: 0;
  left: 0;
  transition: none;
  pointer-events: none;
}

.verify-success-mask,
.verify-failed-mask {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  font-size: 18px;
  font-weight: 600;
  color: white;
  backdrop-filter: blur(4px);
  animation: fadeIn 0.3s ease;
}

.verify-success-mask {
  background: rgba(103, 194, 58, 0.9);
}

.verify-failed-mask {
  background: rgba(245, 108, 108, 0.9);
}

.success-icon,
.failed-icon {
  font-size: 48px;
}

.slider-container {
  position: relative;
  width: 350px;
  margin: 0 auto;
}

.slider-track {
  position: relative;
  height: 50px;
  background: linear-gradient(90deg, #e8f4ff 0%, #d4e9ff 100%);
  border-radius: 25px;
  overflow: hidden;
  box-shadow: inset 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
}

.slider-track.success {
  background: linear-gradient(90deg, #d4f4dd 0%, #b7e4c7 100%);
}

.slider-track.failed {
  background: linear-gradient(90deg, #ffe5e5 0%, #ffd4d4 100%);
}

.slider-fill {
  position: absolute;
  left: 0;
  top: 0;
  height: 100%;
  background: linear-gradient(90deg, #4dabf7 0%, #0969da 100%);
  border-radius: 25px;
  transition: none;
}

.slider-track.success .slider-fill {
  background: linear-gradient(90deg, #67c23a 0%, #85ce61 100%);
}

.slider-track.failed .slider-fill {
  background: linear-gradient(90deg, #f56c6c 0%, #ff8787 100%);
}

.slider-button {
  position: absolute;
  top: 3px;
  left: 0;
  width: 44px;
  height: 44px;
  background: white;
  border-radius: 50%;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: grab;
  transition: transform 0.2s ease;
  z-index: 2;
}

.slider-button:active {
  cursor: grabbing;
  transform: scale(1.1);
}

.slider-button .el-icon {
  font-size: 20px;
  color: #0969da;
}

.slider-button .success-icon {
  color: #67c23a;
}

.slider-button .failed-icon {
  color: #f56c6c;
}

.slider-text {
  position: absolute;
  left: 0;
  right: 0;
  top: 50%;
  transform: translateY(-50%);
  text-align: center;
  color: #909399;
  font-size: 14px;
  pointer-events: none;
  z-index: 1;
}

.refresh-button {
  position: absolute;
  top: 50px;
  right: 10px;
  width: 36px;
  height: 36px;
  background: rgba(255, 255, 255, 0.9);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  transition: all 0.3s ease;
  z-index: 10;
}

.refresh-button:hover {
  background: white;
  transform: rotate(180deg);
}

.refresh-button .el-icon {
  font-size: 18px;
  color: #0969da;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}
</style>
