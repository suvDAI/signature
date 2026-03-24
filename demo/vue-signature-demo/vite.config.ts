import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      'vue-signature': resolve(__dirname, '../../packages/vue-signature/src/index.ts'),
      'signature-canvas': resolve(__dirname, '../../packages/signature-canvas/src/index.ts')
    }
  },
server: {
    host: '0.0.0.0',  // 监听所有网络接口
    // 或指定具体 IP：host: '192.168.x.x'
  }
})
