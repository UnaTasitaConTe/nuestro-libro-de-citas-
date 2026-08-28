import { Link } from 'react-router-dom';
import HeartRating from './HeartRating';
import { averageValoracion } from '../utils/rating';
import { formatFecha } from '../utils/date';

const ROTATIONS = [-3, 2, -1.5, 3, -2.5, 1.5, -3.5, 2.5];

export default function CitaCard({ cita }) {
  const fecha = formatFecha(cita.fecha);

  const firstPhoto = cita.entries.flatMap((e) => e.photos || [])[0];
  const cardImage = firstPhoto?.thumb_url || firstPhoto?.foto_url;
  const complete = cita.entries.length === 2;
  const promedio = averageValoracion(cita.entries);
  const rotation = ROTATIONS[cita.id % ROTATIONS.length];

  return (
    <Link
      to={`/citas/${cita.id}`}
      className="polaroid-tilt group relative block rounded-md border border-ink-dark/25 bg-polaroid p-3 pb-5 shadow-[0_12px_28px_rgba(3,6,20,0.55)] hover:shadow-[0_26px_50px_-18px_rgba(255,204,51,0.45)]"
      style={{ '--tilt': `${rotation}deg` }}
    >
      <span className="washi-tape" aria-hidden="true" />

      <div className="aspect-square overflow-hidden bg-polaroid-mat">
        {cardImage ? (
          <img
            src={cardImage}
            alt={`Foto de ${cita.nombre}`}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <span className="text-sm text-polaroid-ink-soft">sin foto</span>
          </div>
        )}
      </div>

      <div className="pt-3">
        <p className="font-hand text-2xl leading-tight text-polaroid-ink line-clamp-2">
          {cita.nombre}
        </p>
        <p className="mt-1 truncate text-xs text-polaroid-ink-soft">{cita.lugar}</p>
        <p className="text-xs text-polaroid-ink-soft">{fecha}</p>

        {promedio > 0 && (
          <div className="mt-2 flex items-center gap-1.5">
            <HeartRating value={Math.round(promedio)} readOnly size="text-sm" />
            <span className="text-[11px] text-polaroid-ink-soft">{promedio.toFixed(1)}</span>
          </div>
        )}

        <p className="mt-2 text-[11px] italic text-polaroid-ink-soft">
          {complete
            ? 'las dos versiones contadas 💛'
            : cita.entries.length === 1
              ? '1 de 2 versiones contada'
              : 'sin versiones todavía'}
        </p>
      </div>
    </Link>
  );
}
