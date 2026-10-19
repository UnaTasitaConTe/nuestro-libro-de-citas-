import { useId } from 'react';
import useModalDialog from './useModalDialog';

/**
 * Diálogo modal centrado sobre <dialog> nativo (ver useModalDialog).
 * El título es obligatorio: da nombre accesible al diálogo.
 */
export default function Dialog({
  open,
  onClose,
  title,
  role,
  describedBy,
  initialFocusRef,
  className = '',
  children,
}) {
  const titleId = useId();
  const dialog = useModalDialog({ open, onRequestClose: onClose, initialFocusRef });

  return (
    <dialog
      ref={dialog.ref}
      onCancel={dialog.onCancel}
      onClose={dialog.onClose}
      role={role}
      aria-labelledby={titleId}
      aria-describedby={describedBy}
      className="dialog fixed inset-0 m-0 h-full max-h-none w-full max-w-none place-items-center overflow-y-auto overscroll-contain bg-transparent p-4 text-inherit backdrop:bg-transparent open:grid"
    >
      <div
        data-dialog-part
        className="dialog-backdrop fixed inset-0 bg-black/70"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        data-dialog-part
        className={`dialog-panel surface-glass surface-accent relative w-full max-w-md p-6 sm:p-7 ${className}`}
      >
        <h2 id={titleId} className="font-display text-xl font-semibold text-ink-strong">
          {title}
        </h2>
        {children}
      </div>
    </dialog>
  );
}
