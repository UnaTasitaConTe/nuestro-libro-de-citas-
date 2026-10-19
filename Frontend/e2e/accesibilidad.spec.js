import { test, expect, startSession, expectNoA11yViolations } from './fixtures';

// axe-core en las pantallas principales, con el tema predeterminado y uno de
// temporada (el contraste depende de la paleta), en escritorio y móvil.
const PAGES = [
  { path: '/', h1: 'Nuestras citas' },
  { path: '/citas/1', h1: 'Cena en la playa' },
  { path: '/citas/nueva', h1: 'Nueva cita' },
  { path: '/citas/1/mi-entrada', h1: 'Mi versión de la cita' },
  { path: '/citas/1/editar', h1: 'Editar cita' },
  { path: '/calendario?mes=2026-10', h1: 'Calendario' },
  { path: '/galeria', h1: 'Galería' },
  { path: '/backlog', h1: 'Backlog de citas' },
  { path: '/pareja', h1: 'Invitar a mi pareja' },
];

for (const theme of ['noche', 'halloween']) {
  test.describe(`Accesibilidad (${theme})`, () => {
    test.slow(); // axe recorre todo el DOM (incluido el fondo animado)
    test('login y registro', async ({ page, apiCalls }) => {
      void apiCalls;
      await page.addInitScript((t) => localStorage.setItem('nlc:tema', t), theme);
      for (const path of ['/login', '/register']) {
        await page.goto(path);
        await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
        await expectNoA11yViolations(page);
      }
    });

    for (const { path, h1 } of PAGES) {
      test(path, async ({ page, apiCalls }) => {
        void apiCalls;
        await startSession(page, { theme });
        await page.goto(path);
        await expect(page.getByRole('heading', { level: 1, name: h1 })).toBeVisible();
        await expectNoA11yViolations(page);
      });
    }
  });
}
