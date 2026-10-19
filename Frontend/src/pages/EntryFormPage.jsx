import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { CalendarDays, MapPin } from 'lucide-react';
import client from '../api/client';
import { useAuth } from '../context/AuthContext';
import Layout from '../components/Layout';
import PageHeader from '../components/PageHeader';
import EntryFields from '../components/EntryFields';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import StatusMessage from '../components/ui/StatusMessage';
import { REPETIRIAMOS_LABEL } from '../constants/repetiriamos';
import { formatFecha } from '../utils/date';

const emptyEntry = {
  valoracion: 0,
  queHicimos: '',
  comoTeSentiste: '',
  loQueMasGusto: '',
  loQueMenosGusto: '',
  intimidad: false,
};

export default function EntryFormPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [cita, setCita] = useState(null);
  const [entry, setEntry] = useState(emptyEntry);
  const [fotos, setFotos] = useState([]);
  const [existingPhotos, setExistingPhotos] = useState([]);
  const [photoToDelete, setPhotoToDelete] = useState(null);
  const [error, setError] = useState('');
  const [loadError, setLoadError] = useState('');
  const [valoracionError, setValoracionError] = useState('');
  const [loading, setLoading] = useState(false);
  const ratingRef = useRef(null);

  function updateEntry(next) {
    setEntry(next);
    setValoracionError('');
  }

  useEffect(() => {
    client.get(`/citas/${id}`).then(({ data }) => {
      setCita(data);
      const mine = data.entries.find((e) => e.user_id === user.id);
      if (mine) {
        setEntry({
          valoracion: mine.valoracion,
          queHicimos: mine.que_hicimos || '',
          comoTeSentiste: mine.como_te_sentiste || '',
          loQueMasGusto: mine.lo_que_mas_gusto || '',
          loQueMenosGusto: mine.lo_que_menos_gusto || '',
          intimidad: mine.intimidad || false,
        });
        setExistingPhotos(mine.photos || []);
      }
    }).catch(() => setLoadError('No se pudo cargar la cita'));
  }, [id, user.id]);

  async function removeExistingPhoto() {
    setError('');
    try {
      const { data } = await client.delete(`/citas/${id}/fotos/${photoToDelete}`);
      const mine = data.entries.find((e) => e.user_id === user.id);
      setExistingPhotos(mine?.photos || []);
    } catch (err) {
      setError(err.response?.data?.error || 'No se pudo borrar la foto');
    } finally {
      setPhotoToDelete(null);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    if (!entry.valoracion) {
      setValoracionError('Elige una valoración de al menos 1 corazón.');
      ratingRef.current?.querySelector('[role="radio"][tabindex="0"]')?.focus();
      return;
    }

    setLoading(true);
    try {
      const body = new FormData();
      body.append('valoracion', entry.valoracion);
      body.append('queHicimos', entry.queHicimos);
      body.append('comoTeSentiste', entry.comoTeSentiste);
      body.append('loQueMasGusto', entry.loQueMasGusto);
      body.append('loQueMenosGusto', entry.loQueMenosGusto);
      body.append('intimidad', entry.intimidad);
      fotos.forEach((f) => body.append('fotos', f));

      await client.put(`/citas/${id}/mi-entrada`, body);
      navigate(`/citas/${id}`);
    } catch (err) {
      setError(err.response?.data?.error || 'No se pudo guardar tu versión. Vuelve a intentarlo.');
    } finally {
      setLoading(false);
    }
  }

  if (loadError) {
    return (
      <Layout>
        <div className="mx-auto max-w-xl">
          <p role="alert" className="alert alert-danger">
            {loadError}. Revisa tu conexión y vuelve a intentarlo.
          </p>
          <Link to={`/citas/${id}`} className="btn btn-ghost btn-sm mt-4">
            Volver a la cita
          </Link>
        </div>
      </Layout>
    );
  }

  if (!cita) {
    return (
      <Layout>
        <div className="space-y-4" aria-busy="true">
          <p role="status" className="sr-only">Cargando la cita…</p>
          <div className="skeleton h-24 rounded-3xl" />
          <div className="skeleton h-72 rounded-3xl" />
        </div>
      </Layout>
    );
  }

  const fecha = formatFecha(cita.fecha);

  return (
    <Layout>
      <PageHeader title="Mi versión de la cita" subtitle="Lo que tú viviste; tu pareja tiene su propio espacio." />

      <section aria-label="Cita" className="surface surface-accent mb-6 px-5 py-4">
        <p className="break-words font-display text-lg font-semibold text-ink-strong">{cita.nombre}</p>
        <p className="mt-1.5 flex flex-wrap items-center gap-x-5 gap-y-1 text-sm text-ink">
          <span className="inline-flex items-center gap-1.5">
            <CalendarDays className="h-4 w-4 shrink-0 text-royal-light" strokeWidth={1.75} />
            <time dateTime={cita.fecha.slice(0, 10)}>{fecha}</time>
          </span>
          <span className="inline-flex min-w-0 items-center gap-1.5">
            <MapPin className="h-4 w-4 shrink-0 text-royal-light" strokeWidth={1.75} />
            <span className="break-words">{cita.lugar}</span>
          </span>
          <span>
            ¿Repetiríamos? <strong className="text-ink-dark">{REPETIRIAMOS_LABEL[cita.repetiriamos]}</strong>
          </span>
        </p>
      </section>

      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        <div className="surface p-5 sm:p-6">
          <EntryFields
            entry={entry}
            setEntry={updateEntry}
            fotos={fotos}
            setFotos={setFotos}
            existingPhotos={existingPhotos}
            onRemoveExisting={setPhotoToDelete}
            valoracionError={valoracionError}
            ratingRef={ratingRef}
          />
        </div>

        <StatusMessage tone="error" className="alert alert-danger">
          {error}
        </StatusMessage>

        <div className="form-actions">
          <button type="submit" disabled={loading} className="btn btn-primary btn-lg">
            {loading ? 'Guardando…' : 'Guardar mi versión'}
          </button>
          <Link to={`/citas/${id}`} className="btn btn-ghost btn-lg">
            Cancelar
          </Link>
        </div>
      </form>

      <ConfirmDialog
        open={photoToDelete !== null}
        title="¿Borrar esta foto?"
        description="La foto se eliminará de tu versión de la cita. No se puede deshacer."
        confirmLabel="Borrar foto"
        busyLabel="Borrando…"
        onConfirm={removeExistingPhoto}
        onCancel={() => setPhotoToDelete(null)}
      />
    </Layout>
  );
}
