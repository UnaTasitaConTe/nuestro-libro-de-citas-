import { describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Carousel from './Carousel';

const PHOTOS = [
  { id: 1, foto_url: '/u/1.jpg', thumb_url: '/u/1_t.jpg', authorName: 'Ana' },
  { id: 2, foto_url: '/u/2.jpg', thumb_url: '/u/2_t.jpg', authorName: 'Luis' },
];

describe('Carousel', () => {
  it('abre el visor compartido desde la foto central', async () => {
    const user = userEvent.setup();
    render(<Carousel photos={PHOTOS} alt="Cena" />);
    const center = screen.getByRole('button', { name: 'Ampliar foto 1' });

    await user.click(center);

    const viewer = screen.getByRole('dialog', { name: 'Visor de fotos' });
    expect(viewer.open).toBe(true);
    expect(within(viewer).getByRole('img', { name: 'Cena' })).toHaveAttribute('src', '/u/1.jpg');
    expect(within(viewer).getByText('Ana')).toBeInTheDocument();

    fireEvent.keyDown(viewer, { key: 'ArrowRight' });
    expect(within(viewer).getByRole('img', { name: 'Cena' })).toHaveAttribute('src', '/u/2.jpg');

    act(() => {
      viewer.dispatchEvent(new Event('cancel', { cancelable: true }));
    });
    await waitFor(() => expect(viewer.open).toBe(false));
  });

  it('«Borrar foto» avisa a la página con la foto central (sin borrar por su cuenta)', async () => {
    const user = userEvent.setup();
    const onDelete = vi.fn();
    render(<Carousel photos={PHOTOS} alt="Cena" onDelete={onDelete} />);

    await user.click(screen.getByRole('button', { name: 'Borrar foto' }));

    expect(onDelete).toHaveBeenCalledWith(PHOTOS[0]);
    // El clic no abre el visor (cerrado no tiene nombre accesible: se busca por etiqueta).
    expect(document.querySelector('dialog[aria-label="Visor de fotos"]').open).toBe(false);
  });

  it('no falla si se borra la última foto mientras era la central', () => {
    const { rerender } = render(<Carousel photos={PHOTOS} alt="Cena" />);
    fireEvent.click(screen.getByRole('button', { name: 'Ir a foto 2' }));

    rerender(<Carousel photos={PHOTOS.slice(0, 1)} alt="Cena" />);

    expect(screen.getAllByRole('img', { name: 'Cena', hidden: true }).length).toBeGreaterThan(0);
  });
});
