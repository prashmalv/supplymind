import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    const apiTarget = env.VITE_API_PROXY_TARGET || 'http://localhost:3001';
    return {
      server: {
        port: 8444,
        host: '0.0.0.0',
        proxy: {
          // Frontend calls /api/* -> NestJS backend during dev.
          '/api': {
            target: apiTarget,
            changeOrigin: true,
          },
        },
      },
      plugins: [react()],
      // No secrets are injected into the browser bundle. All AI calls go through
      // the NestJS API, which holds provider keys server-side.
      resolve: {
        alias: {
          // Resolve the shared package to its TS source so Vite compiles it as
          // ESM (avoids CJS named-export detection issues with the dist build).
          '@supplymind/shared': path.resolve(__dirname, '../../packages/shared/src/index.ts'),
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
