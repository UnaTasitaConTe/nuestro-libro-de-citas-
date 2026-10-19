# Rediseño UI — Línea base (Etapa 0)

Fecha: 2026-10-19 · Rama: `rediseno-ui` · Alcance: solo preparación. No se ha modificado ningún estilo, componente, página, ruta, API ni lógica.

## 1. Entorno verificado

| Elemento | Valor |
|---|---|
| Raíz del repositorio | `BookOfDate/` (monorepo sin workspace: `Backend/`, `Frontend/`, `docker-compose.yml`) |
| Raíz del frontend | `BookOfDate/Frontend/` |
| Node.js | v22.13.0 |
| npm | 11.7.0 |
| pnpm | 10.27.0 (coincide con `packageManager: pnpm@10.27.0`) |
| yarn | no instalado |
| Gestor del proyecto | **pnpm** (`pnpm-lock.yaml` en `Frontend/` y `Backend/`; el `Dockerfile` usa `corepack` + `pnpm install --frozen-lockfile`) |
| Imagen Docker de build | `node:22-alpine` |

### Dependencias instaladas (antes de la etapa 0)

- Producción: react 19.2.7, react-dom 19.2.7, react-router-dom 7.18.1, tailwindcss 4.3.2, @tailwindcss/vite 4.3.2, axios 1.18.1, lucide-react 1.24.0, @dnd-kit/core 6.3.1, @dnd-kit/sortable 10.0.0, @dnd-kit/utilities 3.2.2.
- Desarrollo: vite 8.1.4, @vitejs/plugin-react 6.0.3, oxlint 1.73.0, @types/react 19.2.17, @types/react-dom 19.2.3.

### Configuración

- **Vite** (`vite.config.js`): plugins `react()` + `tailwindcss()`; proxy de `/api` (con WebSocket) y `/uploads` hacia `VITE_API_PROXY_TARGET` o `http://localhost:4000`.
- **Tailwind CSS 4**: configuración en CSS (`@import "tailwindcss"` + `@theme` en `src/index.css`); no hay `tailwind.config.*`.
- **React Router 7**: `BrowserRouter` en `main.jsx`; 11 rutas planas en `App.jsx`; `ProtectedRoute` redirige a `/login` si no hay token.
- **Oxlint** (`.oxlintrc.json`): plugins `react`, `oxc`; `react/rules-of-hooks: error`, `react/only-export-components: warn`.
- **Producción**: nginx sirve `dist/` y hace proxy de `/api/` y `/uploads/` a `backend:4000`.

### Instrucciones del proyecto

No existen `AGENTS.md`, `CLAUDE.md`, `.cursorrules` ni `copilot-instructions.md` en el repositorio (excluyendo las carpetas de skills). `Frontend/README.md` es la plantilla por defecto de Vite.

## 2. Git

| Elemento | Estado |
|---|---|
| Rama de partida | `eliminacion-citas` (HEAD `dd3360f`, 1 commit por delante de `origin/eliminacion-citas`, sin publicar) |
| Último commit | `dd3360f fix: eliminacion de token y arreglo imagenes thumbnail` |
| Cambios previos del usuario | `.gitignore` modificado (añade `migrate.sh`, que sigue versionado); sin seguimiento: `.agents/`, `.claude/`, `skills-lock.json` |
| Stash previo | `stash@{0}: WIP on eliminacion-citas: 167978c` (del usuario; no se ha tocado) |
| Rama de trabajo | `rediseno-ui`, creada con `git switch -c` desde `dd3360f`. No cambia de commit, así que los cambios pendientes siguen intactos en el árbol de trabajo. **No se ha hecho commit, stash ni limpieza.** |

## 3. Skills

Ubicaciones: `.agents/skills/` (instaladas según `skills-lock.json`) y `.claude/skills/`.

| Skill | Estado verificado |
|---|---|
| `frontend-design` | `.agents/skills/frontend-design/SKILL.md` — leído. Solo guía (sin scripts). |
| `ui-ux-pro-max` | `.agents/skills/ui-ux-pro-max/` — leído. El script `scripts/search.py` **funciona con `python` sin `-I`** (con `-I` falla al importar `core`). Ejecutado en modo lectura (sin `--persist`). |
| `animate` | `.agents/skills/animate/SKILL.md` + `RECIPES.md` — `SKILL.md` leído. Solo guía. |
| `web-design-guidelines` | `.claude/skills/web-design-guidelines/SKILL.md` — leído. Descarga sus reglas de `raw.githubusercontent.com/vercel-labs/web-interface-guidelines`; descarga verificada. |
| Relacionadas disponibles | `review-animations`, `improve-animations`, `find-animation-opportunities`, `animation-performance` (en `.agents/skills/`, no leídas aún). |

