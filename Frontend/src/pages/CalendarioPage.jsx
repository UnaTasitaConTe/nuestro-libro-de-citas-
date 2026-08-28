import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Flame } from 'lucide-react';
import client from '../api/client';
import Layout from '../components/Layout';
import PageHeader from '../components/PageHeader';
import { parseLocalDate } from '../utils/date';

const DAYS_OF_WEEK = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

function getMonthName(month) {
  const date = new Date(2024, month - 1);
  return date.toLocaleDateString('es', { month: 'long' });
}

function getCalendarGrid(year, month) {
  const firstDay = new Date(year, month - 1, 1);
  const lastDay = new Date(year, month, 0);
  const daysInMonth = lastDay.getDate();

  // Monday = 0, Sunday = 6
  let startDow = firstDay.getDay() - 1;
  if (startDow < 0) startDow = 6;

  const cells = [];

  // Empty cells before the first day
  for (let i = 0; i < startDow; i++) {
    cells.push(null);
  }

  // Day cells
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push(d);
  }

  return cells;
}

export default function CalendarioPage() {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth() + 1);
  const [citas, setCitas] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    client
      .get('/citas/calendar', { params: { year, month } })
      .then(({ data }) => setCitas(data))
      .catch(() => setCitas([]))
      .finally(() => setLoading(false));
  }, [year, month]);

  function prevMonth() {
    if (month === 1) {
      setMonth(12);
      setYear((y) => y - 1);
    } else {
      setMonth((m) => m - 1);
    }
  }

  function nextMonth() {
    if (month === 12) {
      setMonth(1);
      setYear((y) => y + 1);
    } else {
      setMonth((m) => m + 1);
    }
  }

  // Build a map: day number -> array of citas
  const citasByDay = new Map();
  for (const cita of citas) {
    const day = parseLocalDate(cita.fecha).getDate();
    if (!citasByDay.has(day)) citasByDay.set(day, []);
    citasByDay.get(day).push(cita);
  }

  const cells = getCalendarGrid(year, month);

  return (
    <Layout>
      <PageHeader
        eyebrow="Vista mensual"
        title="Calendario de citas 📅"
        subtitle="Ve de un vistazo los días que tuvieron una cita juntos."
      />

      {/* Month navigation */}
      <div className="flex items-center justify-between mb-6">
        <button
          type="button"
          onClick={prevMonth}
          className="icon-btn"
          aria-label="Mes anterior"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <h2 className="font-display text-xl font-semibold text-ink-strong capitalize">
          {getMonthName(month)} {year}
        </h2>
        <button
          type="button"
          onClick={nextMonth}
          className="icon-btn"
          aria-label="Mes siguiente"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>

      {/* Calendar grid */}
      <div className="surface p-4 sm:p-6 rounded-2xl">
        {/* Day headers */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {DAYS_OF_WEEK.map((day) => (
            <div
              key={day}
              className="text-center text-xs font-medium text-ink/60 uppercase tracking-wide py-1"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Day cells */}
        <div className="grid grid-cols-7 gap-1">
          {cells.map((day, idx) => {
            if (day === null) {
              return <div key={`empty-${idx}`} className="aspect-square" />;
            }

            const dayCitas = citasByDay.get(day) || [];
            const hasCita = dayCitas.length > 0;
            const hasIntimidad = dayCitas.some((c) => c.intimidad);
            const isToday =
              day === today.getDate() &&
              month === today.getMonth() + 1 &&
              year === today.getFullYear();

            return (
              <div
                key={day}
                className={`relative aspect-square rounded-xl flex flex-col items-center justify-center transition-all duration-200 ${
                  hasCita
                    ? 'bg-ink-dark/15 border border-ink-dark/30 shadow-sm hover:shadow-md hover:-translate-y-0.5'
                    : 'hover:bg-card/60'
                } ${isToday ? 'ring-2 ring-ink-dark/50' : ''}`}
              >
                <span
                  className={`text-sm font-medium ${
                    hasCita ? 'text-ink-dark' : 'text-ink'
                  } ${isToday ? 'font-bold' : ''}`}
                >
                  {day}
                </span>

                {hasCita && (
                  <div className="flex items-center gap-0.5 mt-0.5">
                    <span className="text-[10px]">💛</span>
                    {hasIntimidad && (
                      <Flame className="h-3 w-3 text-rose-400" strokeWidth={2} />
                    )}
                  </div>
                )}

                {/* Tooltip-like details on hover */}
                {hasCita && (
                  <div className="absolute inset-0 opacity-0 hover:opacity-100 transition-opacity z-10">
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 bg-paper border border-line rounded-xl shadow-xl p-3 pointer-events-none">
                      {dayCitas.map((c) => (
                        <div key={c.id} className="mb-1 last:mb-0">
                          <p className="text-xs font-semibold text-ink-strong truncate">
                            {c.nombre}
                          </p>
                          <p className="text-[10px] text-ink truncate">{c.lugar}</p>
                          {c.intimidad && (
                            <span className="inline-flex items-center gap-0.5 text-[10px] text-rose-400">
                              <Flame className="h-2.5 w-2.5" /> Intimidad
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 mt-6 pt-4 border-t border-line">
          <div className="flex items-center gap-1.5 text-xs text-ink">
            <span className="inline-block w-3 h-3 rounded bg-ink-dark/15 border border-ink-dark/30" />
            Día con cita
          </div>
          <div className="flex items-center gap-1.5 text-xs text-ink">
            <Flame className="h-3 w-3 text-rose-400" />
            Intimidad
          </div>
        </div>
      </div>

      {/* Citas list for the month */}
      {!loading && citas.length > 0 && (
        <div className="mt-8">
          <h3 className="font-display text-lg font-semibold text-ink-strong mb-4">
            Citas en {getMonthName(month)}
          </h3>
          <div className="flex flex-col gap-3">
            {citas.map((cita) => (
              <Link
                key={cita.id}
                to={`/citas/${cita.id}`}
                className="surface flex items-center justify-between px-4 py-3 rounded-xl hover:shadow-md transition-shadow"
              >
                <div className="min-w-0">
                  <p className="font-medium text-ink-strong truncate">{cita.nombre}</p>
                  <p className="text-xs text-ink">
                    {parseLocalDate(cita.fecha).toLocaleDateString('es', {
                      day: 'numeric',
                      month: 'short',
                    })}{' '}
                    · {cita.lugar}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {cita.intimidad && (
                    <Flame className="h-4 w-4 text-rose-400" />
                  )}
                  <span className="text-xs text-ink/60">→</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {!loading && citas.length === 0 && (
        <p className="text-center text-ink/60 mt-8 text-sm">
          No hay citas registradas en {getMonthName(month)} {year}.
        </p>
      )}
    </Layout>
  );
}
