# UniSignature API 文档

## 目录

- [组件概述](#组件概述)
- [Props 属性](#props-属性)
- [Events 事件](#events-事件)
- [Methods 方法](#methods-方法)
- [Types 类型定义](#types-类型定义)
- [使用示例](#使用示例)

---

## 组件概述

`UniSignature` 是 UniApp 环境的签名板组件，支持触摸/鼠标绘制签名，并导出为图片。

### 兼容性

| 平台 | Vue2 | Vue3 |
|------|------|------|
| 微信小程序 | ✅ | ✅ |
| 支付宝小程序 | ✅ | ✅ |
| H5 | ✅ | ✅ |
| Android APP | ✅ | ✅ |
| iOS APP | ✅ | ✅ |

### 文件位置

```
uni-signature/
├── vue2/UniSignature.vue   # Vue2 版本
└── vue3/UniSignature.vue  # Vue3 版本
```

---

## Props 属性

### canvasId

- **类型**: `String`
- **默认值**: `'signature'`
- **说明**: 画布的唯一标识 ID，用于 `uni.createCanvasContext` 和 `uni.canvasToTempFilePath`。多个签名组件需设置不同的 ID。

```vue
<!-- 单个签名组件 -->
<uni-signature canvas-id="my-signature" />

<!-- 多个签名组件 -->
<uni-signature canvas-id="signature-1" />
<uni-signature canvas-id="signature-2" />
```

---

### width

- **类型**: `Number`
- **默认值**: `300`
- **说明**: 画布宽度，单位为像素。

```vue
<uni-signature :width="400" />
```

---

### height

- **类型**: `Number`
- **默认值**: `200`
- **说明**: 画布高度，单位为像素。

```vue
<uni-signature :height="300" />
```

---

### lineColor

- **类型**: `String`
- **默认值**: `'#000000'`
- **说明**: 签名线条颜色，支持所有 CSS 颜色格式。

```vue
<!-- 黑色 -->
<uni-signature line-color="#000000" />

<!-- 蓝色 -->
<uni-signature line-color="#1a73e8" />

<!-- 红色 -->
<uni-signature line-color="red" />

<!-- 半透明黑色 -->
<uni-signature line-color="rgba(0,0,0,0.8)" />
```

---

### lineWidth

- **类型**: `Number`
- **默认值**: `3`
- **说明**: 签名线条宽度，单位为像素。数值越大线条越粗。

```vue
<!-- 细线 -->
<uni-signature :line-width="2" />

<!-- 粗线 -->
<uni-signature :line-width="5" />
```

---

### backgroundColor

- **类型**: `String`
- **默认值**: `'#FFFFFF'`
- **说明**: 画布背景颜色。

```vue
<!-- 白色背景 -->
<uni-signature background-color="#FFFFFF" />

<!-- 浅灰色背景 -->
<uni-signature background-color="#f5f5f5" />
```

---

### disabled

- **类型**: `Boolean`
- **默认值**: `false`
- **说明**: 是否禁用签名功能。禁用后用户无法进行绘制。

```vue
<!-- 禁用签名 -->
<uni-signature :disabled="true" />

<!-- 根据条件禁用 -->
<uni-signature :disabled="isLocked" />
```

---

## Events 事件

### begin

- **参数**: 无
- **触发时机**: 用户开始触摸画布并开始绘制时触发
- **使用场景**: 记录签名开始时间、隐藏占位符等

```vue
<uni-signature @begin="onBegin" />
```

```js
function onBegin() {
  console.log('用户开始签名');
  this.isSigning = true;
}
```

---

### end

- **参数**: 无
- **触发时机**: 用户结束触摸画布（抬起手指）时触发
- **使用场景**: 保存签名、验证签名是否有效等

```vue
<uni-signature @end="onEnd" />
```

```js
function onEnd() {
  console.log('用户结束签名');
  this.validateSignature();
}
```

---

### change

- **参数**: `{ hasSignature: boolean }`
- **触发时机**: 画布内容发生变化时触发（绘制新笔画、清空画布等）
- **使用场景**: 更新按钮可用状态、显示预览等

```vue
<uni-signature @change="onChange" />
```

```js
function onChange(payload) {
  console.log('是否有签名:', payload.hasSignature);
  this.hasSignature = payload.hasSignature;
}
```

---

## Methods 方法

所有方法通过组件实例调用：

```vue
<uni-signature ref="signature" />
```

```js
// Vue2
this.$refs.signature.getDataURL()

// Vue3
signature.value.getDataURL()
```

---

### getDataURL

获取签名的 Base64 图片数据。

**函数签名**:
```ts
getDataURL(type?: string, quality?: number): Promise<string>
```

**参数**:

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `type` | `string` | `'image/png'` | 图片类型，支持 `'image/png'`、`'image/jpeg'` |
| `quality` | `number` | `0.92` | 图片质量，范围 0-1，仅对 JPEG 有效 |

**返回值**: `Promise<string>` - Base64 编码的图片数据 URL

**示例**:
```js
// 获取 PNG 格式
const pngData = await this.$refs.signature.getDataURL();

// 获取 JPEG 格式，质量和 0.8
const jpegData = await this.$refs.signature.getDataURL('image/jpeg', 0.8);

// 上传到服务器
uni.request({
  url: 'https://api.example.com/upload',
  method: 'POST',
  data: {
    signature: pngData,
  },
});
```

---

### getData

获取签名的原始数据。

**函数签名**:
```ts
getData(): Promise<SignatureData>
```

**返回值**: `Promise<SignatureData>` - 包含绘制点和时间戳的数据对象

**示例**:
```js
const data = await this.$refs.signature.getData();
console.log('签名数据:', data.points, data.timestamp);
```

---

### clear

清空画布内容。

**函数签名**:
```ts
clear(): void
```

**示例**:
```js
// 清空签名
this.$refs.signature.clear();

// 清空后触发 change 事件
this.$refs.signature.clear();
console.log('画布已清空');
```

---

### undo

撤销上一笔画。

**函数签名**:
```ts
undo(): boolean
```

**返回值**: `boolean` - 撤销是否成功

**示例**:
```js
// 撤销上一笔
const success = this.$refs.signature.undo();
if (success) {
  console.log('撤销成功');
} else {
  console.log('无法撤销');
}
```

---

### redo

重做上一笔撤销的笔画。

**函数签名**:
```ts
redo(): boolean
```

**返回值**: `boolean` - 重做是否成功

**示例**:
```js
// 重做
const success = this.$refs.signature.redo();
if (success) {
  console.log('重做成功');
}
```

---

### isUndoAvailable

检查是否可以撤销。

**函数签名**:
```ts
isUndoAvailable(): boolean
```

**返回值**: `boolean` - 是否可以撤销

**示例**:
```vue
<button @click="handleUndo" :disabled="!canUndo">撤销</button>
```

```js
data() {
  return {
    canUndo: false,
  };
},

methods: {
  onChange(e) {
    this.canUndo = this.$refs.signature.isUndoAvailable();
  },
}
```

---

### isRedoAvailable

检查是否可以重做。

**函数签名**:
```ts
isRedoAvailable(): boolean
```

**返回值**: `boolean` - 是否可以重做

**示例**:
```vue
<button @click="handleRedo" :disabled="!canRedo">重做</button>
```

```js
data() {
  return {
    canRedo: false,
  };
},

methods: {
  onChange(e) {
    this.canRedo = this.$refs.signature.isRedoAvailable();
  },
}
```

---

### isEmpty

检查画布是否为空。

**函数签名**:
```ts
isEmpty(): boolean
```

**返回值**: `boolean` - 画布是否为空

**示例**:
```js
const isEmpty = this.$refs.signature.isEmpty();
if (isEmpty) {
  uni.showToast({ title: '请先签名', icon: 'none' });
}
```

---

### destroy

销毁组件，释放资源。

**函数签名**:
```ts
destroy(): void
```

**示例**:
```js
// 组件销毁时调用
onUnload() {
  this.$refs.signature.destroy();
}
```

---

## Types 类型定义

### UniSignatureProps (Vue3)

```ts
interface UniSignatureProps {
  canvasId?: string;
  width?: number;
  height?: number;
  lineColor?: string;
  lineWidth?: number;
  backgroundColor?: string;
  disabled?: boolean;
}
```

### UniSignatureEmits (Vue3)

```ts
type UniSignatureEmits = (
  'begin' |
  'end' |
  'change'
);

interface ChangePayload {
  hasSignature: boolean;
}
```

### Point

```ts
interface Point {
  /** X 坐标 */
  x: number;
  /** Y 坐标 */
  y: number;
  /** 压力值 (0-1)，预留字段 */
  pressure?: number;
}
```

### SignatureData

```ts
interface SignatureData {
  /** Base64 图片数据 */
  dataURL?: string;
  /** 原始数据 */
  data?: any;
  /** 时间戳 */
  timestamp?: number;
}
```

### UniSignatureInstance

```ts
interface UniSignatureInstance {
  getDataURL(type?: string, quality?: number): Promise<string>;
  getData(): Promise<any>;
  clear(): void;
  undo(): boolean;
  redo(): boolean;
  isUndoAvailable(): boolean;
  isRedoAvailable(): boolean;
  isEmpty(): boolean;
  destroy(): void;
}
```

---

## 使用示例

### 完整表单提交

```vue
<template>
  <view class="form">
    <view class="form-item">
      <text>姓名：</text>
      <input v-model="form.name" placeholder="请输入姓名" />
    </view>

    <view class="form-item">
      <text>签名：</text>
      <uni-signature
        ref="signature"
        canvas-id="sign-form"
        :width="canvasWidth"
        :height="200"
        line-color="#000"
        :line-width="3"
        background-color="#fff"
        @change="onSignatureChange"
      />
      <view class="signature-actions">
        <button size="mini" @click="handleUndo">撤销</button>
        <button size="mini" @click="handleRedo">重做</button>
        <button size="mini" @click="handleClear">清空</button>
      </view>
    </view>

    <button
      type="primary"
      :disabled="!canSubmit"
      @click="handleSubmit"
    >
      提交
    </button>
  </view>
</template>

<script>
import UniSignature from '@/components/uni-signature/UniSignature.vue';

export default {
  components: { UniSignature },

  data() {
    return {
      form: {
        name: '',
      },
      canSubmit: false,
      canvasWidth: 0,
    };
  },

  onLoad() {
    const info = uni.getSystemInfoSync();
    this.canvasWidth = info.windowWidth - 40;
  },

  methods: {
    onSignatureChange(e) {
      this.canSubmit = e.hasSignature && !!this.form.name;
    },

    handleUndo() {
      this.$refs.signature.undo();
    },

    handleRedo() {
      this.$refs.signature.redo();
    },

    handleClear() {
      this.$refs.signature.clear();
    },

    async handleSubmit() {
      const signature = await this.$refs.signature.getDataURL();

      uni.request({
        url: 'https://api.example.com/submit',
        method: 'POST',
        data: {
          ...this.form,
          signature,
        },
        success: (res) => {
          uni.showToast({ title: '提交成功' });
        },
      });
    },
  },
};
</script>

<style scoped>
.form {
  padding: 20rpx;
}

.form-item {
  margin-bottom: 30rpx;
}

.signature-actions {
  display: flex;
  gap: 20rpx;
  margin-top: 10rpx;
}
</style>
```

---

### 响应式画布尺寸

```vue
<template>
  <view class="container">
    <uni-signature
      ref="signature"
      :width="canvasWidth"
      :height="canvasHeight"
    />
  </view>
</template>

<script>
export default {
  data() {
    return {
      canvasWidth: 300,
      canvasHeight: 200,
    };
  },

  onReady() {
    this.adjustCanvasSize();
    // 监听窗口大小变化
    uni.onWindowResize((res) => {
      this.adjustCanvasSize();
    });
  },

  methods: {
    adjustCanvasSize() {
      const info = uni.getSystemInfoSync();
      // 减去 padding
      this.canvasWidth = info.windowWidth - 40;
      // 按 3:2 比例设置高度
      this.canvasHeight = Math.floor(this.canvasWidth * 2 / 3);
    },
  },
};
</script>
```

---

### 保存到本地相册

```js
async function saveToAlbum() {
  const dataURL = await this.$refs.signature.getDataURL();

  // 将 base64 转为临时文件
  const timestamp = Date.now();
  const tempFilePath = `${wx.env.USER_DATA_PATH}/signature_${timestamp}.png`;

  const fs = uni.getFileSystemManager();
  fs.writeFile({
    filePath: tempFilePath,
    data: dataURL.replace(/^data:image\/\w+;base64,/, ''),
    encoding: 'base64',
    success: () => {
      // 保存到相册
      uni.saveImageToPhotosAlbum({
        filePath: tempFilePath,
        success: () => {
          uni.showToast({ title: '保存成功' });
        },
        fail: (err) => {
          uni.showToast({ title: '保存失败', icon: 'none' });
          console.error(err);
        },
      });
    },
  });
}
```

---

### 清空后重新签名

```vue
<template>
  <view>
    <uni-signature
      ref="signature"
      @end="onEnd"
    />

    <view v-if="step === 'review'">
      <image :src="signatureImage" />
      <button @click="handleReSign">重新签名</button>
      <button @click="handleConfirm">确认</button>
    </view>
  </view>
</template>

<script>
export default {
  data() {
    return {
      step: 'sign',
      signatureImage: '',
    };
  },

  methods: {
    async onEnd() {
      this.signatureImage = await this.$refs.signature.getDataURL();
      this.step = 'review';
    },

    handleReSign() {
      this.$refs.signature.clear();
      this.step = 'sign';
    },

    handleConfirm() {
      console.log('最终签名:', this.signatureImage);
      // 提交...
    },
  },
};
</script>
```
