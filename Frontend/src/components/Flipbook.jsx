import { useEffect, useState } from 'react';

/**
 * Libro con hojas que se pasan al hacer click.
 * leaves: [{ key, front, back }]
 */
export default function Flipbook({
  leaves,
  leftBase = null,
  rightBase = null,
  hint = 'pasar hoja →',
  navNoun = 'Hoja',
}) {
  const [turned, setTurned] = useState(0);
  const total = leaves.length;

  useEffect(() => {
    setTurned(0);
  }, [total]);

  useEffect(() => {
    function onKey(e) {
      if (e.key === 'ArrowRight') setTurned((t) => Math.min(t + 1, total));
      if (e.key === 'ArrowLeft') setTurned((t) => Math.max(t - 1, 0));
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [total]);

  return (
    <div className="book">
      <span className="book-ribbon" aria-hidden="true" />
      <div className="flipbook">
        <div className="flipbook-spread">
          <div className="flipbook-base flipbook-base-left book-lined flex flex-col items-center justify-center text-center">
            {leftBase}
          </div>
          <div className="flipbook-base flipbook-base-right book-lined flex flex-col items-center justify-center text-center">
            {rightBase}
          </div>

          {leaves.map((leaf, i) => {
            const isTurned = i < turned;
            const toggle = () => setTurned(isTurned ? i : i + 1);
            return (
              <div
                key={leaf.key ?? i}
                className={`flipbook-leaf${isTurned ? ' is-turned' : ''}`}
                style={{ zIndex: isTurned ? i + 1 : total - i }}
                onClick={toggle}
                role="button"
                tabIndex={isTurned ? -1 : 0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    toggle();
                  }
                }}
              >
                <div className="flipbook-face flipbook-face-front flipbook-face-scroll book-lined">
                  {leaf.front}
                  <span className="flipbook-hint">{hint}</span>
                  <span className="flipbook-corner" aria-hidden="true" />
                </div>
                <div className="flipbook-face flipbook-face-back flipbook-face-scroll">{leaf.back}</div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="flipbook-nav">
        <button
          type="button"
          className="btn btn-ghost px-4 py-1.5 text-sm"
          onClick={() => setTurned((t) => Math.max(t - 1, 0))}
          disabled={turned === 0}
        >
          ← Anterior
        </button>
        <span className="text-ink text-sm">
          {navNoun} {Math.min(turned + 1, total)} de {total}
        </span>
        <button
          type="button"
          className="btn btn-ghost px-4 py-1.5 text-sm"
          onClick={() => setTurned((t) => Math.min(t + 1, total))}
          disabled={turned >= total}
        >
          Siguiente →
        </button>
      </div>
    </div>
  );
}
