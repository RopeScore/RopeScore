import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import WindiCSS from 'vite-plugin-windicss'
import Icons from 'vite-plugin-icons'

// https://vitejs.dev/config/
export default defineConfig({
  build: {
    sourcemap: true,
    outDir: 'dist/render'
  },
  server: {
    port: 5050
  },
  plugins: [
    vue(),
    WindiCSS(),
    Icons()
  ]
})
