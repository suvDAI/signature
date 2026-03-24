<template>
  <div
    class="vue-signature"
    :class="{ 'is-disabled': disabled }"
    :style="{ width: width + 'px', height: height + 'px' }"
    @touchstart="handleTouchStart"
    @touchmove="handleTouchMove"
    @touchend="handleTouchEnd"
    @mousedown="handleMouseDown"
    @mousemove="handleMouseMove"
    @mouseup="handleMouseUp"
  >
    <canvas
      :ref="canvasId"
      :id="canvasId"
      class="vue-signature__canvas"
      :style="{ width: width + 'px', height: height + 'px' }"
    />
  </div>
</template>

<script>
export default {
  name: 'VueSignature',

  props: {
    canvasId: {
      type: String,
      default: 'vue-signature-canvas',
    },
    width: {
      type: Number,
      default: 300,
    },
    height: {
      type: Number,
      default: 200,
    },
    lineColor: {
      type: String,
      default: '#000000',
    },
    lineWidth: {
      type: Number,
      default: 2,
    },
    backgroundColor: {
      type: String,
      default: '#FFFFFF',
    },
    disabled: {
      type: Boolean,
      default: false,
    },
  },

  data() {
    return {
      ctx: null,
      canvas: null,
      currentPoints: [],
      isDrawing: false,
      hasSignature: false,
      historyStack: [],
      historyIndex: -1,
      lastPoint: null,
    };
  },

  computed: {
    maxHistorySteps() {
      return 50;
    },
  },

  mounted() {
    this.$nextTick(() => {
      this.initCanvas();
    });
  },

  beforeDestroy() {
    this.destroy();
  },

  methods: {
    initCanvas() {
      this.canvas = document.getElementById(this.canvasId);
      if (!this.canvas) {
        console.warn('Canvas element not found');
        return;
      }

      this.ctx = this.canvas.getContext('2d');
      this.ctx.lineCap = 'round';
      this.ctx.lineJoin = 'round';
      this.ctx.strokeStyle = this.lineColor;
      this.ctx.lineWidth = this.lineWidth;

      // 设置画布背景
      this.ctx.fillStyle = this.backgroundColor;
      this.ctx.fillRect(0, 0, this.width, this.height);

      this.saveState();
    },

    getPointFromEvent(e) {
      const rect = this.canvas.getBoundingClientRect();
      if (e.touches && e.touches.length > 0) {
        return {
          x: e.touches[0].clientX - rect.left,
          y: e.touches[0].clientY - rect.top,
        };
      }
      return {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };
    },

    handleTouchStart(e) {
      if (this.disabled) return;
      e.preventDefault();
      this.isDrawing = true;
      this.currentPoints = [];
      const point = this.getPointFromEvent(e);
      this.currentPoints.push(point);
      this.lastPoint = point;
      this.ctx.beginPath();
      this.ctx.moveTo(point.x, point.y);
      this.$emit('begin');
    },

    handleTouchMove(e) {
      if (this.disabled || !this.isDrawing) return;
      e.preventDefault();
      const point = this.getPointFromEvent(e);
      this.drawLine(this.lastPoint, point);
      this.currentPoints.push(point);
      this.lastPoint = point;
    },

    handleTouchEnd(e) {
      if (this.disabled || !this.isDrawing) return;
      e.preventDefault();
      this.isDrawing = false;
      if (this.currentPoints.length > 1) {
        this.saveState();
        this.hasSignature = true;
        this.$emit('change', { hasSignature: true });
      }
      this.$emit('end');
    },

    handleMouseDown(e) {
      if (this.disabled || e.touches) return;
      this.isDrawing = true;
      this.currentPoints = [];
      const point = this.getPointFromEvent(e);
      this.currentPoints.push(point);
      this.lastPoint = point;
      this.ctx.beginPath();
      this.ctx.moveTo(point.x, point.y);
      this.$emit('begin');
    },

    handleMouseMove(e) {
      if (this.disabled || !this.isDrawing || e.touches) return;
      const point = this.getPointFromEvent(e);
      this.drawLine(this.lastPoint, point);
      this.currentPoints.push(point);
      this.lastPoint = point;
    },

    handleMouseUp(e) {
      if (this.disabled || !this.isDrawing || e.touches) return;
      this.isDrawing = false;
      if (this.currentPoints.length > 1) {
        this.saveState();
        this.hasSignature = true;
        this.$emit('change', { hasSignature: true });
      }
      this.$emit('end');
    },

    drawLine(from, to) {
      this.ctx.strokeStyle = this.lineColor;
      this.ctx.lineWidth = this.lineWidth;
      this.ctx.beginPath();
      this.ctx.moveTo(from.x, from.y);

      // 使用二次贝塞尔曲线使线条平滑
      const midX = (from.x + to.x) / 2;
      const midY = (from.y + to.y) / 2;
      this.ctx.quadraticCurveTo(from.x, from.y, midX, midY);
      this.ctx.lineTo(to.x, to.y);
      this.ctx.stroke();
    },

    saveState() {
      const imageData = this.ctx.getImageData(0, 0, this.width, this.height);
      if (this.historyIndex < this.historyStack.length - 1) {
        this.historyStack = this.historyStack.slice(0, this.historyIndex + 1);
      }
      this.historyStack.push(imageData);
      if (this.historyStack.length > this.maxHistorySteps) {
        this.historyStack.shift();
      } else {
        this.historyIndex++;
      }
    },

    getDataURL(type = 'image/png', quality = 0.92) {
      return Promise.resolve(this.canvas.toDataURL(type, quality));
    },

    getData() {
      const imageData = this.ctx.getImageData(0, 0, this.width, this.height);
      return Promise.resolve({
        data: imageData.data,
        width: imageData.width,
        height: imageData.height,
      });
    },

    clear() {
      if (!this.ctx) return;
      this.ctx.fillStyle = this.backgroundColor;
      this.ctx.fillRect(0, 0, this.width, this.height);
      this.historyStack = [];
      this.historyIndex = -1;
      this.hasSignature = false;
      this.currentPoints = [];
      this.$emit('change', { hasSignature: false });
    },

    undo() {
      if (!this.canUndo()) return false;
      this.historyIndex--;
      this.restoreState();
      this.hasSignature = this.historyIndex >= 0;
      this.$emit('change', { hasSignature: this.hasSignature });
      return true;
    },

    redo() {
      if (!this.canRedo()) return false;
      this.historyIndex++;
      this.restoreState();
      this.hasSignature = true;
      this.$emit('change', { hasSignature: true });
      return true;
    },

    restoreState() {
      if (this.historyIndex < 0 || this.historyIndex >= this.historyStack.length) return;
      const imageData = this.historyStack[this.historyIndex];
      this.ctx.putImageData(imageData, 0, 0);
    },

    canUndo() {
      return this.historyIndex > 0;
    },

    canRedo() {
      return this.historyIndex < this.historyStack.length - 1;
    },

    isEmpty() {
      return !this.hasSignature;
    },

    isUndoAvailable() {
      return this.canUndo();
    },

    isRedoAvailable() {
      return this.canRedo();
    },

    destroy() {
      if (this.ctx) {
        this.ctx = null;
      }
      this.canvas = null;
      this.historyStack = [];
      this.historyIndex = -1;
      this.currentPoints = [];
    },
  },
};
</script>

<style scoped>
.vue-signature {
  position: relative;
  background-color: #FFFFFF;
  border: 1px solid #E0E0E0;
  border-radius: 4px;
  overflow: hidden;
  touch-action: none;
  -webkit-touch-callout: none;
  -webkit-user-select: none;
  user-select: none;
}

.vue-signature__canvas {
  display: block;
}

.vue-signature.is-disabled {
  opacity: 0.6;
  pointer-events: none;
}
</style>
