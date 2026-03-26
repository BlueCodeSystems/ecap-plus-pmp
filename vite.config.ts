import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig(() => ({
  server: {
    host: "::",
    port: 3040,
    hmr: {
      overlay: false,
    },
    proxy: {
      // Proxy Superset API requests to avoid CORS issues in development
      "/superset-api": {
        target: "http://localhost:3005",
        changeOrigin: true,
        rewrite: (p: string) => p.replace(/^\/superset-api/, ""),
      },
    },
  },
  preview: {
    host: "::",
    port: 3040,
  },
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
