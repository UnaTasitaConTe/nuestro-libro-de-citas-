import { describe, expect, it } from 'vitest';
import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { AuthProvider } from '../context/AuthContext';
import Layout from './Layout';

function renderLayout(path = '/') {
  localStorage.setItem('token', 'token-de-prueba');
  localStorage.setItem('user', JSON.stringify({ id: 1, name: 'Ana', role: 'USER' }));
  return render(
    <AuthProvider>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route path="*" element={<Layout><h1>Contenido de la página</h1></Layout>} />
        </Routes>
      </MemoryRouter>
    </AuthProvider>
  );
}

function getDrawer() {
  return document.getElementById('menu-movil');
}

describe('Layout: enlace para saltar al contenido', () => {
  it('es el primer elemento enfocable y mueve el foco a <main>', async () => {
    const user = userEvent.setup();
    renderLayout();

    await user.tab();
    const skip = screen.getByRole('link', { name: 'Saltar al contenido' });
    expect(skip).toHaveFocus();

    await user.click(skip);
    expect(screen.getByRole('main')).toHaveFocus();
  });

  it('no cambia la URL al usarse', async () => {
    const user = userEvent.setup();
    renderLayout('/calendario');
    await user.click(screen.getByRole('link', { name: 'Saltar al contenido' }));
    // La ruta activa sigue siendo la misma (no hay navegación a #contenido).
    expect(screen.getAllByRole('link', { name: 'Calendario' })[0]).toHaveAttribute('aria-current', 'page');
  });
});

describe('Sidebar: navegación', () => {
  it('marca la ruta activa con aria-current', () => {
    renderLayout('/galeria');
    const nav = screen.getAllByRole('navigation', { name: 'Principal' })[0];
    expect(within(nav).getByRole('link', { name: 'Galería' })).toHaveAttribute('aria-current', 'page');
    expect(within(nav).getByRole('link', { name: 'Calendario' })).not.toHaveAttribute('aria-current');
  });
});

describe('Sidebar: drawer móvil', () => {
  it('se abre como diálogo y enfoca dentro del menú', async () => {
    const user = userEvent.setup();
    renderLayout();
    const trigger = screen.getByRole('button', { name: 'Abrir menú' });
    expect(trigger).toHaveAttribute('aria-expanded', 'false');

    await user.click(trigger);

    expect(getDrawer().open).toBe(true);
    expect(trigger).toHaveAttribute('aria-expanded', 'true');
    await waitFor(() => expect(getDrawer().dataset.state).toBe('open'));
  });

  it('Escape lo cierra (con salida animada) y devuelve el foco al disparador', async () => {
    const user = userEvent.setup();
    renderLayout();
    const trigger = screen.getByRole('button', { name: 'Abrir menú' });
    await user.click(trigger);
    await waitFor(() => expect(getDrawer().dataset.state).toBe('open'));

    // Escape en un <dialog> modal dispara `cancel`.
    const cancel = new Event('cancel', { cancelable: true });
    act(() => {
      getDrawer().dispatchEvent(cancel);
    });
    expect(cancel.defaultPrevented).toBe(true);
    expect(getDrawer().dataset.state).toBe('closing');

    // jsdom no emite transitionend: se cierra por el tiempo de respaldo.
    await waitFor(() => expect(getDrawer().open).toBe(false));
    expect(trigger).toHaveFocus();
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
  });

  it('se cierra al terminar la transición sin esperar el respaldo', async () => {
    const user = userEvent.setup();
    renderLayout();
    const trigger = screen.getByRole('button', { name: 'Abrir menú' });
    await user.click(trigger);
    await waitFor(() => expect(getDrawer().dataset.state).toBe('open'));

    await user.click(within(getDrawer()).getByRole('button', { name: 'Cerrar menú' }));
    const panel = getDrawer().querySelector('.drawer-panel');
    fireEvent.transitionEnd(panel);

    expect(getDrawer().open).toBe(false);
    expect(trigger).toHaveFocus();
  });

  it('elegir una sección cierra el menú', async () => {
    const user = userEvent.setup();
    renderLayout();
    await user.click(screen.getByRole('button', { name: 'Abrir menú' }));
    await waitFor(() => expect(getDrawer().dataset.state).toBe('open'));

    await user.click(within(getDrawer()).getByRole('link', { name: 'Backlog' }));

    await waitFor(() => expect(getDrawer().open).toBe(false));
    expect(
      within(getDrawer()).getByRole('link', { name: 'Backlog', hidden: true })
    ).toHaveAttribute('aria-current', 'page');
  });

  it('bloquea el scroll del documento solo mientras está abierto', async () => {
    const user = userEvent.setup();
    renderLayout();
    await user.click(screen.getByRole('button', { name: 'Abrir menú' }));
    expect(document.documentElement.style.overflow).toBe('hidden');

    await user.click(within(getDrawer()).getByRole('button', { name: 'Cerrar menú' }));
    expect(document.documentElement.style.overflow).toBe('');
  });
});
