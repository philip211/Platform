import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false,
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: false,
        drop_debugger: true
      }
    },
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom', 'framer-motion'],
        },
      },
    },
  },
  server: {
    host: true,
    port: 5173,
    strictPort: true,
    cors: true,
    proxy: {
      '/api': {
        target: 'https://mafia-chicago-api.onrender.com',
        changeOrigin: true,
        secure: false,
      },
    },
    allowedHosts: [
      'localhost',
      '127.0.0.1',
      'e290-5-173-57-95.ngrok-free.app',
      'mytestapp.loca.lt',
      'ancient-bullfrog-78.loca.lt',
      'soft-impala-92.loca.lt',
      'shy-monkey-20.loca.lt',
      'mean-warthog-5.loca.lt',
      'mafia-chicago-game.loca.lt',
      'mafia-chicago-app.loca.lt',
    ],
  },
})
