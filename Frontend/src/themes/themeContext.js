import { createContext, useContext } from 'react';
import { DEFAULT_THEME_ID, THEMES, getTheme } from './themes';

const defaultTheme = getTheme(DEFAULT_THEME_ID);

// Valor sin <ThemeProvider> (p. ej. componentes probados de forma aislada): el
// tema predeterminado en modo automático. En la app, main.jsx siempre lo provee.
const FALLBACK = {
  preference: 'auto',
  setPreference: () => {
    if (import.meta.env.DEV) console.warn('setPreference sin <ThemeProvider>: no tiene efecto.');
  },
  activeTheme: defaultTheme,
  autoTheme: defaultTheme,
  season: null,
  themes: THEMES,
};

export const ThemeContext = createContext(FALLBACK);

/**
 * Tema activo y preferencia:
 *   preference   'auto' | id de tema
 *   setPreference(valor)
 *   activeTheme  tema aplicado ahora (objeto de themes.js)
 *   autoTheme    tema que correspondería por fecha
 *   season       temporada por fecha (null si no hay ninguna)
 *   themes       lista de temas disponibles
 */
export function useSeasonTheme() {
  return useContext(ThemeContext);
}
