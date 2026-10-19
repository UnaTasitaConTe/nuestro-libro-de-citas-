import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { AuthProvider } from '../context/AuthContext';
import client from '../api/client';
import LoginPage from './LoginPage';
import RegisterPage from './RegisterPage';

vi.mock('../api/client', () => ({
  default: { get: vi.fn(), post: vi.fn(), put: vi.fn(), patch: vi.fn(), delete: vi.fn() },
}));

function renderAt(path) {
  return render(
    <AuthProvider>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/" element={<p>Álbum</p>} />
        </Routes>
      </MemoryRouter>
    </AuthProvider>
  );
}

describe('LoginPage', () => {
  beforeEach(() => vi.clearAllMocks());

  it('inicia sesión con la misma petición, guarda la sesión y abre el álbum', async () => {
    const user = userEvent.setup();
    client.post.mockResolvedValue({ data: { token: 'tok', user: { id: 1, name: 'Ana' } } });
    renderAt('/login');

    expect(screen.getByRole('main')).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Nuestro Libro de Citas');
    await user.type(screen.getByLabelText('Email'), 'ana@ejemplo.com');
    await user.type(screen.getByLabelText('Contraseña'), 'secreta1');
    await user.click(screen.getByRole('button', { name: 'Entrar' }));

    expect(client.post).toHaveBeenCalledWith('/auth/login', { email: 'ana@ejemplo.com', password: 'secreta1' });
    expect(await screen.findByText('Álbum')).toBeInTheDocument();
    expect(localStorage.getItem('token')).toBe('tok');
  });

  it('el error de credenciales se anuncia como alerta', async () => {
    const user = userEvent.setup();
    client.post.mockRejectedValue({ response: { data: { error: 'Credenciales inválidas' } } });
    renderAt('/login');

    await user.type(screen.getByLabelText('Email'), 'ana@ejemplo.com');
    await user.type(screen.getByLabelText('Contraseña'), 'mala');
    await user.click(screen.getByRole('button', { name: 'Entrar' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Credenciales inválidas');
  });

  it('permite mostrar y ocultar la contraseña', async () => {
    const user = userEvent.setup();
    renderAt('/login');
    const password = screen.getByLabelText('Contraseña');
    expect(password).toHaveAttribute('type', 'password');

    await user.click(screen.getByRole('button', { name: 'Mostrar contraseña' }));
    expect(password).toHaveAttribute('type', 'text');
    expect(screen.getByRole('button', { name: 'Ocultar contraseña' })).toHaveAttribute('aria-pressed', 'true');
  });

  it('el email no se autocorrige ni se capitaliza', () => {
    renderAt('/login');
    const email = screen.getByLabelText('Email');
    expect(email).toHaveAttribute('autocomplete', 'email');
    expect(email).toHaveAttribute('autocapitalize', 'none');
    expect(email).toHaveAttribute('spellcheck', 'false');
  });
});

describe('RegisterPage', () => {
  beforeEach(() => vi.clearAllMocks());

  it('registra con la misma petición, incluido el código de invitación de la URL', async () => {
    const user = userEvent.setup();
    client.post.mockResolvedValue({ data: { token: 'tok', user: { id: 2, name: 'Luis' } } });
    renderAt('/register?invite=ABC123');

    expect(screen.getByText('Te estás uniendo con una invitación de tu pareja.')).toBeInTheDocument();
    await user.type(screen.getByLabelText('Nombre'), 'Luis');
    await user.type(screen.getByLabelText('Email'), 'luis@ejemplo.com');
    await user.type(screen.getByLabelText('Contraseña'), 'secreta1');
    await user.click(screen.getByRole('button', { name: 'Crear cuenta' }));

    expect(client.post).toHaveBeenCalledWith('/auth/register', {
      email: 'luis@ejemplo.com',
      password: 'secreta1',
      name: 'Luis',
      inviteCode: 'ABC123',
    });
    expect(await screen.findByText('Álbum')).toBeInTheDocument();
  });

  it('el mínimo de la contraseña es una ayuda visible y asociada, no solo un placeholder', () => {
    renderAt('/register');
    const password = screen.getByLabelText('Contraseña');
    expect(password).toHaveAccessibleDescription('Mínimo 6 caracteres.');
    expect(password).toHaveAttribute('minlength', '6');
    expect(password).not.toHaveAttribute('placeholder');
  });
});
