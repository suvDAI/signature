/**
 * UniSignature - Vue3 Version
 * UniApp 签名板组件 (Vue3 Composition API)
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
 * useSignature 组合式函数 (Vue3)
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

/**
 * UniSignature 组件配置对象 (用于 JavaScript 引用类型提示)
 * 直接导入 .js 文件时可获得此对象的类型提示
 */
export const UniSignatureConfig = {
  name: 'UniSignature',
  props: {
    canvasId: { type: String, default: 'signature' },
    width: { type: Number, default: 300 },
    height: { type: Number, default: 200 },
    lineColor: { type: String, default: '#000000' },
    lineWidth: { type: Number, default: 3 },
    backgroundColor: { type: String, default: '#FFFFFF' },
    disabled: { type: Boolean, default: false },
  },
  emits: ['begin', 'end', 'change'],
};

export default {
  name: 'UniSignature',
  // Vue 组件选项将在 .vue 文件中使用
};
