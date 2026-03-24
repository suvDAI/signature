/**
 * UniSignature - Vue2 Version
 * UniApp 签名板组件 (Vue2 Options API)
 *
 * @description 直接复制此文件到 components/uni-signature/ 目录即可使用
 * @example
 * import UniSignature from '@/components/uni-signature/UniSignature.vue';
 * // 或
 * import UniSignature from '@/components/uni-signature/UniSignature.js';
 */

// Props 默认值
const defaultProps = {
  canvasId: 'signature',
  width: 300,
  height: 200,
  lineColor: '#000000',
  lineWidth: 3,
  backgroundColor: '#FFFFFF',
  disabled: false,
};

// 历史记录最大值
const MAX_HISTORY_STEPS = 50;

/**
 * 平滑曲线算法
 * @param {Array} points - 点数组
 * @param {number} tension - 张力系数
 * @returns {string} SVG 路径字符串
 */
function smoothPath(points, tension = 0.5) {
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

/**
 * UniSignature 组件配置对象 (Vue2)
 *
 * 使用方式:
 * 1. 直接导入 .vue 文件使用
 * 2. 导入此 .js 文件获得类型提示
 * 3. 用于 Vue.extend(UniSignature) 创建组件
 */
export const UniSignature = {
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
      return MAX_HISTORY_STEPS;
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

    saveState() {
      if (!this.ctx) return;
      this.historyStack.push({
        points: [...this.currentPoints],
        timestamp: Date.now(),
      });
      if (this.historyStack.length > MAX_HISTORY_STEPS) {
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

export default UniSignature;

/**
 * useSignature 组合式函数 (Vue2)
 * 用于在 Vue2 中使用 Composition API 风格的签名功能
 * @param {Object} options - 配置选项
 * @returns {Object} API 对象
 */
export function useSignature(options) {
  const {
    canvasId,
    width,
    height,
    lineColor = '#000000',
    lineWidth = 3,
    backgroundColor = '#FFFFFF',
    disabled = false,
    onBegin,
    onEnd,
    onChange,
  } = { ...defaultProps, ...options };

  const ctx = uni.createCanvasContext(canvasId);
  ctx.setLineCap('round');
  ctx.setLineJoin('round');
  ctx.setStrokeStyle(lineColor);
  ctx.setLineWidth(lineWidth);

  const currentPoints = [];
  const historyStack = [];
  let historyIndex = -1;
  let isDrawing = false;
  let hasSig = false;

  function handleTouchStart(e) {
    if (disabled) return;
    isDrawing = true;
    currentPoints.length = 0;
    const point = { x: e.touches[0].clientX, y: e.touches[0].clientY, pressure: 0.5 };
    currentPoints.push(point);
    onBegin?.();
  }

  function handleTouchMove(e) {
    if (disabled || !isDrawing) return;
    const point = { x: e.touches[0].clientX, y: e.touches[0].clientY, pressure: 0.5 };
    currentPoints.push(point);
    drawPath(currentPoints);
  }

  function handleTouchEnd(e) {
    if (disabled || !isDrawing) return;
    isDrawing = false;
    if (currentPoints.length > 1) {
      saveState();
      hasSig = true;
      onChange?.({ hasSignature: true });
    }
    onEnd?.();
  }

  function drawPath(points) {
    if (points.length < 2) return;
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    if (points.length === 2) {
      ctx.lineTo(points[1].x, points[1].y);
      ctx.stroke();
      ctx.draw(true);
      return;
    }
    for (let i = 1; i < points.length - 1; i++) {
      const p1 = points[i];
      const p2 = points[i + 1];
      const midX = (p1.x + p2.x) / 2;
      const midY = (p1.y + p2.y) / 2;
      ctx.quadraticCurveTo(p1.x, p1.y, midX, midY);
    }
    const lastPoint = points[points.length - 1];
    ctx.lineTo(lastPoint.x, lastPoint.y);
    ctx.stroke();
    ctx.draw(true);
  }

  function saveState() {
    historyStack.push({ points: [...currentPoints], timestamp: Date.now() });
    if (historyStack.length > MAX_HISTORY_STEPS) {
      historyStack.shift();
    } else {
      historyIndex++;
    }
  }

  function getDataURL(type = 'image/png', quality = 0.92) {
    return new Promise((resolve, reject) => {
      uni.canvasToTempFilePath({
        canvasId,
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
  }

  function clear() {
    ctx.clearRect?.(0, 0, width, height);
    ctx.draw?.();
    historyStack.length = 0;
    historyIndex = -1;
    hasSig = false;
    onChange?.({ hasSignature: false });
  }

  function undo() {
    if (!canUndo()) return false;
    historyIndex--;
    hasSig = historyIndex >= 0;
    onChange?.({ hasSignature: hasSig });
    return true;
  }

  function redo() {
    if (!canRedo()) return false;
    historyIndex++;
    hasSig = true;
    onChange?.({ hasSignature: true });
    return true;
  }

  function canUndo() {
    return historyIndex > 0;
  }

  function canRedo() {
    return historyIndex < historyStack.length - 1;
  }

  function isEmpty() {
    return !hasSig;
  }

  return {
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    isEmpty,
    getDataURL,
    clear,
    undo,
    redo,
    isUndoAvailable: canUndo,
    isRedoAvailable: canRedo,
  };
}
