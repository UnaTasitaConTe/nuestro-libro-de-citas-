import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { AuthProvider } from '../context/AuthContext';
import client from '../api/client';
import BacklogPage from './BacklogPage';

vi.mock('../api/client', () => ({
  default: { get: vi.fn(), post: vi.fn(), put: vi.fn(), patch: vi.fn(), delete: vi.fn() },
}));

// WebSocket falso: la página se suscribe a cambios en tiempo real, sin red en las pruebas.
class FakeWebSocket {
  constructor(url) {
    this.url = url;
    FakeWebSocket.instances.push(this);
  }
  close() {}
}
FakeWebSocket.instances = [];

const IDEAS = [
  { id: 1, titulo: 'Ir al cine', descripcion: 'Estreno', estado: 'POR_HACER', orden: 0 },
  { id: 2, titulo: 'Picnic', descripcion: '', estado: 'HECHA', orden: 0 },
];

function renderPage() {
  localStorage.setItem('token', 'token-de-prueba');
  localStorage.setItem('user', JSON.stringify({ id: 1, name: 'Ana', role: 'USER' }));
  return render(
    <AuthProvider>
      <MemoryRouter>
        <BacklogPage />
      </MemoryRouter>
    </AuthProvider>
  );
}

function column(name) {
  return screen.getByRole('region', { name });
}

