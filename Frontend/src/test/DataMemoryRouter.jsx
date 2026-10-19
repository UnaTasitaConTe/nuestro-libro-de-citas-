import { useState } from 'react';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';

/**
 * Equivalente de prueba del router de la app (main.jsx): data router en memoria
 * con una ruta comodín que renderiza `children` (normalmente un <Routes>).
 * Hace falta para las páginas que usan useBlocker.
 */
export default function DataMemoryRouter({ initialEntries, children }) {
  const [router] = useState(() =>
    createMemoryRouter([{ path: '*', element: children }], { initialEntries })
  );
  return <RouterProvider router={router} />;
}
