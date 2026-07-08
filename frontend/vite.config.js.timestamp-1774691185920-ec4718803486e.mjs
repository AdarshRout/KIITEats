// vite.config.js
import { defineConfig } from "file:///C:/WORK/CodeBase/kiiteats/frontend/node_modules/vite/dist/node/index.js";
import react from "file:///C:/WORK/CodeBase/kiiteats/frontend/node_modules/@vitejs/plugin-react/dist/index.js";
import basicSsl from "file:///C:/WORK/CodeBase/kiiteats/frontend/node_modules/@vitejs/plugin-basic-ssl/dist/index.mjs";
// var vite_config_default = defineConfig({
//   plugins: [react(), basicSsl()],
//   server: {
//     host: true,
//     https: true,
//     proxy: {
//       // Proxy all backend API paths through Vite → avoids mixed content (HTTPS→HTTP)
//       "/vendors": { target: "http://127.0.0.1:8000", changeOrigin: true, secure: false },
//       "/foods": { target: "http://127.0.0.1:8000", changeOrigin: true, secure: false },
//       "/cart": { target: "http://127.0.0.1:8000", changeOrigin: true, secure: false },
//       "/orders": { target: "http://127.0.0.1:8000", changeOrigin: true, secure: false },
//       "/auth": { target: "http://127.0.0.1:8000", changeOrigin: true, secure: false },
//       "/payments": { target: "http://127.0.0.1:8000", changeOrigin: true, secure: false },
//       "/group-orders": { target: "http://127.0.0.1:8000", changeOrigin: true, secure: false },
//       "/splits": { target: "http://127.0.0.1:8000", changeOrigin: true, secure: false },
//       "/api": { target: "http://127.0.0.1:8000", changeOrigin: true, secure: false },
//       "/ws": { target: "http://127.0.0.1:8000", changeOrigin: true, secure: false, ws: true }
//     }
//   }
// });
var vite_config_default = defineConfig({
  plugins: [react(), basicSsl()],
  server: {
    host: true,
    https: true,
    proxy: {
      // Proxy all backend API paths through Vite → avoids mixed content (HTTPS→HTTP)
      "/vendors": { target: "https://swagatpatel03-kiiteats.hf.space", changeOrigin: true, secure: false },
      "/foods": { target: "https://swagatpatel03-kiiteats.hf.space", changeOrigin: true, secure: false },
      "/cart": { target: "https://swagatpatel03-kiiteats.hf.space", changeOrigin: true, secure: false },
      "/orders": { target: "https://swagatpatel03-kiiteats.hf.space", changeOrigin: true, secure: false },
      "/auth": { target: "https://swagatpatel03-kiiteats.hf.space", changeOrigin: true, secure: false },
      "/payments": { target: "https://swagatpatel03-kiiteats.hf.space", changeOrigin: true, secure: false },
      "/group-orders": { target: "https://swagatpatel03-kiiteats.hf.space", changeOrigin: true, secure: false },
      "/splits": { target: "https://swagatpatel03-kiiteats.hf.space", changeOrigin: true, secure: false },
      "/api": { target: "https://swagatpatel03-kiiteats.hf.space", changeOrigin: true, secure: false },
      "/ws": { target: "https://swagatpatel03-kiiteats.hf.space", changeOrigin: true, secure: false, ws: true }
    }
  }
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcuanMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCJDOlxcXFxXT1JLXFxcXENvZGVCYXNlXFxcXGtpaXRlYXRzXFxcXGZyb250ZW5kXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCJDOlxcXFxXT1JLXFxcXENvZGVCYXNlXFxcXGtpaXRlYXRzXFxcXGZyb250ZW5kXFxcXHZpdGUuY29uZmlnLmpzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9DOi9XT1JLL0NvZGVCYXNlL2tpaXRlYXRzL2Zyb250ZW5kL3ZpdGUuY29uZmlnLmpzXCI7aW1wb3J0IHsgZGVmaW5lQ29uZmlnIH0gZnJvbSAndml0ZSdcclxuaW1wb3J0IHJlYWN0IGZyb20gJ0B2aXRlanMvcGx1Z2luLXJlYWN0J1xyXG5pbXBvcnQgYmFzaWNTc2wgZnJvbSAnQHZpdGVqcy9wbHVnaW4tYmFzaWMtc3NsJ1xyXG5cclxuZXhwb3J0IGRlZmF1bHQgZGVmaW5lQ29uZmlnKHtcclxuICBwbHVnaW5zOiBbcmVhY3QoKSwgYmFzaWNTc2woKV0sXHJcbiAgc2VydmVyOiB7XHJcbiAgICBob3N0OiB0cnVlLFxyXG4gICAgaHR0cHM6IHRydWUsXHJcbiAgICBwcm94eToge1xyXG4gICAgICAvLyBQcm94eSBhbGwgYmFja2VuZCBBUEkgcGF0aHMgdGhyb3VnaCBWaXRlIFx1MjE5MiBhdm9pZHMgbWl4ZWQgY29udGVudCAoSFRUUFNcdTIxOTJIVFRQKVxyXG4gICAgICAnL3ZlbmRvcnMnOiB7IHRhcmdldDogJ2h0dHA6Ly8xMjcuMC4wLjE6ODAwMCcsIGNoYW5nZU9yaWdpbjogdHJ1ZSwgc2VjdXJlOiBmYWxzZSB9LFxyXG4gICAgICAnL2Zvb2RzJzogeyB0YXJnZXQ6ICdodHRwOi8vMTI3LjAuMC4xOjgwMDAnLCBjaGFuZ2VPcmlnaW46IHRydWUsIHNlY3VyZTogZmFsc2UgfSxcclxuICAgICAgJy9jYXJ0JzogeyB0YXJnZXQ6ICdodHRwOi8vMTI3LjAuMC4xOjgwMDAnLCBjaGFuZ2VPcmlnaW46IHRydWUsIHNlY3VyZTogZmFsc2UgfSxcclxuICAgICAgJy9vcmRlcnMnOiB7IHRhcmdldDogJ2h0dHA6Ly8xMjcuMC4wLjE6ODAwMCcsIGNoYW5nZU9yaWdpbjogdHJ1ZSwgc2VjdXJlOiBmYWxzZSB9LFxyXG4gICAgICAnL2F1dGgnOiB7IHRhcmdldDogJ2h0dHA6Ly8xMjcuMC4wLjE6ODAwMCcsIGNoYW5nZU9yaWdpbjogdHJ1ZSwgc2VjdXJlOiBmYWxzZSB9LFxyXG4gICAgICAnL3BheW1lbnRzJzogeyB0YXJnZXQ6ICdodHRwOi8vMTI3LjAuMC4xOjgwMDAnLCBjaGFuZ2VPcmlnaW46IHRydWUsIHNlY3VyZTogZmFsc2UgfSxcclxuICAgICAgJy9ncm91cC1vcmRlcnMnOiB7IHRhcmdldDogJ2h0dHA6Ly8xMjcuMC4wLjE6ODAwMCcsIGNoYW5nZU9yaWdpbjogdHJ1ZSwgc2VjdXJlOiBmYWxzZSB9LFxyXG4gICAgICAnL3NwbGl0cyc6IHsgdGFyZ2V0OiAnaHR0cDovLzEyNy4wLjAuMTo4MDAwJywgY2hhbmdlT3JpZ2luOiB0cnVlLCBzZWN1cmU6IGZhbHNlIH0sXHJcbiAgICAgICcvYXBpJzogeyB0YXJnZXQ6ICdodHRwOi8vMTI3LjAuMC4xOjgwMDAnLCBjaGFuZ2VPcmlnaW46IHRydWUsIHNlY3VyZTogZmFsc2UgfSxcclxuICAgICAgJy93cyc6IHsgdGFyZ2V0OiAnaHR0cDovLzEyNy4wLjAuMTo4MDAwJywgY2hhbmdlT3JpZ2luOiB0cnVlLCBzZWN1cmU6IGZhbHNlLCB3czogdHJ1ZSB9LFxyXG4gICAgfSxcclxuICB9LFxyXG59KVxyXG4iXSwKICAibWFwcGluZ3MiOiAiO0FBQWtTLFNBQVMsb0JBQW9CO0FBQy9ULE9BQU8sV0FBVztBQUNsQixPQUFPLGNBQWM7QUFFckIsSUFBTyxzQkFBUSxhQUFhO0FBQUEsRUFDMUIsU0FBUyxDQUFDLE1BQU0sR0FBRyxTQUFTLENBQUM7QUFBQSxFQUM3QixRQUFRO0FBQUEsSUFDTixNQUFNO0FBQUEsSUFDTixPQUFPO0FBQUEsSUFDUCxPQUFPO0FBQUE7QUFBQSxNQUVMLFlBQVksRUFBRSxRQUFRLHlCQUF5QixjQUFjLE1BQU0sUUFBUSxNQUFNO0FBQUEsTUFDakYsVUFBVSxFQUFFLFFBQVEseUJBQXlCLGNBQWMsTUFBTSxRQUFRLE1BQU07QUFBQSxNQUMvRSxTQUFTLEVBQUUsUUFBUSx5QkFBeUIsY0FBYyxNQUFNLFFBQVEsTUFBTTtBQUFBLE1BQzlFLFdBQVcsRUFBRSxRQUFRLHlCQUF5QixjQUFjLE1BQU0sUUFBUSxNQUFNO0FBQUEsTUFDaEYsU0FBUyxFQUFFLFFBQVEseUJBQXlCLGNBQWMsTUFBTSxRQUFRLE1BQU07QUFBQSxNQUM5RSxhQUFhLEVBQUUsUUFBUSx5QkFBeUIsY0FBYyxNQUFNLFFBQVEsTUFBTTtBQUFBLE1BQ2xGLGlCQUFpQixFQUFFLFFBQVEseUJBQXlCLGNBQWMsTUFBTSxRQUFRLE1BQU07QUFBQSxNQUN0RixXQUFXLEVBQUUsUUFBUSx5QkFBeUIsY0FBYyxNQUFNLFFBQVEsTUFBTTtBQUFBLE1BQ2hGLFFBQVEsRUFBRSxRQUFRLHlCQUF5QixjQUFjLE1BQU0sUUFBUSxNQUFNO0FBQUEsTUFDN0UsT0FBTyxFQUFFLFFBQVEseUJBQXlCLGNBQWMsTUFBTSxRQUFRLE9BQU8sSUFBSSxLQUFLO0FBQUEsSUFDeEY7QUFBQSxFQUNGO0FBQ0YsQ0FBQzsiLAogICJuYW1lcyI6IFtdCn0K