describe('BacklogPage', () => {
  const RealWebSocket = globalThis.WebSocket;
  beforeEach(() => {
    vi.clearAllMocks();
    globalThis.WebSocket = FakeWebSocket;
    client.get.mockResolvedValue({ data: IDEAS });
  });
  afterEach(() => {
    globalThis.WebSocket = RealWebSocket;
  });

  it('muestra las columnas con su título y número de ideas', async () => {
    renderPage();
    const porHacer = await screen.findByRole('region', { name: 'Por hacer' });
    expect(within(porHacer).getByRole('heading', { level: 2, name: 'Por hacer' })).toBeInTheDocument();
    expect(within(porHacer).getByText('1', { selector: '.chip' })).toHaveTextContent('1 idea');
    expect(within(porHacer).getAllByRole('listitem')).toHaveLength(1);
    expect(within(column('Haciendo')).getByText('Sin ideas todavía.')).toBeInTheDocument();
  });

  it('el arrastre por teclado tiene instrucciones en español', async () => {
    renderPage();
    const handle = await screen.findByRole('button', { name: 'Mover «Ir al cine» (arrastrar)' });
    expect(handle).toHaveAttribute('aria-roledescription', 'sortable');
    // dnd-kit monta las instrucciones con un portal un render después.
    await waitFor(() => expect(handle).toHaveAccessibleDescription(/Para mover una idea, pulsa Espacio/));
  });

  it('crea una idea con la misma petición y lo anuncia', async () => {
    const user = userEvent.setup();
    client.post.mockResolvedValue({ data: { id: 3, titulo: 'Karaoke', descripcion: '', estado: 'POR_HACER', orden: 1 } });
    renderPage();

    await user.type(await screen.findByLabelText('Nueva idea de cita'), 'Karaoke');
    await user.click(screen.getByRole('button', { name: 'Agregar idea' }));

    expect(client.post).toHaveBeenCalledWith('/ideas-citas', { titulo: 'Karaoke' });
    expect(await within(column('Por hacer')).findByText('Karaoke')).toBeInTheDocument();
    expect(screen.getAllByRole('status').some((s) => s.textContent === 'Idea «Karaoke» agregada a Por hacer.')).toBe(true);
  });

  it('si crear falla, el texto vuelve al campo y se anuncia el error', async () => {
    const user = userEvent.setup();
    client.post.mockRejectedValue({ response: { data: { error: 'Título demasiado largo' } } });
    renderPage();
    const input = await screen.findByLabelText('Nueva idea de cita');

    await user.type(input, 'Karaoke');
    await user.click(screen.getByRole('button', { name: 'Agregar idea' }));

    expect(await screen.findByText('Título demasiado largo')).toBeInTheDocument();
    expect(screen.getByText('Título demasiado largo').closest('[role="alert"]')).not.toBeNull();
    expect(input).toHaveValue('Karaoke');
  });

  it('editar: pasar del título a la descripción no cierra el editor; al salir se guarda', async () => {
    const user = userEvent.setup();
    client.patch.mockImplementation((url, data) => Promise.resolve({ data: { ...IDEAS[0], ...data } }));
    renderPage();

    await user.click(await screen.findByRole('button', { name: 'Editar «Ir al cine»' }));
    const titulo = screen.getByLabelText('Título de la idea');
    expect(titulo).toHaveFocus();

    await user.tab();
    const descripcion = screen.getByLabelText('Descripción de la idea (opcional)');
    expect(descripcion).toHaveFocus();
    expect(client.patch).not.toHaveBeenCalled();

    await user.clear(descripcion);
    await user.type(descripcion, 'Estreno de la noche');
    await user.tab(); // sale del editor

    expect(client.patch).toHaveBeenCalledWith('/ideas-citas/1', { titulo: 'Ir al cine', descripcion: 'Estreno de la noche' });
  });

  it('Escape cancela la edición sin guardar y devuelve el foco', async () => {
    const user = userEvent.setup();
    renderPage();
    await user.click(await screen.findByRole('button', { name: 'Editar «Ir al cine»' }));

    await user.type(screen.getByLabelText('Título de la idea'), ' 2');
    await user.keyboard('{Escape}');

    expect(client.patch).not.toHaveBeenCalled();
    await waitFor(() => expect(screen.getByRole('button', { name: 'Editar «Ir al cine»' })).toHaveFocus());
  });

  it('«Mover a» envía la misma petición que el arrastre y conserva el foco', async () => {
    const user = userEvent.setup();
    client.patch.mockResolvedValue({ data: [] });
    renderPage();

    await user.selectOptions(await screen.findByLabelText('Mover «Ir al cine» a'), 'HECHA');

    expect(client.patch).toHaveBeenCalledWith('/ideas-citas/1/mover', { estado: 'HECHA', orderedIds: [2, 1] });
    expect(within(column('Hecha')).getAllByRole('listitem')).toHaveLength(2);
    await waitFor(() => expect(screen.getByLabelText('Mover «Ir al cine» a')).toHaveFocus());
    expect(screen.getAllByRole('status').some((s) => s.textContent === '«Ir al cine» movida a Hecha.')).toBe(true);
  });

  it('borrar: misma petición; si falla, se anuncia y se recupera la lista', async () => {
    const user = userEvent.setup();
    client.delete.mockRejectedValue(new Error('red'));
    renderPage();

    await user.click(await screen.findByRole('button', { name: 'Borrar «Picnic»' }));
    const dialog = screen.getByRole('alertdialog', { name: '¿Borrar esta idea?' });
    await user.click(within(dialog).getByRole('button', { name: 'Borrar idea' }));

    expect(client.delete).toHaveBeenCalledWith('/ideas-citas/2');
    expect((await screen.findByText('No se pudo borrar «Picnic».')).closest('[role="alert"]')).not.toBeNull();
    expect(await within(column('Hecha')).findByText('Picnic')).toBeInTheDocument();
  });

  it('si no cargan las ideas, permite reintentar', async () => {
    const user = userEvent.setup();
    client.get.mockRejectedValueOnce(new Error('red')).mockResolvedValueOnce({ data: IDEAS });
    renderPage();

    const alert = (await screen.findByText(/No se pudieron cargar las ideas/)).closest('[role="alert"]');
    await user.click(within(alert).getByRole('button', { name: 'vuelve a intentarlo' }));

    expect(await screen.findByRole('region', { name: 'Por hacer' })).toBeInTheDocument();
  });

  it('la descripción de una idea se lee como descripción del botón de edición', async () => {
    renderPage();
    const editar = await screen.findByRole('button', { name: 'Editar «Ir al cine»' });
    expect(editar).toHaveAccessibleDescription('Estreno');
  });

  it('borrar pide confirmación: cancelar no borra nada', async () => {
    const user = userEvent.setup();
    renderPage();

    await user.click(await screen.findByRole('button', { name: 'Borrar «Picnic»' }));
    const dialog = screen.getByRole('alertdialog', { name: '¿Borrar esta idea?' });
    expect(dialog).toHaveAccessibleDescription('Se borrará «Picnic» del backlog. No se puede deshacer.');
    await user.click(within(dialog).getByRole('button', { name: 'Cancelar' }));

    await waitFor(() => expect(dialog.open).toBe(false));
    expect(client.delete).not.toHaveBeenCalled();
    expect(within(column('Hecha')).getByText('Picnic')).toBeInTheDocument();
  });
});
