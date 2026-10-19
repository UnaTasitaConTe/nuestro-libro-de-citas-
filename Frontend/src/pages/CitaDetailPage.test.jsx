import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { AuthProvider } from '../context/AuthContext';
import client from '../api/client';
import CitaDetailPage from './CitaDetailPage';

vi.mock('../api/client', () => ({
  default: { get: vi.fn(), post: vi.fn(), put: vi.fn(), patch: vi.fn(), delete: vi.fn() },
}));

const PHOTO = { id: 100, foto_url: '/uploads/a.jpg', thumb_url: '/uploads/a_t.jpg' };

function citaWith(photos) {
  return {
    id: 1,
    nombre: 'Cena en la playa',
    fecha: '2026-08-25',
    lugar: 'Playa',
    repetiriamos: 'SI',
    entries: [
      {
        id: 10,
        user_id: 1,
        user_name: 'Ana',
        valoracion: 4,
        que_hicimos: 'Cenamos',
        como_te_sentiste: '',
        lo_que_mas_gusto: '',
        lo_que_menos_gusto: '',
        photos,
      },
    ],
  };
}

function renderPage() {
  localStorage.setItem('token', 'token-de-prueba');
  localStorage.setItem('user', JSON.stringify({ id: 1, name: 'Ana', role: 'ADMIN' }));
  return render(
    <AuthProvider>
      <MemoryRouter initialEntries={['/citas/1']}>
        <Routes>
          <Route path="/citas/:id" element={<CitaDetailPage />} />
          <Route path="/" element={<p>Inicio del álbum</p>} />
        </Routes>
      </MemoryRouter>
    </AuthProvider>
  );
}

// Se busca con el diálogo abierto y se guarda la referencia: una vez cerrado
// queda fuera del árbol accesible y ya no se encuentra por nombre.
function openDialog(name) {
  return screen.getByRole('alertdialog', { name });
}

describe('CitaDetailPage: borrar la cita', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    client.get.mockResolvedValue({ data: citaWith([PHOTO]) });
  });

  it('cancelar no borra y devuelve el foco al botón', async () => {
    const user = userEvent.setup();
    renderPage();
    const trigger = await screen.findByRole('button', { name: 'Borrar cita' });

    await user.click(trigger);
    const dialog = openDialog('¿Borrar esta cita?');
    expect(within(dialog).getByRole('button', { name: 'Cancelar' })).toHaveFocus();
    await user.click(within(dialog).getByRole('button', { name: 'Cancelar' }));

    await waitFor(() => expect(dialog.open).toBe(false));
    expect(client.delete).not.toHaveBeenCalled();
    expect(trigger).toHaveFocus();
  });

  it('Escape también cancela', async () => {
    const user = userEvent.setup();
    renderPage();
    await user.click(await screen.findByRole('button', { name: 'Borrar cita' }));
    const dialog = openDialog('¿Borrar esta cita?');

    act(() => {
      dialog.dispatchEvent(new Event('cancel', { cancelable: true }));
    });

    await waitFor(() => expect(dialog.open).toBe(false));
    expect(client.delete).not.toHaveBeenCalled();
  });

  it('confirmar borra con la misma llamada y vuelve al álbum', async () => {
    const user = userEvent.setup();
    client.delete.mockResolvedValue({});
    renderPage();
    await user.click(await screen.findByRole('button', { name: 'Borrar cita' }));

    await user.click(within(openDialog('¿Borrar esta cita?')).getByRole('button', { name: 'Borrar cita' }));

    expect(client.delete).toHaveBeenCalledWith('/citas/1');
    expect(await screen.findByText('Inicio del álbum')).toBeInTheDocument();
  });

  it('si el servidor rechaza el borrado, cierra el diálogo y anuncia el error', async () => {
    const user = userEvent.setup();
    client.delete.mockRejectedValue({ response: { data: { error: 'Solo un administrador puede borrar citas' } } });
    renderPage();
    await user.click(await screen.findByRole('button', { name: 'Borrar cita' }));
    const dialog = openDialog('¿Borrar esta cita?');

    await user.click(within(dialog).getByRole('button', { name: 'Borrar cita' }));

    await waitFor(() => expect(dialog.open).toBe(false));
    const alerts = screen.getAllByRole('alert');
    expect(alerts.some((a) => a.textContent === 'Solo un administrador puede borrar citas')).toBe(true);
  });
});

describe('CitaDetailPage: borrar una foto', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    client.get.mockResolvedValue({ data: citaWith([PHOTO]) });
  });

  it('cancelar no borra la foto', async () => {
    const user = userEvent.setup();
    renderPage();
    await user.click(await screen.findByRole('button', { name: 'Borrar foto' }));
    const dialog = openDialog('¿Borrar esta foto?');

    await user.click(within(dialog).getByRole('button', { name: 'Cancelar' }));

    await waitFor(() => expect(dialog.open).toBe(false));
    expect(client.delete).not.toHaveBeenCalled();
  });

  it('confirmar borra la foto con la misma llamada que antes', async () => {
    const user = userEvent.setup();
    client.delete.mockResolvedValue({ data: citaWith([]) });
    renderPage();
    await user.click(await screen.findByRole('button', { name: 'Borrar foto' }));
    const dialog = openDialog('¿Borrar esta foto?');

    await user.click(within(dialog).getByRole('button', { name: 'Borrar foto' }));

    expect(client.delete).toHaveBeenCalledWith('/citas/1/fotos/100');
    await waitFor(() => expect(dialog.open).toBe(false));
    expect(screen.getByText('sin foto')).toBeInTheDocument();
    // El botón que abrió el diálogo ya no existe: el foco va al contenido principal.
    expect(screen.getByRole('main')).toHaveFocus();
  });
});

describe('CitaDetailPage: recordatorio a la pareja', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    client.get.mockResolvedValue({ data: citaWith([]) });
  });

  it('anuncia el resultado en una región de estado', async () => {
    const user = userEvent.setup();
    client.post.mockResolvedValue({});
    renderPage();

    await user.click(await screen.findByRole('button', { name: /Recordar a mi pareja/ }));

    expect(client.post).toHaveBeenCalledWith('/citas/1/nudge');
    const status = screen.getAllByRole('status').find((el) => el.textContent.includes('Recordatorio enviado'));
    expect(status).toBeDefined();
  });
});
