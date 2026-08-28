import { useEffect, useState } from 'react';
import { X } from 'lucide-react';

const TILTS = [-4, 3, -2, 4, -3, 2];

export default function Carousel({ photos, alt, onDelete }) {
  const [index, setIndex] = useState(0);
  const [lightbox, setLightbox] = useState(false);

  // Bloquear scroll del body cuando el lightbox está abierto
  useEffect(() => {
    if (lightbox) {
      document.body.style.overflow = 'hidden';
      return () => { document.body.style.overflow = ''; };
    }
  }, [lightbox]);

  // Keyboard nav en lightbox
  useEffect(() => {
    if (!lightbox) return;
    function onKey(e) {
      if (e.key === 'Escape') setLightbox(false);
      if (e.key === 'ArrowLeft') setIndex((i) => (((i - 1) % photos.length) + photos.length) % photos.length);
      if (e.key === 'ArrowRight') setIndex((i) => (i + 1) % photos.length);
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [lightbox, photos.length]);

  if (!photos.length) {
    return (
      <div className="mx-auto flex aspect-square max-w-xs items-center justify-center rounded-md border border-ink-dark/25 bg-polaroid p-3">
        <span className="text-sm text-polaroid-ink-soft">sin foto</span>
      </div>
    );
  }

  const n = photos.length;

  function go(i) {
    setIndex(((i % n) + n) % n);
  }

  function prev(e) {
    e.stopPropagation();
    go(index - 1);
  }

  function next(e) {
    e.stopPropagation();
    go(index + 1);
  }

  function thumbSrc(photo) {
    return photo.thumb_url || photo.foto_url;
  }

  return (
    <>
      <div className="group relative flex h-80 items-center justify-center overflow-hidden sm:h-[26rem]">
        {photos.map((p, i) => {
          let offset = i - index;
          if (offset > n / 2) offset -= n;
          if (offset < -n / 2) offset += n;
          const abs = Math.abs(offset);
          if (abs > 2) return null;

          const isCenter = offset === 0;
          const scale = isCenter ? 1 : abs === 1 ? 0.78 : 0.6;
          const translate = offset * 62;
          const opacity = isCenter ? 1 : abs === 1 ? 0.5 : 0.25;
          const tilt = isCenter ? 0 : TILTS[Math.abs(i * 2 + (offset > 0 ? 1 : 0)) % TILTS.length];

          return (
            <div
              key={p.id}
              role="button"
              tabIndex={0}
              onClick={() => isCenter ? setLightbox(true) : go(i)}
              onKeyDown={(e) => e.key === 'Enter' && (isCenter ? setLightbox(true) : go(i))}
              aria-label={isCenter ? `Ampliar foto ${i + 1}` : `Ver foto ${i + 1}`}
              className="absolute w-44 sm:w-56"
              style={{
                transform: `translateX(${translate}%) scale(${scale}) rotate(${tilt}deg)`,
                opacity,
                zIndex: 10 - abs,
                cursor: isCenter ? 'zoom-in' : 'pointer',
                transition: 'transform 0.5s ease-out, opacity 0.5s ease-out',
                willChange: 'transform, opacity',
              }}
            >
              <div
                className={`relative rounded-md border border-ink-dark/25 bg-polaroid p-2.5 pb-4 ${
                  isCenter
                    ? 'shadow-[0_28px_54px_-16px_rgba(3,6,20,0.9)]'
                    : 'shadow-[0_14px_28px_rgba(3,6,20,0.5)]'
                }`}
              >
                {isCenter && onDelete && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(p);
                    }}
                    aria-label="Borrar foto"
                    className="icon-btn absolute -right-3 -top-3 z-10 h-8 w-8 border-danger/40 bg-paper text-sm text-danger hover:border-danger hover:text-danger"
                  >
                    ×
                  </button>
                )}
                <div className="aspect-square overflow-hidden bg-polaroid-mat">
                  <img
                    src={thumbSrc(p)}
                    alt={alt}
                    loading="lazy"
                    decoding="async"
                    className="h-full w-full object-cover"
                  />
                </div>
                {p.authorName && (
                  <p className="mt-2 text-center font-hand text-lg leading-none text-polaroid-ink">
                    {p.authorName}
                  </p>
                )}
              </div>
            </div>
          );
        })}

        {n > 1 && (
          <>
            <button
              type="button"
              onClick={prev}
              aria-label="Foto anterior"
              className="icon-btn absolute left-1 top-1/2 z-20 -translate-y-1/2 bg-paper/85 opacity-0 transition-opacity duration-300 focus-visible:opacity-100 group-hover:opacity-100 sm:left-4"
            >
              ‹
            </button>
            <button
              type="button"
              onClick={next}
              aria-label="Foto siguiente"
              className="icon-btn absolute right-1 top-1/2 z-20 -translate-y-1/2 bg-paper/85 opacity-0 transition-opacity duration-300 focus-visible:opacity-100 group-hover:opacity-100 sm:right-4"
            >
              ›
            </button>
            <div className="absolute bottom-1 left-1/2 z-20 flex -translate-x-1/2 gap-1.5 rounded-full border border-line bg-paper/70 px-2.5 py-1.5">
              {photos.map((p, i) => (
                <button
                  type="button"
                  key={p.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    go(i);
                  }}
                  aria-label={`Ir a foto ${i + 1}`}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    i === index ? 'w-5 bg-ink-dark' : 'w-1.5 bg-ink/40 hover:bg-ink/70'
                  }`}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {/* Lightbox — sin backdrop-blur para evitar flicker en móvil */}
      {lightbox && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/95"
          onClick={() => setLightbox(false)}
        >
          <button
            type="button"
            onClick={() => setLightbox(false)}
            className="absolute right-4 top-4 z-10 rounded-full bg-white/10 p-2 text-white hover:bg-white/20 transition-colors"
            aria-label="Cerrar"
          >
            <X className="h-5 w-5" />
          </button>

          {n > 1 && (
            <button
              type="button"
              onClick={prev}
              className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-white/10 px-3 py-2 text-2xl text-white hover:bg-white/20 transition-colors"
              aria-label="Foto anterior"
            >
              ‹
            </button>
          )}

          <div className="max-h-[85vh] max-w-[90vw] px-10" onClick={(e) => e.stopPropagation()}>
            <img
              src={photos[index].foto_url}
              alt={alt}
              className="max-h-[85vh] max-w-full rounded-lg object-contain"
            />
            {photos[index].authorName && (
              <p className="mt-3 text-center text-sm text-white/70">
                {photos[index].authorName}
              </p>
            )}
          </div>

          {n > 1 && (
            <button
              type="button"
              onClick={next}
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-white/10 px-3 py-2 text-2xl text-white hover:bg-white/20 transition-colors"
              aria-label="Foto siguiente"
            >
              ›
            </button>
          )}
        </div>
      )}
    </>
  );
}
