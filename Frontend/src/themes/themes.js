/**
 * Temas visuales de "Nuestro Libro de Citas".
 *
 * Cada tema es una versión del mismo universo nocturno y romántico. Aquí se
 * define lo que necesita JavaScript (nombre, decoraciones, animaciones y color
 * de la barra del navegador). La paleta vive en CSS (themes/seasons.css), en un
 * bloque `:root[data-season="<id>"]` que solo redefine tokens semánticos: los
 * componentes no conocen los temas, heredan los tokens.
 *
 * Para añadir un tema:
 *   1. Añade una entrada aquí (id único).
 *   2. Añade su bloque de tokens en themes/seasons.css (y comprueba el contraste).
 *   3. Opcional: asígnale fechas en themes/seasons.js.
 *
 * decor:
 *   luna       'creciente' | 'llena'
 *   volador    'dragones' | 'murcielagos' | 'corazones' | 'petalos' | null
 *              Cruzan el cielo de vez en cuando (no en bucle continuo).
 *   suelo      'calabazas' | 'nieve' | null   Decoración estática sobre el skyline.
 *   nevada     true | false   Capa de nieve lenta; solo en pantallas anchas.
 * Con prefers-reduced-motion no hay voladores ni nevada; las decoraciones
 * estáticas (luna, suelo, paleta) se mantienen.
 */

export const DEFAULT_THEME_ID = 'noche';

export const THEMES = [
  {
    id: 'noche',
    nombre: 'Noche estrellada',
    descripcion: 'Cielo azul profundo, estrellas discretas y detalles dorados.',
    metaColor: '#070b22',
    decor: { luna: 'creciente', volador: 'dragones', suelo: null, nevada: false },
  },
  {
    id: 'halloween',
    nombre: 'Halloween romántico',
    descripcion: 'Morado profundo, naranja cálido y una luna llena entre calabazas.',
    metaColor: '#110a1d',
    decor: { luna: 'llena', volador: 'murcielagos', suelo: 'calabazas', nevada: false },
  },
  {
    id: 'navidad',
    nombre: 'Navidad mágica',
    descripcion: 'Azul noche, verde pino y dorado, con nieve sobre los tejados.',
    metaColor: '#06121f',
    decor: { luna: 'creciente', volador: null, suelo: 'nieve', nevada: true },
  },
  {
    id: 'sanvalentin',
    nombre: 'San Valentín',
    descripcion: 'Borgoña, rosa empolvado y dorado, con corazones que cruzan el cielo.',
    metaColor: '#19060f',
    decor: { luna: 'creciente', volador: 'corazones', suelo: null, nevada: false },
  },
  {
    id: 'primavera',
    nombre: 'Primavera y aniversario',
    descripcion: 'Crepúsculo lavanda, rosa suave y crema, con pétalos al viento.',
    metaColor: '#17122b',
    decor: { luna: 'creciente', volador: 'petalos', suelo: null, nevada: false },
  },
];

const BY_ID = new Map(THEMES.map((t) => [t.id, t]));

export function getTheme(id) {
  return BY_ID.get(id) ?? BY_ID.get(DEFAULT_THEME_ID);
}

export function isThemeId(id) {
  return BY_ID.has(id);
}
