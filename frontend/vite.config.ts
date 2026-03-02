import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true, // 0.0.0.0 - necesario para Docker
    port: 5173,
    strictPort: true, // Forzar puerto 5173
    hmr: {
      host: 'localhost',
      protocol: 'ws',
      port: 5173,
      clientPort: 5173
    },
    watch: {
      usePolling: true, // Necesario para Docker
      interval: 1000
    },
    allowedHosts: [
      'localhost',
      '127.0.0.1',
      'hockeybariloche.com.ar',
      'www.hockeybariloche.com.ar'
    ]
  },
  // Para producción (ayuda con las rutas)
  base: '/',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false
  }
})