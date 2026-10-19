import { describe, expect, it } from 'vitest';
import { ANIVERSARIO, SEASONS, resolveSeason } from './seasons';
import { THEMES } from './themes';

const d = (y, m, day) => new Date(y, m - 1, day, 12);
const sinAniversario = { ...ANIVERSARIO, mes: null, dia: null };
const resolve = (date) => resolveSeason(date, SEASONS, sinAniversario);

describe('resolveSeason', () => {
  it('cada temporada apunta a un tema existente', () => {
    const ids = new Set(THEMES.map((t) => t.id));
    for (const s of SEASONS) expect(ids.has(s.tema)).toBe(true);
    expect(ids.has(ANIVERSARIO.tema)).toBe(true);
  });

  it('detecta cada temporada por la fecha local', () => {
    expect(resolve(d(2026, 10, 31)).themeId).toBe('halloween');
    expect(resolve(d(2026, 12, 24)).themeId).toBe('navidad');
    expect(resolve(d(2027, 2, 14)).themeId).toBe('sanvalentin');
    expect(resolve(d(2027, 4, 1)).themeId).toBe('primavera');
  });

  it('los límites están incluidos y el día siguiente vuelve al predeterminado', () => {
    expect(resolve(d(2026, 10, 15)).themeId).toBe('halloween');
    expect(resolve(d(2026, 11, 2)).themeId).toBe('halloween');
    expect(resolve(d(2026, 11, 3))).toEqual({ season: null, themeId: 'noche' });
    expect(resolve(d(2026, 10, 14)).themeId).toBe('noche');
  });

  it('una temporada que cruza el fin de año funciona en ambos lados', () => {
    expect(resolve(d(2026, 12, 31)).themeId).toBe('navidad');
    expect(resolve(d(2027, 1, 1)).themeId).toBe('navidad');
    expect(resolve(d(2027, 1, 6)).themeId).toBe('navidad');
    expect(resolve(d(2027, 1, 7)).themeId).toBe('noche');
  });

  it('sin temporada activa devuelve el tema predeterminado', () => {
    expect(resolve(d(2026, 7, 15))).toEqual({ season: null, themeId: 'noche' });
  });

  it('el aniversario gana por prioridad aunque coincida con otra temporada', () => {
    const aniversario = { ...ANIVERSARIO, mes: 10, dia: 31 };
    const r = resolveSeason(d(2026, 11, 1), SEASONS, aniversario);
    expect(r.season.id).toBe('aniversario');
    expect(r.themeId).toBe('primavera');
    expect(resolveSeason(d(2026, 11, 4), SEASONS, aniversario).themeId).toBe('noche');
  });

  it('el aniversario funciona alrededor del cambio de año', () => {
    const aniversario = { ...ANIVERSARIO, mes: 12, dia: 31, diasDespues: 3 };
    // Navidad también está activa: gana el aniversario por prioridad.
    expect(resolveSeason(d(2027, 1, 2), SEASONS, aniversario).season.id).toBe('aniversario');
  });

  it('con la misma prioridad gana el periodo más corto (el más específico)', () => {
    const seasons = [
      { id: 'larga', tema: 'navidad', desde: '12-01', hasta: '12-31', prioridad: 10 },
      { id: 'corta', tema: 'sanvalentin', desde: '12-20', hasta: '12-26', prioridad: 10 },
    ];
    expect(resolveSeason(d(2026, 12, 24), seasons, sinAniversario).season.id).toBe('corta');
    expect(resolveSeason(d(2026, 12, 10), seasons, sinAniversario).season.id).toBe('larga');
  });
});
