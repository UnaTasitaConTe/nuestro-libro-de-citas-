import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Flame, Heart } from 'lucide-react';
import client from '../api/client';
import Layout from '../components/Layout';
import PageHeader from '../components/PageHeader';
import IconButton from '../components/ui/IconButton';
import StatusMessage from '../components/ui/StatusMessage';
import { parseLocalDate } from '../utils/date';

const WEEKDAYS = [
  { short: 'Lun', long: 'lunes' },
  { short: 'Mar', long: 'martes' },
  { short: 'Mié', long: 'miércoles' },
  { short: 'Jue', long: 'jueves' },
  { short: 'Vie', long: 'viernes' },
  { short: 'Sáb', long: 'sábado' },
  { short: 'Dom', long: 'domingo' },
];

const monthFormat = new Intl.DateTimeFormat('es', { month: 'long' });
const shortDateFormat = new Intl.DateTimeFormat('es', { day: 'numeric', month: 'short' });

function getMonthName(month) {
  return monthFormat.format(new Date(2024, month - 1, 1));
}

// ?mes=AAAA-MM; si falta o no es válido, el mes actual.
function parseMes(value, today) {
  const match = /^(\d{4})-(\d{2})$/.exec(value ?? '');
  const year = match && Number(match[1]);
  const month = match && Number(match[2]);
  if (!match || month < 1 || month > 12) return { year: today.getFullYear(), month: today.getMonth() + 1 };
  return { year, month };
}

function formatMes(year, month) {
  return `${year}-${String(month).padStart(2, '0')}`;
}

// Semanas de lunes a domingo; null en los huecos antes y después del mes.
function getCalendarWeeks(year, month) {
  const daysInMonth = new Date(year, month, 0).getDate();
  let startDow = new Date(year, month - 1, 1).getDay() - 1;
  if (startDow < 0) startDow = 6;

  const cells = Array.from({ length: startDow }, () => null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7) cells.push(null);

  const weeks = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));
  return weeks;
}

function focusListItem(event, citaId) {
  // Varias citas el mismo día: se lleva el foco a la primera en la lista de abajo
  // sin cambiar la URL (un #hash añadiría una entrada al historial).
  event.preventDefault();
  document.getElementById(`cita-${citaId}`)?.focus();
}

