import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { AuthProvider } from '../context/AuthContext';
import client from '../api/client';
import GaleriaPage from './GaleriaPage';

vi.mock('../api/client', () => ({
  default: { get: vi.fn(), post: vi.fn(), put: vi.fn(), patch: vi.fn(), delete: vi.fn() },
}));

const PHOTOS = [
  { id: 1, cita_id: 7, cita_nombre: 'Picnic', cita_fecha: '2026-05-02', foto_url: '/u/1.jpg', thumb_url: '/u/1_t.jpg' },
  { id: 2, cita_id: 8, cita_nombre: 'Museo', cita_fecha: '2026-06-10', foto_url: '/u/2.jpg', thumb_url: '/u/2_t.jpg' },
];

function renderPage() {
  localStorage.setItem('token', 'token-de-prueba');
  localStorage.setItem('user', JSON.stringify({ id: 1, name: 'Ana', role: 'USER' }));
  return render(
    <AuthProvider>
      <MemoryRouter initialEntries={['/galeria']}>
        <Routes>
          <Route path="/galeria" element={<GaleriaPage />} />
        </Routes>
      </MemoryRouter>
    </AuthProvider>
  );
}

describe('GaleriaPage: visor de fotos', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    client.get.mockResolvedValue({ data: { photos: PHOTOS, totalPages: 1, total: 2 } });
  });

  async function openFirst(user) {
    // El nombre de la miniatura combina el alt y el pie («Picnic Picnic 2 de mayo…»).
    const thumbs = await screen.findAllByRole('button', { name: /^Picnic/ });
    await user.click(thumbs[0]);
    return { trigger: thumbs[0], viewer: screen.getByRole('dialog', { name: 'Visor de fotos' }) };
  }

  it('abre un diálogo modal con la foto y el foco en «Cerrar»', async () => {
    const user = userEvent.setup();
    renderPage();
    const { viewer } = await openFirst(user);

    expect(viewer.open).toBe(true);
    expect(within(viewer).getByRole('img', { name: 'Picnic' })).toHaveAttribute('src', '/u/1.jpg');
    expect(within(viewer).getByRole('button', { name: 'Cerrar' })).toHaveFocus();
    expect(within(viewer).getByRole('link', { name: 'Picnic' })).toHaveAttribute('href', '/citas/7');
  });

  it('las flechas del teclado y los botones recorren las fotos', async () => {
    const user = userEvent.setup();
    renderPage();
    const { viewer } = await openFirst(user);

    fireEvent.keyDown(viewer, { key: 'ArrowRight' });
    expect(within(viewer).getByRole('img')).toHaveAttribute('src', '/u/2.jpg');

    await user.click(within(viewer).getByRole('button', { name: 'Foto anterior' }));
    expect(within(viewer).getByRole('img')).toHaveAttribute('src', '/u/1.jpg');

    // Desde la primera, «anterior» da la vuelta a la última (como antes).
    fireEvent.keyDown(viewer, { key: 'ArrowLeft' });
    expect(within(viewer).getByRole('img')).toHaveAttribute('src', '/u/2.jpg');
  });

  it('Escape lo cierra y devuelve el foco a la miniatura', async () => {
    const user = userEvent.setup();
    renderPage();
    const { trigger, viewer } = await openFirst(user);

    act(() => {
      viewer.dispatchEvent(new Event('cancel', { cancelable: true }));
    });

    await waitFor(() => expect(viewer.open).toBe(false));
    expect(trigger).toHaveFocus();
    expect(document.documentElement.style.overflow).toBe('');
  });

  it('el botón «Cerrar» también lo cierra', async () => {
    const user = userEvent.setup();
    renderPage();
    const { viewer } = await openFirst(user);

    await user.click(within(viewer).getByRole('button', { name: 'Cerrar' }));

    await waitFor(() => expect(viewer.open).toBe(false));
  });
});
