import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import client from '../api/client';
import { useAuth } from '../context/AuthContext';
import Layout from '../components/Layout';
import HeartRating from '../components/HeartRating';
import Carousel from '../components/Carousel';
import { REPETIRIAMOS_LABEL } from '../constants/repetiriamos';
import { averageValoracion } from '../utils/rating';
import { formatFecha } from '../utils/date';

const ENTRY_TILTS = [-1.5, 1.5];

function EntryView({ entry, delay, index }) {
  return (
    <div
      className="polaroid-tilt fade-in-up relative bg-polaroid border border-ink-dark/30 rounded-sm p-5 sm:p-6 shadow-[0_14px_34px_rgba(0,0,0,0.45)] hover:shadow-[0_20px_40px_rgba(255,204,51,0.2)]"
      style={{ animationDelay: `${delay}s`, '--tilt': `${ENTRY_TILTS[index % ENTRY_TILTS.length]}deg` }}
    >
      <span className="washi-tape" aria-hidden="true" />

      <p className="font-hand text-3xl leading-none text-center text-polaroid-ink mb-4">{entry.user_name}</p>

      <p className="uppercase text-xs tracking-widest font-semibold text-royal-light mb-1">Valoración</p>
      <HeartRating value={entry.valoracion} readOnly />

      <div className="grid gap-4 pt-4 mt-4 border-t border-ink-dark/20">
        <div>
          <p className="uppercase text-xs tracking-widest font-semibold text-royal-light mb-1">Qué hicimos</p>
          <p className="whitespace-pre-wrap text-sm text-[#e9ecfb]">{entry.que_hicimos || '—'}</p>
        </div>
        <div>
          <p className="uppercase text-xs tracking-widest font-semibold text-royal-light mb-1">Cómo me sentí</p>
          <p className="whitespace-pre-wrap text-sm text-[#e9ecfb]">{entry.como_te_sentiste || '—'}</p>
        </div>
        <div>
          <p className="uppercase text-xs tracking-widest font-semibold text-royal-light mb-1">Lo que más me gustó</p>
          <p className="whitespace-pre-wrap text-sm text-[#e9ecfb]">{entry.lo_que_mas_gusto || '—'}</p>
        </div>
        <div>
          <p className="uppercase text-xs tracking-widest font-semibold text-royal-light mb-1">Lo que menos me gustó</p>
          <p className="whitespace-pre-wrap text-sm text-[#e9ecfb]">{entry.lo_que_menos_gusto || '—'}</p>
        </div>
      </div>
    </div>
  );
}

export default function CitaDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [cita, setCita] = useState(null);
  const [error, setError] = useState('');
  const [deleteError, setDeleteError] = useState('');
  const [uploadError, setUploadError] = useState('');
  const [uploading, setUploading] = useState(false);
  const [photoError, setPhotoError] = useState('');

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

  if (error) {
    return (
      <Layout>
        <p className="text-red-400">{error}</p>
      </Layout>
    );
  }

  if (!cita) {
    return (
      <Layout>
        <p className="text-ink">Cargando...</p>
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
      <div className="flex items-center justify-between mb-8">
        <Link to="/" className="text-sm rounded-full border border-line px-3 py-1 hover:border-ink-dark hover:text-ink-dark transition-colors">
          ← volver
        </Link>
        <div className="flex gap-3 text-sm">
          <Link
            to={`/citas/${cita.id}/mi-entrada`}
            className="rounded-full border border-royal-light/40 text-royal-light px-3 py-1 hover:bg-royal-light/10 transition-colors"
          >
            {myEntry ? 'editar mi versión' : 'agregar mi versión'}
          </Link>
          {!bothTold && (
            <button
              onClick={handleDelete}
              className="rounded-full border border-red-400/40 text-red-400 px-3 py-1 hover:bg-red-400/10 transition-colors"
            >
              borrar cita
            </button>
          )}
        </div>
      </div>

      <div className="max-w-xl mx-auto rounded-3xl bg-card/90 backdrop-blur-md border border-line px-6 py-8 sm:px-10 mb-8 shadow-[0_14px_36px_rgba(0,0,0,0.45)]">
        <h2 className="font-display text-2xl sm:text-3xl text-center mb-2 text-ink-dark drop-shadow-[0_0_10px_rgba(255,204,51,0.35)]">
          {cita.nombre}
        </h2>
        <p className="text-center text-[#e9ecfb] mb-1">
          {fecha} · {cita.lugar}
        </p>
        <p className="text-center text-[#e9ecfb]/85 text-sm mb-3">
          ¿Repetiríamos?{' '}
          <span className="text-ink-dark font-semibold">{REPETIRIAMOS_LABEL[cita.repetiriamos]}</span>
        </p>

        {promedio > 0 && (
          <div className="flex items-center justify-center gap-2">
            <HeartRating value={Math.round(promedio)} readOnly />
            <span className="text-sm text-[#e9ecfb]/85">promedio: {promedio.toFixed(1)}</span>
          </div>
        )}

        {bothTold && (
          <p className="text-center text-xs text-ink mt-3">
            Ya no se puede borrar: las dos versiones fueron contadas 💛
          </p>
        )}
        {deleteError && <p className="text-center text-red-400 text-sm mt-3">{deleteError}</p>}
      </div>

      <div className="max-w-lg mx-auto mb-1">
        <Carousel photos={allPhotos} alt={cita.nombre} onDelete={handleDeletePhoto} />
      </div>
      {photoError && <p className="text-center text-red-400 text-sm mb-3">{photoError}</p>}
      <div className="mb-3" />

      {myEntry && (
        <div className="flex flex-col items-center mb-10">
          <label className="cursor-pointer text-sm rounded-full border border-royal-light/40 text-royal-light px-4 py-1.5 hover:bg-royal-light/10 transition-colors">
            {uploading ? 'Subiendo...' : '+ agregar fotos'}
            <input
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              disabled={uploading}
              onChange={handleAddPhotos}
            />
          </label>
          {uploadError && <p className="text-red-400 text-sm mt-2">{uploadError}</p>}
        </div>
      )}
      {!myEntry && <div className="mb-10" />}

      {cita.entries.length === 0 && (
        <p className="text-ink text-center">Nadie ha contado su versión de esta cita todavía.</p>
      )}

      <div className="grid md:grid-cols-2 gap-x-10 gap-y-16 px-2 max-w-3xl mx-auto">
        {cita.entries.map((entry, i) => (
          <EntryView key={entry.id} entry={entry} delay={i * 0.12} index={i} />
        ))}
      </div>
    </Layout>
  );
}
