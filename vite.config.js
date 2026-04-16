import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import dts from 'vite-plugin-dts'
import postcssPxToViewport from 'postcss-px-to-viewport-8-plugin'
import { resolve } from 'path'

export default defineConfig({
  plugins: [
    vue(),
    dts({
      include: ['src/packages/**/*.{vue,ts}'],
      outDir: 'dist/types',
      staticImport: true,
      insertTypesEntry: true
    })
  ],
  build: {
    outDir: 'dist',
    lib: {
      entry: {
        index: resolve(__dirname, 'src/packages/index.ts'),
        style: resolve(__dirname, 'src/packages/styles/index.scss'),
        'style-mobile': resolve(__dirname, 'src/packages/styles/mobile.scss')
      },
      name: 'OhhhVueCalendar',
      formats: ['es', 'cjs'],
      fileName: (format, entryName) => {
        if (entryName === 'index') {
          return `ohhh-vue-calendar.${format}.js`
        }
        return `${entryName}.${format}.js`
      }
    },
    rollupOptions: {
      external: ['vue', '@vueuse/core'],
      output: {
        globals: {
          vue: 'Vue',
          '@vueuse/core': 'VueUse'
        },
        assetFileNames: (assetInfo) => {
          if (assetInfo.name && assetInfo.name.endsWith('.css')) {
            return 'styles/[name][extname]'
          }
          return 'assets/[name][extname]'
        }
      }
    },
    cssCodeSplit: true
  },
  css: {
    postcss: {
      plugins: [
        postcssPxToViewport({
          unitToConvert: 'px',
          viewportWidth: 750,
          unitPrecision: 6,
          propList: ['*'],
          viewportUnit: 'vw',
          fontViewportUnit: 'vw',
          selectorBlackList: [],
          minPixelValue: 1,
          mediaQuery: false,
          replace: true,
          landscape: false,
          exclude: [/\/src\/packages\/Calendar\/style\/index\.scss/]
        })
      ]
    }
  }
})
