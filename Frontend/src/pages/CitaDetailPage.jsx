import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams, useLocation } from 'react-router-dom';
import { ArrowLeft, Bell, CalendarDays, ImagePlus, MapPin, PenLine, Pencil, Trash2 } from 'lucide-react';
import client from '../api/client';
import { useAuth } from '../context/AuthContext';
import Layout from '../components/Layout';
import HeartRating from '../components/HeartRating';
import Carousel from '../components/Carousel';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import StatusMessage from '../components/ui/StatusMessage';
import { REPETIRIAMOS_LABEL } from '../constants/repetiriamos';
import { averageValoracion } from '../utils/rating';
import { formatFecha } from '../utils/date';

const ENTRY_TILTS = [-1.5, 1.5];

const ENTRY_SECTIONS = [
  { key: 'que_hicimos', label: 'Qué hicimos' },
  { key: 'como_te_sentiste', label: 'Cómo me sentí' },
  { key: 'lo_que_mas_gusto', label: 'Lo que más me gustó' },
  { key: 'lo_que_menos_gusto', label: 'Lo que menos me gustó' },
];

const ratingFormat = new Intl.NumberFormat('es', { minimumFractionDigits: 1, maximumFractionDigits: 1 });

// Polaroid de lectura: inclinada como en el álbum, pero sin elevarse al pasar
// el ratón (no es un enlace; moverse sugeriría que se puede pulsar).
function EntryView({ entry, delay, index }) {
  const headingId = `version-${entry.id}`;
  return (
    <article
      aria-labelledby={headingId}
      className="fade-in-up relative rounded-md border border-ink-dark/30 bg-polaroid p-5 shadow-[0_16px_38px_rgba(3,6,20,0.6)] sm:p-6"
      style={{
        animationDelay: `${delay}s`,
        rotate: `${ENTRY_TILTS[index % ENTRY_TILTS.length]}deg`,
      }}
    >
      <span className="washi-tape" aria-hidden="true" />

      {/* La fuente va en el span: la regla base h1–h4 de index.css (sin capa)
          ganaría a la utilidad font-hand puesta en el propio <h2>. */}
      <h2 id={headingId} className="text-center text-3xl font-normal leading-none text-polaroid-ink">
        {/* El espacio va fuera del span: dentro se pierde al calcular el nombre accesible. */}
        <span className="sr-only">Versión de</span> <span className="font-hand">{entry.user_name}</span>
      </h2>

      <div className="mt-4 flex justify-center">
        <HeartRating value={entry.valoracion} readOnly label={`Valoración: ${entry.valoracion} de 5 corazones`} />
      </div>

      <dl className="mt-5 grid gap-4 border-t border-ink-dark/20 pt-5">
        {ENTRY_SECTIONS.map(({ key, label }) => (
          <div key={key}>
            <dt className="text-xs font-semibold text-polaroid-ink-soft">{label}</dt>
            <dd className="mt-1 whitespace-pre-wrap break-words text-sm leading-relaxed text-polaroid-ink">
              {entry[key] || <span className="text-polaroid-ink-soft">Sin escribir</span>}
            </dd>
          </div>
        ))}
      </dl>
    </article>
  );
}

