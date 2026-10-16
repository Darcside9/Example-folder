import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    proxy: {
      '/api/tiger': {
        target: 'https://tiger-sms.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/tiger/, '')
      }
    }
  }
});
