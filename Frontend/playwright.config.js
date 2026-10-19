import { defineConfig, devices } from '@playwright/test';

/**
 * Recorridos E2E sobre el build de producción (vite preview).
 * - La API se responde dentro del navegador (e2e/fixtures.js): ninguna
 *   petición llega al backend, no hacen falta credenciales ni base de datos.
 * - Se usa el Chrome instalado en el sistema (channel: 'chrome'), sin descargar
 *   navegadores. Para usar el Chromium de Playwright: `pnpm exec playwright install chromium`
 *   y quitar `channel`.
 */
const PORT = 4173;

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  // Pocos workers: cada uno lanza un Chrome completo y axe es intensivo en CPU.
  workers: 4,
  retries: process.env.CI ? 1 : 0,
  reporter: [['list']],
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: 'retain-on-failure',
    locale: 'es-ES',
  },
  webServer: {
    command: `pnpm build && pnpm exec vite preview --port ${PORT} --strictPort`,
    url: `http://localhost:${PORT}/login`,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
  projects: [
    { name: 'escritorio', use: { ...devices['Desktop Chrome'], channel: 'chrome', viewport: { width: 1440, height: 900 } } },
    { name: 'movil', use: { ...devices['Pixel 7'], channel: 'chrome' } },
  ],
});
