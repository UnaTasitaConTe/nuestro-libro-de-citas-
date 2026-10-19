import { useState } from 'react';
import { Palette } from 'lucide-react';
import { useSeasonTheme } from '../themes/themeContext';
import StatusMessage from './ui/StatusMessage';

/**
 * Selector de tema de temporada: "Automático" (según la fecha) o un tema
 * concreto, que prevalece sobre el calendario hasta volver a "Automático".
 * <select> nativo: teclado, lector de pantalla y táctil sin JS adicional.
 */
export default function ThemeSelect({ id }) {
  const { preference, setPreference, autoTheme, themes } = useSeasonTheme();
  const [announcement, setAnnouncement] = useState('');
  const hintId = `${id}-ayuda`;

  function handleChange(event) {
    const value = event.target.value;
    setPreference(value);
    const chosen = themes.find((t) => t.id === value);
    setAnnouncement(
      value === 'auto' ? `Tema automático: ${autoTheme.nombre}.` : `Tema elegido: ${chosen?.nombre}.`
    );
  }

  return (
    <div>
      <label htmlFor={id} className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-ink">
        <Palette aria-hidden="true" className="h-3.5 w-3.5" strokeWidth={1.75} />
        Tema
      </label>
      <select
        id={id}
        value={preference}
        onChange={handleChange}
        aria-describedby={hintId}
        className="w-full rounded-xl border border-line bg-paper px-3 py-2 text-sm text-ink-strong transition-colors hover:border-line-strong pointer-coarse:min-h-11"
      >
        <option value="auto">Automático (ahora: {autoTheme.nombre})</option>
        {themes.map((t) => (
          <option key={t.id} value={t.id}>
            {t.nombre}
          </option>
        ))}
      </select>
      <p id={hintId} className="mt-1.5 text-[11px] leading-snug text-ink/80">
        {preference === 'auto' ? 'Cambia solo según la fecha.' : 'Elegido por ti: no cambia con la fecha.'}
      </p>
      <StatusMessage className="sr-only">{announcement}</StatusMessage>
    </div>
  );
}
