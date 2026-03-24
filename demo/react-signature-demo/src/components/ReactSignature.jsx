import React, { useRef, useEffect, useState, forwardRef, useImperativeHandle } from 'react';

/**
 * ReactSignature - Web 签名板组件
 *
 * 使用方式:
 * import ReactSignature from './ReactSignature';
 *
 * <ReactSignature
 *   ref={signatureRef}
 *   width={300}
 *   height={200}
 *   lineColor="#000000"
 *   lineWidth={2}
 *   onBegin={() => console.log('begin')}
 *   onEnd={() => console.log('end')}
 *   onChange={(has) => console.log(has)}
 * />
 */
const ReactSignature = forwardRef(({
  width = 300,
  height = 200,
  lineColor = '#000000',
  lineWidth = 2,
  backgroundColor = '#FFFFFF',
  disabled = false,
  canvasId = 'react-signature-canvas',
  onBegin,
  onEnd,
  onChange,
}, ref) => {
  const canvasRef = useRef(null);
  const ctxRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);
  const lastPointRef = useRef(null);
  const currentPointsRef = useRef([]);
  const historyStackRef = useRef([]);
  const historyIndexRef = useRef(-1);
  const MAX_HISTORY_STEPS = 50;

  useEffect(() => {
    initCanvas();
    return () => {
      destroy();
    };
  }, []);

  const initCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = lineColor;
    ctx.lineWidth = lineWidth;

    // 设置背景
    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, width, height);

    ctxRef.current = ctx;
    saveState();
  };

  const getPointFromEvent = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return {
      x: clientX - rect.left,
      y: clientY - rect.top,
    };
  };

  const handleStart = (e) => {
    if (disabled) return;
    e.preventDefault();
    setIsDrawing(true);
    currentPointsRef.current = [];

    const point = getPointFromEvent(e);
    currentPointsRef.current.push(point);
    lastPointRef.current = point;

    ctxRef.current.beginPath();
    ctxRef.current.moveTo(point.x, point.y);

    onBegin?.();
  };

  const handleMove = (e) => {
    if (disabled || !isDrawing) return;
    e.preventDefault();

    const point = getPointFromEvent(e);
    drawLine(lastPointRef.current, point);
    currentPointsRef.current.push(point);
    lastPointRef.current = point;
  };

  const handleEnd = (e) => {
    if (disabled || !isDrawing) return;
    e.preventDefault();

    setIsDrawing(false);

    if (currentPointsRef.current.length > 1) {
      saveState();
      setHasSignature(true);
      onChange?.(true);
    }

    onEnd?.();
  };

  const drawLine = (from, to) => {
    const ctx = ctxRef.current;
    if (!ctx) return;

    ctx.strokeStyle = lineColor;
    ctx.lineWidth = lineWidth;
    ctx.beginPath();
    ctx.moveTo(from.x, from.y);

    // 使用二次贝塞尔曲线使线条平滑
    const midX = (from.x + to.x) / 2;
    const midY = (from.y + to.y) / 2;
    ctx.quadraticCurveTo(from.x, from.y, midX, midY);
    ctx.lineTo(to.x, to.y);
    ctx.stroke();
  };

  const saveState = () => {
    const canvas = canvasRef.current;
    const ctx = ctxRef.current;
    if (!canvas || !ctx) return;

    const imageData = ctx.getImageData(0, 0, width, height);
    if (historyIndexRef.current < historyStackRef.current.length - 1) {
      historyStackRef.current = historyStackRef.current.slice(0, historyIndexRef.current + 1);
    }
    historyStackRef.current.push(imageData);
    if (historyStackRef.current.length > MAX_HISTORY_STEPS) {
      historyStackRef.current.shift();
    } else {
      historyIndexRef.current++;
    }
  };

  const restoreState = () => {
    const ctx = ctxRef.current;
    if (!ctx) return;
    if (historyIndexRef.current < 0 || historyIndexRef.current >= historyStackRef.current.length) return;
    const imageData = historyStackRef.current[historyIndexRef.current];
    ctx.putImageData(imageData, 0, 0);
  };

  // 暴露给父组件的方法
  useImperativeHandle(ref, () => ({
    getDataURL: (type = 'image/png', quality = 0.92) => {
      const canvas = canvasRef.current;
      if (!canvas) return Promise.reject(new Error('Canvas not initialized'));
      return Promise.resolve(canvas.toDataURL(type, quality));
    },

    getData: () => {
      const ctx = ctxRef.current;
      if (!ctx) return Promise.reject(new Error('Context not initialized'));
      const imageData = ctx.getImageData(0, 0, width, height);
      return Promise.resolve({
        data: imageData.data,
        width: imageData.width,
        height: imageData.height,
      });
    },

    clear: () => {
      const ctx = ctxRef.current;
      if (!ctx) return;
      ctx.fillStyle = backgroundColor;
      ctx.fillRect(0, 0, width, height);
      historyStackRef.current = [];
      historyIndexRef.current = -1;
      setHasSignature(false);
      currentPointsRef.current = [];
      onChange?.(false);
    },

    undo: () => {
      if (!canUndo()) return false;
      historyIndexRef.current--;
      restoreState();
      setHasSignature(historyIndexRef.current >= 0);
      onChange?.(historyIndexRef.current >= 0);
      return true;
    },

    redo: () => {
      if (!canRedo()) return false;
      historyIndexRef.current++;
      restoreState();
      setHasSignature(true);
      onChange?.(true);
      return true;
    },

    canUndo: () => canUndo(),
    canRedo: () => canRedo(),
    isEmpty: () => !hasSignature,
    isUndoAvailable: () => canUndo(),
    isRedoAvailable: () => canRedo(),
  }), [hasSignature, backgroundColor, width, height, lineColor, lineWidth]);

  const canUndo = () => historyIndexRef.current > 0;
  const canRedo = () => historyIndexRef.current < historyStackRef.current.length - 1;

  return (
    <div
      className={`react-signature ${disabled ? 'is-disabled' : ''}`}
      style={{
        width: `${width}px`,
        height: `${height}px`,
        backgroundColor: backgroundColor,
        position: 'relative',
        border: '1px solid #E0E0E0',
        borderRadius: '4px',
        overflow: 'hidden',
        touchAction: 'none',
        userSelect: 'none',
      }}
      onTouchStart={handleStart}
      onTouchMove={handleMove}
      onTouchEnd={handleEnd}
      onMouseDown={handleStart}
      onMouseMove={handleMove}
      onMouseUp={handleEnd}
      onMouseLeave={handleEnd}
    >
      <canvas
        ref={canvasRef}
        id={canvasId}
        width={width}
        height={height}
        style={{ display: 'block' }}
      />
    </div>
  );
});

ReactSignature.displayName = 'ReactSignature';

export default ReactSignature;
