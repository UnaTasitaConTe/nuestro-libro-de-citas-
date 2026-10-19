import { useId } from 'react';

/**
 * Etiqueta + control + ayuda/error, asociados por id.
 * El control se recibe como función para no clonar elementos:
 *
 *   <Field label="Lugar" error={error}>
 *     {(field) => <input {...field} className="field" />}
 *   </Field>
 *
 * `field` incluye id, aria-describedby (ayuda y error) y aria-invalid.
 * Por defecto la etiqueta usa .field-label; labelClassName conserva estilos existentes.
 */
export default function Field({
  label,
  hint,
  error,
  className,
  labelClassName = 'field-label',
  children,
}) {
  const id = useId();
  const hintId = hint ? `${id}-ayuda` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(' ') || undefined;

  return (
    <div className={className}>
      <label htmlFor={id} className={labelClassName}>
        {label}
      </label>
      {children({ id, 'aria-describedby': describedBy, 'aria-invalid': error ? true : undefined })}
      {hint && (
        <p id={hintId} className="mt-1.5 text-xs leading-relaxed text-ink/80">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} className="mt-1.5 text-xs leading-relaxed text-danger">
          {error}
        </p>
      )}
    </div>
  );
}
