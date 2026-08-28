import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import HeartRating from './HeartRating';
import { averageValoracion } from '../utils/rating';
import { formatFecha } from '../utils/date';

function versionesTexto(cita) {
  if (cita.entries.length === 2) return 'las dos versiones contadas';
  if (cita.entries.length === 1) return '1 de 2 versiones contada';
  return 'sin versiones todavía';
}

function LeafFront({ cita, folio }) {
  const fecha = formatFecha(cita.fecha);
  const foto = cita.entries.flatMap((e) => e.photos || [])[0]?.foto_url;
  const promedio = averageValoracion(cita.entries);

  return (
    <div className="flex h-full flex-col">
      <p className="label-caps">{fecha}</p>
      <h3 className="font-hand text-4xl leading-tight text-ink-dark mt-1">{cita.nombre}</h3>
      <p className="text-ink text-sm mt-1">{cita.lugar}</p>

      <div className="mt-4 flex-1 min-h-0 overflow-hidden rounded-sm border border-ink-dark/25 bg-polaroid-mat">
        {foto ? (
          <img src={foto} alt={cita.nombre} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="font-hand text-2xl text-polaroid-ink-soft">sin foto todavía</span>
          </div>
        )}
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          {promedio > 0 && <HeartRating value={Math.round(promedio)} readOnly size="text-base" />}
          <span className="text-xs text-ink italic">{versionesTexto(cita)}</span>
        </div>
        <Link
          to={`/citas/${cita.id}`}
          onClick={(e) => e.stopPropagation()}
          className="btn btn-ghost px-4 py-1.5 text-xs"
        >
          Leer la cita
        </Link>
      </div>

      <span className="book-page-number" style={{ left: '2.25rem' }}>{folio}</span>
      <span className="flipbook-hint">pasar hoja →</span>
      <span className="flipbook-corner" aria-hidden="true" />
    </div>
  );
}

function LeafBack({ cita, folio }) {
  const fecha = formatFecha(cita.fecha);
  return (
    <div className="book-lined flex h-full flex-col justify-center text-center">
      <p className="label-caps">{fecha}</p>
      <p className="font-hand text-3xl text-ink-dark mt-2">{cita.nombre}</p>
      <p className="text-ink text-sm mt-3 italic">{versionesTexto(cita)}</p>
      <p className="font-hand text-xl text-ink/70 mt-8">← volver a esta hoja</p>
      <span className="book-page-number" style={{ right: '2.25rem' }}>{folio}</span>
    </div>
  );
}

export default function CitasFlipbook({ citas, folioBase = 0 }) {
  const [turned, setTurned] = useState(0);
  const total = citas.length;

  useEffect(() => { setTurned(0); }, [citas]);

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
            <p className="font-hand text-3xl text-ink-dark">Nuestro libro de citas</p>
            <p className="text-ink text-sm mt-2 max-w-xs">
              Haz click en la hoja para pasar a la siguiente página.
            </p>
          </div>
          <div className="flipbook-base flipbook-base-right book-lined flex flex-col items-center justify-center text-center">
            <p className="font-hand text-3xl text-ink-dark">Fin de esta página del libro</p>
            <p className="text-ink text-sm mt-2">Vuelve atrás o avanza a la siguiente tanda de recuerdos.</p>
          </div>

          {citas.map((cita, i) => {
            const isTurned = i < turned;
            return (
              <div
                key={cita.id}
                className={`flipbook-leaf${isTurned ? ' is-turned' : ''}`}
                style={{ zIndex: isTurned ? i + 1 : total - i }}
                onClick={() => setTurned(isTurned ? i : i + 1)}
                role="button"
                tabIndex={isTurned ? -1 : 0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setTurned(isTurned ? i : i + 1);
                  }
                }}
              >
                <div className="flipbook-face flipbook-face-front book-lined">
                  <LeafFront cita={cita} folio={folioBase + i * 2 + 2} />
                </div>
                <div className="flipbook-face flipbook-face-back">
                  <LeafBack cita={cita} folio={folioBase + i * 2 + 1} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="flipbook-nav">
        <button type="button" className="btn btn-ghost px-4 py-1.5 text-sm"
          onClick={() => setTurned((t) => Math.max(t - 1, 0))} disabled={turned === 0}>
          ← Anterior
        </button>
        <span className="text-ink text-sm">Hoja {Math.min(turned + 1, total)} de {total}</span>
        <button type="button" className="btn btn-ghost px-4 py-1.5 text-sm"
          onClick={() => setTurned((t) => Math.min(t + 1, total))} disabled={turned >= total}>
          Siguiente →
        </button>
      </div>
    </div>
  );
}
