import { test as base, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const IMG = '/chimueloylanovia.png';
const entry = (id, user_id, user_name, valoracion, photos = []) => ({
  id, user_id, user_name, valoracion,
  que_hicimos: 'Cenamos en la terraza.', como_te_sentiste: 'Feliz.', lo_que_mas_gusto: 'La música.', lo_que_menos_gusto: '',
  intimidad: false, photos,
});
export const CITA = {
  id: 1, nombre: 'Cena en la playa', fecha: '2026-10-03', lugar: 'Mazatlán', repetiriamos: 'SI',
  entries: [entry(10, 1, 'Ana', 4, [{ id: 100, foto_url: IMG, thumb_url: IMG }, { id: 101, foto_url: IMG, thumb_url: IMG }])],
};

/** Respuestas por defecto de la API simulada: `METODO /ruta` → cuerpo. */
export function defaultApi() {
  return {
    'POST /api/auth/login': { token: 'token-e2e', user: { id: 1, name: 'Ana', role: 'ADMIN' } },
    'POST /api/auth/logout': {},
    'GET /api/citas': { citas: [CITA, { ...CITA, id: 2, nombre: 'Museo', entries: [] }], totalPages: 2 },
    'GET /api/citas/1': CITA,
    'GET /api/citas/calendar': [{ id: 1, nombre: 'Cena en la playa', fecha: '2026-10-03', lugar: 'Mazatlán', intimidad: true }],
    'GET /api/citas/gallery': { photos: [{ id: 1, cita_id: 1, cita_nombre: 'Cena en la playa', cita_fecha: '2026-10-03', foto_url: IMG, thumb_url: IMG }], totalPages: 1, total: 1 },
    'GET /api/ideas-citas': [
      { id: 1, titulo: 'Ir al cine', descripcion: 'Estreno', estado: 'POR_HACER', orden: 0 },
      { id: 2, titulo: 'Picnic', descripcion: '', estado: 'HECHA', orden: 0 },
    ],
    'PATCH /api/ideas-citas/1/mover': [],
    'DELETE /api/ideas-citas/2': {},
    'DELETE /api/citas/1/fotos/100': { ...CITA, entries: [{ ...CITA.entries[0], photos: [CITA.entries[0].photos[1]] }] },
    'GET /api/pareja/me': { inviteCode: 'ABC123', members: [{ id: 1, name: 'Ana' }] },
  };
}

export const test = base.extend({
  /** Registro de las peticiones a la API que hizo la página (para comprobar qué se envió). */
  apiCalls: async ({ page }, provide) => { // «provide» = el «use» de Playwright (ese nombre confunde a la regla de hooks)
    const calls = [];
    const api = defaultApi();
    await page.route('**/api/**', async (route) => {
      const req = route.request();
      const key = `${req.method()} ${new URL(req.url()).pathname}`;
      calls.push({ key, body: req.postData() });
      const body = api[key];
      await route.fulfill(body === undefined ? { status: 404, json: { error: 'No simulado en e2e' } } : { json: body });
    });
    // Sin conexión de tiempo real (el backlog abre un WebSocket).
    await page.addInitScript(() => {
      window.WebSocket = class { constructor() {} close() {} };
    });
    await provide(calls);
  },
});

/** Sesión simulada y preferencias, antes de que cargue la app. */
export async function startSession(page, { theme = 'noche', skyMotion = 'si' } = {}) {
  await page.addInitScript(({ theme, skyMotion }) => {
    if (sessionStorage.getItem('e2e-init')) return; // solo en la primera carga: respeta lo que cambie la prueba
    sessionStorage.setItem('e2e-init', '1');
    localStorage.setItem('token', 'token-e2e');
    localStorage.setItem('user', JSON.stringify({ id: 1, name: 'Ana', role: 'ADMIN' }));
    localStorage.setItem('nlc:tema', theme);
    localStorage.setItem('nlc:animar-fondo', skyMotion);
  }, { theme, skyMotion });
}

/** Análisis de accesibilidad con axe-core (WCAG 2.0/2.1/2.2 A y AA). */
export async function expectNoA11yViolations(page) {
  // Espera a que terminen las entradas (fade/card-in): a mitad de la animación
  // la opacidad es parcial y axe mediría un contraste que el usuario no ve.
  await page.evaluate(() =>
    Promise.all(
      document.getAnimations()
        .filter((a) => a.effect?.getComputedTiming().iterations !== Infinity)
        .map((a) => a.finished.catch(() => {}))
    )
  );
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
    .analyze();
  const summary = results.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`);
  expect(summary, 'violaciones de accesibilidad').toEqual([]);
}

export { expect };
