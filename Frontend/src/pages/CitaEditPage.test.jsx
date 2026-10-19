import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Route, Routes } from 'react-router-dom';
import DataMemoryRouter from '../test/DataMemoryRouter';
import { AuthProvider } from '../context/AuthContext';
import client from '../api/client';
import CitaEditPage from './CitaEditPage';

vi.mock('../api/client', () => ({
  default: { get: vi.fn(), post: vi.fn(), put: vi.fn(), patch: vi.fn(), delete: vi.fn() },
}));

const CITA = { id: 1, nombre: 'Picnic', fecha: '2026-05-02T00:00:00.000Z', lugar: 'Parque', repetiriamos: 'SI', entries: [] };

function renderPage() {
  localStorage.setItem('token', 'token-de-prueba');
  localStorage.setItem('user', JSON.stringify({ id: 1, name: 'Ana', role: 'ADMIN' }));
  return render(
    <AuthProvider>
      <DataMemoryRouter initialEntries={['/citas/1/editar']}>
        <Routes>
          <Route path="/citas/:id/editar" element={<CitaEditPage />} />
          <Route path="/citas/:id" element={<p>Detalle de la cita</p>} />
        </Routes>
      </DataMemoryRouter>
    </AuthProvider>
  );
}

describe('CitaEditPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    client.get.mockResolvedValue({ data: CITA });
  });

  it('no muestra el formulario vacío mientras carga', async () => {
    renderPage();
    expect(screen.getAllByRole('status').some((s) => s.textContent === 'Cargando la cita…')).toBe(true);
    expect(screen.queryByLabelText('Nombre de la cita')).not.toBeInTheDocument();
    expect(await screen.findByLabelText('Nombre de la cita')).toHaveValue('Picnic');
    expect(screen.getByLabelText('Fecha')).toHaveValue('2026-05-02');
  });

  it('envía los mismos cuatro campos con PATCH y vuelve a la cita', async () => {
    const user = userEvent.setup();
    client.patch.mockResolvedValue({});
    renderPage();
    const nombre = await screen.findByLabelText('Nombre de la cita');

    await user.clear(nombre);
    await user.type(nombre, 'Picnic al atardecer');
    await user.click(screen.getByRole('radio', { name: 'Ñaoñao' }));
    await user.click(screen.getByRole('button', { name: 'Guardar cambios' }));

    expect(client.patch).toHaveBeenCalledWith('/citas/1', {
      nombre: 'Picnic al atardecer',
      fecha: '2026-05-02',
      lugar: 'Parque',
      repetiriamos: 'NO',
    });
    expect(await screen.findByText('Detalle de la cita')).toBeInTheDocument();
  });

  it('el error del servidor se anuncia como alerta', async () => {
    const user = userEvent.setup();
    client.patch.mockRejectedValue({ response: { data: { error: 'Solo un administrador puede editar la cita' } } });
    renderPage();
    await screen.findByLabelText('Nombre de la cita');

    await user.click(screen.getByRole('button', { name: 'Guardar cambios' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Solo un administrador puede editar la cita');
  });

  it('si no carga, lo dice y ofrece volver', async () => {
    client.get.mockRejectedValue(new Error('red'));
    renderPage();
    expect(await screen.findByRole('alert')).toHaveTextContent('No se pudo cargar la cita');
    expect(screen.getByRole('link', { name: 'Volver a la cita' })).toHaveAttribute('href', '/citas/1');
  });

  it('tiene un <h1> y el enlace a la versión personal', async () => {
    renderPage();
    expect(screen.getByRole('heading', { level: 1, name: 'Editar cita' })).toBeInTheDocument();
    expect(await screen.findByRole('link', { name: 'Editar mi versión' })).toHaveAttribute('href', '/citas/1/mi-entrada');
  });
});

describe('CitaEditPage: cambios sin guardar', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    client.get.mockResolvedValue({ data: CITA });
  });

  it('sin cambios, «Cancelar» sale directamente', async () => {
    const user = userEvent.setup();
    renderPage();
    await screen.findByLabelText('Nombre de la cita');
    await user.click(screen.getByRole('link', { name: 'Cancelar' }));
    expect(await screen.findByText('Detalle de la cita')).toBeInTheDocument();
  });

  it('con cambios, salir pide confirmación; «Seguir editando» conserva lo escrito', async () => {
    const user = userEvent.setup();
    renderPage();
    const nombre = await screen.findByLabelText('Nombre de la cita');
    await user.type(nombre, ' al atardecer');

    await user.click(screen.getByRole('link', { name: 'Cancelar' }));
    const dialog = await screen.findByRole('alertdialog', { name: '¿Salir sin guardar?' });
    await user.click(within(dialog).getByRole('button', { name: 'Seguir editando' }));

    await waitFor(() => expect(dialog.open).toBe(false));
    expect(screen.getByLabelText('Nombre de la cita')).toHaveValue('Picnic al atardecer');
    expect(screen.queryByText('Detalle de la cita')).not.toBeInTheDocument();
  });

  it('«Salir sin guardar» continúa la navegación', async () => {
    const user = userEvent.setup();
    renderPage();
    await user.type(await screen.findByLabelText('Lugar'), ' central');

    await user.click(screen.getByRole('link', { name: 'Cancelar' }));
    const dialog = await screen.findByRole('alertdialog', { name: '¿Salir sin guardar?' });
    await user.click(within(dialog).getByRole('button', { name: 'Salir sin guardar' }));

    expect(await screen.findByText('Detalle de la cita')).toBeInTheDocument();
  });

  it('después de guardar no pregunta', async () => {
    const user = userEvent.setup();
    client.patch.mockResolvedValue({});
    renderPage();
    await user.type(await screen.findByLabelText('Lugar'), ' central');

    await user.click(screen.getByRole('button', { name: 'Guardar cambios' }));

    expect(await screen.findByText('Detalle de la cita')).toBeInTheDocument();
    expect(screen.queryByRole('alertdialog', { name: '¿Salir sin guardar?' })).not.toBeInTheDocument();
  });

  it('con cambios, recargar o cerrar la pestaña muestra el aviso del navegador', async () => {
    const user = userEvent.setup();
    renderPage();
    await user.type(await screen.findByLabelText('Lugar'), ' central');

    const event = new Event('beforeunload', { cancelable: true });
    window.dispatchEvent(event);
    expect(event.defaultPrevented).toBe(true);
  });
});
