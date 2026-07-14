import { useState } from 'react';
import Sidebar from './Sidebar';

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
      <main className={collapsed ? 'md:pl-16' : 'md:pl-64'}>
        <div className="max-w-7xl mx-auto px-6 py-10">{children}</div>
      </main>
    </div>
  );
}
