const HEARTS = [1, 2, 3, 4, 5];

export default function HeartRating({
  value,
  onChange,
  readOnly = false,
  size = 'text-2xl',
  variant = 'gold',
  label,
}) {
  const colors =
    variant === 'polaroid'
      ? { filled: 'text-[#ff8095]', empty: 'text-[#ff8095]/25' }
      : { filled: 'text-ink-dark', empty: 'text-ink/35' };

  function heartClass(filled) {
    return `${filled ? colors.filled : colors.empty} ${
      filled && variant === 'gold' ? 'drop-shadow-[0_0_8px_rgba(255,204,51,0.45)]' : ''
    }`;
  }

  // Solo lectura: una imagen con nombre ("4 de 5 corazones"), no cinco botones desactivados.
  if (readOnly) {
    return (
      <div className={`flex gap-1.5 ${size}`} role="img" aria-label={label ?? `${value} de 5 corazones`}>
        {HEARTS.map((n) => (
          <span key={n} aria-hidden="true" className={`leading-none ${heartClass(n <= value)}`}>
            {n <= value ? '♥' : '♡'}
          </span>
        ))}
      </div>
    );
  }

  return (
    <div className={`flex gap-1.5 ${size}`}>
      {HEARTS.map((n) => {
        const filled = n <= value;
        return (
          <button
            key={n}
            type="button"
            onClick={() => onChange?.(n)}
            className={`leading-none transition-[color,filter,translate,scale] duration-200 ease-out cursor-pointer hover:scale-125 hover:-translate-y-0.5 active:scale-95 ${heartClass(filled)}`}
            aria-label={`${n} corazones`}
          >
            {filled ? '♥' : '♡'}
          </button>
        );
      })}
    </div>
  );
}
