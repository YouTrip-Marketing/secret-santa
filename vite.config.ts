import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  // GitHub Pages project site lives at /secret-santa/. Routing is hash-based.
  base: '/secret-santa/',
  plugins: [react()],
  build: { target: 'es2020', sourcemap: false },
  test: { environment: 'node', include: ['tests/**/*.test.ts'] },
});
