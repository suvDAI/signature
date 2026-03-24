# UniSignature

UniApp 签名板组件，支持 Vue2 和 Vue3，可运行于微信小程序、支付宝小程序、H5、APP 等多端。

## 特性

- **多端支持**: 微信小程序、支付宝小程序、H5、APP
- **双版本**: 提供 Vue2 和 Vue3 两个版本
- **平滑绘制**: 采用 Catmull-Rom 样条算法，绘制流畅自然
- **完整 API**: 支持撤销、重做、保存、清空等操作
- **零依赖**: 纯原生实现，无第三方依赖
- **即用型**: 直接复制文件即可使用，无需 npm 安装

## 快速开始

### 方式一：直接复制文件使用（推荐）

```
uni-signature/
├── vue2/                    # Vue2 版本
│   └── UniSignature.vue     # 直接复制此文件
└── vue3/                    # Vue3 版本
    └── UniSignature.vue     # 直接复制此文件
```

将对应版本的 `UniSignature.vue` 复制到你的 UniApp 项目：

```
你的项目/
└── components/
    └── uni-signature/
        └── UniSignature.vue   # 复制到这里
```

### 方式二：复制完整文件夹

将整个 `vue2` 或 `vue3` 文件夹复制到你的项目中，`.js` 和 `.ts` 文件提供类型提示，删除后 `.vue` 文件仍可正常使用。

## 使用示例

### 基础用法

```vue
<template>
  <view class="container">
    <uni-signature
      ref="signature"
      canvas-id="my-signature"
      :width="300"
      :height="200"
      line-color="#000000"
      :line-width="3"
      @end="onEnd"
      @change="onChange"
    />

    <button @click="handleSave">保存签名</button>
    <button @click="handleClear">清空</button>
    <button @click="handleUndo" :disabled="!canUndo">撤销</button>
    <button @click="handleRedo" :disabled="!canRedo">重做</button>
  </view>
</template>

<script>
// Vue3
import { ref } from 'vue';
import UniSignature from '@/components/uni-signature/UniSignature.vue';

export default {
  components: { UniSignature },
  setup() {
    const signature = ref(null);
    const canUndo = ref(false);
    const canRedo = ref(false);

    async function handleSave() {
      const dataURL = await signature.value.getDataURL('image/png');
      console.log('签名图片:', dataURL);
    }

    function handleClear() {
      signature.value.clear();
    }

    function handleUndo() {
      signature.value.undo();
    }

    function handleRedo() {
      signature.value.redo();
    }

    function onEnd() {
      console.log('签名完成');
    }

    function onChange(e) {
      canUndo.value = signature.value.isUndoAvailable();
      canRedo.value = signature.value.isRedoAvailable();
    }

    return {
      signature,
      canUndo,
      canRedo,
      handleSave,
      handleClear,
      handleUndo,
      handleRedo,
      onEnd,
      onChange,
    };
  }
};
</script>
```

### 禁用签名

```vue
<uni-signature
  :disabled="true"
  @change="onChange"
/>
```

### 自定义样式

```vue
<uni-signature
  canvas-id="custom-signature"
  :width="350"
  :height="250"
  line-color="#1a73e8"
  :line-width="4"
  background-color="#f8f9fa"
/>
```

## Props 属性

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `canvasId` | String | `'signature'` | 画布唯一标识 ID |
| `width` | Number | `300` | 画布宽度（px） |
| `height` | Number | `200` | 画布高度（px） |
| `lineColor` | String | `'#000000'` | 线条颜色 |
| `lineWidth` | Number | `3` | 线条宽度 |
| `backgroundColor` | String | `'#FFFFFF'` | 背景颜色 |
| `disabled` | Boolean | `false` | 是否禁用签名 |

## Events 事件

| 事件名 | 参数 | 说明 |
|--------|------|------|
| `begin` | - | 开始绘制时触发 |
| `end` | - | 绘制结束时触发 |
| `change` | `{ hasSignature: boolean }` | 画布内容变化时触发 |

## Methods 方法

| 方法 | 返回值 | 说明 |
|------|--------|------|
| `getDataURL(type?, quality?)` | `Promise<string>` | 获取 Base64 图片数据 |
| `getData()` | `Promise<any>` | 获取原始数据 |
| `clear()` | `void` | 清空画布 |
| `undo()` | `boolean` | 撤销上一笔 |
| `redo()` | `boolean` | 重做上一笔 |
| `isUndoAvailable()` | `boolean` | 是否可撤销 |
| `isRedoAvailable()` | `boolean` | 是否可重做 |
| `isEmpty()` | `boolean` | 画布是否为空 |
| `destroy()` | `void` | 销毁组件，释放资源 |

