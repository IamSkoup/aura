import {defineConfig} from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';

export default defineConfig({
  root: 'static-site',
  base: '/aura/',
  publicDir: '../public',
  plugins: [react()],
  resolve: {alias: {'@': path.resolve(__dirname, 'static-site')}},
  build: {outDir: '../dist-pages', emptyOutDir: true},
});
