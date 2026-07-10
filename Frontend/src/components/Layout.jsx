import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import DragonIcon from './DragonIcon';

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/login');
  }

  return (
    <div className="relative z-10 min-h-screen">
      <header className="sticky top-0 z-10 bg-paper/95 sm:bg-paper/70 backdrop-blur-none sm:backdrop-blur-md border-b border-line shadow-[0_4px_30px_rgba(255,204,51,0.08)]">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link
            to="/"
            className="flex items-center gap-3 text-lg sm:text-2xl tracking-wide font-display font-semibold text-ink-dark drop-shadow-[0_0_12px_rgba(255,204,51,0.35)]"
          >
            <DragonIcon className="w-9 h-9 shrink-0 drop-shadow-[0_0_8px_rgba(255,204,51,0.4)]" />
            Nuestro Libro de Citas
          </Link>
          {user && (
            <div className="flex items-center gap-3 text-sm">
              <span className="text-ink hidden sm:inline">Hola, {user.name}</span>
              <Link
                to="/pareja"
                className="rounded-full border border-royal-light/40 text-royal-light px-3 py-1 hover:bg-royal-light/10 transition-colors"
              >
                invitar
              </Link>
              <button
                onClick={handleLogout}
                className="rounded-full border border-line px-3 py-1 hover:border-ink-dark hover:text-ink-dark transition-colors"
              >
                salir
              </button>
            </div>
          )}
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-6 py-10">{children}</main>
    </div>
  );
}
