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
      "/directus-api": {
        target: "https://api.achieve.bluecodeltd.com",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/directus-api/, ""),
      },
      "/dqa-api": {
        target: "https://ecapplus.server.dqa.bluecodeltd.com",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/dqa-api/, ""),
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