## 4. Scripts ejecutados y resultados

| Comando | Resultado |
|---|---|
| `pnpm lint` (antes) | OK, **0 errores, 1 aviso preexistente**: `src/context/AuthContext.jsx:50` `react(only-export-components)` |
| `pnpm build --outDir <scratchpad> --emptyOutDir` (antes) | OK, 1870 módulos, CSS 62.86 kB (11.57 kB gzip), JS 397.70 kB (126.14 kB gzip), hashes `index-BM9ajAwS.css` / `index-Bx5rKPiP.js` |
| `pnpm test` (después) | OK, 1 archivo, 2 pruebas, ~28 s (el arranque de jsdom en Windows tarda ~20 s) |
| `pnpm lint` (después) | Igual que antes: 0 errores, el mismo aviso |
| `pnpm build` (después) | OK, **mismos hashes** que antes → el bundle de producción no ha cambiado |

El build se dirigió a una carpeta temporal para no sobrescribir `Frontend/dist/` (ignorado por git; build local antiguo).

### Pruebas existentes

- Frontend: **ninguna** antes de esta etapa.
- Backend: Vitest ^4.1.10, 19 archivos en `Backend/tests/application/**` (casos de uso con fakes). No se han ejecutado en esta etapa.

## 5. Dependencias de pruebas añadidas (solo `devDependencies`)

| Paquete | Versión | Motivo de la versión |
|---|---|---|
| `vitest` | ^4.1.12 | Misma versión principal que el backend; peer `vite ^6‖^7‖^8`; Node `^20‖^22‖>=24`. La 5.0.5 también era compatible, pero se prefirió coherencia con el backend. |
| `jsdom` | ^29.1.1 | **jsdom 30.x exige Node ^22.22.2 y aquí hay 22.13.0.** La 29.1.x acepta `^22.13.0`. |
| `@testing-library/react` | ^16.3.3 | peer `react ^18‖^19` |
| `@testing-library/dom` | ^10.4.2 | peer obligatorio de la anterior |
| `@testing-library/user-event` | ^14.6.8 | interacción realista |
| `@testing-library/jest-dom` | ^7.0.1 | matchers de DOM y accesibilidad (`toBeInTheDocument`, `toHaveAccessibleName`…); Node >=22 |

El lockfile solo tiene **líneas añadidas** y react, vite, tailwind, router y el resto no han cambiado.

**Configuración**: bloque `test` añadido dentro de `vite.config.js` (jsdom, `src/**/*.test.{js,jsx}`, `src/test/setup.js`), así que no se duplica la configuración de Vite. Vite ignora la clave `test` en dev y build.
**Scripts nuevos**: `test` (`vitest run`) y `test:watch` (`vitest`); los existentes no cambian.
**Prueba mínima**: `src/test/smoke.test.jsx` comprueba que `HeartRating` notifica la valoración al hacer clic (user-event) y que `ProtectedRoute` redirige a `/login` sin token (react-router + AuthProvider).

## 6. Capturas de referencia

Carpeta: `docs/redesign-baseline/`. Se tomaron con Chrome headless (Vite dev en `:5199`) mediante un script del protocolo de DevTools, ubicado fuera del repo, con emulación de viewport, tras 3,5 s de espera.

| Archivo | Viewport |
|---|---|
| `login-desktop.png` | 1440×900 @1x |
| `login-mobile.png` | 390×844 @3x, móvil + táctil |
| `register-desktop.png` | 1440×900 @1x |
| `register-mobile.png` | 390×844 @3x, móvil + táctil |

**Capturas no realizadas**: todas las pantallas protegidas (álbum, detalle, formularios, calendario, galería, backlog, pareja). Necesitan sesión y backend (Postgres + Redis + `.env` con secretos reales); Docker no estaba activo y no se usaron credenciales. Se cubrirán con API simulada en la etapa en que se evalúe Playwright.

