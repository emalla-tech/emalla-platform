import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, process.cwd(), '');
    const apiTarget = env.VITE_DEV_API_TARGET || 'http://127.0.0.1:4000';

    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
        strictPort: true,
        proxy: {
          '/api': {
            target: apiTarget,
            changeOrigin: true
          }
        }
      },
      build: {
        target: 'es2020',
        sourcemap: false,
        chunkSizeWarningLimit: 1200
      },
      plugins: [react()],
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
