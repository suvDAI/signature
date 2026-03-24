<template>
  <view class="container">
    <view class="header">
      <text class="title">UniApp Signature Demo</text>
      <text class="subtitle">Sign in the box below</text>
    </view>

    <view class="signature-wrapper">
      <uni-signature
        ref="signatureRef"
        canvas-id="signature-canvas"
        :width="canvasWidth"
        :height="200"
        line-color="#000000"
        :line-width="3"
        background-color="#FFFFFF"
        @begin="onBegin"
        @end="onEnd"
        @change="onChange"
      />
    </view>

    <view class="info">
      <text class="info-text">Status: {{ signatureStatus }}</text>
      <text class="info-text">Has Signature: {{ hasSignature ? 'Yes' : 'No' }}</text>
    </view>

    <view class="controls">
      <button class="btn btn-primary" @click="handleSave" :disabled="!hasSignature">
        Save
      </button>
      <button class="btn btn-default" @click="handleUndo" :disabled="!canUndo">
        Undo
      </button>
      <button class="btn btn-default" @click="handleRedo" :disabled="!canRedo">
        Redo
      </button>
      <button class="btn btn-danger" @click="handleClear">
        Clear
      </button>
    </view>

    <view v-if="savedImage" class="preview">
      <text class="preview-title">Saved Signature:</text>
      <image class="preview-image" :src="savedImage" mode="aspectFit" />
    </view>
  </view>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { UniSignature } from '@/components/uni-signature/UniSignature';

const signatureRef = ref(null);
const hasSignature = ref(false);
const canUndo = ref(false);
const canRedo = ref(false);
const savedImage = ref('');
const signatureStatus = ref('Ready');

const canvasWidth = ref(300);

onMounted(() => {
  // Get screen width for responsive canvas
  const sysInfo = uni.getSystemInfoSync();
  canvasWidth.value = sysInfo.windowWidth - 40; // 20px padding on each side
});

function onBegin() {
  signatureStatus.value = 'Drawing...';
}

function onEnd() {
  signatureStatus.value = 'Completed';
  updateState();
}

function onChange(payload) {
  hasSignature.value = payload.hasSignature;
}

async function updateState() {
  if (signatureRef.value) {
    canUndo.value = signatureRef.value.isUndoAvailable?.() ?? false;
    canRedo.value = signatureRef.value.isRedoAvailable?.() ?? false;
  }
}

async function handleSave() {
  if (!signatureRef.value) return;

  try {
    const dataURL = await signatureRef.value.getDataURL?.('image/png');
    if (dataURL) {
      savedImage.value = dataURL;
      uni.showToast({
        title: 'Signature saved!',
        icon: 'success',
      });
    }
  } catch (e) {
    uni.showToast({
      title: 'Failed to save',
      icon: 'none',
    });
    console.error('Save error:', e);
  }
}

function handleUndo() {
  if (!signatureRef.value) return;
  signatureRef.value.undo?.();
  updateState();
}

function handleRedo() {
  if (!signatureRef.value) return;
  signatureRef.value.redo?.();
  updateState();
}

function handleClear() {
  if (!signatureRef.value) return;
  signatureRef.value.clear?.();
  savedImage.value = '';
  hasSignature.value = false;
  canUndo.value = false;
  canRedo.value = false;
  signatureStatus.value = 'Ready';
}
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
