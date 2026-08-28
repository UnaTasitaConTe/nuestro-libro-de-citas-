import { useState } from 'react';
import Sidebar from './Sidebar';
import Footer from './Footer';

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
      <Sidebar collapsed={collapsed} onToggleCollapsed={toggleCollapsed} />

      <main
        className={`flex min-h-screen flex-col transition-[padding] duration-300 ${
          collapsed ? 'md:pl-20' : 'md:pl-72'
        }`}
      >
        <div className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6 sm:py-10 lg:px-10 lg:py-14">
          {children}
        </div>
        <Footer />
      </main>
    </div>
  );
}