Nota: el fondo tiene animaciones infinitas (estrellas, auroras, dragones), así que las capturas **no son reproducibles píxel a píxel**. Sirven como referencia visual, no para comparación automática.

## 7. Problemas preexistentes y limitaciones

1. Aviso de oxlint en `AuthContext.jsx:50` (exporta `useAuth` junto al proveedor).
2. **En el móvil (390 px) la luna se superpone al titular** de login y registro (visible en `register-mobile.png`).
3. `chrome --headless --window-size` en Windows impone un ancho mínimo de 500 px; las capturas con `--window-size=390` no son móviles reales. Por eso se usó la emulación por DevTools.
4. `ui-ux-pro-max/scripts/search.py` no funciona con `python -I`.
5. Tiempo de arranque de jsdom en Windows: ~20 s por ejecución.
6. Rama `eliminacion-citas` con 1 commit sin publicar y un stash antiguo del usuario.
7. `Frontend/Backend/sql/schema.sql/` es una estructura de carpetas sin ningún archivo dentro del frontend; parece un residuo de un montaje de Docker. No se ha tocado.
8. **Sora** (`--font-display`) se usa en 20 clases `font-display` en JSX, 5 referencias en `index.css` y en la regla base de `h1–h4`. Hay que migrarla con cuidado en la etapa 1.
9. `Flipbook.jsx` y `CitasFlipbook.jsx`: no hay ninguna importación en `src/` fuera de los propios archivos. Su eliminación queda pospuesta según lo acordado.
10. Hallazgos de diseño y accesibilidad del diagnóstico previo (`transition: all`, lightbox sin `role="dialog"`, `confirm()` nativo, falta de `color-scheme`, etc.) siguen pendientes de las etapas 1–5.

## 8. Próximos pasos recomendados

1. Revisar y hacer commit de la etapa 0 en `rediseno-ui`, sin incluir `.gitignore` ni las carpetas de skills salvo que el usuario lo decida.
2. Antes de la etapa 1, añadir pruebas de comportamiento para los flujos que se tocarán primero: envío de `CitaFormPage` (campos de FormData), borrado (cancelar no llama a la API), página reflejada en la URL y teclado del lightbox.
3. Etapa 1: tokens semánticos con alias, tokens de movimiento, `color-scheme`, eliminación de `transition: all`, hovers limitados a ratón, nueva regla de movimiento reducido, Manrope + Caveat (manteniendo Sora como alias hasta migrar sus 25 usos).
4. Evaluar Playwright + axe-core (compatibilidad con Node 22.13) para capturas de pantallas protegidas con API simulada.

---

# Etapa 1 — Fundamentos (tokens, transiciones, hover, movimiento reducido)

Fecha: 2026-10-19 · Rama: `rediseno-ui` · **Sin commit** (la etapa 0 tampoco está confirmada todavía).

## Cambios

| Archivo | Cambio |
|---|---|
| `src/index.css` | Tokens semánticos en `@theme static` (canvas, surface, fg, fg-muted, accent, accent-soft, on-accent, secondary, passion, border, border-accent, success, danger, radios); alias de compatibilidad (`paper`, `card`, `ink`, `ink-dark`, `line`, `royal`…) con **los mismos valores**; tokens de duración (`--duration-instant/fast/base/slow`) y curvas de la skill animate (`--ease-out`, `--ease-in-out`, `--ease-drawer`; `--ease-smooth` pasa a ser alias); `color-scheme: dark`; 4 `transition: all` sustituidos por listas explícitas; todos los `:hover` propios dentro de `@media (hover: hover)`, y los desplazamientos además con `(pointer: fine)` y `(prefers-reduced-motion: no-preference)`; los `:active` van después de los hovers para que la pulsación prevalezca; se elimina el *shimmer* infinito en el hover de `.btn-primary`; nueva regla de movimiento reducido; referencias `var()` internas migradas a nombres semánticos. |
| `index.html` | `<meta name="color-scheme" content="dark">`. Las fuentes no cambian. |
| `components/BacklogCard.jsx` | `transition-all` → `transition-[opacity,background-color,color]` |
| `components/BacklogColumn.jsx` | `transition-all` → `transition-[border-color,background-color,box-shadow]` |
| `components/Carousel.jsx` (puntos) | `transition-all` → `transition-[width,background-color]` |
| `components/HeartRating.jsx` | `transition-all` → `transition-[color,filter,translate,scale]` (en Tailwind 4 `scale-*`/`translate-*` usan las propiedades CSS `scale`/`translate`, no `transform`) |

