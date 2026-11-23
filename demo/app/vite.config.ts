import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const shim = (file: string) => fileURLToPath(new URL(`./src/shims/${file}`, import.meta.url));

// /fhir is proxied to the local HAPI FHIR server, so the browser talks to one origin
// and HAPI needs no CORS setup.
export default defineConfig({
  // Relative asset URLs: the same build runs at / and under a sub-path (GitHub Pages /demo/)
  base: './',
  plugins: [react()],
  resolve: {
    alias: [
      // Node built-ins of the CQL engine's model-info loader (src/shims/node.ts)
      { find: /^(timers|stream|string_decoder|fs)$/, replacement: shim('node.ts') },
      // Only the FHIR 4.0.1 model info is used
      { find: /^\.\/modelInfos\/fhir-modelinfo-(1\.0\.2|3\.0\.0|4\.0\.0)\.xml\.js$/, replacement: shim('empty-modelinfo.ts') },
    ],
  },
  server: {
    port: 5173,
    proxy: {
      '/fhir': { target: process.env.HAPI_URL ?? 'http://localhost:8080', changeOrigin: true },
    },
    // The shared modules in demo/lib sit outside this folder
    fs: { allow: ['..'] },
  },
  preview: {
    port: 4173,
    proxy: {
      '/fhir': { target: process.env.HAPI_URL ?? 'http://localhost:8080', changeOrigin: true },
    },
  },
  build: { chunkSizeWarningLimit: 4000 },
});
