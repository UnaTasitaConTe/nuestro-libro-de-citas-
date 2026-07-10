export default function Pagination({ page, totalPages, onChange }) {
  if (totalPages <= 1) return null;

  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);

  return (
    <div className="flex items-center justify-center gap-2 mt-4">
      <button
        type="button"
        disabled={page === 1}
        onClick={() => onChange(page - 1)}
        aria-label="Página anterior"
        className="w-9 h-9 rounded-full border border-line text-ink flex items-center justify-center hover:border-ink-dark hover:text-ink-dark transition-colors disabled:opacity-30 disabled:pointer-events-none"
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
          className={`w-9 h-9 rounded-full text-sm font-display font-semibold transition-all ${
            p === page
              ? 'bg-gradient-to-r from-ink-dark to-amber-400 text-paper shadow-[0_4px_16px_rgba(255,204,51,0.4)]'
              : 'text-ink border border-line hover:border-ink-dark hover:text-ink-dark'
          }`}
        >
          {p}
        </button>
      ))}

      <button
        type="button"
        disabled={page === totalPages}
        onClick={() => onChange(page + 1)}
        aria-label="Página siguiente"
        className="w-9 h-9 rounded-full border border-line text-ink flex items-center justify-center hover:border-ink-dark hover:text-ink-dark transition-colors disabled:opacity-30 disabled:pointer-events-none"
      >
        ›
      </button>
    </div>
  );
}
