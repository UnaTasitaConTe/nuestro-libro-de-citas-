export default function Pagination({ page, totalPages, onChange }) {
  if (totalPages <= 1) return null;

  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);

  return (
    <nav
      aria-label="Paginación"
      className="mt-10 flex flex-wrap items-center justify-center gap-2"
    >
      <button
        type="button"
        disabled={page === 1}
        onClick={() => onChange(page - 1)}
        aria-label="Página anterior"
        className="icon-btn"
      >
        ‹
      </button>

      {pages.map((p) => (
        <button
          key={p}
          type="button"
          onClick={() => onChange(p)}
          aria-label={`Ir a la página ${p}`}
          aria-current={p === page ? 'page' : undefined}
          className={
            p === page
              ? 'grid h-9 w-9 place-items-center rounded-full bg-linear-to-r from-ink-dark to-amber-300 font-display text-sm font-semibold text-[#1a1300] shadow-[0_8px_24px_-8px_rgba(255,204,51,0.7)]'
              : 'icon-btn font-display text-sm'
          }
        >
          {p}
        </button>
      ))}

      <button
        type="button"
        disabled={page === totalPages}
        onClick={() => onChange(page + 1)}
        aria-label="Página siguiente"
        className="icon-btn"
      >
        ›
      </button>
    </nav>
  );
}