### getDataURL 参数

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `type` | String | `'image/png'` | 图片类型，支持 `image/png`、`image/jpeg` |
| `quality` | Number | `0.92` | 图片质量，范围 0-1 |

## 完整示例

### 保存签名到服务器

```vue
<template>
  <view class="container">
    <uni-signature ref="signature" @end="onEnd" />

    <view class="btn-group">
      <button @click="handleSave" type="primary">保存</button>
      <button @click="handleClear">清空</button>
    </view>

    <view v-if="signatureImage" class="preview">
      <image :src="signatureImage" mode="aspectFit" />
    </view>
  </view>
</template>

<script>
import UniSignature from '@/components/uni-signature/UniSignature.vue';

export default {
  components: { UniSignature },
  data() {
    return {
      signatureImage: '',
    };
  },
  methods: {
    async handleSave() {
      try {
        const dataURL = await this.$refs.signature.getDataURL('image/png');

        // 上传到服务器
        // const res = await uni.uploadFile({
        //   url: 'https://your-api.com/upload',
        //   filePath: dataURL,
        //   name: 'signature',
        // });

        console.log('签名已保存:', dataURL);
        this.signatureImage = dataURL;

        uni.showToast({ title: '保存成功', icon: 'success' });
      } catch (e) {
        console.error('保存失败:', e);
        uni.showToast({ title: '保存失败', icon: 'none' });
      }
    },

    handleClear() {
      this.$refs.signature.clear();
      this.signatureImage = '';
    },

    onEnd() {
      console.log('签名完成');
    },
  },
};
</script>

<style scoped>
.container {
  padding: 20rpx;
}

.btn-group {
  display: flex;
  gap: 20rpx;
  margin-top: 20rpx;
}

.btn-group button {
  flex: 1;
}

.preview {
  margin-top: 30rpx;
  text-align: center;
}

.preview image {
  width: 300rpx;
  height: 200rpx;
  border: 1px solid #ddd;
}
</style>
```

### 表单中使用

```vue
<template>
  <view class="form">
    <view class="form-item">
      <text>用户名：</text>
      <input v-model="form.username" />
    </view>

    <view class="form-item">
      <text>签名：</text>
      <uni-signature
        ref="signature"
        canvas-id="form-signature"
        :width="600"
        :height="200"
        @change="onSignatureChange"
      />
    </view>

    <button @click="handleSubmit" :disabled="!hasSignature">提交</button>
  </view>
</template>

<script>
export default {
  data() {
    return {
      form: {
        username: '',
      },
      hasSignature: false,
    };
  },
  methods: {
    onSignatureChange(e) {
      this.hasSignature = e.hasSignature;
    },

    async handleSubmit() {
      const signature = await this.$refs.signature.getDataURL('image/png');

      // 提交表单
      // await uni.request({
      //   url: 'https://your-api.com/submit',
      //   method: 'POST',
      //   data: {
      //     ...this.form,
      //     signature,
      //   },
      // });
    },
  },
};
</script>
```

## 多端运行

### H5

```bash
npm run dev:h5
# 或
yarn dev:h5
```

### 微信小程序

```bash
npm run dev:mp-weixin
# 或
yarn dev:mp-weixin
```

然后使用微信开发者工具导入项目。

### 支付宝小程序

```bash
npm run dev:mp-alipay
# 或
yarn dev:mp-alipay
```

## 注意事项

1. **canvasId 必须唯一**: 每个签名组件的 `canvasId` 应保持唯一，避免与其他组件冲突。

2. **获取坐标方式**: 组件使用 `clientX/clientY` 获取触摸坐标，在有滚动或 fixed 定位的情况下可能需要调整。

3. **性能优化**: 大量绘制时可能会影响性能，可通过设置 `lineWidth` 适当降低精度。

4. **iOS 小程序**: 在 iOS 小程序中，`canvasToTempFilePath` 可能存在异步问题，确保在 `draw` 完成后调用。

5. **H5 环境**: H5 环境使用原生 Canvas API，兼容性更好但需要注意浏览器差异。

## 常见问题

### Q: 签名绘制不跟手？

A: 检查是否正确绑定了 touch 事件，确保没有阻止默认行为。

### Q: 保存的图片是空白？

A: 确保在 `end` 事件触发后再调用 `getDataURL`，UniApp 需要等待绘制完成。

### Q: 如何自定义笔触效果？

A: 可以通过 `lineColor` 和 `lineWidth` 属性调整颜色和粗细。

### Q: 支持压感书写吗？

A: 当前版本通过 `pressure` 字段预留了支持，但实际压感效果需要设备支持。

## 更新日志

### v1.0.0 (2026-03-24)

- 初始版本发布
- 支持 Vue2 和 Vue3
- 支持多端运行（小程序、H5、APP）
- 实现基础签名功能
- 实现撤销/重做功能
- 实现图片导出功能

## License

MIT
