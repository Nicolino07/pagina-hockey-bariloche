import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const appUrl = (process.env.VITE_API_URL ?? '').replace(/\/api$/, '') || 'http://localhost:8080'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    {
      name: 'print-app-url',
      configureServer(server) {
        server.httpServer?.once('listening', () => {
          console.log(`\n  ➜  App (nginx): \x1b[36m${appUrl}\x1b[0m\n`)
        })
      },
    },
  ],
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
      'frontend',
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