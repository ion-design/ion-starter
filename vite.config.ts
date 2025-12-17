import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

import ionVitePlugin from './.ion/vite-plugin-ion.js';

export default defineConfig({
  plugins: [
    ionVitePlugin(),react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    allowedHosts: true,
  }
})
