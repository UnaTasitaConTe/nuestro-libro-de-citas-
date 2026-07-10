export function averageValoracion(entries) {
  if (!entries.length) return 0;
  return entries.reduce((sum, e) => sum + e.valoracion, 0) / entries.length;
}
