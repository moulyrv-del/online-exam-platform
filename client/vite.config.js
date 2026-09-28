import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Any request starting with /api is forwarded to the Express server.
// If you change PORT in server/.env, change the number below too.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': 'http://localhost:5000',
    },
  },
});
