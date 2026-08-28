export default function HeartRating({
  value,
  onChange,
  readOnly = false,
  size = 'text-2xl',
  variant = 'gold',
}) {
  const hearts = [1, 2, 3, 4, 5];

  const colors =
    variant === 'polaroid'
      ? { filled: 'text-[#ff8095]', empty: 'text-[#ff8095]/25' }
      : { filled: 'text-ink-dark', empty: 'text-ink/35' };

  return (
    <div className={`flex gap-1.5 ${size}`} role={readOnly ? 'img' : undefined}>
      {hearts.map((n) => {
        const filled = n <= value;
        return (
          <button
            key={n}
            type="button"
            disabled={readOnly}
            onClick={() => onChange?.(n)}
            className={`leading-none transition-all duration-200 ease-out ${
              readOnly
                ? 'cursor-default'
                : 'cursor-pointer hover:scale-125 hover:-translate-y-0.5 active:scale-95'
            } ${filled ? colors.filled : colors.empty} ${
              filled && variant === 'gold' ? 'drop-shadow-[0_0_8px_rgba(255,204,51,0.45)]' : ''
            }`}
            aria-label={`${n} corazones`}
          >
            {filled ? '♥' : '♡'}
          </button>
        );
      })}
    </div>
  );
}
