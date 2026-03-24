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

<script>
export default {
  name: 'UniSignature',

  props: {
    canvasId: {
      type: String,
      default: 'signature',
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
      default: 3,
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
      currentPoints: [],
      isDrawing: false,
      hasSignature: false,
      historyStack: [],
      historyIndex: -1,
      ctx: null,
    };
  },

  computed: {
    maxHistorySteps() {
      return 50;
    },
  },

  watch: {
    lineColor() {
      this.updateContextStyle();
    },
    lineWidth() {
      this.updateContextStyle();
    },
  },

  mounted() {
    this.initCanvas();
  },

  beforeDestroy() {
    this.destroy();
  },

  methods: {
    initCanvas() {
      if (typeof uni !== 'undefined') {
        this.ctx = uni.createCanvasContext(this.canvasId);
        this.ctx.setLineCap('round');
        this.ctx.setLineJoin('round');
        this.ctx.setStrokeStyle(this.lineColor);
        this.ctx.setLineWidth(this.lineWidth);
      }
      this.saveState();
    },

    updateContextStyle() {
      if (this.ctx) {
        this.ctx.setStrokeStyle(this.lineColor);
        this.ctx.setLineWidth(this.lineWidth);
      }
    },

    handleTouchStart(e) {
      if (this.disabled) return;
      e.preventDefault?.();
      this.isDrawing = true;
      this.currentPoints = [];
      const point = this.getPointFromEvent(e);
      this.currentPoints.push(point);
      this.$emit('begin');
    },

    handleTouchMove(e) {
      if (this.disabled || !this.isDrawing) return;
      e.preventDefault?.();
      const point = this.getPointFromEvent(e);
      this.currentPoints.push(point);
      this.drawPath(this.currentPoints);
    },

    handleTouchEnd(e) {
      if (this.disabled || !this.isDrawing) return;
      e.preventDefault?.();
      this.isDrawing = false;
      if (this.currentPoints.length > 1) {
        this.saveState();
        this.hasSignature = true;
        this.$emit('change', { hasSignature: true });
      }
      this.$emit('end');
    },

    getPointFromEvent(e) {
      const touch = e.touches[0];
      return {
        x: touch.clientX,
        y: touch.clientY,
        pressure: 0.5,
      };
    },

    drawPath(points) {
      if (!this.ctx || points.length < 2) return;
      this.ctx.setStrokeStyle(this.lineColor);
      this.ctx.setLineWidth(this.lineWidth);
      this.ctx.beginPath();
      this.ctx.moveTo(points[0].x, points[0].y);
      if (points.length === 2) {
        this.ctx.lineTo(points[1].x, points[1].y);
        this.ctx.stroke();
        this.ctx.draw(true);
        return;
      }
      for (let i = 1; i < points.length - 1; i++) {
        const p1 = points[i];
        const p2 = points[i + 1];
        const midX = (p1.x + p2.x) / 2;
        const midY = (p1.y + p2.y) / 2;
        this.ctx.quadraticCurveTo(p1.x, p1.y, midX, midY);
      }
      const lastPoint = points[points.length - 1];
      this.ctx.lineTo(lastPoint.x, lastPoint.y);
      this.ctx.stroke();
      this.ctx.draw(true);
    },

    smoothPath(points, tension = 0.5) {
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
    },

    saveState() {
      if (!this.ctx) return;
      this.historyStack.push({
        points: [...this.currentPoints],
        timestamp: Date.now(),
      });
      if (this.historyStack.length > this.maxHistorySteps) {
        this.historyStack.shift();
      } else {
        this.historyIndex++;
      }
    },

    getImageData() {
      return {
        points: [...this.currentPoints],
        timestamp: Date.now(),
      };
    },

    getDataURL(type = 'image/png', quality = 0.92) {
      return new Promise((resolve, reject) => {
        if (!this.ctx) {
          reject(new Error('Canvas not initialized'));
          return;
        }
        uni.canvasToTempFilePath({
          canvasId: this.canvasId,
          fileType: type === 'image/jpeg' ? 'jpg' : 'png',
          quality,
          success: (res) => {
            const fileManager = uni.getFileSystemManager?.();
            if (fileManager) {
              fileManager.readFile({
                filePath: res.tempFilePath,
                encoding: 'base64',
                success: (readRes) => {
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
    },

    getData() {
      return Promise.resolve(this.getImageData());
    },

    clear() {
      if (!this.ctx) return;
      this.ctx.clearRect?.(0, 0, this.width, this.height);
      this.ctx.draw?.();
      this.historyStack = [];
      this.historyIndex = -1;
      this.hasSignature = false;
      this.$emit('change', { hasSignature: false });
    },

    undo() {
      if (!this.canUndo()) return false;
      this.historyIndex--;
      this.hasSignature = this.historyIndex >= 0 && this.historyStack.length > 0;
      this.$emit('change', { hasSignature: this.hasSignature });
      return true;
    },

    redo() {
      if (!this.canRedo()) return false;
      this.historyIndex++;
      this.hasSignature = true;
      this.$emit('change', { hasSignature: true });
      return true;
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
      this.ctx = null;
      this.historyStack = [];
      this.historyIndex = -1;
    },
  },
};
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
