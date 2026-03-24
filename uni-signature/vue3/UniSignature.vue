<template>
  <view
    class="uni-signature"
    :class="{ 'is-disabled': disabled }"
    :style="{ width: width + 'px', height: height + 'px' }"
    @touchstart="handleTouchStart"
    @touchmove="handleTouchMove"
    @touchend="handleTouchEnd"
  >
    <canvas
      :canvas-id="canvasId"
      :id="canvasId"
      class="uni-signature__canvas"
      :style="{ width: width + 'px', height: height + 'px' }"
    />
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue';

// Props
interface Props {
  canvasId?: string;
  width?: number;
  height?: number;
  lineColor?: string;
  lineWidth?: number;
  backgroundColor?: string;
  disabled?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  canvasId: 'signature',
  width: 300,
  height: 200,
  lineColor: '#000000',
  lineWidth: 3,
  backgroundColor: '#FFFFFF',
  disabled: false,
});

// Emits
interface Emits {
  (e: 'begin'): void;
  (e: 'end'): void;
  (e: 'change', payload: { hasSignature: boolean }): void;
}

const emit = defineEmits<Emits>();

// Refs
const ctx = ref<any>(null);
const currentPoints = ref<Point[]>([]);
const isDrawing = ref(false);
const hasSignature = ref(false);
const historyStack = ref<ImageData[]>([]);
const historyIndex = ref(-1);
const MAX_HISTORY_STEPS = 50;

// Types
interface Point {
  x: number;
  y: number;
  pressure?: number;
}

