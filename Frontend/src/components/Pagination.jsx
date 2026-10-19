import { ChevronLeft, ChevronRight } from 'lucide-react';
import IconButton from './ui/IconButton';

export default function Pagination({ page, totalPages, onChange, label = 'Paginación' }) {
  if (totalPages <= 1) return null;

  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);

  return (
    <nav aria-label={label} className="mt-10 flex flex-wrap items-center justify-center gap-2">
      <IconButton label="Página anterior" disabled={page === 1} onClick={() => onChange(page - 1)}>
        <ChevronLeft className="h-4 w-4" />
      </IconButton>

      {pages.map((p) => (
        <button
          key={p}
          type="button"
          onClick={() => onChange(p)}
          aria-label={`Página ${p}`}
          aria-current={p === page ? 'page' : undefined}
          className={
            p === page
              ? 'grid h-9 w-9 place-items-center rounded-full bg-accent font-display text-sm font-semibold tabular-nums text-on-accent shadow-accent-glow pointer-coarse:h-11 pointer-coarse:w-11'
              : 'icon-btn font-display text-sm tabular-nums'
          }
        >
          {p}
        </button>
      ))}

      <IconButton label="Página siguiente" disabled={page === totalPages} onClick={() => onChange(page + 1)}>
        <ChevronRight className="h-4 w-4" />
      </IconButton>
    </nav>
  );
}
