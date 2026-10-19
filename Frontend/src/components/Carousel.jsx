import { useState } from 'react';
import IconButton from './ui/IconButton';
import Lightbox from './ui/Lightbox';

const TILTS = [-4, 3, -2, 4, -3, 2];

export default function Carousel({ photos, alt, onDelete }) {
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
  const current = photos[Math.min(index, n - 1)];

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
            <IconButton
              label="Foto anterior"
              onClick={prev}
              className="absolute left-1 top-1/2 z-20 -translate-y-1/2 bg-paper/85 opacity-0 transition-opacity duration-300 focus-visible:opacity-100 group-hover:opacity-100 sm:left-4"
            >
              ‹
            </IconButton>
            <IconButton
              label="Foto siguiente"
              onClick={next}
              className="absolute right-1 top-1/2 z-20 -translate-y-1/2 bg-paper/85 opacity-0 transition-opacity duration-300 focus-visible:opacity-100 group-hover:opacity-100 sm:right-4"
            >
              ›
            </IconButton>
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
                  className={`h-1.5 rounded-full transition-[width,background-color] duration-300 ${
                    i === index ? 'w-5 bg-ink-dark' : 'w-1.5 bg-ink/40 hover:bg-ink/70'
                  }`}
                />
              ))}
            </div>
          </>
        )}
      </div>

      <Lightbox
        open={lightbox}
        onClose={() => setLightbox(false)}
        src={current.foto_url}
        alt={alt}
        onPrev={n > 1 ? () => go(index - 1) : undefined}
        onNext={n > 1 ? () => go(index + 1) : undefined}
        caption={
          current.authorName && (
            <span className="text-sm text-white/70">{current.authorName}</span>
          )
        }
      />
    </>
  );
}
