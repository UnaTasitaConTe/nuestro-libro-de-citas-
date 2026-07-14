import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { BookHeart, KanbanSquare, Mail, LogOut, ChevronLeft, ChevronRight, Menu, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import DragonIcon from './DragonIcon';

const NAV_ITEMS = [
  { to: '/', label: 'Nuestras citas', Icon: BookHeart, end: true },
  { to: '/backlog', label: 'Backlog', Icon: KanbanSquare },
  { to: '/pareja', label: 'Invitar', Icon: Mail },
];

function linkClass({ isActive }) {
  return `flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm transition-colors ${
    isActive
      ? 'bg-ink-dark/10 text-ink-dark font-semibold'
      : 'text-ink hover:bg-card/60 hover:text-ink-dark'
  }`;
}

function NavLinks({ collapsed, onNavigate }) {
  return (
    <>
      {NAV_ITEMS.map(({ to, label, Icon, end }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          onClick={onNavigate}
          title={collapsed ? label : undefined}
          className={linkClass}
        >
          <Icon className={`w-5 h-5 shrink-0 ${collapsed ? 'mx-auto' : ''}`} strokeWidth={1.75} />
          {!collapsed && label}
        </NavLink>
      ))}
    </>
  );
}

export default function Sidebar({ collapsed, onToggleCollapsed }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  function handleLogout() {
    setOpen(false);
    logout();
    navigate('/login');
  }

  return (
    <>
      <div className="md:hidden sticky top-0 z-20 flex items-center justify-between bg-paper/95 backdrop-blur-md border-b border-line px-4 py-3">
        <Link to="/" className="flex items-center gap-2 text-base font-display font-semibold text-ink-dark">
          <DragonIcon className="w-8 h-8 shrink-0" />
          Nuestro Libro de Citas
        </Link>
        {user && (
          <button
            onClick={() => setOpen(true)}
            aria-label="Abrir menú"
            className="w-9 h-9 rounded-full border border-line text-ink-dark flex items-center justify-center"
          >
            <Menu className="w-5 h-5" strokeWidth={1.75} />
          </button>
        )}
      </div>

      <aside
        className={`hidden md:flex md:flex-col md:fixed md:inset-y-0 md:left-0 bg-paper/90 backdrop-blur-md border-r border-line z-20 transition-[width] duration-200 ${
          collapsed ? 'md:w-16' : 'md:w-64'
        }`}
      >
        <Link
          to="/"
          className={`flex items-center gap-3 px-5 py-5 text-base leading-tight font-display font-semibold text-ink-dark drop-shadow-[0_0_12px_rgba(255,204,51,0.35)] ${
            collapsed ? 'justify-center px-0' : ''
          }`}
        >
          <DragonIcon className="w-9 h-9 shrink-0 drop-shadow-[0_0_8px_rgba(255,204,51,0.4)]" />
          {!collapsed && 'Nuestro Libro de Citas'}
        </Link>

        <button
          onClick={onToggleCollapsed}
          aria-label={collapsed ? 'Expandir menú' : 'Colapsar menú'}
          className="absolute -right-3 top-16 w-6 h-6 rounded-full border border-line bg-card text-ink-dark flex items-center justify-center shadow-md hover:border-ink-dark transition-colors"
        >
          {collapsed ? <ChevronRight className="w-3.5 h-3.5" strokeWidth={2} /> : <ChevronLeft className="w-3.5 h-3.5" strokeWidth={2} />}
        </button>

        <nav className="flex-1 flex flex-col gap-1 px-3 mt-2">
          <NavLinks collapsed={collapsed} />
        </nav>

        {user && (
          <div className="px-3 pb-5 pt-3 mt-3 border-t border-line">
            {!collapsed && <p className="px-4 text-xs text-ink/70 mb-2">Hola, {user.name}</p>}
            <button
              onClick={handleLogout}
              title={collapsed ? 'Salir' : undefined}
              className="w-full flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm text-ink hover:bg-card/60 hover:text-ink-dark transition-colors"
            >
              <LogOut className={`w-5 h-5 shrink-0 ${collapsed ? 'mx-auto' : ''}`} strokeWidth={1.75} />
              {!collapsed && 'Salir'}
            </button>
          </div>
        )}
      </aside>

      {open && (
        <div className="md:hidden fixed inset-0 z-30">
          <div className="absolute inset-0 bg-black/60" onClick={() => setOpen(false)} />
          <aside className="absolute inset-y-0 left-0 w-64 flex flex-col bg-paper border-r border-line shadow-2xl">
            <button
              onClick={() => setOpen(false)}
              aria-label="Cerrar menú"
              className="absolute top-4 right-4 w-8 h-8 rounded-full border border-line text-ink flex items-center justify-center"
            >
              <X className="w-4 h-4" strokeWidth={1.75} />
            </button>

            <Link
              to="/"
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 pl-5 pr-11 py-5 text-base leading-tight font-display font-semibold text-ink-dark drop-shadow-[0_0_12px_rgba(255,204,51,0.35)]"
            >
              <DragonIcon className="w-9 h-9 shrink-0 drop-shadow-[0_0_8px_rgba(255,204,51,0.4)]" />
              Nuestro Libro de Citas
            </Link>

            <nav className="flex-1 flex flex-col gap-1 px-3">
              <NavLinks collapsed={false} onNavigate={() => setOpen(false)} />
            </nav>

            {user && (
              <div className="px-3 pb-5 pt-3 mt-3 border-t border-line">
                <p className="px-4 text-xs text-ink/70 mb-2">Hola, {user.name}</p>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm text-ink hover:bg-card/60 hover:text-ink-dark transition-colors"
                >
                  <LogOut className="w-5 h-5 shrink-0" strokeWidth={1.75} />
                  Salir
                </button>
              </div>
            )}
          </aside>
        </div>
      )}
    </>
  );
}
