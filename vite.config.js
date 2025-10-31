import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  },
  server: {
    port: 3000,
    host: true,
    https: false,
    // 添加代理配置解决CORS问题
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:54322',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '')
      }
    }
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