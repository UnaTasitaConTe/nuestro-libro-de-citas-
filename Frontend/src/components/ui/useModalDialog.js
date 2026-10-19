import { useEffect, useRef } from 'react';

// Respaldo por si no llega transitionend (p. ej. transiciones desactivadas).
const EXIT_FALLBACK_MS = 400;

function restoreFocus(element) {
  // Si el disparador ya no existe (p. ej. se borró la foto que lo contenía),
  // el foco vuelve al contenido principal en lugar de perderse en <body>.
  const target = element?.isConnected ? element : document.getElementById('contenido');
  target?.focus?.();
}

/**
 * Ciclo de vida de un <dialog> modal nativo con animación de entrada y salida.
 *
 * - Abre con showModal(): el resto de la página queda inerte y el foco atrapado.
 * - Escape (`cancel`) pide el cierre a través de onRequestClose, para animar la salida.
 * - La animación se controla con `data-state` ("open" / "closing") en el <dialog>;
 *   el cierre real espera al transitionend de un elemento con [data-dialog-part].
 * - Al cerrar devuelve el foco a returnFocusRef o al elemento enfocado al abrir.
 * - Bloquea el scroll del documento mientras está abierto.
 *
 * Devuelve las props que hay que pasar al <dialog>.
 */
export default function useModalDialog({ open, onRequestClose, returnFocusRef, initialFocusRef }) {
  const dialogRef = useRef(null);
  const openerRef = useRef(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return undefined;

    if (open) {
      if (!dialog.open) {
        openerRef.current = document.activeElement;
        dialog.showModal();
        initialFocusRef?.current?.focus();
      }
      // Un frame con el estado cerrado para que la entrada tenga desde dónde animar.
      const frame = requestAnimationFrame(() => {
        dialog.dataset.state = 'open';
      });
      return () => cancelAnimationFrame(frame);
    }

    if (!dialog.open) {
      delete dialog.dataset.state;
      return undefined;
    }

    dialog.dataset.state = 'closing';
    let finished = false;
    function finish() {
      if (finished) return;
      finished = true;
      dialog.close();
      delete dialog.dataset.state;
      restoreFocus(returnFocusRef?.current ?? openerRef.current);
    }
    function onTransitionEnd(event) {
      if (event.target.hasAttribute('data-dialog-part')) finish();
    }
    dialog.addEventListener('transitionend', onTransitionEnd);
    const fallback = setTimeout(finish, EXIT_FALLBACK_MS);
    return () => {
      dialog.removeEventListener('transitionend', onTransitionEnd);
      clearTimeout(fallback);
    };
  }, [open, returnFocusRef, initialFocusRef]);

  useEffect(() => {
    if (!open) return undefined;
    const root = document.documentElement;
    const previous = root.style.overflow;
    root.style.overflow = 'hidden';
    return () => {
      root.style.overflow = previous;
    };
  }, [open]);

  return {
    ref: dialogRef,
    onCancel(event) {
      // Escape: en lugar del cierre instantáneo del navegador, se anima la salida.
      event.preventDefault();
      onRequestClose();
    },
    onClose() {
      // Si el navegador cerró el diálogo por su cuenta (sin pasar por la salida
      // animada, que antes cambia data-state), se sincroniza el estado.
      if (dialogRef.current?.dataset.state === 'open') onRequestClose();
    },
  };
}
