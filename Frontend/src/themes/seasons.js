import { DEFAULT_THEME_ID } from './themes';

/**
 * Calendario de temporadas: qué tema se activa automáticamente y cuándo.
 * Todo usa la fecha local del dispositivo (sin servicios externos).
 *
 * desde / hasta: 'MM-DD', ambos incluidos. Si desde > hasta, el periodo
 * cruza el fin de año (p. ej. Navidad, del 1 de diciembre al 6 de enero).
 *
 * Coincidencias: gana la temporada con mayor `prioridad`; si empatan, la de
 * periodo más corto (la más específica); si siguen empatadas, la primera de la
 * lista. Sin ninguna activa: el tema predeterminado (Noche estrellada).
 */
export const SEASONS = [
  { id: 'halloween', tema: 'halloween', desde: '10-15', hasta: '11-02', prioridad: 10 },
  { id: 'navidad', tema: 'navidad', desde: '12-01', hasta: '01-06', prioridad: 10 },
  { id: 'sanvalentin', tema: 'sanvalentin', desde: '02-07', hasta: '02-15', prioridad: 10 },
  { id: 'primavera', tema: 'primavera', desde: '03-20', hasta: '04-20', prioridad: 5 },
];

/**
 * Aniversario: reutiliza el tema de primavera unos días alrededor de la fecha.
 * Para activarlo, indica el mes (1–12) y el día. Tiene la prioridad más alta,
 * así que se impone a cualquier otra temporada que coincida.
 */
export const ANIVERSARIO = {
  mes: null, // p. ej. 5 para mayo
  dia: null, // p. ej. 14
  diasAntes: 3,
  diasDespues: 3,
  tema: 'primavera',
  prioridad: 100,
};

const DAY_MS = 24 * 60 * 60 * 1000;

function startOfDay(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function parseMonthDay(value) {
  const [mes, dia] = value.split('-').map(Number);
  return { mes, dia };
}

/** Ventana [inicio, fin] (fechas locales, días completos) que contiene `date`, o null. */
function windowContaining(date, desde, hasta) {
  const day = startOfDay(date);
  const year = day.getFullYear();
  const from = parseMonthDay(desde);
  const to = parseMonthDay(hasta);
  const crossesYear = from.mes * 100 + from.dia > to.mes * 100 + to.dia;

  // Se prueban las ventanas que empiezan el año anterior y el actual (fin de año).
  for (const startYear of crossesYear ? [year - 1, year] : [year]) {
    const start = new Date(startYear, from.mes - 1, from.dia);
    const end = new Date(crossesYear ? startYear + 1 : startYear, to.mes - 1, to.dia);
    if (day >= start && day <= end) return { start, end };
  }
  return null;
}

function anniversaryWindow(date, aniversario) {
  if (!aniversario?.mes || !aniversario?.dia) return null;
  const day = startOfDay(date);
  for (const year of [day.getFullYear() - 1, day.getFullYear(), day.getFullYear() + 1]) {
    const center = new Date(year, aniversario.mes - 1, aniversario.dia);
    const start = new Date(center.getTime() - aniversario.diasAntes * DAY_MS);
    const end = new Date(center.getTime() + aniversario.diasDespues * DAY_MS);
    if (day >= startOfDay(start) && day <= startOfDay(end)) return { start, end };
  }
  return null;
}

/**
 * Temporada activa para una fecha.
 * Devuelve { season, themeId }: season es null cuando no hay ninguna activa.
 */
export function resolveSeason(date = new Date(), seasons = SEASONS, aniversario = ANIVERSARIO) {
  const candidates = [];

  seasons.forEach((season, order) => {
    const range = windowContaining(date, season.desde, season.hasta);
    if (range) candidates.push({ season, order, length: range.end - range.start });
  });

  const anniversary = anniversaryWindow(date, aniversario);
  if (anniversary) {
    candidates.push({
      season: { id: 'aniversario', tema: aniversario.tema, prioridad: aniversario.prioridad },
      order: -1,
      length: anniversary.end - anniversary.start,
    });
  }

  if (!candidates.length) return { season: null, themeId: DEFAULT_THEME_ID };

  candidates.sort(
    (a, b) => b.season.prioridad - a.season.prioridad || a.length - b.length || a.order - b.order
  );
  const winner = candidates[0].season;
  return { season: winner, themeId: winner.tema };
}
