import { Link } from 'react-router-dom';
import { CalendarDays, Check, MapPin } from 'lucide-react';
import HeartRating from './HeartRating';
import { averageValoracion } from '../utils/rating';
import { formatFecha } from '../utils/date';

const ROTATIONS = [-3, 2, -1.5, 3, -2.5, 1.5, -3.5, 2.5];
const ratingFormat = new Intl.NumberFormat('es', { minimumFractionDigits: 1, maximumFractionDigits: 1 });

function versionesTexto(count) {
  if (count >= 2) return 'Las dos versiones contadas';
  if (count === 1) return '1 de 2 versiones contada';
  return 'Sin versiones todavía';
}

/**
 * Polaroid del álbum. Toda la tarjeta es pulsable, pero el enlace está en el
 * título (patrón de enlace extendido con ::after): su nombre accesible es solo
 * el nombre de la cita y el resto se lee como contenido, no como un enlace enorme.
 */
export default function CitaCard({ cita, headingLevel = 'h2' }) {
  const Heading = headingLevel;
  const fecha = formatFecha(cita.fecha);

  const firstPhoto = cita.entries.flatMap((e) => e.photos || [])[0];
  const cardImage = firstPhoto?.thumb_url || firstPhoto?.foto_url;
  const count = cita.entries.length;
  const promedio = averageValoracion(cita.entries);
  const rotation = ROTATIONS[cita.id % ROTATIONS.length];

  return (
    <article
      className="polaroid-tilt group relative rounded-md border border-ink-dark/25 bg-polaroid p-3 pb-5 shadow-polaroid hover:shadow-polaroid-lift"
      style={{ '--tilt': `${rotation}deg` }}
    >
      <span className="washi-tape" aria-hidden="true" />

      <div className="aspect-square overflow-hidden bg-polaroid-mat">
        {cardImage ? (
          <img
            src={cardImage}
            alt=""
            loading="lazy"
            decoding="async"
            className="h-full w-full object-cover transition-transform duration-300 ease-out motion-safe:group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <span className="text-sm text-polaroid-ink-soft">Sin foto</span>
          </div>
        )}
      </div>

      <div className="pt-3">
        <Heading className="font-hand text-2xl font-normal leading-tight tracking-normal text-polaroid-ink">
          <Link
            to={`/citas/${cita.id}`}
            className="line-clamp-2 break-words outline-none after:absolute after:inset-0 after:rounded-md after:content-[''] focus-visible:after:outline-2 focus-visible:after:outline-offset-4 focus-visible:after:outline-ink-dark"
          >
            {cita.nombre}
          </Link>
        </Heading>

        <p className="mt-1.5 flex min-w-0 items-center gap-1.5 text-xs text-polaroid-ink-soft">
          <MapPin aria-hidden="true" className="h-3.5 w-3.5 shrink-0" strokeWidth={1.75} />
          <span className="truncate">{cita.lugar}</span>
        </p>
        <p className="mt-0.5 flex items-center gap-1.5 text-xs text-polaroid-ink-soft">
          <CalendarDays aria-hidden="true" className="h-3.5 w-3.5 shrink-0" strokeWidth={1.75} />
          <time dateTime={cita.fecha.slice(0, 10)}>{fecha}</time>
        </p>

        {promedio > 0 && (
          <div className="mt-2.5 flex items-center gap-1.5">
            <HeartRating
              value={Math.round(promedio)}
              readOnly
              size="text-sm"
              label={`Valoración media: ${ratingFormat.format(promedio)} de 5`}
            />
            <span aria-hidden="true" className="text-[11px] tabular-nums text-polaroid-ink-soft">
              {ratingFormat.format(promedio)}
            </span>
          </div>
        )}

        <p className="mt-2 flex items-center gap-1 text-[11px] text-polaroid-ink-soft">
          {count >= 2 && <Check aria-hidden="true" className="h-3.5 w-3.5 text-success" strokeWidth={2} />}
          {versionesTexto(count)}
        </p>
      </div>
    </article>
  );
}
