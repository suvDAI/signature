# React Signature Demo

直接复制 `src/components/ReactSignature.jsx` 到你的项目即可使用，无需 npm 安装。

## 快速使用

### 1. 复制组件文件

将 `src/components/ReactSignature.jsx` 复制到你的项目：

```
你的项目/
└── components/
    └── ReactSignature.jsx   ← 复制到这里
```

### 2. 页面中使用

```jsx
import React, { useRef } from 'react';
import ReactSignature from './components/ReactSignature';

function App() {
  const signatureRef = useRef(null);

  const handleSave = async () => {
    const dataURL = await signatureRef.current.getDataURL('image/png');
    console.log('签名图片:', dataURL);
  };

  const handleClear = () => {
    signatureRef.current.clear();
  };

  return (
    <div>
      <ReactSignature
        ref={signatureRef}
        width={300}
        height={200}
        lineColor="#000000"
        lineWidth={2}
        onEnd={() => console.log('签名完成')}
        onChange={(has) => console.log('是否有签名:', has)}
      />

      <button onClick={handleSave}>保存</button>
      <button onClick={handleClear}>清空</button>
    </div>
  );
}

export default App;
```

## Props 属性

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `canvasId` | String | `'react-signature-canvas'` | 画布 ID |
| `width` | Number | `300` | 画布宽度 |
| `height` | Number | `200` | 画布高度 |
| `lineColor` | String | `'#000000'` | 线条颜色 |
| `lineWidth` | Number | `2` | 线条宽度 |
| `backgroundColor` | String | `'#FFFFFF'` | 背景颜色 |
| `disabled` | Boolean | `false` | 是否禁用 |

## Events 事件

| 事件 | 参数 | 说明 |
|------|------|------|
| `onBegin` | - | 开始绘制时触发 |
| `onEnd` | - | 绘制结束时触发 |
| `onChange` | `(has: boolean) => void` | 内容变化时触发 |

## Methods 方法 (通过 ref 调用)

| 方法 | 返回值 | 说明 |
|------|--------|------|
| `getDataURL(type?, quality?)` | `Promise<string>` | 获取 Base64 图片 |
| `getData()` | `Promise<any>` | 获取原始数据 |
| `clear()` | `void` | 清空画布 |
| `undo()` | `boolean` | 撤销上一笔 |
| `redo()` | `boolean` | 重做上一笔 |
| `canUndo()` | `boolean` | 是否可撤销 |
| `canRedo()` | `boolean` | 是否可重做 |
| `isEmpty()` | `boolean` | 是否为空 |

## 完整示例

```jsx
import React, { useRef, useState } from 'react';
import ReactSignature from './components/ReactSignature';
import './App.css';

function App() {
  const signatureRef = useRef(null);
  const [hasSignature, setHasSignature] = useState(false);
  const [savedImage, setSavedImage] = useState('');

  const handleSave = async () => {
    const dataURL = await signatureRef.current.getDataURL('image/png');
    setSavedImage(dataURL);
  };

  const handleClear = () => {
    signatureRef.current.clear();
    setSavedImage('');
    setHasSignature(false);
  };

  return (
    <div className="container">
      <h1>签名 Demo</h1>

      <ReactSignature
        ref={signatureRef}
        canvasId="signature-canvas"
        width={300}
        height={200}
        lineColor="#000000"
        lineWidth={2}
        onBegin={() => console.log('开始签名')}
        onEnd={() => console.log('签名完成')}
        onChange={setHasSignature}
      />

      <div className="controls">
        <button onClick={handleSave} disabled={!hasSignature}>
          保存
        </button>
        <button onClick={() => signatureRef.current.undo()}>
          撤销
        </button>
        <button onClick={() => signatureRef.current.redo()}>
          重做
        </button>
        <button onClick={handleClear}>
          清空
        </button>
      </div>

      {savedImage && (
        <div className="preview">
          <p>签名预览:</p>
          <img src={savedImage} alt="签名预览" />
        </div>
      )}
    </div>
  );
}

export default App;
```

## 特性

- 同时支持 PC 鼠标和移动端触摸
- 使用 forwardRef 暴露方法
- 平滑贝塞尔曲线绘制
- 撤销/重做功能
- 导出 PNG/JPEG 图片
- 零依赖，纯原生实现
