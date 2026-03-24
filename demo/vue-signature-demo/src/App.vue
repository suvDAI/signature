<script setup lang="ts">
import { ref } from 'vue';
import { VueSignature } from 'vue-signature';

interface SignatureRef {
  clear: () => void;
  undo: () => void;
  redo: () => void;
  save: () => string;
  getSignature: () => string;
  isEmpty: () => boolean;
}

const signatureRef = ref<SignatureRef | null>(null);
const signatureData = ref<string>('');
const strokeColor = ref('#000000');
const strokeWidth = ref(2);
const isDisabled = ref(false);

const colors = ['#000000', '#FF0000', '#00FF00', '#0000FF', '#FF00FF', '#00FFFF'];

const handleSignatureChange = (base64: string) => {
  signatureData.value = base64;
};

const handleClear = () => {
  signatureRef.value?.clear();
};

const handleUndo = () => {
  signatureRef.value?.undo();
};

const handleRedo = () => {
  signatureRef.value?.redo();
};

const handleSave = () => {
  const data = signatureRef.value?.save() || '';
  if (data) {
    const link = document.createElement('a');
    link.download = `signature-${Date.now()}.png`;
    link.href = data;
    link.click();
  }
};

const handleGetSignature = () => {
  const data = signatureRef.value?.getSignature() || '';
  console.log('Signature:', data);
};

const handleIsEmpty = () => {
  const empty = signatureRef.value?.isEmpty();
  console.log('Is empty:', empty);
};
</script>

<template>
  <div class="demo-container">
    <h1>Vue Signature Demo</h1>

    <div class="signature-section">
      <h2>Basic Signature</h2>
      <VueSignature
        ref="signatureRef"
        width="100%"
        height="200px"
        :stroke-color="strokeColor"
        :stroke-width="strokeWidth"
        :disabled="isDisabled"
        @update:signature="handleSignatureChange"
      />
    </div>

    <div class="controls-section">
      <h2>Controls</h2>

      <div class="control-group">
        <label>Stroke Color:</label>
        <div class="color-picker">
          <button
            v-for="color in colors"
            :key="color"
            :class="['color-btn', { active: strokeColor === color }]"
            :style="{ backgroundColor: color }"
            @click="strokeColor = color"
          />
        </div>
      </div>

      <div class="control-group">
        <label>Stroke Width:</label>
        <input
          type="range"
          v-model="strokeWidth"
          min="1"
          max="10"
          step="1"
        />
        <span>{{ strokeWidth }}px</span>
      </div>

      <div class="control-group">
        <label>
          <input type="checkbox" v-model="isDisabled" />
          Disabled
        </label>
      </div>

      <div class="button-group">
        <button @click="handleUndo">Undo</button>
        <button @click="handleRedo">Redo</button>
        <button @click="handleClear">Clear</button>
        <button @click="handleSave">Save PNG</button>
        <button @click="handleGetSignature">Get Signature</button>
        <button @click="handleIsEmpty">Check Empty</button>
      </div>
    </div>

    <div v-if="signatureData" class="preview-section">
      <h2>Preview</h2>
      <img :src="signatureData" alt="Signature Preview" class="signature-preview" />
    </div>
  </div>
</template>

<style scoped>
.demo-container {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
  font-family: Arial, sans-serif;
}

h1 {
  text-align: center;
  color: #333;
}

h2 {
  color: #666;
  margin-bottom: 10px;
}

.signature-section {
  margin-bottom: 20px;
}

@media (max-width: 600px) {
  .demo-container {
    padding: 12px;
  }

  h1 {
    font-size: 24px;
  }

  h2 {
    font-size: 18px;
  }
}

.control-group {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 15px;
  flex-wrap: wrap;
}

.control-group label {
  font-weight: bold;
  min-width: 100px;
}

.color-picker {
  display: flex;
  gap: 8px;
}

.color-btn {
  width: 30px;
  height: 30px;
  border: 2px solid transparent;
  border-radius: 4px;
  cursor: pointer;
}

.color-btn.active {
  border-color: #333;
}

input[type="range"] {
  width: 150px;
}

.button-group {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 15px;
}

.button-group button {
  padding: 10px 20px;
  background: #007bff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: background 0.3s;
}

.button-group button:hover {
  background: #0056b3;
}

.preview-section {
  background: #f5f5f5;
  padding: 20px;
  border-radius: 8px;
  text-align: center;
}

.signature-preview {
  max-width: 100%;
  border: 1px solid #ccc;
  border-radius: 4px;
}

@media (max-width: 600px) {
  .controls-section {
    padding: 12px;
  }

  .control-group {
    flex-direction: column;
    align-items: flex-start;
    gap: 6px;
  }

  .control-group label {
    min-width: auto;
  }

  input[type="range"] {
    width: 100%;
    max-width: 200px;
  }

  .button-group {
    flex-direction: column;
  }

  .button-group button {
    width: 100%;
  }
}
</style>
