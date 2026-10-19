const HEARTS = [1, 2, 3, 4, 5];

const STEP_KEYS = { ArrowRight: 1, ArrowUp: 1, ArrowLeft: -1, ArrowDown: -1 };

function heartsLabel(n) {
  return `${n} ${n === 1 ? 'corazón' : 'corazones'}`;
}

/**
 * Valoración de 1 a 5 corazones.
 * - readOnly: una imagen con nombre ("4 de 5 corazones").
 * - interactiva: un grupo de radio (role="radiogroup"). Tab entra en el
 *   corazón elegido (o el primero); flechas, Inicio y Fin cambian el valor.
 *   labelledBy / describedBy / invalid conectan la etiqueta y el error del formulario.
 */
export default function HeartRating({
  value,
  onChange,
  readOnly = false,
  size = 'text-2xl',
  variant = 'gold',
  label,
  labelledBy,
  describedBy,
  invalid = false,
  groupRef,
}) {
  const colors =
    variant === 'polaroid'
      ? { filled: 'text-passion', empty: 'text-passion/25' }
      : { filled: 'text-ink-dark', empty: 'text-ink/35' };

  function heartClass(filled) {
    return `${filled ? colors.filled : colors.empty} ${
      filled && variant === 'gold' ? 'drop-shadow-glow-sm' : ''
    }`;
  }

  // Solo lectura: una imagen con nombre, no cinco botones desactivados.
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

  function select(n, event) {
    onChange?.(n);
    // El corazón elegido recibe el foco (patrón de radio con foco itinerante).
    event.currentTarget.closest('[role="radiogroup"]')?.querySelectorAll('[role="radio"]')[n - 1]?.focus();
  }

  function handleKeyDown(event) {
    let next;
    if (event.key in STEP_KEYS) next = Math.min(5, Math.max(1, (value || 0) + STEP_KEYS[event.key]));
    else if (event.key === 'Home') next = 1;
    else if (event.key === 'End') next = 5;
    if (!next) return;
    event.preventDefault();
    select(next, event);
  }

  const focusable = value >= 1 ? value : 1;

  return (
    <div
      ref={groupRef}
      role="radiogroup"
      aria-labelledby={labelledBy}
      aria-label={labelledBy ? undefined : label ?? 'Valoración'}
      aria-describedby={describedBy}
      aria-invalid={invalid || undefined}
      onKeyDown={handleKeyDown}
      className={`flex gap-1.5 ${size}`}
    >
      {HEARTS.map((n) => {
        const filled = n <= value;
        return (
          <button
            key={n}
            type="button"
            role="radio"
            aria-checked={n === value}
            aria-label={heartsLabel(n)}
            tabIndex={n === focusable ? 0 : -1}
            onClick={(event) => select(n, event)}
            className={`grid place-items-center rounded-md leading-none transition-[color,filter,translate,scale] duration-200 ease-out cursor-pointer pointer-coarse:min-h-11 pointer-coarse:min-w-11 hover:scale-125 hover:-translate-y-0.5 active:scale-95 ${heartClass(filled)}`}
          >
            {filled ? '♥' : '♡'}
          </button>
        );
      })}
    </div>
  );
}
