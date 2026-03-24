<template>
  <view
    class="uni-signature"
    :class="{ 'uni-signature--disabled': disabled }"
    :style="{ width: `${width}px`, height: `${height}px` }"
    @touchstart="handleTouchStart"
    @touchmove="handleTouchMove"
    @touchend="handleTouchEnd"
  >
    <canvas
      :canvas-id="canvasId"
      :id="canvasId"
      class="uni-signature__canvas"
      :style="{ width: `${width}px`, height: `${height}px` }"
    />
    <view v-if="disabled" class="uni-signature__overlay" />
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue';
import { smoothPath, type Point } from 'signature-utility';
import { UniAppCanvasAdapter } from './UniAppCanvasAdapter';

interface Props {
  /** Canvas identifier ID */
  canvasId?: string;
  /** Canvas width in pixels */
  width?: number;
  /** Canvas height in pixels */
  height?: number;
  /** Stroke color */
  lineColor?: string;
  /** Stroke width */
  lineWidth?: number;
  /** Background color */
  backgroundColor?: string;
  /** Disable signing */
  disabled?: boolean;
}

interface Emits {
  (e: 'begin'): void;
  (e: 'end'): void;
  (e: 'change', payload: { hasSignature: boolean }): void;
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

const emit = defineEmits<Emits>();

// Refs
const adapter = ref<UniAppCanvasAdapter | null>(null);
const currentPoints = ref<Point[]>([]);
const isDrawing = ref(false);
const hasSignature = ref(false);

// History management
const historyStack = ref<ImageData[]>([]);
const historyIndex = ref(-1);
const MAX_HISTORY_STEPS = 50;

onMounted(() => {
  initCanvas();
});

onUnmounted(() => {
  destroy();
});

function initCanvas(): void {
  adapter.value = new UniAppCanvasAdapter(props.canvasId, props.width, props.height);
  saveState();
}

function handleTouchStart(e: TouchEvent): void {
  if (props.disabled) return;
  e.preventDefault();

  isDrawing.value = true;
  currentPoints.value = [];

  const touch = e.touches[0];
  const point = getPointFromEvent(touch);
  currentPoints.value.push(point);

  emit('begin');
}

function handleTouchMove(e: TouchEvent): void {
  if (props.disabled || !isDrawing.value) return;
  e.preventDefault();

  const touch = e.touches[0];
  const point = getPointFromEvent(touch);
  currentPoints.value.push(point);

  drawPath(currentPoints.value);
}

function handleTouchEnd(e: TouchEvent): void {
  if (props.disabled || !isDrawing.value) return;
  e.preventDefault();

  isDrawing.value = false;

  if (currentPoints.value.length > 1) {
    saveState();
    hasSignature.value = true;
    emit('change', { hasSignature: true });
  }

  emit('end');
}

function getPointFromEvent(touch: Touch): Point {
  // In UniApp, we need to get the actual position via selectorQuery
  // For now, return relative coordinates
  return {
    x: touch.clientX,
    y: touch.clientY,
    pressure: 0.5,
  };
}

function drawPath(points: Point[]): void {
  const ctx = adapter.value?.getContext();
  if (!ctx || points.length < 2) return;

  ctx.setLineCap('round');
  ctx.setLineJoin('round');
  ctx.setStrokeStyle(props.lineColor);
  ctx.setLineWidth(props.lineWidth);

  // Use smooth path from signature-utility
  const pathData = smoothPath(points, 0.5);
  if (!pathData) return;

  // Parse and draw the SVG-like path
  drawSmoothCurve(points, ctx);
  ctx.stroke();
}

function drawSmoothCurve(points: Point[], ctx: any): void {
  if (points.length < 2) return;

  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);

  if (points.length === 2) {
    ctx.lineTo(points[1].x, points[1].y);
    return;
  }

  for (let i = 1; i < points.length - 1; i++) {
    const p0 = points[i - 1];
    const p1 = points[i];
    const p2 = points[i + 1];

    const midX = (p1.x + p2.x) / 2;
    const midY = (p1.y + p2.y) / 2;

    if (i === 1) {
      ctx.quadraticCurveTo(p1.x, p1.y, midX, midY);
    } else {
      ctx.quadraticCurveTo(p1.x, p1.y, midX, midY);
    }
  }

  const lastPoint = points[points.length - 1];
  ctx.lineTo(lastPoint.x, lastPoint.y);
}

function saveState(): void {
  if (!adapter.value) return;

  // Save current canvas state to history
  const imageData = adapter.value.getImageData();
  if (!imageData) return;

  // Remove any states after current index (for redo functionality)
  if (historyIndex.value < historyStack.value.length - 1) {
    historyStack.value = historyStack.value.slice(0, historyIndex.value + 1);
  }

  historyStack.value.push(imageData);

  // Limit history size
  if (historyStack.value.length > MAX_HISTORY_STEPS) {
    historyStack.value.shift();
  } else {
    historyIndex.value++;
  }
}

function restoreState(): void {
  if (!adapter.value || historyIndex.value < 0 || historyIndex.value >= historyStack.value.length) {
    return;
  }

  const imageData = historyStack.value[historyIndex.value];
  adapter.value.putImageData(imageData);
}

// Public API
function getDataURL(type: string = 'image/png', quality?: number): Promise<string> {
  if (!adapter.value) {
    return Promise.reject(new Error('Canvas not initialized'));
  }
  return adapter.value.toDataURL(type, quality);
}

function getData(): Promise<any> {
  if (!adapter.value) {
    return Promise.reject(new Error('Canvas not initialized'));
  }
  return adapter.value.getImageData();
}

function clear(): void {
  if (!adapter.value) return;

  adapter.value.clear();
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
  adapter.value = null;
  historyStack.value = [];
  historyIndex.value = -1;
}

// Expose public API
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

// Watch for prop changes
watch(() => [props.lineColor, props.lineWidth], () => {
  // Prop changes would require redrawing
});
</script>

<style scoped>
.uni-signature {
  position: relative;
  background-color: v-bind(backgroundColor);
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  overflow: hidden;
}

.uni-signature__canvas {
  display: block;
}

.uni-signature--disabled {
  opacity: 0.6;
  pointer-events: none;
}

.uni-signature__overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(255, 255, 255, 0.5);
}
</style>
