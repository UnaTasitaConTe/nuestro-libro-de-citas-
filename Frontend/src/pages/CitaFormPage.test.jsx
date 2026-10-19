import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { AuthProvider } from '../context/AuthContext';
import client from '../api/client';
import CitaFormPage from './CitaFormPage';

vi.mock('../api/client', () => ({
  default: { get: vi.fn(), post: vi.fn(), put: vi.fn(), patch: vi.fn(), delete: vi.fn() },
}));

function renderPage() {
  localStorage.setItem('token', 'token-de-prueba');
  localStorage.setItem('user', JSON.stringify({ id: 1, name: 'Ana', role: 'USER' }));
  return render(
    <AuthProvider>
      <MemoryRouter initialEntries={['/citas/nueva']}>
        <Routes>
          <Route path="/citas/nueva" element={<CitaFormPage />} />
          <Route path="/citas/:id" element={<p>Detalle de la cita</p>} />
        </Routes>
      </MemoryRouter>
    </AuthProvider>
  );
}

async function fillShared(user) {
  await user.type(screen.getByLabelText('Nombre de la cita'), 'Picnic');
  await user.type(screen.getByLabelText('Fecha'), '2026-05-02');
  await user.type(screen.getByLabelText('Lugar'), 'Parque');
  await user.click(screen.getByRole('radio', { name: 'Tal vez…' }));
}

describe('CitaFormPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    URL.createObjectURL = vi.fn(() => 'blob:x');
    URL.revokeObjectURL = vi.fn();
  });

  it('envía exactamente los mismos campos que antes y abre la cita creada', async () => {
    const user = userEvent.setup();
    client.post.mockResolvedValue({ data: { id: 42 } });
    renderPage();

    await fillShared(user);
    await user.click(screen.getByRole('radio', { name: '4 corazones' }));
    await user.type(screen.getByLabelText('Qué hicimos'), 'Comimos');
    await user.click(screen.getByRole('checkbox', { name: 'Hubo intimidad' }));
    await user.upload(screen.getByLabelText('Agregar fotos'), new File(['x'], 'p.jpg', { type: 'image/jpeg' }));
    await user.click(screen.getByRole('button', { name: 'Guardar cita' }));

    expect(client.post).toHaveBeenCalledWith('/citas', expect.any(FormData));
    const body = client.post.mock.calls[0][1];
    expect([...body.keys()]).toEqual([
      'nombre', 'fecha', 'lugar', 'repetiriamos', 'valoracion', 'queHicimos',
      'comoTeSentiste', 'loQueMasGusto', 'loQueMenosGusto', 'intimidad', 'fotos',
    ]);
    expect(Object.fromEntries([...body.entries()].filter(([k]) => k !== 'fotos'))).toEqual({
      nombre: 'Picnic',
      fecha: '2026-05-02',
      lugar: 'Parque',
      repetiriamos: 'TALVEZ',
      valoracion: '4',
      queHicimos: 'Comimos',
      comoTeSentiste: '',
      loQueMasGusto: '',
      loQueMenosGusto: '',
      intimidad: 'true',
    });
    expect(body.getAll('fotos')[0].name).toBe('p.jpg');
    expect(await screen.findByText('Detalle de la cita')).toBeInTheDocument();
  });

  it('sin valoración no envía: marca el error junto al campo y lleva el foco allí', async () => {
    const user = userEvent.setup();
    renderPage();
    await fillShared(user);

    await user.click(screen.getByRole('button', { name: 'Guardar cita' }));

    expect(client.post).not.toHaveBeenCalled();
    const group = screen.getByRole('radiogroup', { name: 'Valoración' });
    expect(group).toHaveAccessibleDescription('Elige una valoración de al menos 1 corazón.');
    expect(screen.getByRole('radio', { name: '1 corazón' })).toHaveFocus();

    await user.keyboard('{ArrowRight}');
    expect(group).not.toHaveAttribute('aria-invalid');
  });

  it('el error del servidor se anuncia como alerta', async () => {
    const user = userEvent.setup();
    client.post.mockRejectedValue({ response: { data: { error: 'Fecha inválida' } } });
    renderPage();
    await fillShared(user);
    await user.click(screen.getByRole('radio', { name: '3 corazones' }));

    await user.click(screen.getByRole('button', { name: 'Guardar cita' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Fecha inválida');
  });

  it('tiene un <h1> y etiquetas asociadas', () => {
    renderPage();
    expect(screen.getByRole('heading', { level: 1, name: 'Nueva cita' })).toBeInTheDocument();
    expect(screen.getByRole('group', { name: '¿Repetiríamos?' })).toBeInTheDocument();
    expect(screen.getByLabelText('Nombre de la cita')).toBeRequired();
  });
});
