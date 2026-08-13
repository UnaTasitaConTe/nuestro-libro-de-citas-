import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import client from '../api/client';
import { useAuth } from '../context/AuthContext';
import Layout from '../components/Layout';
import PageHeader from '../components/PageHeader';
import EntryFields from '../components/EntryFields';
import { REPETIRIAMOS_LABEL } from '../constants/repetiriamos';
import { formatFecha } from '../utils/date';

const emptyEntry = {
  valoracion: 0,
  queHicimos: '',
  comoTeSentiste: '',
  loQueMasGusto: '',
  loQueMenosGusto: '',
};

export default function EntryFormPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [cita, setCita] = useState(null);
  const [entry, setEntry] = useState(emptyEntry);
  const [fotos, setFotos] = useState([]);
  const [existingPhotos, setExistingPhotos] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

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
        });
        setExistingPhotos(mine.photos || []);
      }
    });
  }, [id, user.id]);

  async function handleRemoveExisting(photoId) {
    if (!confirm('¿Borrar esta foto?')) return;
    setError('');
    try {
      const { data } = await client.delete(`/citas/${id}/fotos/${photoId}`);
      const mine = data.entries.find((e) => e.user_id === user.id);
      setExistingPhotos(mine?.photos || []);
    } catch (err) {
      setError(err.response?.data?.error || 'No se pudo borrar la foto');
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    if (!entry.valoracion) {
      setError('Elige una valoración de al menos 1 corazón');
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
      fotos.forEach((f) => body.append('fotos', f));

      await client.put(`/citas/${id}/mi-entrada`, body);
      navigate(`/citas/${id}`);
    } catch (err) {
      setError(err.response?.data?.error || 'Error al guardar tu entrada');
    } finally {
      setLoading(false);
    }
  }

  if (!cita) {
    return (
      <Layout>
        <div className="space-y-4">
          <div className="skeleton h-24 rounded-3xl" />
          <div className="skeleton h-72 rounded-3xl" />
        </div>
      </Layout>
    );
  }

  const fecha = formatFecha(cita.fecha);

  return (
    <Layout>
      <PageHeader eyebrow="Tu voz" title="Mi versión de la cita 💛" />

      <div className="surface surface-accent mb-6 px-5 py-4">
        <p className="font-display text-lg font-semibold text-ink-strong">{cita.nombre}</p>
        <p className="mt-1 text-sm text-ink">
          {fecha} · {cita.lugar} · {REPETIRIAMOS_LABEL[cita.repetiriamos]}
        </p>
      </div>

      {error && <p className="alert alert-danger mb-6">{error}</p>}

      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        <EntryFields
          entry={entry}
          setEntry={setEntry}
          fotos={fotos}
          setFotos={setFotos}
          existingPhotos={existingPhotos}
          onRemoveExisting={handleRemoveExisting}
        />

        <div className="form-actions">
          <button type="submit" disabled={loading} className="btn btn-primary btn-lg">
            {loading ? 'Guardando...' : 'Guardar mi versión'}
          </button>
        </div>
      </form>
    </Layout>
  );
}
