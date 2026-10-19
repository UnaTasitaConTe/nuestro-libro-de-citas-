import { describe, expect, it, vi } from 'vitest';
import { act, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import Field from './Field';
import IconButton from './IconButton';
import StatusMessage from './StatusMessage';
import ConfirmDialog from './ConfirmDialog';

describe('Field', () => {
  it('asocia etiqueta, ayuda y error al control', () => {
    render(
      <Field label="Lugar" hint="Dónde fue la cita" error="Escribe un lugar">
        {(field) => <input {...field} />}
      </Field>
    );
    const input = screen.getByLabelText('Lugar');
    expect(input).toHaveAccessibleDescription('Dónde fue la cita Escribe un lugar');
    expect(input).toHaveAttribute('aria-invalid', 'true');
  });

  it('sin error no marca el campo como inválido', () => {
    render(<Field label="Lugar">{(field) => <input {...field} />}</Field>);
    const input = screen.getByLabelText('Lugar');
    expect(input).not.toHaveAttribute('aria-invalid');
    expect(input).not.toHaveAttribute('aria-describedby');
  });

  it('conserva la clase de etiqueta por defecto (.field-label)', () => {
    render(<Field label="Lugar">{(field) => <input {...field} />}</Field>);
    expect(screen.getByText('Lugar')).toHaveClass('field-label');
  });
});

describe('IconButton', () => {
  it('usa label como nombre accesible y no envía formularios', () => {
    render(
      <IconButton label="Cerrar">
        <span aria-hidden="true">×</span>
      </IconButton>
    );
    const button = screen.getByRole('button', { name: 'Cerrar' });
    expect(button).toHaveAttribute('type', 'button');
    expect(button).toHaveClass('icon-btn');
  });
});

describe('StatusMessage', () => {
  it('mantiene la región viva aunque esté vacía y anuncia el contenido nuevo', () => {
    const { rerender } = render(<StatusMessage className="alert" />);
    const region = screen.getByRole('status');
    expect(region).toBeEmptyDOMElement();

    rerender(<StatusMessage className="alert">Link copiado</StatusMessage>);
    expect(screen.getByRole('status')).toBe(region);
    expect(region).toHaveTextContent('Link copiado');
    expect(region.firstChild).toHaveClass('alert');
  });

  it('los errores usan role="alert"', () => {
    render(<StatusMessage tone="error">No se pudo guardar</StatusMessage>);
    expect(screen.getByRole('alert')).toHaveTextContent('No se pudo guardar');
  });
});

function ConfirmDemo({ onConfirm }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" onClick={() => setOpen(true)}>Borrar</button>
      <ConfirmDialog
        open={open}
        title="¿Borrar?"
        description="No se puede deshacer."
        confirmLabel="Borrar ya"
        busyLabel="Borrando…"
        onConfirm={async () => {
          await onConfirm();
          setOpen(false);
        }}
        onCancel={() => setOpen(false)}
      />
    </>
  );
}

describe('ConfirmDialog', () => {
  it('mientras confirma, desactiva los botones e ignora Escape', async () => {
    const user = userEvent.setup();
    let resolve;
    const onConfirm = vi.fn(() => new Promise((r) => { resolve = r; }));
    render(<ConfirmDemo onConfirm={onConfirm} />);

    await user.click(screen.getByRole('button', { name: 'Borrar' }));
    const dialog = screen.getByRole('alertdialog', { name: '¿Borrar?' });
    expect(dialog).toHaveAccessibleDescription('No se puede deshacer.');

    await user.click(within(dialog).getByRole('button', { name: 'Borrar ya' }));
    expect(within(dialog).getByRole('button', { name: 'Borrando…' })).toBeDisabled();
    expect(within(dialog).getByRole('button', { name: 'Cancelar' })).toBeDisabled();

    act(() => {
      dialog.dispatchEvent(new Event('cancel', { cancelable: true }));
    });
    expect(dialog.open).toBe(true);

    await act(async () => resolve());
    await waitFor(() => expect(dialog.open).toBe(false));
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });
});
