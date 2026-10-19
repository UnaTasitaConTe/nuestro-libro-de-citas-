import { test, expect, startSession } from './fixtures';

test.describe('Autenticación', () => {
  test('inicia sesión con el formulario y abre el álbum', async ({ page, apiCalls }) => {
    await page.goto('/login');
    await page.getByLabel('Email').fill('ana@ejemplo.com');
    await page.getByLabel('Contraseña', { exact: true }).fill('secreta1');
    await page.getByRole('button', { name: 'Entrar' }).click();

    await expect(page.getByRole('heading', { level: 1, name: 'Nuestras citas' })).toBeVisible();
    const login = apiCalls.find((c) => c.key === 'POST /api/auth/login');
    expect(JSON.parse(login.body)).toEqual({ email: 'ana@ejemplo.com', password: 'secreta1' });
  });

  test('sin sesión, una ruta protegida lleva al login', async ({ page, apiCalls }) => {
    void apiCalls;
    await page.goto('/calendario');
    await expect(page).toHaveURL(/\/login$/);
  });
});

test.describe('Teclado y foco', () => {
  test('el primer Tab enfoca «Saltar al contenido» y lleva el foco a <main>', async ({ page, apiCalls }) => {
    void apiCalls;
    await startSession(page);
    await page.goto('/');
    await page.keyboard.press('Tab');
    await expect(page.getByRole('link', { name: 'Saltar al contenido' })).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(page.locator('main#contenido')).toBeFocused();
    await expect(page).toHaveURL(/\/$/); // sin #hash en el historial
  });

  test('menú móvil: Escape lo cierra y devuelve el foco', async ({ page, apiCalls, isMobile }) => {
    test.skip(!isMobile, 'el menú desplegable solo existe en móvil');
    void apiCalls;
    await startSession(page);
    await page.goto('/');
    const trigger = page.getByRole('button', { name: 'Abrir menú' });
    await trigger.click();
    const menu = page.getByRole('dialog', { name: 'Menú de navegación' });
    await expect(menu).toBeVisible();
    await expect(page.getByRole('button', { name: 'Cerrar menú' })).toBeFocused();

    await page.keyboard.press('Escape');
    await expect(menu).toBeHidden();
    await expect(trigger).toBeFocused();
  });
});

test.describe('Citas', () => {
  test('borrar la cita: cancelar con Escape no envía nada', async ({ page, apiCalls }) => {
    await startSession(page);
    await page.goto('/citas/1');
    await page.getByRole('button', { name: 'Borrar cita' }).click();
    const dialog = page.getByRole('alertdialog', { name: '¿Borrar esta cita?' });
    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole('button', { name: 'Cancelar' })).toBeFocused();

    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();
    expect(apiCalls.some((c) => c.key.startsWith('DELETE'))).toBe(false);
  });

  test('borrar una foto: confirmar envía la misma petición de siempre', async ({ page, apiCalls }) => {
    await startSession(page);
    await page.goto('/citas/1');
    await page.getByRole('button', { name: 'Borrar foto' }).click();
    await page.getByRole('alertdialog', { name: '¿Borrar esta foto?' }).getByRole('button', { name: 'Borrar foto' }).click();
    await expect.poll(() => apiCalls.map((c) => c.key)).toContain('DELETE /api/citas/1/fotos/100');
  });

  test('visor de la galería: flechas y Escape', async ({ page, apiCalls }) => {
    void apiCalls;
    await startSession(page);
    await page.goto('/galeria');
    const thumb = page.getByRole('button', { name: /^Ampliar foto de Cena en la playa/ });
    await thumb.click();
    const viewer = page.getByRole('dialog', { name: 'Visor de fotos' });
    await expect(viewer).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(viewer).toBeHidden();
    await expect(thumb).toBeFocused();
  });
});

