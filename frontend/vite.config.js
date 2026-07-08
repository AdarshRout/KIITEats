import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import basicSsl from '@vitejs/plugin-basic-ssl'

// export default defineConfig(({ command }) => ({
//   plugins: command === 'serve' ? [react(), basicSsl()] : [react()],
//   server: {
//     host: true,
//     https: true,
//     proxy: {
//       // Proxy all backend API paths through Vite → avoids mixed content (HTTPS→HTTP)
//       '/vendors': { target: 'http://127.0.0.1:8000', changeOrigin: true, secure: false },
//       '/foods': { target: 'http://127.0.0.1:8000', changeOrigin: true, secure: false },
//       '/cart': { target: 'http://127.0.0.1:8000', changeOrigin: true, secure: false },
//       '/orders': { target: 'http://127.0.0.1:8000', changeOrigin: true, secure: false },
//       '/auth': { target: 'http://127.0.0.1:8000', changeOrigin: true, secure: false },
//       '/payments': { target: 'http://127.0.0.1:8000', changeOrigin: true, secure: false },
//       '/group-orders': { target: 'http://127.0.0.1:8000', changeOrigin: true, secure: false },
//       '/splits': { target: 'http://127.0.0.1:8000', changeOrigin: true, secure: false },
//       '/api': { target: 'http://127.0.0.1:8000', changeOrigin: true, secure: false },
//       '/ws': { target: 'http://127.0.0.1:8000', changeOrigin: true, secure: false, ws: true },
//     },
//   },
// }))

export default defineConfig(({ command }) => ({
  plugins: command === 'serve' ? [react(), basicSsl()] : [react()],
  server: {
    host: true,
    https: true,
    proxy: {
      // Proxy all backend API paths through Vite → avoids mixed content (HTTPS→HTTP)
      '/vendors': { target: 'https://swagatpatel03-kiiteats.hf.space', changeOrigin: true, secure: false },
      '/foods': { target: 'https://swagatpatel03-kiiteats.hf.space', changeOrigin: true, secure: false },
      '/cart': { target: 'https://swagatpatel03-kiiteats.hf.space', changeOrigin: true, secure: false },
      '/orders': { target: 'https://swagatpatel03-kiiteats.hf.space', changeOrigin: true, secure: false },
      '/auth': { target: 'https://swagatpatel03-kiiteats.hf.space', changeOrigin: true, secure: false },
      '/payments': { target: 'https://swagatpatel03-kiiteats.hf.space', changeOrigin: true, secure: false },
      '/group-orders': { target: 'https://swagatpatel03-kiiteats.hf.space', changeOrigin: true, secure: false },
      '/splits': { target: 'https://swagatpatel03-kiiteats.hf.space', changeOrigin: true, secure: false },
      '/api': { target: 'https://swagatpatel03-kiiteats.hf.space', changeOrigin: true, secure: false },
      '/ws': { target: 'https://swagatpatel03-kiiteats.hf.space', changeOrigin: true, secure: false, ws: true },
    },
  },
}))