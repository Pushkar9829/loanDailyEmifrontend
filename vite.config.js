import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// Stamp the service worker with a build id so browsers pick up each new deploy.
const stampServiceWorker = () => ({
  name: 'stamp-sw',
  apply: 'build',
  closeBundle() {
    const file = resolve(__dirname, 'dist/sw.js');
    if (!existsSync(file)) return;
    const id = process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 8) || Date.now().toString(36);
    writeFileSync(file, readFileSync(file, 'utf8').replace('__BUILD_VERSION__', id));
  },
});

export default defineConfig({
  plugins: [react(), tailwindcss(), stampServiceWorker()],
  server: { port: 5173 },
});
