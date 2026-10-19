import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { AuthProvider } from '../context/AuthContext';
import client from '../api/client';
import CalendarioPage from './CalendarioPage';

vi.mock('../api/client', () => ({
  default: { get: vi.fn(), post: vi.fn(), put: vi.fn(), patch: vi.fn(), delete: vi.fn() },
}));

const AGOSTO = [
  { id: 1, nombre: 'Cena en la playa', fecha: '2026-08-25', lugar: 'Mazatlán', repetiriamos: 'SI', intimidad: true },
  { id: 2, nombre: 'Museo', fecha: '2026-08-10', lugar: 'Centro', repetiriamos: 'NO', intimidad: false },
  { id: 3, nombre: 'Cine', fecha: '2026-08-10', lugar: 'Plaza', repetiriamos: 'SI', intimidad: false },
];

function LocationProbe() {
  const location = useLocation();
  return <output data-testid="url">{location.pathname + location.search}</output>;
}

function renderPage(path = '/calendario') {
  localStorage.setItem('token', 'token-de-prueba');
  localStorage.setItem('user', JSON.stringify({ id: 1, name: 'Ana', role: 'USER' }));
  return render(
    <AuthProvider>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route
            path="/calendario"
            element={
              <>
                <CalendarioPage />
                <LocationProbe />
              </>
            }
          />
          <Route path="/citas/:id" element={<p>Detalle de la cita</p>} />
        </Routes>
      </MemoryRouter>
    </AuthProvider>
  );
}

describe('CalendarioPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date(2026, 9, 19, 12)); // 19 de octubre de 2026
    client.get.mockResolvedValue({ data: [] });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('sin parámetro muestra el mes actual y marca hoy', async () => {
    renderPage();
    expect(client.get).toHaveBeenCalledWith('/citas/calendar', { params: { year: 2026, month: 10 } });
    expect(screen.getByRole('heading', { level: 2, name: 'octubre 2026' })).toBeInTheDocument();
    const table = screen.getByRole('table', { name: 'Citas de octubre de 2026' });
    expect(within(table).getAllByRole('columnheader')).toHaveLength(7);
    expect(within(table).getByText('19').closest('[aria-current="date"]')).not.toBeNull();
    expect(await screen.findByText('No hay citas registradas en octubre de 2026.')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Volver a hoy' })).not.toBeInTheDocument();
  });

  it('lee el mes de la URL y los días con cita son enlaces descriptivos', async () => {
    client.get.mockResolvedValue({ data: AGOSTO });
    renderPage('/calendario?mes=2026-08');

    expect(client.get).toHaveBeenCalledWith('/citas/calendar', { params: { year: 2026, month: 8 } });
    const day = await screen.findByRole('link', { name: '25 de agosto: Cena en la playa, con intimidad' });
    expect(day).toHaveAttribute('href', '/citas/1');
    expect(screen.getByRole('link', { name: '10 de agosto: Museo, Cine' })).toBeInTheDocument();
    expect(screen.getAllByRole('status').some((s) => s.textContent === 'agosto de 2026: 3 citas')).toBe(true);
  });

  it('un día con varias citas lleva el foco a la primera de la lista sin salir de la página', async () => {
    const user = userEvent.setup();
    client.get.mockResolvedValue({ data: AGOSTO });
    renderPage('/calendario?mes=2026-08');

    await user.click(await screen.findByRole('link', { name: '10 de agosto: Museo, Cine' }));

    const list = screen.getByRole('region', { name: 'Citas en agosto' });
    expect(within(list).getByRole('link', { name: /Museo/ })).toHaveFocus();
    expect(screen.getByTestId('url')).toHaveTextContent('/calendario?mes=2026-08');
  });

  it('los botones de mes cambian la URL y la petición, también entre años', async () => {
    const user = userEvent.setup();
    renderPage('/calendario?mes=2026-12');

    await user.click(screen.getByRole('button', { name: 'Mes siguiente' }));
    expect(screen.getByTestId('url')).toHaveTextContent('/calendario?mes=2027-01');
    expect(client.get).toHaveBeenLastCalledWith('/citas/calendar', { params: { year: 2027, month: 1 } });

    await user.click(screen.getByRole('button', { name: 'Mes anterior' }));
    await user.click(screen.getByRole('button', { name: 'Mes anterior' }));
    expect(screen.getByTestId('url')).toHaveTextContent('/calendario?mes=2026-11');

    await user.click(screen.getByRole('button', { name: 'Volver a hoy' }));
    expect(screen.getByTestId('url')).toHaveTextContent('/calendario?mes=2026-10');
  });

  it('un mes inválido en la URL vuelve al mes actual', () => {
    renderPage('/calendario?mes=2026-13');
    expect(client.get).toHaveBeenCalledWith('/citas/calendar', { params: { year: 2026, month: 10 } });
  });

  it('si falla la carga lo dice (no "sin citas") y permite reintentar', async () => {
    const user = userEvent.setup();
    client.get.mockRejectedValueOnce(new Error('red')).mockResolvedValueOnce({ data: AGOSTO });
    renderPage('/calendario?mes=2026-08');

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent('No se pudieron cargar las citas de este mes');
    expect(screen.queryByText(/No hay citas registradas/)).not.toBeInTheDocument();

    await user.click(within(alert).getByRole('button', { name: 'Reintentar' }));

    expect(client.get).toHaveBeenCalledTimes(2);
    expect(await screen.findByRole('link', { name: /25 de agosto/ })).toBeInTheDocument();
  });
});