## Hallazgos técnicos

- **Tailwind 4 solo emite las variables del tema que usa alguna utilidad.** Por eso los tokens semánticos van en `@theme static`; sin eso, un alias `var(--color-x)` podría apuntar a una variable inexistente. Verificado en el CSS generado: los alias resuelven e incluso el respaldo estático (`bg-ink-dark/15` → `#ffcc3326`) es correcto.
- **Las utilidades `hover:` de Tailwind 4 ya van dentro de `@media (hover:hover)`**; solo había que limitar los `:hover` del CSS propio.
- Redefinir `--ease-out` y `--ease-in-out` cambia también las utilidades `ease-out`/`ease-in-out` (las usan `CitaCard` y `HeartRating`): la curva es más decidida, con la misma duración.

## Movimiento reducido (antes → ahora)

| Aspecto | Antes | Ahora |
|---|---|---|
| Bucles decorativos | Estado final | Estado final (sin cambio) |
| Entradas `.fade-in-up` | Instantáneas | Fundido de opacidad de 220 ms, sin desplazamiento |
| Transiciones de color, borde, sombra y opacidad | **Eliminadas** (0,001 ms) | **Conservadas** |
| Transiciones de transformación | Eliminadas | Instantáneas (también las de dnd-kit y `scale`/`translate` de Tailwind) |
| Elevación en hover de los CSS propios | Instantánea | No se aplica |

## Verificación

| Comprobación | Línea base | Etapa 1 |
|---|---|---|
| `pnpm lint` | 0 errores, 1 aviso | 0 errores, el mismo aviso |
| `pnpm build` | CSS 62.86 kB (11.57 gzip), JS 397.70 kB | CSS 65.98 kB (12.09 gzip, **+0.52 kB**), JS 397.81 kB (+0.11 kB por las clases nuevas) |
| `pnpm test` | 2/2 | 2/2 |
| `transition:all` en el CSS generado | 4 propias + utilidad | 0 propias; la utilidad `.transition-all` sigue generándose por 3 páginas (fuera de alcance) |
| Estilos calculados en Chrome (login, 1440 px) | — | Color, borde, fondo, radio, sombra y fuente idénticos a los valores originales; `color-scheme: dark` |
| Movimiento reducido emulado | — | `.fade-in-up` → `fade-in` 0.22s; transiciones sin `transform`; bucles a 1e-6 s; `scroll-behavior: auto` |
| Capturas login/registro (escritorio y móvil) | `docs/redesign-baseline/` | Visualmente idénticas salvo la posición del fondo animado (no se guardan en el repo) |

## Pendiente (fuera del alcance de la etapa 1)

- `transition-all` en **páginas**: `CalendarioPage.jsx:147`, `CitaEditPage.jsx:124`, `CitaFormPage.jsx:123` → etapa 4.
- Utilidades `hover:scale/translate` de componentes y páginas sin `motion-safe:` → bajo movimiento reducido son instantáneas, pero siguen moviendo; etapas 4–5.
- `window.scrollTo({ behavior: 'smooth' })` en páginas no respeta movimiento reducido → etapa 4.
- La regla global `:focus-visible` cambia el `border-radius` del elemento enfocado → etapa 2.
- `.dropzone` y `.pill-option` no se usan en ningún JSX (se corrigieron igualmente).
- Sora: sigue cargándose y usándose vía `--font-display`; migrar a `--font-ui` pantalla a pantalla.
- Fondo animado sin cambios → etapa 2.

---

# Etapa 2 — Fondo, layout, Sidebar y drawer

Fecha: 2026-10-19 · Rama: `rediseno-ui` · **Sin commit**. `App.jsx` **no se ha modificado**: el enlace para saltar al contenido se integra en `Layout`, que usan todas las rutas protegidas. Rutas, protección, API y lógica sin cambios.

## Archivos modificados