test.describe('Cambios sin guardar', () => {
  test('salir del formulario con cambios pide confirmación', async ({ page, apiCalls }) => {
    void apiCalls;
    await startSession(page);
    await page.goto('/citas/nueva');
    await page.getByLabel('Nombre de la cita').fill('Concierto');

    await page.getByRole('link', { name: 'Cancelar' }).click();
    const dialog = page.getByRole('alertdialog', { name: '¿Salir sin guardar?' });
    await expect(dialog).toBeVisible();
    await dialog.getByRole('button', { name: 'Seguir editando' }).click();
    await expect(page).toHaveURL(/\/citas\/nueva$/);
    await expect(page.getByLabel('Nombre de la cita')).toHaveValue('Concierto');

    await page.getByRole('link', { name: 'Cancelar' }).click();
    await dialog.getByRole('button', { name: 'Salir sin guardar' }).click();
    await expect(page).toHaveURL(/\/$/);
  });

  test('cerrar la pestaña con cambios muestra el aviso del navegador', async ({ page, apiCalls }) => {
    void apiCalls;
    await startSession(page);
    await page.goto('/citas/nueva');
    await page.getByLabel('Nombre de la cita').fill('Concierto');
    const dialogPromise = page.waitForEvent('dialog');
    await page.close({ runBeforeUnload: true });
    const dialog = await dialogPromise;
    expect(dialog.type()).toBe('beforeunload');
    await dialog.dismiss();
  });

  test('sin cambios, «Cancelar» sale directamente', async ({ page, apiCalls }) => {
    void apiCalls;
    await startSession(page);
    await page.goto('/citas/nueva');
    await page.getByRole('link', { name: 'Cancelar' }).click();
    await expect(page).toHaveURL(/\/$/);
  });
});

test.describe('Backlog', () => {
  test('borrar una idea pide confirmación', async ({ page, apiCalls }) => {
    await startSession(page);
    await page.goto('/backlog');
    await page.getByRole('button', { name: 'Borrar «Picnic»' }).click();
    const dialog = page.getByRole('alertdialog', { name: '¿Borrar esta idea?' });
    await dialog.getByRole('button', { name: 'Cancelar' }).click();
    await expect(dialog).toBeHidden();
    expect(apiCalls.some((c) => c.key === 'DELETE /api/ideas-citas/2')).toBe(false);

    await page.getByRole('button', { name: 'Borrar «Picnic»' }).click();
    await dialog.getByRole('button', { name: 'Borrar idea' }).click();
    await expect.poll(() => apiCalls.map((c) => c.key)).toContain('DELETE /api/ideas-citas/2');
  });

  test('«Mover a» envía la misma petición que el arrastre', async ({ page, apiCalls }) => {
    await startSession(page);
    await page.goto('/backlog');
    await page.getByLabel('Mover «Ir al cine» a').selectOption('HECHA');
    await expect.poll(() => apiCalls.find((c) => c.key === 'PATCH /api/ideas-citas/1/mover')?.body).toBe(
      JSON.stringify({ estado: 'HECHA', orderedIds: [2, 1] })
    );
  });
});

test.describe('Temas y movimiento', () => {
  test('el tema elegido se conserva al recargar', async ({ page, apiCalls, isMobile }) => {
    test.skip(isMobile, 'el selector de escritorio está en la barra lateral');
    void apiCalls;
    await startSession(page);
    await page.goto('/');
    await page.getByRole('combobox', { name: 'Tema' }).selectOption('navidad');
    await expect(page.locator('html')).toHaveAttribute('data-season', 'navidad');
    await page.reload();
    await expect(page.locator('html')).toHaveAttribute('data-season', 'navidad');
    await expect(page.getByRole('combobox', { name: 'Tema' })).toHaveValue('navidad');
  });

  test('«Animar el fondo» también está en el login y detiene los bucles', async ({ page, apiCalls }) => {
    void apiCalls;
    await page.goto('/login');
    const toggle = page.getByRole('checkbox', { name: 'Animar el fondo' });
    await expect(toggle).toBeChecked();
    await toggle.uncheck();
    await expect(page.locator('html')).toHaveAttribute('data-sky-motion', 'off');
    const loops = await page.evaluate(
      () => document.getAnimations().filter((a) => a.playState === 'running' && a.effect?.getComputedTiming().iterations === Infinity).length
    );
    expect(loops).toBe(0);
  });

  test('con movimiento reducido no hay bucles decorativos', async ({ page, apiCalls }) => {
    void apiCalls;
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await startSession(page, { theme: 'navidad' });
    await page.goto('/');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    const loops = await page.evaluate(
      () => document.getAnimations().filter((a) => a.playState === 'running' && a.effect?.getComputedTiming().iterations === Infinity).length
    );
    expect(loops).toBe(0);
  });
});
