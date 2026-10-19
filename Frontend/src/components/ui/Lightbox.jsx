import { X } from 'lucide-react';
import IconButton from './IconButton';
import useModalDialog from './useModalDialog';

/**
 * Visor de fotos a pantalla completa sobre <dialog> modal (ver useModalDialog).
 * Escape cierra; ← y → recorren las fotos cuando hay onPrev/onNext.
 * Se mantiene montado mientras se cierra para que la foto no desaparezca
 * durante la salida: la página controla `open` aparte de la foto mostrada.
 */
export default function Lightbox({ open, onClose, src, alt, caption, onPrev, onNext, label = 'Visor de fotos' }) {
  const dialog = useModalDialog({ open, onRequestClose: onClose });

  function handleKeyDown(event) {
    if (event.key === 'ArrowLeft' && onPrev) {
      event.preventDefault();
      onPrev();
    }
    if (event.key === 'ArrowRight' && onNext) {
      event.preventDefault();
      onNext();
    }
  }

  return (
    <dialog
      ref={dialog.ref}
      onCancel={dialog.onCancel}
      onClose={dialog.onClose}
      onKeyDown={handleKeyDown}
      aria-label={label}
      className="dialog fixed inset-0 m-0 h-full max-h-none w-full max-w-none bg-transparent p-0 text-inherit backdrop:bg-transparent"
    >
      {/* Sin backdrop-blur para evitar parpadeos en móvil. */}
      <div
        data-dialog-part
        className="dialog-backdrop absolute inset-0 bg-black/95"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Los controles van antes que la foto: el foco inicial cae en «Cerrar». */}
      <IconButton variant="overlay" label="Cerrar" onClick={onClose} className="absolute z-10 right-4 top-[max(1rem,env(safe-area-inset-top))]">
        <X className="h-5 w-5" />
      </IconButton>

      {onPrev && (
        <IconButton variant="overlay" label="Foto anterior" onClick={onPrev} className="absolute z-10 left-3 top-1/2 -translate-y-1/2 text-2xl">
          ‹
        </IconButton>
      )}
      {onNext && (
        <IconButton variant="overlay" label="Foto siguiente" onClick={onNext} className="absolute z-10 right-3 top-1/2 -translate-y-1/2 text-2xl">
          ›
        </IconButton>
      )}

      <div
        data-dialog-part
        className="dialog-panel pointer-events-none absolute inset-0 flex items-center justify-center px-14 py-16"
      >
        <figure className="pointer-events-auto max-h-full max-w-full">
          {src && (
            <img
              src={src}
              alt={alt}
              className="max-h-[80vh] max-w-full rounded-lg object-contain shadow-2xl"
            />
          )}
          {caption && <figcaption className="mt-3 text-center">{caption}</figcaption>}
        </figure>
      </div>
    </dialog>
  );
}
