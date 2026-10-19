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
