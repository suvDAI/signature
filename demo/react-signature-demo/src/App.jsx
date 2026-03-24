import React, { useRef, useState } from 'react';
import ReactSignature from './components/ReactSignature';
import './App.css';

/**
 * React Signature Demo
 * 直接复制 components/ReactSignature.jsx 到你的项目使用
 */
function App() {
  const signatureRef = useRef(null);
  const [hasSignature, setHasSignature] = useState(false);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  const [savedImage, setSavedImage] = useState('');
  const [status, setStatus] = useState('准备就绪');

  const handleBegin = () => {
    setStatus('绘制中...');
  };

  const handleEnd = () => {
    setStatus('绘制完成');
    updateState();
  };

  const handleChange = (has) => {
    setHasSignature(has);
    updateState();
  };

  const updateState = () => {
    if (signatureRef.current) {
      setCanUndo(signatureRef.current.canUndo());
      setCanRedo(signatureRef.current.canRedo());
    }
  };

  const handleSave = async () => {
    if (!signatureRef.current) return;

    try {
      const dataURL = await signatureRef.current.getDataURL('image/png');
      setSavedImage(dataURL);
      alert('保存成功！');
    } catch (e) {
      alert('保存失败');
      console.error(e);
    }
  };

  const handleUndo = () => {
    if (!signatureRef.current) return;
    signatureRef.current.undo();
    updateState();
  };

  const handleRedo = () => {
    if (!signatureRef.current) return;
    signatureRef.current.redo();
    updateState();
  };

  const handleClear = () => {
    if (!signatureRef.current) return;
    signatureRef.current.clear();
    setSavedImage('');
    setHasSignature(false);
    setCanUndo(false);
    setCanRedo(false);
    setStatus('已清空');
  };

  return (
    <div className="container">
      <div className="header">
        <h1 className="title">React Signature Demo</h1>
        <p className="subtitle">在下方签名</p>
      </div>

      <div className="signature-wrapper">
        <ReactSignature
          ref={signatureRef}
          canvasId="signature-canvas"
          width={300}
          height={200}
          lineColor="#000000"
          lineWidth={2}
          backgroundColor="#FFFFFF"
          onBegin={handleBegin}
          onEnd={handleEnd}
          onChange={handleChange}
        />
      </div>

      <div className="info">
        <p className="info-text">状态: {status}</p>
        <p className="info-text">是否有签名: {hasSignature ? '是' : '否'}</p>
      </div>

      <div className="controls">
        <button
          className="btn btn-primary"
          onClick={handleSave}
          disabled={!hasSignature}
        >
          保存
        </button>
        <button
          className="btn btn-default"
          onClick={handleUndo}
          disabled={!canUndo}
        >
          撤销
        </button>
        <button
          className="btn btn-default"
          onClick={handleRedo}
          disabled={!canRedo}
        >
          重做
        </button>
        <button
          className="btn btn-danger"
          onClick={handleClear}
        >
          清空
        </button>
      </div>

      {savedImage && (
        <div className="preview">
          <p className="preview-title">签名预览:</p>
          <img src={savedImage} alt="签名预览" className="preview-image" />
        </div>
      )}
    </div>
  );
}

export default App;
