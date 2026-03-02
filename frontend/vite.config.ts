import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  return {
    server: {
      port: 3000,
      host: '0.0.0.0',
      proxy: {
        '/api': { target: 'http://localhost:3001', changeOrigin: true },
        '/webhooks': { target: 'http://localhost:3001', changeOrigin: true },
      },
    },
    plugins: [react()],
    define: {
      'process.env.VITE_GEMINI_API_KEY': JSON.stringify(env.VITE_GEMINI_API_KEY),
      'process.env.VITE_OPENROUTER_API_KEY': JSON.stringify(env.VITE_OPENROUTER_API_KEY),
      'process.env.VITE_AI_MODEL': JSON.stringify(env.VITE_AI_MODEL)
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      }
    },
    build: {
      chunkSizeWarningLimit: 600,
      rollupOptions: {
        output: {
          manualChunks: (id) => {
            if (id.includes('node_modules/react') || id.includes('node_modules/react-dom')) {
              return 'vendor-react';
            }
            if (id.includes('node_modules/framer-motion')) {
              return 'vendor-framer';
            }
            if (id.includes('node_modules/lucide-react')) {
              return 'vendor-icons';
            }
            if (id.includes('node_modules')) {
              return 'vendor-misc';
            }
          },
        },
      },
    },
  };
});

