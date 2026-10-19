import { REPETIRIAMOS_OPTIONS } from '../constants/repetiriamos';

/**
 * "¿Repetiríamos?" como grupo de radios nativos (flechas y Tab funcionan sin JS).
 * Compartido por la creación y la edición de citas.
 */
export default function RepetiriamosField({ value, onChange, legendClassName }) {
  return (
    <fieldset className="min-w-0">
      <legend className={legendClassName}>¿Repetiríamos?</legend>
      <div className="flex flex-wrap gap-2">
        {REPETIRIAMOS_OPTIONS.map((opt) => (
          <label
            key={opt.value}
            className={`flex cursor-pointer items-center gap-2 rounded-full border px-3.5 py-2 text-sm transition-colors duration-200 pointer-coarse:min-h-11 has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-ink-dark ${
              value === opt.value
                ? 'border-ink-dark bg-ink-dark/10 text-ink-dark'
                : 'border-line text-ink hover:border-ink-dark/50 hover:text-ink-strong'
            }`}
          >
            <input
              type="radio"
              name="repetiriamos"
              value={opt.value}
              checked={value === opt.value}
              onChange={() => onChange(opt.value)}
              className="accent-[color:var(--color-ink-dark)]"
            />
            {opt.label}
          </label>
        ))}
      </div>
    </fieldset>
  );
}
