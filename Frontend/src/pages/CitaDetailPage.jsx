import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams, useLocation } from 'react-router-dom';
import { ArrowLeft, Bell, ImagePlus, PenLine, Pencil, Trash2 } from 'lucide-react';
import client from '../api/client';
import { useAuth } from '../context/AuthContext';
import Layout from '../components/Layout';
import HeartRating from '../components/HeartRating';
import Carousel from '../components/Carousel';
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

function EntryView({ entry, delay, index }) {
  return (
    <article
      className="polaroid-tilt fade-in-up relative rounded-md border border-ink-dark/30 bg-polaroid p-5 shadow-[0_16px_38px_rgba(3,6,20,0.6)] hover:shadow-[0_26px_52px_-16px_rgba(255,204,51,0.35)] sm:p-6"
      style={{
        animationDelay: `${delay}s`,
        '--tilt': `${ENTRY_TILTS[index % ENTRY_TILTS.length]}deg`,
      }}
    >
      <span className="washi-tape" aria-hidden="true" />

      <p className="mb-4 text-center font-hand text-3xl leading-none text-polaroid-ink">
        {entry.user_name}
      </p>

      <p className="eyebrow mb-1.5">Valoración</p>
      <HeartRating value={entry.valoracion} readOnly />

      <div className="mt-5 grid gap-4 border-t border-ink-dark/20 pt-5">
        {ENTRY_SECTIONS.map(({ key, label }) => (
          <div key={key}>
            <p className="eyebrow mb-1">{label}</p>
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-polaroid-ink">
              {entry[key] || '—'}
            </p>
          </div>
        ))}
      </div>
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
  const [photoError, setPhotoError] = useState('');
  const [nudging, setNudging] = useState(false);
  const [nudgeMsg, setNudgeMsg] = useState('');

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
    setUploading(true);
    try {
      const body = new FormData();
      files.forEach((f) => body.append('fotos', f));
      const { data } = await client.post(`/citas/${id}/mi-entrada/fotos`, body);
      setCita(data);
    } catch (err) {
      setUploadError(err.response?.data?.error || 'No se pudieron subir las fotos');
    } finally {
      setUploading(false);
    }
  }

  async function handleDeletePhoto(photo) {
    if (!confirm('¿Borrar esta foto?')) return;
    setPhotoError('');
    try {
      const { data } = await client.delete(`/citas/${id}/fotos/${photo.id}`);
      setCita(data);
    } catch (err) {
      setPhotoError(err.response?.data?.error || 'No se pudo borrar la foto');
    }
  }

  async function handleDelete() {
    if (!confirm('¿Seguro que quieres borrar esta cita completa (ambas versiones)?')) return;
    setDeleteError('');
    try {
      await client.delete(`/citas/${id}`);
      navigate('/');
    } catch (err) {
      setDeleteError(err.response?.data?.error || 'No se pudo borrar la cita');
    }
  }

  async function handleNudge() {
    setNudging(true);
    setNudgeMsg('');
    try {
      await client.post(`/citas/${id}/nudge`);
      setNudgeMsg('✅ ¡Recordatorio enviado! Tu pareja recibirá un correo.');
    } catch (err) {
      setNudgeMsg(err.response?.data?.error || 'No se pudo enviar el recordatorio');
    } finally {
      setNudging(false);
    }
  }

  if (error) {
    return (
      <Layout>
        <p className="alert alert-danger">{error}</p>
      </Layout>
    );
  }

  if (!cita) {
    return (
      <Layout>
        <div className="mx-auto max-w-xl space-y-4">
          <div className="skeleton h-40 rounded-3xl" />
          <div className="skeleton h-64 rounded-3xl" />
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

  return (
    <Layout>
      {/* ---------- Barra de acciones ---------- */}
      <div className="mb-8 flex flex-col gap-3">
        <button
          type="button"
          onClick={handleBack}
          className="btn btn-ghost btn-sm self-start"
        >
          <ArrowLeft className="h-4 w-4" strokeWidth={1.75} />
          Volver
        </button>

        <div className="flex flex-wrap items-center gap-2 sm:justify-end">
          {user.role === 'ADMIN' && (
            <Link to={`/citas/${cita.id}/editar`} className="btn btn-ghost btn-sm">
              <Pencil className="h-4 w-4" strokeWidth={1.75} />
              Editar cita
            </Link>
          )}
          <Link to={`/citas/${cita.id}/mi-entrada`} className="btn btn-secondary btn-sm">
            <PenLine className="h-4 w-4" strokeWidth={1.75} />
            {myEntry ? 'Editar mi versión' : 'Agregar mi versión'}
          </Link>
          {user.role === 'ADMIN' && (
            <button onClick={handleDelete} className="btn btn-danger btn-sm">
              <Trash2 className="h-4 w-4" strokeWidth={1.75} />
              Borrar cita
            </button>
          )}
        </div>
      </div>

      {/* ---------- Hero de la cita ---------- */}
      <section className="surface-glass surface-accent fade-in-up mx-auto mb-10 max-w-xl px-6 py-8 text-center sm:px-10">
        <p className="eyebrow">{fecha}</p>

        <h2 className="mt-2 font-display text-3xl font-bold leading-tight text-ink-strong sm:text-4xl">
          <span className="title-gold">{cita.nombre}</span>
        </h2>

        <p className="mt-2 text-sm text-ink">{cita.lugar}</p>

        <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
          <span className="chip">
            ¿Repetiríamos?
            <strong className="text-ink-dark">{REPETIRIAMOS_LABEL[cita.repetiriamos]}</strong>
          </span>
          {promedio > 0 && (
            <span className="chip chip-gold">Promedio {promedio.toFixed(1)}</span>
          )}
        </div>

        {promedio > 0 && (
          <div className="mt-4 flex justify-center">
            <HeartRating value={Math.round(promedio)} readOnly />
          </div>
        )}

        {bothTold && (
          <p className="mt-4 text-xs text-ink/70">
            Ya no se puede borrar: las dos versiones fueron contadas 💛
          </p>
        )}
        {deleteError && <p className="alert alert-danger mt-4">{deleteError}</p>}
      </section>

      {/* ---------- Fotos ---------- */}
      <div className="mx-auto mb-2 max-w-lg">
        <Carousel photos={allPhotos} alt={cita.nombre} onDelete={handleDeletePhoto} />
      </div>
      {photoError && <p className="alert alert-danger mx-auto max-w-md">{photoError}</p>}

      {myEntry ? (
        <div className="mb-12 mt-4 flex flex-col items-center">
          <label className="btn btn-secondary btn-sm cursor-pointer">
            <ImagePlus className="h-4 w-4" strokeWidth={1.75} />
            {uploading ? 'Subiendo...' : 'Agregar fotos'}
            <input
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              disabled={uploading}
              onChange={handleAddPhotos}
            />
          </label>
          {uploadError && <p className="alert alert-danger mt-3">{uploadError}</p>}
        </div>
      ) : (
        <div className="mb-12" />
      )}

      {/* ---------- Versiones ---------- */}
      {cita.entries.length === 0 && (
        <div className="surface mx-auto max-w-md border-dashed p-8 text-center">
          <p className="text-sm text-ink">
            Nadie ha contado su versión de esta cita todavía.
          </p>
        </div>
      )}

      {/* Botón de recordatorio cuando falta la versión de la pareja */}
      {myEntry && !bothTold && (
        <div className="mx-auto mb-8 max-w-md surface surface-accent rounded-2xl px-5 py-4 text-center">
          <p className="text-sm text-ink mb-3">
            Tu pareja aún no ha escrito su versión de esta cita.
          </p>
          <button
            type="button"
            onClick={handleNudge}
            disabled={nudging}
            className="btn btn-secondary btn-sm inline-flex items-center gap-2"
          >
            <Bell className="h-4 w-4" strokeWidth={1.75} />
            {nudging ? 'Enviando...' : 'Recordar a mi pareja 💌'}
          </button>
          {nudgeMsg && (
            <p className={`mt-3 text-xs ${nudgeMsg.startsWith('✅') ? 'text-green-600' : 'text-red-400'}`}>
              {nudgeMsg}
            </p>
          )}
        </div>
      )}

      <div className="mx-auto grid max-w-3xl gap-x-10 gap-y-16 px-2 md:grid-cols-2">
        {cita.entries.map((entry, i) => (
          <EntryView key={entry.id} entry={entry} delay={i * 0.12} index={i} />
        ))}
      </div>
    </Layout>
  );
}
