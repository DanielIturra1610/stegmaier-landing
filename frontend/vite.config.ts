import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { fileURLToPath } from 'url';

// Esto reemplaza __dirname en ESM (compatible con Windows)
const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig(({ command, mode }) => {
  const isProduction = mode === 'production';
  
  return {
    plugins: [react()],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "src"),
        "@components": path.resolve(__dirname, "src/components"),
        "@lib": path.resolve(__dirname, "src/lib"),
        "@hooks": path.resolve(__dirname, "src/hooks"),
        "@assets": path.resolve(__dirname, "src/assets"),
      },
    },
    
    // Build optimizations para producción
    build: {
      // Target modern browsers para mejor performance
      target: 'es2015',
      
      // Optimizaciones de bundle
      rollupOptions: {
        output: {
          // Code splitting inteligente
          manualChunks: {
            // Vendor chunks
            vendor: ['react', 'react-dom'],
            router: ['react-router-dom'],
            ui: ['@heroicons/react', 'framer-motion', 'lucide-react'],
            forms: ['formik', 'yup'],
            charts: ['recharts'],
          },
          
          // Nombres de archivo con hash para cache busting
          chunkFileNames: 'assets/js/[name]-[hash].js',
          entryFileNames: 'assets/js/[name]-[hash].js',
          assetFileNames: 'assets/[ext]/[name]-[hash].[ext]',
        },
      },
      
      // Compresión y minificación
      minify: 'terser',
      terserOptions: {
        compress: {
          // Remover console.logs en producción
          drop_console: isProduction,
          drop_debugger: isProduction,
        },
      },
      
      // Source maps solo en desarrollo
      sourcemap: !isProduction,
      
      // Chunk size warnings
      chunkSizeWarningLimit: 600,
    },
    
    // Server configuration (desarrollo)
    server: {
      host: '0.0.0.0',
      port: 5173,
      proxy: {
        '/api': {
          target: process.env.VITE_PROXY_TARGET || 'http://localhost:8080',
          changeOrigin: true,
          secure: false,
          configure: (proxy, options) => {
            if (!isProduction) {
              proxy.on('error', (err, req, res) => {
                console.log('Proxy error:', err.message);
              });
            }
          },
        },
      },
    },
    
    // Preview configuration (para testing de build)
    preview: {
      host: '0.0.0.0',
      port: 4173,
    },
    
    // Define global constants
    define: {
      __APP_VERSION__: JSON.stringify(process.env.VITE_APP_VERSION || '1.0.0'),
      __BUILD_TIME__: JSON.stringify(new Date().toISOString()),
    },
    
    // Optimizations
    optimizeDeps: {
      include: [
        'react',
        'react-dom',
        'react-router-dom',
        '@heroicons/react/24/outline',
        '@heroicons/react/24/solid',
      ],
    },
  };
});
