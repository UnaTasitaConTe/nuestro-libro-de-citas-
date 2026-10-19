import { StrictMode, useState } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import EntryFields from './EntryFields';

const emptyEntry = {
  valoracion: 0,
  queHicimos: '',
  comoTeSentiste: '',
  loQueMasGusto: '',
  loQueMenosGusto: '',
  intimidad: false,
};

const fileA = new File(['a'], 'a.jpg', { type: 'image/jpeg' });
const fileB = new File(['b'], 'b.jpg', { type: 'image/jpeg' });
const fileC = new File(['c'], 'c.jpg', { type: 'image/jpeg' });

function Harness({ initialFotos = [], valoracionError }) {
  const [entry, setEntry] = useState(emptyEntry);
  const [fotos, setFotos] = useState(initialFotos);
  return (
    <>
      <EntryFields entry={entry} setEntry={setEntry} fotos={fotos} setFotos={setFotos} valoracionError={valoracionError} />
      <button type="button" onClick={() => setFotos([fileC])}>
        reemplazar
      </button>
      <output data-testid="fotos">{fotos.map((f) => f.name).join(',')}</output>
      <output data-testid="entry">{JSON.stringify(entry)}</output>
    </>
  );
}

describe('EntryFields: vistas previas de fotos nuevas', () => {
  // jsdom no implementa URL.createObjectURL: se simula para contar creaciones y liberaciones.
  let created;
  let revoked;
  beforeEach(() => {
    created = [];
    revoked = [];
    URL.createObjectURL = vi.fn((file) => {
      const url = `blob:${file.name}#${created.length}`;
      created.push(url);
      return url;
    });
    URL.revokeObjectURL = vi.fn((url) => revoked.push(url));
  });
  afterEach(() => {
    delete URL.createObjectURL;
    delete URL.revokeObjectURL;
  });

  const live = () => created.filter((u) => !revoked.includes(u));

  it('crea una URL por foto y no las recrea al volver a renderizar', async () => {
    const user = userEvent.setup();
    render(<Harness />);

    await user.upload(screen.getByLabelText('Agregar fotos'), [fileA, fileB]);
    expect(created).toHaveLength(2);

    // Escribir en un texto re-renderiza el formulario: antes se creaba una URL nueva por foto y tecla.
    await user.type(screen.getByLabelText('Qué hicimos'), 'hola');
    expect(created).toHaveLength(2);
    expect(live()).toHaveLength(2);
  });

  it('al quitar una foto libera solo su URL y conserva la de las demás', async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await user.upload(screen.getByLabelText('Agregar fotos'), [fileA, fileB]);
    const [urlA, urlB] = created;

    await user.click(screen.getByRole('button', { name: 'Quitar a.jpg' }));

    expect(screen.getByTestId('fotos')).toHaveTextContent('b.jpg');
    expect(revoked).toEqual([urlA]);
    expect(created).toHaveLength(2); // b.jpg no se recrea aunque cambie de posición
    expect(live()).toEqual([urlB]);
  });

  it('al reemplazar la lista libera las URL anteriores y crea las nuevas', async () => {
    const user = userEvent.setup();
    render(<Harness initialFotos={[fileA, fileB]} />);
    const [urlA, urlB] = created;

    await user.click(screen.getByRole('button', { name: 'reemplazar' }));

    expect(revoked).toEqual(expect.arrayContaining([urlA, urlB]));
    expect(live()).toHaveLength(1);
    expect(live()[0]).toMatch(/^blob:c\.jpg/);
  });

  it('al desmontar libera todas las URL', () => {
    const { unmount } = render(<Harness initialFotos={[fileA, fileB]} />);
    expect(live()).toHaveLength(2);
    unmount();
    expect(live()).toHaveLength(0);
  });

  it('con StrictMode (doble efecto en desarrollo) no quedan URL huérfanas', () => {
    const { unmount } = render(
      <StrictMode>
        <Harness initialFotos={[fileA]} />
      </StrictMode>
    );
    expect(live()).toHaveLength(1);
    unmount();
    expect(live()).toHaveLength(0);
  });
});

describe('EntryFields: accesibilidad', () => {
  beforeEach(() => {
    URL.createObjectURL = vi.fn(() => 'blob:x');
    URL.revokeObjectURL = vi.fn();
  });
  afterEach(() => {
    delete URL.createObjectURL;
    delete URL.revokeObjectURL;
  });

  it('«Agregar fotos» es un campo de archivo alcanzable con teclado', async () => {
    const user = userEvent.setup();
    render(<Harness />);
    const input = screen.getByLabelText('Agregar fotos');
    expect(input).toHaveAttribute('type', 'file');
    expect(input).toHaveAttribute('multiple');
    expect(input).toHaveAttribute('accept', 'image/*');

    await user.tab();
    expect(input).toHaveFocus();
  });

  it('la valoración es un grupo de radio con su etiqueta y su error', async () => {
    const user = userEvent.setup();
    render(<Harness valoracionError="Elige una valoración de al menos 1 corazón." />);
    const group = screen.getByRole('radiogroup', { name: 'Valoración' });
    expect(group).toHaveAttribute('aria-invalid', 'true');
    expect(group).toHaveAccessibleDescription('Elige una valoración de al menos 1 corazón.');

    await user.click(screen.getByRole('radio', { name: '4 corazones' }));
    expect(screen.getByTestId('entry')).toHaveTextContent('"valoracion":4');
  });

  it('«Hubo intimidad» es una casilla con nombre', async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await user.click(screen.getByRole('checkbox', { name: 'Hubo intimidad' }));
    expect(screen.getByTestId('entry')).toHaveTextContent('"intimidad":true');
  });
});
