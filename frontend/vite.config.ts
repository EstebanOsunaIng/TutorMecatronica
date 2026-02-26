import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

function parseAllowedHosts(value: string | undefined) {
  return String(value || '')
    .split(',')
    .map((host) => host.trim())
    .filter(Boolean);
}

export default defineConfig(({ mode }) => {
    const allowedHosts = [
      '.railway.app',
      'localhost',
      '127.0.0.1',
      ...parseAllowedHosts(process.env.VITE_ALLOWED_HOSTS)
    ];

    return {
      server: {
        port: 3000,
        strictPort: true,
        host: '0.0.0.0',
        proxy: {
          '/api': {
            target: 'http://localhost:3001',
            changeOrigin: true,
          }
        }
      },
      preview: {
        host: '0.0.0.0',
        allowedHosts
      },
      plugins: [react()],
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
