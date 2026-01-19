import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig(() => ({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
    proxy: {
      '/api/directus': {
        target: 'https://api.achieve.bluecodeltd.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/directus/, ''),
      },
      '/api/dqa': {
        target: 'https://ecapplus.server.dqa.bluecodeltd.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/dqa/, ''),
      },
      '/api': {
        target: 'https://api.achieve.bluecodeltd.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
