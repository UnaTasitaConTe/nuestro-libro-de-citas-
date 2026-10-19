import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { AuthProvider } from '../context/AuthContext';
import client from '../api/client';
import EntryFormPage from './EntryFormPage';

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
        intimidad: false,
        photos,
      },
    ],
  };
}

function renderPage() {
  localStorage.setItem('token', 'token-de-prueba');
  localStorage.setItem('user', JSON.stringify({ id: 1, name: 'Ana', role: 'USER' }));
  return render(
    <AuthProvider>
      <MemoryRouter initialEntries={['/citas/1/mi-entrada']}>
        <Routes>
          <Route path="/citas/:id/mi-entrada" element={<EntryFormPage />} />
        </Routes>
      </MemoryRouter>
    </AuthProvider>
  );
}

// Se busca con el diálogo abierto y se guarda la referencia: una vez cerrado
// queda fuera del árbol accesible (también su título) y ya no se encuentra por nombre.
function confirmDialog() {
  return screen.getByRole('alertdialog', { name: '¿Borrar esta foto?' });
}

describe('EntryFormPage: borrar una foto existente', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    client.get.mockResolvedValue({ data: citaWith([PHOTO]) });
  });

  it('las etiquetas de los textos están asociadas a sus campos', async () => {
    renderPage();
    expect(await screen.findByLabelText('Qué hicimos')).toHaveValue('Cenamos');
    expect(screen.getByLabelText('Lo que menos me gustó').tagName).toBe('TEXTAREA');
  });

  it('cancelar no borra nada y devuelve el foco al botón', async () => {
    const user = userEvent.setup();
    renderPage();
    const trigger = await screen.findByRole('button', { name: 'Borrar foto' });

    await user.click(trigger);
    const dialog = confirmDialog();
    expect(dialog.open).toBe(true);
    // El foco inicial va a la opción segura.
    expect(within(dialog).getByRole('button', { name: 'Cancelar' })).toHaveFocus();

    await user.click(within(dialog).getByRole('button', { name: 'Cancelar' }));

    await waitFor(() => expect(dialog.open).toBe(false));
    expect(client.delete).not.toHaveBeenCalled();
    expect(trigger).toHaveFocus();
  });

  it('Escape cancela igual que el botón', async () => {
    const user = userEvent.setup();
    renderPage();
    await user.click(await screen.findByRole('button', { name: 'Borrar foto' }));

    const dialog = confirmDialog();
    act(() => {
      dialog.dispatchEvent(new Event('cancel', { cancelable: true }));
    });

    await waitFor(() => expect(dialog.open).toBe(false));
    expect(client.delete).not.toHaveBeenCalled();
  });

  it('confirmar borra la foto con la misma llamada que antes', async () => {
    const user = userEvent.setup();
    client.delete.mockResolvedValue({ data: citaWith([]) });
    renderPage();
    await user.click(await screen.findByRole('button', { name: 'Borrar foto' }));

    const dialog = confirmDialog();
    await user.click(within(dialog).getByRole('button', { name: 'Borrar foto' }));

    expect(client.delete).toHaveBeenCalledWith('/citas/1/fotos/100');
    await waitFor(() => expect(dialog.open).toBe(false));
    expect(screen.queryByRole('button', { name: 'Borrar foto' })).not.toBeInTheDocument();
  });

  it('si el servidor falla, se cierra el diálogo y se muestra el error', async () => {
    const user = userEvent.setup();
    client.delete.mockRejectedValue({ response: { data: { error: 'Foto no encontrada' } } });
    renderPage();
    await user.click(await screen.findByRole('button', { name: 'Borrar foto' }));

    const dialog = confirmDialog();
    await user.click(within(dialog).getByRole('button', { name: 'Borrar foto' }));

    expect(await screen.findByText('Foto no encontrada')).toBeInTheDocument();
    await waitFor(() => expect(dialog.open).toBe(false));
  });
});
