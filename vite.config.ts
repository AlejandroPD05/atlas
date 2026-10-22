import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    // MapLibre carga su worker con `new URL(..., import.meta.url)`;
    // el pre-bundling de dependencias de Vite rompe esa resolución.
    exclude: ['maplibre-gl'],
  },
  server: {
    host: '127.0.0.1',
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    css: false,
  },
})
