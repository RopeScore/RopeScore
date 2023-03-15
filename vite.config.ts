import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import WindiCSS from 'vite-plugin-windicss'
import Icons from 'unplugin-icons/vite'

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
    vue({
      template: {
        compilerOptions: {
          isCustomElement: tag => [
            // @github/relative-time-element
            'relative-time'
          ].includes(tag)
        }
      }
    }),
    WindiCSS(),
    Icons({
      compiler: 'vue3'
    })
  ]
})