| Archivo | Cambio |
|---|---|
| `src/components/NightSkyBackground.jsx` | Las 3 auroras animadas pasan a un único `.sky-glow` estático. Los 3 dragones en bucle infinito pasan a **una pareja que cruza de vez en cuando** (primer vuelo a los 6 s, después cada 40–80 s, 30 s de vuelo); entre vuelos no hay animación de dragones. No se programan vuelos con `prefers-reduced-motion: reduce` ni con la pestaña oculta. Con la pestaña oculta pone `data-sky-paused` en `<html>` y se pausan las animaciones CSS activas. |
| `src/components/FlyingDragon.jsx` | `delay` opcional y nueva prop `onAnimationEnd` (para retirar la pareja al terminar el vuelo). |
| `src/components/Layout.jsx` | Enlace «Saltar al contenido» (primer elemento enfocable; mueve el foco con JS para no alterar el historial ni la lógica de «Volver» de `CitaDetailPage`). `<main id="contenido" tabIndex={-1}>` envuelve solo el contenido; el `<footer>` queda fuera de `<main>` y vuelve a ser un landmark válido. Mismas clases, mismo aspecto. |
| `src/components/Sidebar.jsx` | El drawer móvil pasa a `<dialog>` modal (`showModal`): resto de la página inerte, foco atrapado, Escape (`cancel`) con salida animada, cierre al pulsar el fondo, al elegir una sección o al pasar a escritorio; **el foco vuelve al botón «Abrir menú»**. Animación de entrada y salida con `data-state` y respaldo de 400 ms si no llega `transitionend`. Bloqueo de scroll del documento mientras está abierto, `overscroll-behavior: contain`, safe areas (`env(safe-area-inset-*)`, porque `index.html` usa `viewport-fit=cover`). Botón con `aria-expanded`, `aria-controls` y `aria-haspopup="dialog"`. `aria-label` en enlaces y en «Salir» cuando la barra está colapsada; `<nav aria-label="Principal">`. Tarjeta de usuario extraída a `UserCard` (antes duplicada). |
| `src/index.css` | Fondo: estrellas solo del tamaño del viewport (antes 4 veces su área) y sin deriva; parpadeo solo en `::after` (6 s, opacidad); `::before` fija al 0.7; `twinkle` termina en un estado visible (con movimiento reducido las estrellas ya no quedan al 0.2). Se eliminan los keyframes `drift-stars-*` y `aurora-*` y la clase `.aurora`. `.flying-dragon` con una sola iteración. Pausa con `html[data-sky-paused]`. **Estado activo de la navegación**: ahora `.nav-link[aria-current="page"]`. Antes dependía de `data-active` en un `<span>` interior sin la clase `.nav-link` y **nunca se aplicaba**. Nuevas clases `.drawer-*` y `.skip-link`. La regla global `:focus-visible` ya no cambia el `border-radius` del elemento y excluye `tabindex="-1"`. |
| `src/test/setup.js` | Polyfills mínimos de `HTMLDialogElement.showModal/close` y `matchMedia` (jsdom no los implementa). |
| `src/components/Layout.test.jsx` (nuevo) | 8 pruebas: enlace de salto (primer foco, mueve el foco a `<main>`, no cambia la ruta), `aria-current`, drawer (apertura modal, Escape con salida animada y retorno del foco, cierre por `transitionend`, cierre al navegar, bloqueo de scroll). |
| `src/components/NightSkyBackground.test.jsx` (nuevo) | 4 pruebas: vuelo ocasional (no continuo), sin vuelos con movimiento reducido, pausa con la pestaña oculta, `aria-hidden`. |

## Verificación

| Comprobación | Etapa 1 | Etapa 2 |
|---|---|---|
| `pnpm test` | 2/2 | **14/14** |
| `pnpm lint` | 0 errores, 1 aviso | Igual |
| Build CSS / JS | 65.98 / 397.81 kB | 66.34 / 399.97 kB (gzip 12.33 / 127.10) |
| Animaciones CSS continuas en `/login` (Chrome) | **11** (estrellas ×4, auroras ×3, luna, dragones ×3) | **2** (parpadeo, luna) + vuelo ocasional |
| Elementos con `filter` o `mix-blend-mode` en el fondo | 3 (auroras con blur 70 px + screen) | 0 |
| Tiempo de tareas en el hilo principal (5 s, `/login`) | 0.022 s | 0.019 s (ya era mínimo: el coste estaba en la composición en GPU) |

