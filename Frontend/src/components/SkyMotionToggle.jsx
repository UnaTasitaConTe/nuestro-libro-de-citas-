import { useSeasonTheme } from '../themes/themeContext';

/**
 * «Animar el fondo» (WCAG 2.2.2): detiene el movimiento decorativo del cielo
 * (estrellas, luna, nevada y lo que lo cruza). La preferencia se guarda.
 * onToggle(enabled) permite a quien lo usa anunciar el cambio.
 */
export default function SkyMotionToggle({ onToggle, className = '' }) {
  const { skyMotion, setSkyMotion } = useSeasonTheme();

  return (
    <label className={`flex cursor-pointer items-center gap-2 text-xs text-ink pointer-coarse:min-h-11 ${className}`}>
      <input
        type="checkbox"
        checked={skyMotion}
        onChange={(e) => {
          setSkyMotion(e.target.checked);
          onToggle?.(e.target.checked);
        }}
        className="h-4 w-4 accent-[color:var(--color-accent)]"
      />
      Animar el fondo
    </label>
  );
}
