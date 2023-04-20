import { fileURLToPath, URL } from 'node:url';
import createSvgSpritePlugin from 'vite-plugin-svg-sprite';
import { defineConfig } from 'vite';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    createSvgSpritePlugin({
      symbolId: 'icon-[name]-[hash]',
    })
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  }
})