function DayCell({ day, monthName, citas, isToday }) {
  const base = 'relative flex aspect-square flex-col items-center justify-center rounded-xl text-sm lg:aspect-[3/2]';
  const todayRing = isToday ? 'ring-2 ring-ink-dark/60' : '';

  if (!citas.length) {
    return (
      <div className={`${base} ${todayRing} text-ink`} aria-current={isToday ? 'date' : undefined}>
        <span className={isToday ? 'font-bold text-ink-strong' : ''}>{day}</span>
      </div>
    );
  }

  const hasIntimidad = citas.some((c) => c.intimidad);
  const label = `${day} de ${monthName}: ${citas.map((c) => c.nombre).join(', ')}${
    hasIntimidad ? ', con intimidad' : ''
  }`;
  const single = citas.length === 1;

  return (
    <Link
      to={`/citas/${citas[0].id}`}
      onClick={single ? undefined : (event) => focusListItem(event, citas[0].id)}
      aria-label={label}
      aria-current={isToday ? 'date' : undefined}
      className={`group ${base} ${todayRing} border border-ink-dark/30 bg-ink-dark/15 font-semibold text-ink-dark transition-colors hover:bg-ink-dark/25`}
    >
      <span>{day}</span>
      <span aria-hidden="true" className="mt-0.5 flex items-center gap-0.5">
        <Heart className="h-2.5 w-2.5 fill-current" strokeWidth={0} />
        {hasIntimidad && <Flame className="h-3 w-3 text-passion" strokeWidth={2} />}
      </span>

      {/* Vista previa al pasar el ratón o enfocar. Decorativa: la misma
          información está en el nombre del enlace y en la lista inferior. */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-2 hidden w-48 -translate-x-1/2 rounded-xl border border-line bg-paper p-3 text-left font-normal opacity-0 shadow-xl transition-opacity duration-150 group-focus-visible:block group-focus-visible:opacity-100 pointer-fine:group-hover:block pointer-fine:group-hover:opacity-100"
      >
        {citas.map((c) => (
          <span key={c.id} className="mb-1 block last:mb-0">
            <span className="block truncate text-xs font-semibold text-ink-strong">{c.nombre}</span>
            <span className="block truncate text-[11px] text-ink">{c.lugar}</span>
          </span>
        ))}
      </span>
    </Link>
  );
}

export default function CalendarioPage() {
  const today = new Date();
  const [searchParams, setSearchParams] = useSearchParams();
  const { year, month } = parseMes(searchParams.get('mes'), today);
  const [citas, setCitas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    setLoading(true);
    setError('');
    client
      .get('/citas/calendar', { params: { year, month } })
      .then(({ data }) => setCitas(data))
      .catch(() => {
        setCitas([]);
        setError('No se pudieron cargar las citas de este mes');
      })
      .finally(() => setLoading(false));
  }, [year, month, reloadKey]);

  // El mes vive en la URL: al volver desde una cita se conserva. `replace`
  // evita llenar el historial con cada mes recorrido.
  function goTo(nextYear, nextMonth) {
    setSearchParams({ mes: formatMes(nextYear, nextMonth) }, { replace: true });
  }

  function prevMonth() {
    if (month === 1) goTo(year - 1, 12);
    else goTo(year, month - 1);
  }

  function nextMonth() {
    if (month === 12) goTo(year + 1, 1);
    else goTo(year, month + 1);
  }

  const isCurrentMonth = year === today.getFullYear() && month === today.getMonth() + 1;

  const citasByDay = new Map();
  for (const cita of citas) {
    const day = parseLocalDate(cita.fecha).getDate();
    if (!citasByDay.has(day)) citasByDay.set(day, []);
    citasByDay.get(day).push(cita);
  }

  const monthName = getMonthName(month);
  const weeks = getCalendarWeeks(year, month);
  const summary = loading
    ? ''
    : `${monthName} de ${year}: ${citas.length === 0 ? 'sin citas' : citas.length === 1 ? '1 cita' : `${citas.length} citas`}`;

  return (
    <Layout>
      <PageHeader title="Calendario" subtitle="Los días que tuvieron una cita juntos, mes a mes." />

      {/* ---------- Navegación de meses ---------- */}
      <div className="mb-6 flex items-center gap-3">
        <IconButton label="Mes anterior" onClick={prevMonth}>
          <ChevronLeft className="h-5 w-5" />
        </IconButton>
        <h2 className="min-w-0 flex-1 text-center font-display text-xl font-semibold capitalize text-ink-strong">
          {monthName} {year}
        </h2>
        <IconButton label="Mes siguiente" onClick={nextMonth}>
          <ChevronRight className="h-5 w-5" />
        </IconButton>
      </div>
      {!isCurrentMonth && (
        <div className="-mt-3 mb-5 flex justify-center">
          <button
            type="button"
            onClick={() => goTo(today.getFullYear(), today.getMonth() + 1)}
            className="btn btn-ghost btn-sm pointer-coarse:min-h-11"
          >
            Volver a hoy
          </button>
        </div>
      )}

      <StatusMessage className="sr-only">{summary}</StatusMessage>
      <StatusMessage tone="error" className="alert alert-danger mb-6">
        {error && (
          <>
            {error}.{' '}
            <button
              type="button"
              onClick={() => setReloadKey((k) => k + 1)}
              className="font-semibold underline underline-offset-4"
            >
              Reintentar
            </button>
          </>
        )}
      </StatusMessage>

      {/* ---------- Mes ---------- */}
      <div className="surface rounded-2xl p-3 sm:p-6" aria-busy={loading || undefined}>
        <table className="w-full table-fixed border-separate border-spacing-1">
          <caption className="sr-only">
            Citas de {monthName} de {year}
          </caption>
          <thead>
            <tr>
              {WEEKDAYS.map((d) => (
                <th key={d.short} scope="col" className="py-1 text-center text-xs font-medium text-ink/80">
                  <abbr title={d.long} className="no-underline">
                    {d.short}
                  </abbr>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className={loading ? 'opacity-60 transition-opacity' : 'transition-opacity'}>
            {weeks.map((week, w) => (
              <tr key={w}>
                {week.map((day, i) => (
                  <td key={i} className="p-0 align-top">
                    {day !== null && (
                      <DayCell
                        day={day}
                        monthName={monthName}
                        citas={citasByDay.get(day) || []}
                        isToday={isCurrentMonth && day === today.getDate()}
                      />
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>

        <ul className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-line pt-4 text-xs text-ink" aria-label="Leyenda">
          <li className="flex items-center gap-1.5">
            <span aria-hidden="true" className="inline-block h-3 w-3 rounded border border-ink-dark/30 bg-ink-dark/15" />
            Día con cita
          </li>
          <li className="flex items-center gap-1.5">
            <Flame aria-hidden="true" className="h-3 w-3 text-passion" />
            Intimidad
          </li>
          <li className="flex items-center gap-1.5">
            <span aria-hidden="true" className="inline-block h-3 w-3 rounded ring-2 ring-ink-dark/60" />
            Hoy
          </li>
        </ul>
      </div>

      {/* ---------- Lista del mes ---------- */}
      {!loading && !error && citas.length > 0 && (
        <section aria-labelledby="citas-del-mes" className="mt-8">
          <h2 id="citas-del-mes" className="mb-4 font-display text-lg font-semibold text-ink-strong">
            Citas en {monthName}
          </h2>
          <ul className="flex flex-col gap-3">
            {citas.map((cita) => (
              <li key={cita.id}>
                <Link
                  id={`cita-${cita.id}`}
                  to={`/citas/${cita.id}`}
                  className="group surface flex items-center justify-between gap-3 rounded-xl px-4 py-3 pointer-coarse:min-h-11"
                >
                  <span className="min-w-0">
                    <span className="block truncate font-medium text-ink-strong">{cita.nombre}</span>
                    <span className="mt-0.5 flex min-w-0 gap-2 text-xs text-ink">
                      <time dateTime={cita.fecha.slice(0, 10)} className="shrink-0">
                        {shortDateFormat.format(parseLocalDate(cita.fecha))}
                      </time>
                      <span className="truncate">{cita.lugar}</span>
                    </span>
                  </span>
                  <span className="flex shrink-0 items-center gap-2">
                    {cita.intimidad && (
                      <>
                        <Flame aria-hidden="true" className="h-4 w-4 text-passion" />
                        <span className="sr-only">Con intimidad</span>
                      </>
                    )}
                    {/* El hover va en el chevron: .surface (sin capa CSS) anula borde y sombra de las utilidades. */}
                    <ChevronRight
                      aria-hidden="true"
                      className="h-4 w-4 text-ink/60 transition-[color,translate] duration-150 group-hover:translate-x-0.5 group-hover:text-ink-dark"
                    />
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {!loading && !error && citas.length === 0 && (
        <div className="mt-8 text-center">
          <p className="text-sm text-ink">
            No hay citas registradas en {monthName} de {year}.
          </p>
          <Link to="/citas/nueva" className="btn btn-secondary btn-sm mt-3 pointer-coarse:min-h-11">
            Registrar una cita
          </Link>
        </div>
      )}
    </Layout>
  );
}