// Smooth path algorithm (embedded from signature-utility)
function smoothPath(points: Point[], tension: number = 0.5): string {
  if (points.length < 2) return '';
  let path = `M ${points[0].x} ${points[0].y}`;
  if (points.length === 2) {
    path += ` L ${points[1].x} ${points[1].y}`;
    return path;
  }
  for (let i = 1; i < points.length - 1; i++) {
    const p0 = points[i - 1];
    const p1 = points[i];
    const p2 = points[i + 1];
    const cp1x = p1.x - (p2.x - p0.x) * tension / 6;
    const cp1y = p1.y - (p2.y - p0.y) * tension / 6;
    const cp2x = p1.x + (p2.x - p0.x) * tension / 6;
    const cp2y = p1.y + (p2.y - p0.y) * tension / 6;
    path += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p1.x} ${p1.y}`;
  }
  const lastPoint = points[points.length - 1];
  path += ` L ${lastPoint.x} ${lastPoint.y}`;
  return path;
}

// Lifecycle
onMounted(() => {
  initCanvas();
});

onUnmounted(() => {
  destroy();
});

function initCanvas(): void {
  if (typeof uni !== 'undefined') {
    ctx.value = uni.createCanvasContext(props.canvasId);
    ctx.value.setLineCap('round');
    ctx.value.setLineJoin('round');
    ctx.value.setStrokeStyle(props.lineColor);
    ctx.value.setLineWidth(props.lineWidth);
  }
  saveState();
}

// Touch handlers
function handleTouchStart(e: TouchEvent): void {
  if (props.disabled) return;
  e.preventDefault?.();
  isDrawing.value = true;
  currentPoints.value = [];
  const point = getPointFromEvent(e);
  currentPoints.value.push(point);
  emit('begin');
}

function handleTouchMove(e: TouchEvent): void {
  if (props.disabled || !isDrawing.value) return;
  e.preventDefault?.();
  const point = getPointFromEvent(e);
  currentPoints.value.push(point);
  drawPath(currentPoints.value);
}

function handleTouchEnd(e: TouchEvent): void {
  if (props.disabled || !isDrawing.value) return;
  e.preventDefault?.();
  isDrawing.value = false;
  if (currentPoints.value.length > 1) {
    saveState();
    hasSignature.value = true;
    emit('change', { hasSignature: true });
  }
  emit('end');
}

function getPointFromEvent(e: TouchEvent): Point {
  const touch = e.touches[0];
  return {
    x: touch.clientX,
    y: touch.clientY,
    pressure: 0.5,
  };
}

function drawPath(points: Point[]): void {
  if (!ctx.value || points.length < 2) return;
  ctx.value.setStrokeStyle(props.lineColor);
  ctx.value.setLineWidth(props.lineWidth);
  ctx.value.beginPath();
  ctx.value.moveTo(points[0].x, points[0].y);
  if (points.length === 2) {
    ctx.value.lineTo(points[1].x, points[1].y);
    ctx.value.stroke();
    ctx.value.draw(true);
    return;
  }
  for (let i = 1; i < points.length - 1; i++) {
    const p1 = points[i];
    const p2 = points[i + 1];
    const midX = (p1.x + p2.x) / 2;
    const midY = (p1.y + p2.y) / 2;
    ctx.value.quadraticCurveTo(p1.x, p1.y, midX, midY);
  }
  const lastPoint = points[points.length - 1];
  ctx.value.lineTo(lastPoint.x, lastPoint.y);
  ctx.value.stroke();
  ctx.value.draw(true);
}

function saveState(): void {
  if (!ctx.value) return;
  // Save current drawing to history
  const imageData = getImageData();
  if (!imageData) return;
  if (historyIndex.value < historyStack.value.length - 1) {
    historyStack.value = historyStack.value.slice(0, historyIndex.value + 1);
  }
  historyStack.value.push(imageData);
  if (historyStack.value.length > MAX_HISTORY_STEPS) {
    historyStack.value.shift();
  } else {
    historyIndex.value++;
  }
}

function getImageData(): any {
  // UniApp uses different approach for image data
  // This is a simplified version
  return {
    points: [...currentPoints.value],
    timestamp: Date.now(),
  };
}

function restoreState(): void {
  // Simplified restore - in real implementation would redraw from history
  if (historyIndex.value < 0 || historyIndex.value >= historyStack.value.length) return;
}

// Public API
function getDataURL(type: string = 'image/png', quality?: number): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!ctx.value) {
      reject(new Error('Canvas not initialized'));
      return;
    }
    uni.canvasToTempFilePath({
      canvasId: props.canvasId,
      fileType: type === 'image/jpeg' ? 'jpg' : 'png',
      quality: quality ?? 0.92,
      success: (res: any) => {
        const fileManager = uni.getFileSystemManager?.();
        if (fileManager) {
          fileManager.readFile({
            filePath: res.tempFilePath,
            encoding: 'base64',
            success: (readRes: any) => {
              resolve(`data:${type};base64,${readRes.data}`);
            },
            fail: reject,
          });
        } else {
          resolve(res.tempFilePath);
        }
      },
      fail: reject,
    });
  });
}

function getData(): Promise<any> {
  return Promise.resolve(getImageData());
}

function clear(): void {
  if (!ctx.value) return;
  ctx.value.clearRect?.(0, 0, props.width, props.height);
  ctx.value.draw?.();
  historyStack.value = [];
  historyIndex.value = -1;
  hasSignature.value = false;
  emit('change', { hasSignature: false });
}

function undo(): boolean {
  if (!canUndo()) return false;
  historyIndex.value--;
  restoreState();
  const hasSig = historyIndex.value >= 0 && historyStack.value.length > 0;
  hasSignature.value = hasSig;
  emit('change', { hasSignature: hasSig });
  return true;
}

function redo(): boolean {
  if (!canRedo()) return false;
  historyIndex.value++;
  restoreState();
  hasSignature.value = true;
  emit('change', { hasSignature: true });
  return true;
}

function canUndo(): boolean {
  return historyIndex.value > 0;
}

function canRedo(): boolean {
  return historyIndex.value < historyStack.value.length - 1;
}

function isEmpty(): boolean {
  return !hasSignature.value;
}

function destroy(): void {
  ctx.value = null;
  historyStack.value = [];
  historyIndex.value = -1;
}

defineExpose({
  getDataURL,
  getData,
  clear,
  undo,
  redo,
  isUndoAvailable: canUndo,
  isRedoAvailable: canRedo,
  isEmpty,
  destroy,
});

watch(() => [props.lineColor, props.lineWidth], () => {
  if (ctx.value) {
    ctx.value.setStrokeStyle(props.lineColor);
    ctx.value.setLineWidth(props.lineWidth);
  }
});
</script>

<style scoped>
.uni-signature {
  position: relative;
  background-color: v-bind(backgroundColor);
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  overflow: hidden;
  box-sizing: border-box;
}

.uni-signature__canvas {
  display: block;
  width: 100%;
  height: 100%;
}

.uni-signature.is-disabled {
  opacity: 0.6;
  pointer-events: none;
}
</style>
