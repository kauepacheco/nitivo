import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const clientDirectory = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  root: clientDirectory,
  plugins: [react({})],
  build: {
    outDir: resolve(clientDirectory, '../public'),
    emptyOutDir: true,
  },
});
