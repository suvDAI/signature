<template>
  <view class="container">
    <view class="header">
      <text class="title">Vue Signature Demo</text>
      <text class="subtitle">在下方签名</text>
    </view>

    <view class="signature-wrapper">
      <VueSignature
        ref="signature"
        canvas-id="signature-canvas"
        :width="canvasWidth"
        :height="200"
        line-color="#000000"
        :line-width="2"
        background-color="#FFFFFF"
        @begin="onBegin"
        @end="onEnd"
        @change="onChange"
      />
    </view>

    <view class="info">
      <text class="info-text">状态: {{ status }}</text>
      <text class="info-text">是否有签名: {{ hasSignature ? '是' : '否' }}</text>
    </view>

    <view class="controls">
      <button class="btn btn-primary" @click="handleSave" :disabled="!hasSignature">
        保存
      </button>
      <button class="btn btn-default" @click="handleUndo" :disabled="!canUndo">
        撤销
      </button>
      <button class="btn btn-default" @click="handleRedo" :disabled="!canRedo">
        重做
      </button>
      <button class="btn btn-danger" @click="handleClear">
        清空
      </button>
    </view>

    <view v-if="savedImage" class="preview">
      <text class="preview-title">签名预览:</text>
      <image class="preview-image" :src="savedImage" mode="aspectFit" />
    </view>
  </view>
</template>

<script>
import VueSignature from '@/components/VueSignature.vue';

export default {
  components: {
    VueSignature,
  },

  data() {
    return {
      canvasWidth: 300,
      status: '准备就绪',
      hasSignature: false,
      canUndo: false,
      canRedo: false,
      savedImage: '',
    };
  },

  onLoad() {
    const sysInfo = uni.getSystemInfoSync();
    this.canvasWidth = sysInfo.windowWidth - 40;
  },

  methods: {
    onBegin() {
      this.status = '绘制中...';
    },

    onEnd() {
      this.status = '绘制完成';
      this.updateState();
    },

    onChange(e) {
      this.hasSignature = e.hasSignature;
      this.updateState();
    },

    updateState() {
      if (this.$refs.signature) {
        this.canUndo = this.$refs.signature.isUndoAvailable();
        this.canRedo = this.$refs.signature.isRedoAvailable();
      }
    },

    async handleSave() {
      if (!this.$refs.signature) return;

      try {
        const dataURL = await this.$refs.signature.getDataURL('image/png');
        this.savedImage = dataURL;
        uni.showToast({
          title: '保存成功',
          icon: 'success',
        });
      } catch (e) {
        uni.showToast({
          title: '保存失败',
          icon: 'none',
        });
        console.error('Save error:', e);
      }
    },

    handleUndo() {
      if (!this.$refs.signature) return;
      this.$refs.signature.undo();
      this.updateState();
    },

    handleRedo() {
      if (!this.$refs.signature) return;
      this.$refs.signature.redo();
      this.updateState();
    },

    handleClear() {
      if (!this.$refs.signature) return;
      this.$refs.signature.clear();
      this.savedImage = '';
      this.hasSignature = false;
      this.canUndo = false;
      this.canRedo = false;
      this.status = '已清空';
    },
  },
};
</script>

<style scoped>
.container {
  padding: 20px;
  min-height: 100vh;
  background-color: #f5f5f5;
}

.header {
  margin-bottom: 20px;
  text-align: center;
}

.title {
  display: block;
  font-size: 24px;
  font-weight: bold;
  color: #333;
  margin-bottom: 8px;
}

.subtitle {
  display: block;
  font-size: 14px;
  color: #666;
}

.signature-wrapper {
  background-color: #fff;
  border-radius: 8px;
  padding: 10px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  margin-bottom: 20px;
}

.info {
  background-color: #fff;
  border-radius: 8px;
  padding: 15px;
  margin-bottom: 20px;
}

.info-text {
  display: block;
  font-size: 14px;
  color: #333;
  line-height: 1.6;
}

.controls {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 20px;
}

.btn {
  flex: 1;
  min-width: 70px;
  padding: 12px 0;
  border-radius: 8px;
  font-size: 14px;
  text-align: center;
  border: none;
}

.btn-primary {
  background-color: #007aff;
  color: #fff;
}

.btn-primary[disabled] {
  background-color: #a0cfff;
}

.btn-default {
  background-color: #fff;
  color: #333;
  border: 1px solid #ddd;
}

.btn-danger {
  background-color: #ff3b30;
  color: #fff;
}

.preview {
  background-color: #fff;
  border-radius: 8px;
  padding: 15px;
  text-align: center;
}

.preview-title {
  display: block;
  font-size: 14px;
  color: #333;
  margin-bottom: 10px;
}

.preview-image {
  width: 100%;
  max-width: 300px;
  height: 150px;
  border: 1px solid #ddd;
  border-radius: 4px;
}
</style>
