import { useState } from 'react';
import IconButton from './ui/IconButton';
import Lightbox from './ui/Lightbox';
import StatusMessage from './ui/StatusMessage';

const TILTS = [-4, 3, -2, 4, -3, 2];

/**
 * Carrusel de polaroids. Accesible por teclado con una sola parada para la
 * foto central (botón que la amplía), las flechas y los puntos; ← y → también
 * funcionan con el foco dentro del carrusel. Las fotos laterales son un atajo
 * para ratón y táctil (aria-hidden): su función ya la cubren flechas y puntos.
 */
export default function Carousel({ photos, alt, onDelete, label = 'Fotos' }) {
  const [index, setIndex] = useState(0);
  const [lightbox, setLightbox] = useState(false);

  if (!photos.length) {
    return (
      <div className="mx-auto flex aspect-square max-w-xs items-center justify-center rounded-md border border-ink-dark/25 bg-polaroid p-3">
        <span className="text-sm text-polaroid-ink-soft">sin foto</span>
      </div>
    );
  }

  const n = photos.length;
  // Tras borrar la última foto, index puede quedar fuera de rango.
  const safeIndex = Math.min(index, n - 1);
  const current = photos[safeIndex];

  function go(i) {
    setIndex(((i % n) + n) % n);
  }

  function prev(e) {
    e.stopPropagation();
    go(safeIndex - 1);
  }

  function next(e) {
    e.stopPropagation();
    go(safeIndex + 1);
  }

  function handleKeyDown(e) {
    if (n < 2) return;
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      go(safeIndex - 1);
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      go(safeIndex + 1);
    }
  }

  function thumbSrc(photo) {
    return photo.thumb_url || photo.foto_url;
  }

  const position = `Foto ${safeIndex + 1} de ${n}`;

  return (
    <>
      <div
        role="region"
        aria-roledescription="carrusel"
        aria-label={label}
        onKeyDown={handleKeyDown}
        className="group relative flex h-80 items-center justify-center overflow-hidden sm:h-[26rem]"
      >
        {photos.map((p, i) => {
          let offset = i - safeIndex;
          if (offset > n / 2) offset -= n;
          if (offset < -n / 2) offset += n;
          const abs = Math.abs(offset);
          if (abs > 2) return null;

          const isCenter = offset === 0;
          const scale = isCenter ? 1 : abs === 1 ? 0.78 : 0.6;
          const translate = offset * 62;
          const opacity = isCenter ? 1 : abs === 1 ? 0.5 : 0.25;
          const tilt = isCenter ? 0 : TILTS[Math.abs(i * 2 + (offset > 0 ? 1 : 0)) % TILTS.length];

          const polaroid = (
            <div
              className={`relative rounded-md border border-ink-dark/25 bg-polaroid p-2.5 pb-4 ${
                isCenter ? 'shadow-[0_28px_54px_-16px_rgba(3,6,20,0.9)]' : 'shadow-[0_14px_28px_rgba(3,6,20,0.5)]'
              }`}
            >
              <div className="aspect-square overflow-hidden bg-polaroid-mat">
                <img src={thumbSrc(p)} alt="" loading="lazy" decoding="async" className="h-full w-full object-cover" />
              </div>
              {p.authorName && (
                <p className="mt-2 text-center font-hand text-lg leading-none text-polaroid-ink">{p.authorName}</p>
              )}
            </div>
          );

          // Movimiento en pantalla: ease-in-out y menos de 300 ms (skill animate).
          // Con movimiento reducido la transformación es instantánea (index.css).
          const style = {
            transform: `translateX(${translate}%) scale(${scale}) rotate(${tilt}deg)`,
            opacity,
            zIndex: 10 - abs,
            transition: 'transform 280ms var(--ease-in-out), opacity 280ms var(--ease-in-out)',
          };

          if (!isCenter) {
            return (
              <div
                key={p.id}
                aria-hidden="true"
                onClick={() => go(i)}
                className="absolute w-44 cursor-pointer sm:w-56"
                style={style}
              >
                {polaroid}
              </div>
            );
          }

          return (
            <div key={p.id} className="absolute w-44 sm:w-56" style={style}>
              <button
                type="button"
                onClick={() => setLightbox(true)}
                aria-label={`Ampliar ${position.toLowerCase()}`}
                className="block w-full cursor-zoom-in rounded-md text-left"
              >
                {polaroid}
              </button>
              {onDelete && (
                <IconButton
                  label="Borrar foto"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(p);
                  }}
                  className="absolute -right-3 -top-3 z-10 h-8 w-8 border-danger/40 bg-paper text-sm text-danger hover:border-danger hover:text-danger"
                >
                  ×
                </IconButton>
              )}
            </div>
          );
        })}

        {n > 1 && (
          <>
            {/* Visibles siempre en táctil (no hay hover); con ratón aparecen al pasar o enfocar. */}
            <IconButton
              label="Foto anterior"
              onClick={prev}
              className="absolute left-1 top-1/2 z-20 -translate-y-1/2 bg-paper/85 opacity-0 transition-opacity duration-200 focus-visible:opacity-100 group-hover:opacity-100 group-focus-within:opacity-100 pointer-coarse:opacity-100 sm:left-4"
            >
              ‹
            </IconButton>
            <IconButton
              label="Foto siguiente"
              onClick={next}
              className="absolute right-1 top-1/2 z-20 -translate-y-1/2 bg-paper/85 opacity-0 transition-opacity duration-200 focus-visible:opacity-100 group-hover:opacity-100 group-focus-within:opacity-100 pointer-coarse:opacity-100 sm:right-4"
            >
              ›
            </IconButton>
            <div className="absolute bottom-1 left-1/2 z-20 flex -translate-x-1/2 items-center rounded-full border border-line bg-paper/70 px-1.5">
              {photos.map((p, i) => (
                <button
                  type="button"
                  key={p.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    go(i);
                  }}
                  aria-label={`Ir a foto ${i + 1}`}
                  aria-current={i === safeIndex ? 'true' : undefined}
                  className="group/dot flex h-7 items-center px-1 pointer-coarse:h-9"
                >
                  {/* Punto visual de 6 px dentro de un área pulsable mayor. */}
                  <span
                    aria-hidden="true"
                    className={`block h-1.5 rounded-full transition-[width,background-color] duration-200 ${
                      i === safeIndex ? 'w-5 bg-ink-dark' : 'w-1.5 bg-ink/40 group-hover/dot:bg-ink/70'
                    }`}
                  />
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      {n > 1 && <StatusMessage className="sr-only">{position}</StatusMessage>}

      <Lightbox
        open={lightbox}
        onClose={() => setLightbox(false)}
        src={current.foto_url}
        alt={alt}
        onPrev={n > 1 ? () => go(safeIndex - 1) : undefined}
        onNext={n > 1 ? () => go(safeIndex + 1) : undefined}
        caption={current.authorName && <span className="text-sm text-white/70">{current.authorName}</span>}
      />
    </>
  );
}
