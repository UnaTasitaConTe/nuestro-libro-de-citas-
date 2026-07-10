import { Link } from 'react-router-dom';
import HeartRating from './HeartRating';
import { averageValoracion } from '../utils/rating';
import { formatFecha } from '../utils/date';

const ROTATIONS = [-3, 2, -1.5, 3, -2.5, 1.5, -3.5, 2.5];

export default function CitaCard({ cita }) {
  const fecha = formatFecha(cita.fecha);

  const firstPhoto = cita.entries.flatMap((e) => e.photos || [])[0]?.foto_url;
  const complete = cita.entries.length === 2;
  const promedio = averageValoracion(cita.entries);
  const rotation = ROTATIONS[cita.id % ROTATIONS.length];

  return (
    <Link
      to={`/citas/${cita.id}`}
      className="polaroid-tilt relative block bg-polaroid border border-ink-dark/30 rounded-sm p-3 pb-5 shadow-[0_10px_24px_rgba(0,0,0,0.5)] hover:shadow-[0_20px_38px_rgba(255,204,51,0.3)]"
      style={{ '--tilt': `${rotation}deg` }}
    >
      <span className="washi-tape" aria-hidden="true" />

      <div className="aspect-square bg-polaroid-mat overflow-hidden">
        {firstPhoto ? (
          <img src={firstPhoto} alt={fecha} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-polaroid-ink-soft text-sm">sin foto</span>
          </div>
        )}
      </div>

      <div className="pt-3">
        <p className="font-hand text-2xl leading-tight text-polaroid-ink line-clamp-2">{cita.nombre}</p>
        <p className="text-polaroid-ink-soft text-xs mt-1 truncate">{cita.lugar}</p>
        <p className="text-polaroid-ink-soft text-xs">{fecha}</p>

        {promedio > 0 && (
          <div className="flex items-center gap-1.5 mt-1.5">
            <HeartRating value={Math.round(promedio)} readOnly size="text-sm" />
            <span className="text-[11px] text-polaroid-ink-soft">{promedio.toFixed(1)}</span>
          </div>
        )}

        <p className="text-[11px] mt-1.5 text-polaroid-ink-soft italic">
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
