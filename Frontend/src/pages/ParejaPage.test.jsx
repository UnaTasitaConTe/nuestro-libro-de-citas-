import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { AuthProvider } from '../context/AuthContext';
import client from '../api/client';
import ParejaPage from './ParejaPage';

vi.mock('../api/client', () => ({
  default: { get: vi.fn(), post: vi.fn(), put: vi.fn(), patch: vi.fn(), delete: vi.fn() },
}));

function renderPage() {
  localStorage.setItem('token', 'token-de-prueba');
  localStorage.setItem('user', JSON.stringify({ id: 1, name: 'Ana', role: 'USER' }));
  return render(
    <AuthProvider>
      <MemoryRouter>
        <ParejaPage />
      </MemoryRouter>
    </AuthProvider>
  );
}

describe('ParejaPage: mensajes anunciados', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    client.get.mockResolvedValue({ data: { inviteCode: 'ABC123', members: [{ id: 1, name: 'Ana' }] } });
  });

  it('anuncia que el link se copió', async () => {
    const user = userEvent.setup();
    const writeText = vi.spyOn(navigator.clipboard, 'writeText').mockResolvedValue();
    renderPage();

    await user.click(await screen.findByRole('button', { name: 'Copiar' }));

    expect(writeText).toHaveBeenCalledWith(expect.stringContaining('/register?invite=ABC123'));
    const status = screen.getAllByRole('status').find((el) => el.textContent);
    expect(status).toHaveTextContent('Link de invitación copiado al portapapeles');
  });

  it('el error al unirse se anuncia como alerta', async () => {
    const user = userEvent.setup();
    client.post.mockRejectedValue({ response: { data: { error: 'Código de invitación inválido' } } });
    renderPage();

    await user.type(await screen.findByLabelText('Código de invitación'), 'XYZ');
    await user.click(screen.getByRole('button', { name: 'Unirme' }));

    expect(client.post).toHaveBeenCalledWith('/pareja/unirme', { inviteCode: 'XYZ' });
    expect(await screen.findByRole('alert')).toHaveTextContent('Código de invitación inválido');
  });
});

describe('ParejaPage: copiar sin portapapeles (HTTP en la red local)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    client.get.mockResolvedValue({ data: { inviteCode: 'ABC123', members: [{ id: 1, name: 'Ana' }] } });
  });

  it('si el portapapeles no está disponible, selecciona el link y lo explica', async () => {
    const user = userEvent.setup();
    vi.spyOn(navigator.clipboard, 'writeText').mockRejectedValue(new TypeError('clipboard no disponible'));
    renderPage();

    await user.click(await screen.findByRole('button', { name: 'Copiar' }));

    const link = screen.getByLabelText('Link de invitación');
    expect(link).toHaveFocus();
    expect(link.selectionStart).toBe(0);
    expect(link.selectionEnd).toBe(link.value.length);
    const status = screen.getAllByRole('status').find((s) => s.textContent);
    expect(status).toHaveTextContent('No se pudo copiar automáticamente. El link está seleccionado');
  });

  it('las secciones tienen títulos en lugar de etiquetas en mayúsculas', async () => {
    renderPage();
    expect(await screen.findByRole('heading', { level: 1, name: 'Invitar a mi pareja' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: 'Quiénes están en este libro' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: '¿Ya tienes cuenta?' })).toBeInTheDocument();
  });
});
