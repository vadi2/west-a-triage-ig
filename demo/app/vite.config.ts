import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// /fhir is proxied to the local HAPI FHIR server, so the browser talks to one origin
// and HAPI needs no CORS setup.
export default defineConfig({
  plugins: [react()],
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
