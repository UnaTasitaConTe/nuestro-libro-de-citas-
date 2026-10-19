import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import HeartRating from '../components/HeartRating';
import ProtectedRoute from '../components/ProtectedRoute';
import { AuthProvider } from '../context/AuthContext';

// Prueba mínima para validar el entorno: jsdom, Testing Library, user-event,
// jest-dom y react-router funcionando juntos.
describe('entorno de pruebas', () => {
  it('HeartRating notifica la valoración elegida', async () => {
    const onChange = vi.fn();
    render(<HeartRating value={0} onChange={onChange} />);

    await userEvent.click(screen.getByRole('button', { name: '3 corazones' }));

    expect(onChange).toHaveBeenCalledWith(3);
  });

  it('ProtectedRoute redirige a /login sin token', () => {
    render(
      <AuthProvider>
        <MemoryRouter initialEntries={['/']}>
          <Routes>
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <p>privado</p>
                </ProtectedRoute>
              }
            />
            <Route path="/login" element={<p>pantalla de login</p>} />
          </Routes>
        </MemoryRouter>
      </AuthProvider>
    );

    expect(screen.getByText('pantalla de login')).toBeInTheDocument();
    expect(screen.queryByText('privado')).not.toBeInTheDocument();
  });
});
