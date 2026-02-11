import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
    server: {
    proxy: {
      // REST
      '/api': {
        target: 'http://intflowserver2.iptime.org:60535',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
      // WebSocket
      '/ws': {
        target: 'ws://intflowserver2.iptime.org:60535',
        ws: true,
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/ws/, '/ws'),
      },
    },
  },
})
