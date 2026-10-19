import { useId, useRef, useState } from 'react';
import Dialog from './Dialog';

/**
 * Confirmación accesible que sustituye a window.confirm().
 * - El foco inicial va a "Cancelar": la opción segura ante una acción destructiva.
 * - onConfirm puede ser asíncrona: mientras se resuelve, los botones se
 *   desactivan y Escape no cierra. La página decide cuándo cerrar (open=false).
 */
export default function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel,
  busyLabel,
  cancelLabel = 'Cancelar',
  tone = 'danger',
  onConfirm,
  onCancel,
}) {
  const [busy, setBusy] = useState(false);
  const cancelRef = useRef(null);
  const descriptionId = useId();

  function requestClose() {
    if (!busy) onCancel();
  }

  async function handleConfirm() {
    setBusy(true);
    try {
      await onConfirm();
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog
      open={open}
      onClose={requestClose}
      title={title}
      role="alertdialog"
      describedBy={descriptionId}
      initialFocusRef={cancelRef}
    >
      <p id={descriptionId} className="mt-2 text-sm leading-relaxed text-ink">
        {description}
      </p>
      <div className="form-actions mt-6 justify-end">
        <button
          ref={cancelRef}
          type="button"
          onClick={requestClose}
          disabled={busy}
          className="btn btn-ghost"
        >
          {cancelLabel}
        </button>
        <button
          type="button"
          onClick={handleConfirm}
          disabled={busy}
          aria-busy={busy || undefined}
          className={`btn ${tone === 'danger' ? 'btn-danger' : 'btn-primary'}`}
        >
          {busy ? (busyLabel ?? `${confirmLabel}…`) : confirmLabel}
        </button>
      </div>
    </Dialog>
  );
}
