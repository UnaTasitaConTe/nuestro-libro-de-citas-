export function parseLocalDate(dateStr) {
  const [year, month, day] = dateStr.slice(0, 10).split('-').map(Number);
  return new Date(year, month - 1, day);
}

export function formatFecha(dateStr) {
  return parseLocalDate(dateStr).toLocaleDateString('es', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}
