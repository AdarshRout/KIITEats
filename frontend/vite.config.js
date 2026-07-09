import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import basicSsl from '@vitejs/plugin-basic-ssl'

// Local backend for development
const DEV_BACKEND = 'http://127.0.0.1:8000'

export default defineConfig(({ command }) => ({
  plugins: command === 'serve' ? [react(), basicSsl()] : [react()],

  server: {
    host: true,
    https: true,
    // Dev proxy — routes all API paths to the local FastAPI server.
    // In production (Vercel), VITE_API_URL points directly to the HF Space backend.
    proxy: {
      '/auth':         { target: DEV_BACKEND, changeOrigin: true, secure: false },
      '/vendors':      { target: DEV_BACKEND, changeOrigin: true, secure: false },
      '/foods':        { target: DEV_BACKEND, changeOrigin: true, secure: false },
      '/cart':         { target: DEV_BACKEND, changeOrigin: true, secure: false },
      '/orders':       { target: DEV_BACKEND, changeOrigin: true, secure: false },
      '/payments':     { target: DEV_BACKEND, changeOrigin: true, secure: false },
      '/group-orders': { target: DEV_BACKEND, changeOrigin: true, secure: false },
      '/splits':       { target: DEV_BACKEND, changeOrigin: true, secure: false },
      '/api':          { target: DEV_BACKEND, changeOrigin: true, secure: false },
      '/ws':           { target: DEV_BACKEND, changeOrigin: true, secure: false, ws: true },
    },
  },

  build: {
    outDir: 'dist',
    sourcemap: false,
    // Raise the warning limit slightly — fc_*.png images are large bundled assets
    chunkSizeWarningLimit: 3000,
    rollupOptions: {
      output: {
        // Split vendor JS from app JS for better long-term caching
        manualChunks: {
          react: ['react', 'react-dom'],
          router: ['react-router-dom'],
          charts: ['recharts'],
          leaflet: ['leaflet', 'react-leaflet'],
        },
      },
    },
  },
}))