**Drawer en Chrome real (390×844, emulación móvil)**: entrada a mitad de recorrido a los 60 ms (−86 px); `:modal`, foco en «Cerrar menú», `aria-expanded="true"`, scroll bloqueado; 9 Tabs y el foco sigue dentro; Escape → `closing` → cerrado, foco en «Abrir menú», scroll restaurado; clic en el fondo cierra; con movimiento reducido el panel aparece sin desplazarse y solo se funde el fondo.
**Enlace de salto en Chrome**: primer Tab → «Saltar al contenido»; Enter → foco en `MAIN#contenido`, URL sin `#`.
**Sesión real** (backend local del usuario, cuenta facilitada por él, **solo lectura**: las únicas peticiones no GET fueron login y logout): la ruta activa se marca en la barra lateral y en el drawer; Enter y Espacio abren el drawer, Escape lo cierra y devuelve el foco; «Salir» cierra la sesión.

## Hallazgos

- **Backend:** `GET /api/citas/gallery` responde **500 «Error inesperado»** en el backend local (`GET /api/citas` responde 200). La Galería muestra «No se pudieron cargar las fotos». No lo provoca el frontend; queda fuera del alcance.
- Una petición de verificación con un token **falso** llegó al backend local antes de que se interceptara la API en el navegador (respuesta 401). A partir de ahí, las comprobaciones con sesión falsa respondían desde DevTools sin salir del navegador.
- Arnés de pruebas: tras `Input.insertText` del protocolo de DevTools, Chrome headless no activaba botones con Enter simulado. Se comprobó en una pestaña limpia que el teclado funciona; no es un fallo de la app.
- La medición de capas compuestas en Chrome headless (sin GPU) no es concluyente y no se usa como prueba.

## Pendiente

- Animación de anchura/padding al colapsar la barra lateral de escritorio (`transition-[width]` / `transition-[padding]`, 300 ms): provoca reflujo; revisar en la etapa 5.
- La luna se superpone al titular en login/registro móvil (etapa 4, pantallas de acceso).
- Los lightbox de Galería y Carousel siguen sin `<dialog>` (etapa 3: componente `Lightbox`).

---

# Etapa 3 — Componentes reutilizables y diálogos

Fecha: 2026-10-19 · Rama: `rediseno-ui` · **Sin commit**. Rutas, API y lógica de negocio sin cambios: cada borrado hace exactamente la misma llamada que antes; solo cambia cómo se pide la confirmación.

## Componentes nuevos (`src/components/ui/`)

| Componente | Qué resuelve | Dónde se usa |
|---|---|---|
| `useModalDialog.js` | Ciclo de vida común de `<dialog>` modal: `showModal()`, Escape (`cancel`) con salida animada, `data-state`, cierre tras `transitionend` (respaldo de 400 ms), foco inicial opcional, **retorno del foco** al disparador (o a `<main>` si ya no existe), bloqueo de scroll. Extraído del drawer de la etapa 2 para no duplicarlo. | Drawer móvil, `Dialog`, `Lightbox` |
| `Dialog.jsx` | Diálogo modal centrado; título obligatorio como nombre accesible (`aria-labelledby`). Entrada 220 ms fundido + escala desde 0.96; salida 160 ms. | `ConfirmDialog` |
| `ConfirmDialog.jsx` | Sustituye a `window.confirm()`: `role="alertdialog"`, descripción con `aria-describedby`, **foco inicial en «Cancelar»**, `onConfirm` asíncrono con estado «Borrando…» (botones desactivados y Escape ignorado mientras dura). | `CitaDetailPage` (foto y cita), `EntryFormPage` (foto) |
| `Field.jsx` | Etiqueta asociada por `useId`, ayuda y error en `aria-describedby`, `aria-invalid`. El control se recibe como función (sin clonar elementos). `labelClassName` conserva estilos existentes. | `EntryFields` (4 textos) |
| `IconButton.jsx` | Botón solo con icono con `label` obligatorio (nombre accesible), `type="button"` y `.icon-btn`. Variante `overlay` para el visor. | `Carousel`, `Lightbox` |
| `StatusMessage.jsx` | Región viva **siempre presente** (también vacía); `role="alert"` para errores, `role="status"` para el resto. `className` solo se aplica con contenido. | `CitaDetailPage`, `ParejaPage` |
| `Lightbox.jsx` | Visor único de fotos sobre `<dialog>` modal: foco en «Cerrar», ← → para recorrer, Escape cierra y devuelve el foco a la miniatura. Sustituye los dos visores que había. | `GaleriaPage`, `Carousel` |

