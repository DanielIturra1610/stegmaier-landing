import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path"; // Usa 'path' en vez de 'node:path'

// Esto reemplaza __dirname en ESM
const __dirname = new URL(".", import.meta.url).pathname;

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
  server: {
    host: '0.0.0.0', // Escuchar en todas las interfaces
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://stegmaier-api:8000', // Usar siempre el nombre del servicio Docker
        changeOrigin: true,
        secure: false,
        configure: (proxy, options) => {
          proxy.on('error', (err, req, res) => {
            console.log('Proxy error:', err.message);
          });
          proxy.on('proxyReq', (proxyReq, req, res) => {
            console.log('Proxying request to:', proxyReq.path);
          });
        },
      },
    },
  },
});
