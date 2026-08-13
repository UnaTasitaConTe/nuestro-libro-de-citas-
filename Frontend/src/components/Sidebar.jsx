import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import {
  BookHeart,
  KanbanSquare,
  Mail,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import DragonIcon from './DragonIcon';

const NAV_ITEMS = [
  { to: '/', label: 'Nuestras citas', Icon: BookHeart, end: true },
  { to: '/backlog', label: 'Backlog', Icon: KanbanSquare },
  { to: '/pareja', label: 'Invitar', Icon: Mail },
];

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
          className="nav-link"
          style={collapsed ? { justifyContent: 'center', paddingInline: 0 } : undefined}
        >
          {({ isActive }) => (
            <span
              data-active={isActive}
              className="flex w-full items-center gap-3"
              style={collapsed ? { justifyContent: 'center' } : undefined}
            >
              <Icon className="h-5 w-5 shrink-0" strokeWidth={1.75} />
              {!collapsed && <span className="truncate">{label}</span>}
            </span>
          )}
        </NavLink>
      ))}
    </>
  );
}

function Brand({ collapsed = false, onNavigate, compact = false }) {
  return (
    <Link
      to="/"
      onClick={onNavigate}
      className={`group flex items-center gap-3 ${collapsed ? 'justify-center px-0' : 'px-5'} ${
        compact ? 'py-0' : 'py-6'
      }`}
    >
      <DragonIcon className="h-10 w-10 shrink-0 drop-shadow-[0_0_12px_rgba(255,204,51,0.35)] transition-transform duration-300 group-hover:scale-105" />
      {!collapsed && (
        <span className="min-w-0">
          <span className="block font-display text-[0.95rem] font-semibold leading-tight text-ink-strong">
            Nuestro Libro
          </span>
          <span className="block font-display text-[0.95rem] font-semibold leading-tight title-gold">
            de Citas
          </span>
        </span>
      )}
    </Link>
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
      {/* ---------- Header móvil ---------- */}
      <header className="sticky top-0 z-30 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 border-b border-line bg-paper/85 px-4 py-3 backdrop-blur-xl md:hidden">
        <Brand compact onNavigate={() => setOpen(false)} />
        {user && (
          <button
            onClick={() => setOpen(true)}
            aria-label="Abrir menú"
            className="icon-btn shrink-0"
          >
            <Menu className="h-5 w-5" strokeWidth={1.75} />
          </button>
        )}
      </header>

      {/* ---------- Sidebar escritorio ---------- */}
      <aside
        className={`z-20 hidden border-r border-line bg-paper/70 backdrop-blur-xl transition-[width] duration-300 md:fixed md:inset-y-0 md:left-0 md:flex md:flex-col ${
          collapsed ? 'md:w-20' : 'md:w-72'
        }`}
      >
        <Brand collapsed={collapsed} />

        <button
          onClick={onToggleCollapsed}
          aria-label={collapsed ? 'Expandir menú' : 'Colapsar menú'}
          className="icon-btn absolute -right-3.5 top-20 h-7 w-7 bg-card shadow-lg"
        >
          {collapsed ? (
            <ChevronRight className="h-3.5 w-3.5" strokeWidth={2} />
          ) : (
            <ChevronLeft className="h-3.5 w-3.5" strokeWidth={2} />
          )}
        </button>

        <nav className={`mt-2 flex flex-1 flex-col gap-1.5 ${collapsed ? 'px-2' : 'px-4'}`}>
          <NavLinks collapsed={collapsed} />
        </nav>

        {user && (
          <div className={`border-t border-line pb-6 pt-4 ${collapsed ? 'px-2' : 'px-4'}`}>
            {!collapsed && (
              <div className="mb-3 flex min-w-0 items-center gap-3 rounded-2xl border border-line bg-card/50 px-3 py-2.5">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-ink-dark/15 font-display text-sm font-semibold text-ink-dark">
                  {user.name?.[0]?.toUpperCase() ?? '♥'}
                </span>
                <span className="min-w-0">
                  <span className="block text-[0.7rem] uppercase tracking-widest text-ink/60">
                    Hola
                  </span>
                  <span className="block truncate text-sm font-medium text-ink-strong">
                    {user.name}
                  </span>
                </span>
              </div>
            )}
            <button
              onClick={handleLogout}
              title={collapsed ? 'Salir' : undefined}
              className="nav-link w-full"
              style={collapsed ? { justifyContent: 'center', paddingInline: 0 } : undefined}
            >
              <LogOut className="h-5 w-5 shrink-0" strokeWidth={1.75} />
              {!collapsed && 'Salir'}
            </button>
          </div>
        )}
      </aside>

      {/* ---------- Drawer móvil ---------- */}
      {open && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />
          <aside className="fade-in-up absolute inset-y-0 left-0 flex w-72 flex-col border-r border-line bg-paper shadow-2xl">
            <button
              onClick={() => setOpen(false)}
              aria-label="Cerrar menú"
              className="icon-btn absolute right-4 top-4"
            >
              <X className="h-4 w-4" strokeWidth={1.75} />
            </button>

            <div className="pr-12">
              <Brand onNavigate={() => setOpen(false)} />
            </div>

            <nav className="flex flex-1 flex-col gap-1.5 px-4">
              <NavLinks collapsed={false} onNavigate={() => setOpen(false)} />
            </nav>

            {user && (
              <div className="border-t border-line px-4 pb-6 pt-4">
                <div className="mb-3 flex min-w-0 items-center gap-3 rounded-2xl border border-line bg-card/50 px-3 py-2.5">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-ink-dark/15 font-display text-sm font-semibold text-ink-dark">
                    {user.name?.[0]?.toUpperCase() ?? '♥'}
                  </span>
                  <span className="min-w-0">
                    <span className="block text-[0.7rem] uppercase tracking-widest text-ink/60">
                      Hola
                    </span>
                    <span className="block truncate text-sm font-medium text-ink-strong">
                      {user.name}
                    </span>
                  </span>
                </div>
                <button onClick={handleLogout} className="nav-link w-full">
                  <LogOut className="h-5 w-5 shrink-0" strokeWidth={1.75} />
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
