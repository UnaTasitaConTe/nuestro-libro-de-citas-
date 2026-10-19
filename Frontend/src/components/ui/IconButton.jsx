/**
 * Botón solo con icono. `label` es obligatorio: es su nombre accesible.
 * Usa .icon-btn (36 px visibles; 44 px en pantallas táctiles, ver index.css).
 * variant="overlay": sobre fondos oscuros a pantalla completa (visor de fotos).
 */
export default function IconButton({ label, variant = 'default', className = '', children, ...props }) {
  if (import.meta.env.DEV && !label) {
    console.error('IconButton necesita un label: es su nombre accesible.');
  }
  const variantClass = variant === 'overlay' ? 'icon-btn-overlay' : '';

  return (
    <button
      type="button"
      aria-label={label}
      className={`icon-btn ${variantClass} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
