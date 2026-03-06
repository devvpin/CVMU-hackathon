import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // Expose on all interfaces so Android phone on same Wi-Fi can reach this dev server
    host: '0.0.0.0',
    port: 5173,
    proxy: {
      // Forward /api calls to the backend (works in browser and via live reload on mobile)
      "/api": {
        target: "http://127.0.0.1:5000",
        changeOrigin: true,
      },
    },
    allowedHosts: true,
  }
})