## Archivos modificados

| Archivo | Cambio |
|---|---|
| `src/index.css` | `.dialog-backdrop` / `.dialog-panel` (animación); `.icon-btn` con **mínimo 44×44 px con `pointer: coarse`** (36 px con ratón, sin cambio visual en escritorio); variante `.icon-btn-overlay` (44 px, blanco sobre negro). |
| `src/components/Sidebar.jsx` | `MobileDrawer` usa `useModalDialog` (mismo comportamiento; `data-drawer-part` → `data-dialog-part`). |
| `src/components/EntryFields.jsx` | `Field` en los 4 textos (las etiquetas no estaban asociadas). «Fotos» y «Valoración» pasan de `<label>` sin control a `<p>` con la misma clase. Botones «Borrar/Quitar foto»: área táctil de 44 px con el mismo círculo visual de 20 px. |
| `src/pages/EntryFormPage.jsx` | `confirm()` → `ConfirmDialog` («¿Borrar esta foto?»). |
| `src/pages/CitaDetailPage.jsx` | 2 `confirm()` → `ConfirmDialog` («¿Borrar esta foto?», «¿Borrar esta cita?»). Errores de borrado y subida en `StatusMessage` (`role="alert"`). Recordatorio en una región `status`; el éxito usa `text-success` (antes `text-green-600`, con poco contraste sobre el fondo oscuro). |
| `src/pages/GaleriaPage.jsx` | Visor local → `Lightbox`. `open` separado del índice para que la foto no desaparezca durante el cierre. Flechas ocultas si solo hay una foto. |
| `src/components/Carousel.jsx` | Visor local → `Lightbox`; botones → `IconButton`; el índice se acota (ya no falla si se borra la última foto siendo la central). Se eliminan los listeners globales de teclado y el bloqueo de scroll propios. |
| `src/pages/ParejaPage.jsx` | «¡Copiado!» anunciado con `StatusMessage` (`sr-only`); error al unirse con `role="alert"`. |
| `src/test/setup.js` | Polyfills: `showModal` enfoca el primer elemento enfocable (como el navegador); `IntersectionObserver`. |

**Texto de los diálogos verificado contra el backend**: `DeleteCita` borra la cita, sus versiones y los archivos de fotos; `DeleteFoto` borra la fila y el archivo. «No se puede deshacer» es exacto.

## Pruebas (42 en total, antes 14)

| Archivo | Cubre |
|---|---|
| `components/ui/ui.test.jsx` (6) | `Field` (asociación, descripción, `aria-invalid`), `IconButton`, `StatusMessage` (región persistente, `alert`), `ConfirmDialog` (estado ocupado, Escape ignorado mientras confirma). |
| `pages/EntryFormPage.test.jsx` (5) | Etiquetas asociadas; borrar foto: **cancelar**, Escape, **confirmar** (misma llamada `DELETE`), error del servidor. |
| `pages/CitaDetailPage.test.jsx` (7) | Borrar cita: **cancelar** (foco de vuelta), Escape, **confirmar** (navega al álbum), error anunciado. Borrar foto: **cancelar**, **confirmar** (el foco va a `<main>` porque el botón desaparece). Recordatorio anunciado. |
| `pages/GaleriaPage.test.jsx` (4) | Visor modal, foco en «Cerrar», teclado y botones, Escape con retorno del foco y scroll restaurado. |
| `components/Carousel.test.jsx` (3) | Visor compartido, «Borrar foto» delega en la página, índice acotado. |
| `pages/ParejaPage.test.jsx` (2) | Copia anunciada, error al unirse como alerta. |

## Verificación

| Comprobación | Etapa 2 | Etapa 3 |
|---|---|---|
| `pnpm test` | 14/14 | **42/42** |
| `pnpm lint` | 0 errores, 1 aviso | Igual |
| Build CSS / JS | 66.34 / 399.97 kB | 67.15 / 402.71 kB (gzip 12.47 / 127.87) |
| `confirm()` en `src/` | 3 | **0** |

