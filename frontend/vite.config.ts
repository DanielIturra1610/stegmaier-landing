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
});