export default function CitaDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  function handleBack() {
    // location.key es 'default' cuando esta es la primera entrada del historial
    // de la SPA (enlace directo, notificación, correo o recarga): en ese caso
    // navigate(-1) sacaría al usuario fuera de la app, así que vamos al inicio.
    if (location.key === 'default') {
      navigate('/');
    } else {
      navigate(-1);
    }
  }

  const [cita, setCita] = useState(null);
  const [error, setError] = useState('');
  const [deleteError, setDeleteError] = useState('');
  const [uploadError, setUploadError] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState('');
  const [photoError, setPhotoError] = useState('');
  const [nudging, setNudging] = useState(false);
  const [nudge, setNudge] = useState(null); // { tone: 'success' | 'error', text }
  const [photoToDelete, setPhotoToDelete] = useState(null);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  useEffect(() => {
    client
      .get(`/citas/${id}`)
      .then(({ data }) => setCita(data))
      .catch(() => setError('No se pudo cargar la cita'));
  }, [id]);

  async function handleAddPhotos(e) {
    const files = Array.from(e.target.files || []);
    e.target.value = '';
    if (!files.length) return;

    setUploadError('');
    setUploadStatus('');
    setUploading(true);
    try {
      const body = new FormData();
      files.forEach((f) => body.append('fotos', f));
      const { data } = await client.post(`/citas/${id}/mi-entrada/fotos`, body);
      setCita(data);
      setUploadStatus(files.length === 1 ? 'Foto agregada' : `${files.length} fotos agregadas`);
    } catch (err) {
      setUploadError(err.response?.data?.error || 'No se pudieron subir las fotos');
    } finally {
      setUploading(false);
    }
  }

  async function deletePhoto() {
    setPhotoError('');
    try {
      const { data } = await client.delete(`/citas/${id}/fotos/${photoToDelete.id}`);
      setCita(data);
    } catch (err) {
      setPhotoError(err.response?.data?.error || 'No se pudo borrar la foto');
    } finally {
      setPhotoToDelete(null);
    }
  }

  async function deleteCita() {
    setDeleteError('');
    try {
      await client.delete(`/citas/${id}`);
      navigate('/');
    } catch (err) {
      setDeleteError(err.response?.data?.error || 'No se pudo borrar la cita');
      setConfirmingDelete(false);
    }
  }

  async function handleNudge() {
    setNudging(true);
    setNudge(null);
    try {
      await client.post(`/citas/${id}/nudge`);
      setNudge({ tone: 'success', text: 'Recordatorio enviado. Tu pareja recibirá un correo.' });
    } catch (err) {
      setNudge({ tone: 'error', text: err.response?.data?.error || 'No se pudo enviar el recordatorio' });
    } finally {
      setNudging(false);
    }
  }

  if (error) {
    return (
      <Layout>
        <div className="mx-auto max-w-xl">
          <p role="alert" className="alert alert-danger">
            {error}. Revisa tu conexión y vuelve a intentarlo.
          </p>
          <button type="button" onClick={handleBack} className="btn btn-ghost btn-sm mt-4 pointer-coarse:min-h-11">
            <ArrowLeft className="h-4 w-4" strokeWidth={1.75} />
            Volver
          </button>
        </div>
      </Layout>
    );
  }

  if (!cita) {
    return (
      <Layout>
        <div className="mx-auto max-w-2xl space-y-4" aria-busy="true">
          <p role="status" className="sr-only">Cargando la cita…</p>
          <div className="skeleton h-9 w-24 rounded-full" />
          <div className="skeleton h-52 rounded-3xl" />
          <div className="skeleton mx-auto h-80 max-w-lg rounded-md" />
        </div>
      </Layout>
    );
  }

  const fecha = formatFecha(cita.fecha);

  const myEntry = cita.entries.find((e) => e.user_id === user.id);
  const bothTold = cita.entries.length > 1;
  const promedio = averageValoracion(cita.entries);
  const allPhotos = cita.entries.flatMap((e) =>
    e.photos.map((p) => ({ ...p, authorName: e.user_name }))
  );

  const isAdmin = user.role === 'ADMIN';

  return (
    <Layout>
      <button
        type="button"
        onClick={handleBack}
        className="btn btn-ghost btn-sm mb-6 pointer-coarse:min-h-11"
      >
        <ArrowLeft className="h-4 w-4" strokeWidth={1.75} />
        Volver
      </button>

      {/* ---------- Cabecera de la cita ---------- */}
      <section
        aria-labelledby="cita-titulo"
        className="surface-glass surface-accent fade-in-up mx-auto mb-12 max-w-2xl px-6 py-8 sm:px-10"
      >
        <h1
          id="cita-titulo"
          className="break-words font-display text-3xl font-bold leading-tight text-ink-strong sm:text-4xl"
        >
          {cita.nombre}
        </h1>

        <p className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-1.5 text-sm text-ink">
          <span className="inline-flex items-center gap-1.5">
            <CalendarDays className="h-4 w-4 shrink-0 text-royal-light" strokeWidth={1.75} />
            <time dateTime={cita.fecha.slice(0, 10)}>{fecha}</time>
          </span>
          <span className="inline-flex min-w-0 items-center gap-1.5">
            <MapPin className="h-4 w-4 shrink-0 text-royal-light" strokeWidth={1.75} />
            <span className="break-words">{cita.lugar}</span>
          </span>
        </p>

        <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-3">
          {promedio > 0 && (
            <div className="flex items-center gap-2.5">
              <HeartRating
                value={Math.round(promedio)}
                readOnly
                label={`Valoración media: ${ratingFormat.format(promedio)} de 5`}
              />
              <span aria-hidden="true" className="font-display text-lg font-semibold tabular-nums text-ink-dark">
                {ratingFormat.format(promedio)}
              </span>
            </div>
          )}
          <span className="chip">
            ¿Repetiríamos?
            <strong className="text-ink-dark">{REPETIRIAMOS_LABEL[cita.repetiriamos]}</strong>
          </span>
        </div>

        {bothTold && (
          <p className="mt-4 text-xs text-ink/80">Las dos versiones ya están contadas.</p>
        )}

        {/* Acciones dentro de la tarjeta: son de esta cita y así no compiten con la luna del fondo. */}
        <div className="mt-7 flex flex-wrap items-center gap-2 border-t border-line pt-6">
          <Link to={`/citas/${cita.id}/mi-entrada`} className="btn btn-secondary btn-sm pointer-coarse:min-h-11">
            <PenLine className="h-4 w-4" strokeWidth={1.75} />
            {myEntry ? 'Editar mi versión' : 'Agregar mi versión'}
          </Link>
          {isAdmin && (
            <Link to={`/citas/${cita.id}/editar`} className="btn btn-ghost btn-sm pointer-coarse:min-h-11">
              <Pencil className="h-4 w-4" strokeWidth={1.75} />
              Editar cita
            </Link>
          )}
          {isAdmin && (
            <button
              type="button"
              onClick={() => setConfirmingDelete(true)}
              className="btn btn-danger btn-sm pointer-coarse:min-h-11 sm:ml-auto"
            >
              <Trash2 className="h-4 w-4" strokeWidth={1.75} />
              Borrar cita
            </button>
          )}
        </div>
        <StatusMessage tone="error" className="alert alert-danger mt-4">
          {deleteError}
        </StatusMessage>
      </section>

      {/* ---------- Fotos ---------- */}
      <section aria-labelledby="cita-fotos" className="mb-12">
        <h2 id="cita-fotos" className="sr-only">Fotos</h2>
        <div className="mx-auto mb-2 max-w-lg">
          <Carousel photos={allPhotos} alt={`Foto de ${cita.nombre}`} onDelete={setPhotoToDelete} />
        </div>
        <StatusMessage tone="error" className="alert alert-danger mx-auto max-w-md">
          {photoError}
        </StatusMessage>

        {myEntry && (
          <div className="mt-4 flex flex-col items-center">
            {/* El input queda accesible por teclado (sr-only, no display:none);
                el foco se muestra en la etiqueta con has-focus-visible. */}
            <label
              className={`btn btn-secondary btn-sm pointer-coarse:min-h-11 has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-ink-dark ${
                uploading ? 'cursor-progress opacity-60' : 'cursor-pointer'
              }`}
            >
              <ImagePlus className="h-4 w-4" strokeWidth={1.75} />
              {uploading ? 'Subiendo…' : 'Agregar fotos'}
              <input
                type="file"
                accept="image/*"
                multiple
                className="sr-only"
                disabled={uploading}
                onChange={handleAddPhotos}
              />
            </label>
            <StatusMessage tone="error" className="alert alert-danger mt-3">
              {uploadError}
            </StatusMessage>
            <StatusMessage className="sr-only">{uploadStatus}</StatusMessage>
          </div>
        )}
      </section>

      {/* ---------- Versiones ---------- */}
      {cita.entries.length === 0 && (
        <div className="surface mx-auto max-w-md border-dashed p-8 text-center">
          <p className="text-sm text-ink">Nadie ha contado su versión de esta cita todavía.</p>
          <Link to={`/citas/${cita.id}/mi-entrada`} className="btn btn-primary btn-sm mt-4 pointer-coarse:min-h-11">
            <PenLine className="h-4 w-4" strokeWidth={1.75} />
            Contar mi versión
          </Link>
        </div>
      )}

      {/* Recordatorio cuando falta la versión de la pareja */}
      {myEntry && !bothTold && (
        <div className="surface mx-auto mb-12 flex max-w-md flex-col items-center gap-3 rounded-2xl px-5 py-5 text-center">
          <p className="text-sm text-ink">Tu pareja aún no ha escrito su versión de esta cita.</p>
          <button
            type="button"
            onClick={handleNudge}
            disabled={nudging}
            className="btn btn-secondary btn-sm pointer-coarse:min-h-11"
          >
            <Bell className="h-4 w-4" strokeWidth={1.75} />
            {nudging ? 'Enviando…' : 'Recordar a mi pareja'}
          </button>
          {/* Una sola región cortés para éxito y error: si cambiara el role al
              cambiar el resultado, el anuncio dejaría de ser fiable. */}
          <StatusMessage className={`text-xs ${nudge?.tone === 'success' ? 'text-success' : 'text-danger'}`}>
            {nudge?.text}
          </StatusMessage>
        </div>
      )}

      {cita.entries.length > 0 && (
        <div className="mx-auto grid max-w-3xl gap-x-10 gap-y-16 px-2 md:grid-cols-2">
          {cita.entries.map((entry, i) => (
            <EntryView key={entry.id} entry={entry} delay={i * 0.12} index={i} />
          ))}
        </div>
      )}

      <ConfirmDialog
        open={photoToDelete !== null}
        title="¿Borrar esta foto?"
        description="La foto se eliminará de la cita. No se puede deshacer."
        confirmLabel="Borrar foto"
        busyLabel="Borrando…"
        onConfirm={deletePhoto}
        onCancel={() => setPhotoToDelete(null)}
      />

      <ConfirmDialog
        open={confirmingDelete}
        title="¿Borrar esta cita?"
        description="Se borrará la cita completa, con sus versiones y todas sus fotos. No se puede deshacer."
        confirmLabel="Borrar cita"
        busyLabel="Borrando…"
        onConfirm={deleteCita}
        onCancel={() => setConfirmingDelete(false)}
      />
    </Layout>
  );
}
