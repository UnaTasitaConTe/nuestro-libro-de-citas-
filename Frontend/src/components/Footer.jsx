import { Link } from 'react-router-dom';
import { BookHeart, KanbanSquare, Mail } from 'lucide-react';
import DragonIcon from './DragonIcon';

const YEAR = new Date().getFullYear();

export default function Footer() {
  return (
    <footer className="mt-16 border-t border-line bg-paper/40 backdrop-blur-md">
      <div className="mx-auto grid w-full max-w-7xl gap-8 px-4 py-10 sm:px-6 md:grid-cols-[minmax(0,1.4fr)_auto] md:items-start lg:px-10">
        <div className="flex min-w-0 items-start gap-3">
          <DragonIcon className="h-10 w-10 shrink-0" />
          <div className="min-w-0">
            <p className="font-display text-base font-semibold text-ink-strong">
              Nuestro Libro de Citas
            </p>
            <p className="mt-1 max-w-sm text-sm leading-relaxed text-ink">
              Un lugar tranquilo para guardar las dos versiones de cada historia: las fotos, las
              risas y lo que sentimos esa noche.
            </p>
          </div>
        </div>

        <nav className="flex flex-wrap gap-2" aria-label="Enlaces del pie de página">
          <Link to="/" className="chip transition-colors hover:text-ink-dark">
            <BookHeart className="h-3.5 w-3.5" strokeWidth={1.75} /> Nuestras citas
          </Link>
          <Link to="/backlog" className="chip transition-colors hover:text-ink-dark">
            <KanbanSquare className="h-3.5 w-3.5" strokeWidth={1.75} /> Backlog
          </Link>
          <Link to="/pareja" className="chip transition-colors hover:text-ink-dark">
            <Mail className="h-3.5 w-3.5" strokeWidth={1.75} /> Invitar
          </Link>
        </nav>
      </div>

      <div className="divider" />

      <p className="px-4 py-5 text-center text-xs text-ink/70 sm:px-6 lg:px-10">
        © {YEAR} Nuestro Libro de Citas · Hecho con calma y cariño 💛
      </p>
    </footer>
  );
}