**Chrome real** (build de la etapa servido con `vite preview`; **API respondida dentro del navegador con datos de prueba, ningún borrado llegó al backend**): confirmación de cita modal con la entrada a mitad de recorrido a los 50 ms, foco en «Cancelar», Escape → `closing` → cerrado con foco en «Borrar cita» y sin `DELETE`; confirmar foto → `DELETE /api/citas/1/fotos/100` (interceptado); visor modal con foco en «Cerrar», → cambia de foto, Escape devuelve el foco a la miniatura y restaura el scroll; fondo del visor idéntico al original (negro al 95 %); con emulación táctil `.icon-btn` mide 44×44 px.

## Hallazgos

- **Precedencia de CSS**: las clases propias de `index.css` (`.icon-btn`, `.btn`…) no están en ninguna `@layer`, así que **ganan siempre a las utilidades de Tailwind** (que van en `@layer utilities`). Por eso `h-7 w-7` en el botón de colapsar la barra lateral y `text-danger border-danger/40` en «Borrar foto» del Carousel **nunca se aplicaron**. No se ha cambiado (alteraría el aspecto actual); propuesta para la etapa 4: mover las clases de componentes a `@layer components` y revisar visualmente esos casos.
- El nombre accesible de las miniaturas de la Galería repite el título («Picnic Picnic 2 de mayo…») porque combina el `alt` con el pie visible → etapa 4.
- La luna se transparenta a través de los botones de fondo casi transparente en el detalle de la cita (escritorio) → etapa 4.
- `EntryFields` sigue llamando a `URL.createObjectURL` en cada render sin liberarlo → etapa 4.
- `BacklogPage` borra ideas sin confirmación (no usaba `confirm()`; no se ha añadido para no cambiar el comportamiento).

---

# Capas CSS (`@layer base` / `@layer components`)

Fecha: 2026-10-19 · Rama: `rediseno-ui`.

**Problema**: las reglas propias de `src/index.css` no estaban en ninguna capa, así que ganaban siempre a las utilidades de Tailwind 4 (que van en `@layer utilities`). Varias utilidades del JSX nunca tuvieron efecto, y en la etapa 4 hubo que esquivarlo tres veces (fuente de un `<h2>`, hover de una lista `.surface`, tamaño de `.icon-btn`).

**Cambio**: estilos de elementos (`html`, `body`, `h1–h4`, foco, scrollbars, estrellas) → `@layer base`; clases propias (`.btn`, `.icon-btn`, `.surface`, `.field`, `.chip`, `.nav-link`, drawer, diálogos, polaroids, fondo…) → `@layer components`. `@theme`, `:root` y `@keyframes` no cambian. La regla de `prefers-reduced-motion` queda **sin capa a propósito**: su `!important` sigue imponiéndose.

**Verificación**: estilos calculados (39 propiedades) de todos los elementos de 11 pantallas, en escritorio y móvil, antes y después (Chrome, API simulada en el navegador). Causas raíz de las diferencias:

| Elemento | Cambio | Decisión |
|---|---|---|
| Botón colapsar barra lateral (escritorio) | 36 → 28 px, fondo sólido (`h-7 w-7 bg-card`) | Aceptado: era la intención del código |
| «Borrar foto» del Carousel | rojo y 32 px (`text-danger border-danger/40 bg-paper h-8 w-8`) | Aceptado: identifica la acción destructiva |
| Flechas del Carousel | `bg-paper/85`, transición de 300 ms | Aceptado |
| Recordatorio, calendario, lista del calendario | radio `rounded-2xl` / `rounded-xl` (antes 24 px de `.surface`) | Aceptado |
| Backlog: títulos de columna y contadores | `tracking-widest`, `text-[11px] px-2` | Aceptado (pantalla pendiente de rediseño) |
| Pareja: link de invitación | 15 → 12 px (`text-xs`) | **Revertido**: se quitan esas utilidades (iOS hace zoom en campos < 16 px y 12 px se lee mal) |
| Chips del pie (hover) | `hover:text-ink-dark` ahora funciona | Aceptado |

Además, en `BacklogCard` se quita `outline-none` de los dos campos de edición en línea: con las capas, esa utilidad habría anulado el contorno de foco de la regla base.

Login, registro, álbum, Galería y formularios: sin ninguna diferencia. Pruebas 77/77, lint igual que antes.
