import { useState } from 'react';

const TILTS = [-4, 3, -2, 4, -3, 2];

export default function Carousel({ photos, alt, onDelete }) {
  const [index, setIndex] = useState(0);

  if (!photos.length) {
    return (
      <div className="aspect-square max-w-xs mx-auto rounded-sm bg-polaroid border border-ink-dark/30 flex items-center justify-center p-3">
        <span className="text-polaroid-ink-soft text-sm">sin foto</span>
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

  return (
    <div className="relative h-80 sm:h-[26rem] flex items-center justify-center overflow-hidden group">
      {photos.map((p, i) => {
        let offset = i - index;
        if (offset > n / 2) offset -= n;
        if (offset < -n / 2) offset += n;
        const abs = Math.abs(offset);
        if (abs > 2) return null;

        const isCenter = offset === 0;
        const scale = isCenter ? 1 : abs === 1 ? 0.78 : 0.6;
        const translate = offset * 62;
        const opacity = isCenter ? 1 : abs === 1 ? 0.55 : 0.3;
        const tilt = isCenter ? 0 : TILTS[Math.abs(i * 2 + (offset > 0 ? 1 : 0)) % TILTS.length];

        return (
          <div
            key={p.id}
            role="button"
            tabIndex={0}
            onClick={() => go(i)}
            onKeyDown={(e) => e.key === 'Enter' && go(i)}
            aria-label={`Ver foto ${i + 1}`}
            className="absolute w-44 sm:w-56 transition-all duration-500 ease-out"
            style={{
              transform: `translateX(${translate}%) scale(${scale}) rotate(${tilt}deg)`,
              opacity,
              zIndex: 10 - abs,
              cursor: isCenter ? 'default' : 'pointer',
            }}
          >
            <div className="relative bg-polaroid border border-ink-dark/30 rounded-sm p-2.5 pb-4 shadow-[0_16px_32px_rgba(0,0,0,0.5)]">
              {isCenter && onDelete && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(p);
                  }}
                  aria-label="Borrar foto"
                  className="absolute -top-2 -right-2 z-10 w-7 h-7 rounded-full bg-paper border border-line text-red-400 text-sm flex items-center justify-center shadow-md hover:bg-red-400/10 transition-colors"
                >
                  ×
                </button>
              )}
              <div className="aspect-square bg-polaroid-mat overflow-hidden">
                <img src={p.foto_url} alt={alt} className="w-full h-full object-cover" />
              </div>
              {p.authorName && (
                <p className="font-hand text-lg leading-none text-center text-polaroid-ink mt-2">
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
            className="absolute z-20 left-1 sm:left-4 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-paper/80 text-ink-dark flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
          >
            ‹
          </button>
          <button
            type="button"
            onClick={next}
            aria-label="Foto siguiente"
            className="absolute z-20 right-1 sm:right-4 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-paper/80 text-ink-dark flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
          >
            ›
          </button>
          <div className="absolute z-20 bottom-1 left-1/2 -translate-x-1/2 flex gap-1.5">
            {photos.map((p, i) => (
              <button
                type="button"
                key={p.id}
                onClick={(e) => {
                  e.stopPropagation();
                  go(i);
                }}
                aria-label={`Ir a foto ${i + 1}`}
                className={`w-1.5 h-1.5 rounded-full transition-colors ${
                  i === index ? 'bg-ink-dark' : 'bg-paper/80'
                }`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}