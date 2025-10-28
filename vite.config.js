import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  server: {
    port: 3000,
    host: true,
    https: false
  },
  optimizeDeps: {
    exclude: ['tslib']
  },
  build: {
    rollupOptions: {
      external: ['tslib']
    }
  }
})