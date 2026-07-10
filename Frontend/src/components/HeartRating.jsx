export default function HeartRating({ value, onChange, readOnly = false, size = 'text-2xl', variant = 'gold' }) {
  const hearts = [1, 2, 3, 4, 5];

  const colors =
    variant === 'polaroid'
      ? { filled: 'text-[#c2455a]', empty: 'text-[#c2455a]/25' }
      : { filled: 'text-ink-dark', empty: 'text-ink/40' };

  return (
    <div className={`flex gap-1 ${size}`}>
      {hearts.map((n) => {
        const filled = n <= value;
        return (
          <button
            key={n}
            type="button"
            disabled={readOnly}
            onClick={() => onChange?.(n)}
            className={`transition-transform ${readOnly ? 'cursor-default' : 'cursor-pointer hover:scale-110'} ${
              filled ? colors.filled : colors.empty
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
