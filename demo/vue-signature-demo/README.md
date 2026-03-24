# Vue Signature Demo

直接复制 `src/components/VueSignature.vue` 到你的项目即可使用，无需 npm 安装。

## 快速使用

### 1. 复制组件文件

将 `src/components/VueSignature.vue` 复制到你的项目：

```
你的项目/
└── components/
    └── VueSignature.vue   ← 复制到这里
```

### 2. 页面中使用

```vue
<template>
  <view class="container">
    <VueSignature
      ref="signature"
      canvas-id="my-signature"
      :width="300"
      :height="200"
      line-color="#000000"
      :line-width="2"
      @end="onEnd"
      @change="onChange"
    />

    <button @click="handleSave">保存</button>
    <button @click="handleClear">清空</button>
  </view>
</template>

<script>
import VueSignature from '@/components/VueSignature.vue';

export default {
  components: { VueSignature },

  methods: {
    async handleSave() {
      const dataURL = await this.$refs.signature.getDataURL('image/png');
      console.log('签名图片:', dataURL);
    },

    handleClear() {
      this.$refs.signature.clear();
    },

    onEnd() {
      console.log('签名完成');
    },

    onChange(e) {
      console.log('是否有签名:', e.hasSignature);
    }
  }
};
</script>
```

## Props 属性

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `canvasId` | String | `'vue-signature-canvas'` | 画布 ID |
| `width` | Number | `300` | 画布宽度 |
| `height` | Number | `200` | 画布高度 |
| `lineColor` | String | `'#000000'` | 线条颜色 |
| `lineWidth` | Number | `2` | 线条宽度 |
| `backgroundColor` | String | `'#FFFFFF'` | 背景颜色 |
| `disabled` | Boolean | `false` | 是否禁用 |

## Events 事件

| 事件 | 参数 | 说明 |
|------|------|------|
| `begin` | - | 开始绘制时触发 |
| `end` | - | 绘制结束时触发 |
| `change` | `{ hasSignature: boolean }` | 内容变化时触发 |

## Methods 方法

| 方法 | 返回值 | 说明 |
|------|--------|------|
| `getDataURL(type?, quality?)` | `Promise<string>` | 获取 Base64 图片 |
| `getData()` | `Promise<any>` | 获取原始数据 |
| `clear()` | `void` | 清空画布 |
| `undo()` | `boolean` | 撤销上一笔 |
| `redo()` | `boolean` | 重做上一笔 |
| `isUndoAvailable()` | `boolean` | 是否可撤销 |
| `isRedoAvailable()` | `boolean` | 是否可重做 |
| `isEmpty()` | `boolean` | 是否为空 |

## 特性

- 同时支持 PC 鼠标和移动端触摸
- 平滑贝塞尔曲线绘制
- 撤销/重做功能
- 导出 PNG/JPEG 图片
- 零依赖，纯原生实现
