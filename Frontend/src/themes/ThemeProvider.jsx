import { useCallback, useEffect, useLayoutEffect, useMemo, useState } from 'react';
import { ThemeContext } from './themeContext';
import { THEMES, getTheme, isThemeId } from './themes';
import { resolveSeason } from './seasons';
import { APPLIED_KEY, PREFERENCE_KEY, SKY_MOTION_KEY, readStorage, writeStorage } from './storage';

const AUTO = 'auto';
const RECHECK_MS = 60 * 60 * 1000; // en modo automático, se reevalúa cada hora
// Referencia estable: un valor por defecto en línea resuscribiría el efecto en cada render.
const systemNow = () => new Date();

// Un valor guardado desconocido (p. ej. un tema eliminado) se trata como
// "Automático", sin borrarlo: nunca se cambia la preferencia en silencio.
function readPreference() {
  const stored = readStorage(PREFERENCE_KEY);
  return stored && (stored === AUTO || isThemeId(stored)) ? stored : AUTO;
}

export function ThemeProvider({ children, now = systemNow }) {
  const [preference, setPreferenceState] = useState(readPreference);
  const [resolution, setResolution] = useState(() => resolveSeason(now()));
  // WCAG 2.2.2: el movimiento decorativo del fondo (más de 5 s, junto al
  // contenido) se puede detener desde la propia app, no solo con la preferencia
  // de movimiento reducido del sistema.
  const [skyMotion, setSkyMotionState] = useState(() => readStorage(SKY_MOTION_KEY) !== 'no');

  // Modo automático: la fecha puede cambiar con la app abierta (medianoche,
  // portátil suspendido). Se recalcula al volver a la pestaña y cada hora.
  // Solo afecta al tema automático: una elección manual nunca se sobrescribe.
  useEffect(() => {
    function recheck() {
      if (document.hidden) return;
      setResolution((prev) => {
        const next = resolveSeason(now());
        return next.themeId === prev.themeId && next.season?.id === prev.season?.id ? prev : next;
      });
    }
    document.addEventListener('visibilitychange', recheck);
    const timer = setInterval(recheck, RECHECK_MS);
    return () => {
      document.removeEventListener('visibilitychange', recheck);
      clearInterval(timer);
    };
  }, [now]);

  // Otra pestaña cambió la preferencia: se adopta aquí también.
  useEffect(() => {
    function onStorage(event) {
      if (event.key === PREFERENCE_KEY) setPreferenceState(readPreference());
      if (event.key === SKY_MOTION_KEY) setSkyMotionState(event.newValue !== 'no');
    }
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const setPreference = useCallback((value) => {
    const next = value === AUTO || isThemeId(value) ? value : AUTO;
    setPreferenceState(next);
    writeStorage(PREFERENCE_KEY, next); // si falla, la elección vale para esta sesión
  }, []);

  const setSkyMotion = useCallback((enabled) => {
    setSkyMotionState(enabled);
    writeStorage(SKY_MOTION_KEY, enabled ? 'si' : 'no');
  }, []);

  const autoTheme = getTheme(resolution.themeId);
  const activeTheme = preference === AUTO ? autoTheme : getTheme(preference);

  // Se aplica antes del pintado: los tokens de themes/seasons.css cuelgan de
  // <html data-season>. También se guarda para que index.html lo aplique en la
  // próxima carga antes de que arranque React (sin parpadeo del tema anterior).
  useLayoutEffect(() => {
    const root = document.documentElement;
    root.dataset.season = activeTheme.id;
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', activeTheme.metaColor);
    writeStorage(APPLIED_KEY, activeTheme.id);
  }, [activeTheme]);

  useLayoutEffect(() => {
    if (skyMotion) delete document.documentElement.dataset.skyMotion;
    else document.documentElement.dataset.skyMotion = 'off';
  }, [skyMotion]);

  const value = useMemo(
    () => ({
      preference,
      setPreference,
      activeTheme,
      autoTheme,
      season: resolution.season,
      themes: THEMES,
      skyMotion,
      setSkyMotion,
    }),
    [preference, setPreference, activeTheme, autoTheme, resolution.season, skyMotion, setSkyMotion]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}
