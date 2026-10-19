import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const apiTarget = env.VITE_API_PROXY_TARGET || 'http://localhost:4000'

  return {
    plugins: [react(), tailwindcss()],
    server: {
      host: true,
      proxy: {
        '/api': { target: apiTarget, ws: true },
        '/uploads': apiTarget,
      },
    },
    test: {
      environment: 'jsdom',
      include: ['src/**/*.test.{js,jsx}'],
      setupFiles: ['./src/test/setup.js'],
      // Las pruebas que escriben mucho con user-event tardan ~1,5 s solas, pero
      // con todos los archivos en paralelo (Windows, jsdom) superaban los 5 s.
      testTimeout: 15000,
    },
  }
})
