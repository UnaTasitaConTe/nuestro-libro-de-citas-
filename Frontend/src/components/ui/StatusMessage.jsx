/**
 * Mensaje de estado anunciado por lectores de pantalla.
 *
 * La región viva se renderiza SIEMPRE (también vacía): los lectores solo
 * anuncian de forma fiable los cambios dentro de una región que ya existía.
 * - tone="error": role="alert" (asertivo), para fallos tras una acción.
 * - resto: role="status" (cortés), para confirmaciones.
 *
 * `className` es el aspecto visual del mensaje (p. ej. "alert alert-danger");
 * solo se aplica cuando hay contenido, así no aparece una caja vacía.
 */
export default function StatusMessage({ tone = 'info', className = '', children }) {
  const isError = tone === 'error';

  return (
    <div role={isError ? 'alert' : 'status'} aria-live={isError ? 'assertive' : 'polite'} aria-atomic="true">
      {children ? <p className={className}>{children}</p> : null}
    </div>
  );
}
