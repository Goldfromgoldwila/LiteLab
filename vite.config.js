import { defineConfig } from 'vite'

export default defineConfig({
  base: '/LiteLab/',
  server: {
    port: 5173,
    host: 'localhost'
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets'
  }
})