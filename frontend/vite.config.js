import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: '127.0.0.1',
    port: 5173,
    proxy: {
      // In dev, call the API as `/api/...` and Vite will forward to backend
      "/api": {
        target: "http://127.0.0.1:5000",
        changeOrigin: true,
      },
    },
  }
})
