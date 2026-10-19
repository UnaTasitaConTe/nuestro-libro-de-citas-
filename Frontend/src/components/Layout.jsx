import { useState } from 'react';
import Sidebar from './Sidebar';
import Footer from './Footer';

const MAIN_ID = 'contenido';

// Se mueve el foco con JS en lugar de navegar a #contenido: un cambio de hash
// crearía una entrada de historial y alteraría el comportamiento de "Volver".
function skipToContent(event) {
  event.preventDefault();
  document.getElementById(MAIN_ID)?.focus();
}

export default function Layout({ children }) {
  const [collapsed, setCollapsed] = useState(() => localStorage.getItem('sidebarCollapsed') === '1');

  function toggleCollapsed() {
    setCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem('sidebarCollapsed', next ? '1' : '0');
      return next;
    });
  }

  return (
    <div className="relative z-10 min-h-screen">
      <a href={`#${MAIN_ID}`} onClick={skipToContent} className="skip-link">
        Saltar al contenido
      </a>

      <Sidebar collapsed={collapsed} onToggleCollapsed={toggleCollapsed} />

      <div
        className={`flex min-h-screen flex-col transition-[padding] duration-300 ${
          collapsed ? 'md:pl-20' : 'md:pl-72'
        }`}
      >
        <main
          id={MAIN_ID}
          tabIndex={-1}
          className="mx-auto w-full max-w-7xl flex-1 scroll-mt-20 px-4 py-8 outline-none sm:px-6 sm:py-10 md:scroll-mt-0 lg:px-10 lg:py-14"
        >
          {children}
        </main>
        <Footer />
      </div>
    </div>
  );
}
