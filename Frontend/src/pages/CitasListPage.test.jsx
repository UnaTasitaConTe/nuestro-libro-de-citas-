import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { AuthProvider } from '../context/AuthContext';
import client from '../api/client';
import CitasListPage from './CitasListPage';

vi.mock('../api/client', () => ({
  default: { get: vi.fn(), post: vi.fn(), put: vi.fn(), patch: vi.fn(), delete: vi.fn() },
}));

const entry = (id, user_id, valoracion, photos = []) => ({ id, user_id, user_name: 'Ana', valoracion, photos });
const CITAS = [
  { id: 1, nombre: 'Cena en la playa', fecha: '2026-08-25', lugar: 'Mazatlán', entries: [entry(10, 1, 4, [{ id: 1, foto_url: '/a.jpg' }]), entry(11, 2, 5)] },
  { id: 2, nombre: 'Museo', fecha: '2026-06-10', lugar: 'Centro', entries: [] },
];

function LocationProbe() {
  const l = useLocation();
  return <output data-testid="url">{l.pathname + l.search}</output>;
}

function renderPage(path = '/') {
  localStorage.setItem('token', 'token-de-prueba');
  localStorage.setItem('user', JSON.stringify({ id: 1, name: 'Ana', role: 'USER' }));
  return render(
    <AuthProvider>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route path="/" element={<><CitasListPage /><LocationProbe /></>} />
        </Routes>
      </MemoryRouter>
    </AuthProvider>
  );
}

describe('CitasListPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.scrollTo = vi.fn();
    client.get.mockResolvedValue({ data: { citas: CITAS, totalPages: 3 } });
  });

  it('cada polaroid es un artículo con un enlace corto al detalle', async () => {
    renderPage();
    const list = await screen.findByRole('list', { name: 'Citas' });
    const cards = within(list).getAllByRole('article');
    expect(cards).toHaveLength(2);

    const link = within(cards[0]).getByRole('link', { name: 'Cena en la playa' });
    expect(link).toHaveAttribute('href', '/citas/1');
    expect(within(cards[0]).getByRole('heading', { level: 2, name: 'Cena en la playa' })).toBeInTheDocument();
    expect(within(cards[0]).getByRole('img', { name: 'Valoración media: 4,5 de 5' })).toBeInTheDocument();
    expect(within(cards[0]).getByText('Las dos versiones contadas')).toBeInTheDocument();
    expect(within(cards[1]).getByText('Sin versiones todavía')).toBeInTheDocument();
  });

  it('pide la página de la URL y pagina con la misma petición', async () => {
    const user = userEvent.setup();
    renderPage('/?page=2');
    expect(client.get).toHaveBeenCalledWith('/citas', { params: { page: 2, limit: 10 } });

    const nav = await screen.findByRole('navigation', { name: 'Páginas del álbum' });
    expect(within(nav).getByRole('button', { name: 'Página 2' })).toHaveAttribute('aria-current', 'page');
    expect(screen.getAllByRole('status').some((s) => s.textContent === 'Página 2 de 3: 2 citas')).toBe(true);

    await user.click(within(nav).getByRole('button', { name: 'Página siguiente' }));
    expect(screen.getByTestId('url')).toHaveTextContent('/?page=3');
    expect(client.get).toHaveBeenLastCalledWith('/citas', { params: { page: 3, limit: 10 } });
    expect(window.scrollTo).toHaveBeenCalled();
  });

  it('si falla, lo dice y permite reintentar', async () => {
    const user = userEvent.setup();
    client.get.mockRejectedValueOnce(new Error('red')).mockResolvedValueOnce({ data: { citas: CITAS, totalPages: 1 } });
    renderPage();

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent('No se pudieron cargar las citas');
    await user.click(within(alert).getByRole('button', { name: 'vuelve a intentarlo' }));

    expect(await screen.findByRole('list', { name: 'Citas' })).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('sin citas invita a registrar la primera', async () => {
    client.get.mockResolvedValue({ data: { citas: [], totalPages: 1 } });
    renderPage();
    expect(await screen.findByRole('heading', { name: 'Su álbum está vacío' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Registrar la primera cita' })).toHaveAttribute('href', '/citas/nueva');
    expect(screen.queryByRole('navigation', { name: 'Páginas del álbum' })).not.toBeInTheDocument();
  });

  it('el encabezado tiene <h1> y el acceso a «Nueva cita»', () => {
    renderPage();
    expect(screen.getByRole('heading', { level: 1, name: 'Nuestras citas' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Nueva cita' })).toHaveAttribute('href', '/citas/nueva');
  });
});
