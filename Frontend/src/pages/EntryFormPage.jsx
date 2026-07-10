import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import client from '../api/client';
import { useAuth } from '../context/AuthContext';
import Layout from '../components/Layout';
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
        <p className="text-ink">Cargando...</p>
      </Layout>
    );
  }

  const fecha = formatFecha(cita.fecha);

  return (
    <Layout>
      <h2 className="font-display text-xl sm:text-2xl mb-2 text-ink-dark">Mi versión de la cita 💛</h2>
      <div className="text-sm text-ink mb-6 rounded-xl bg-card/60 border border-line px-4 py-3">
        <p className="text-ink-dark font-display mb-1">{cita.nombre}</p>
        <p>
          {fecha} · {cita.lugar} · {REPETIRIAMOS_LABEL[cita.repetiriamos]}
        </p>
      </div>

      {error && <p className="text-red-400 mb-4">{error}</p>}

      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        <EntryFields
          entry={entry}
          setEntry={setEntry}
          fotos={fotos}
          setFotos={setFotos}
          existingPhotos={existingPhotos}
          onRemoveExisting={handleRemoveExisting}
        />

        <div>
          <button
            type="submit"
            disabled={loading}
            className="rounded-full bg-gradient-to-r from-ink-dark to-amber-400 text-paper font-display font-semibold px-8 py-2.5 shadow-[0_4px_20px_rgba(255,204,51,0.35)] hover:shadow-[0_4px_28px_rgba(255,204,51,0.5)] hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 transition-all"
          >
            {loading ? 'Guardando...' : 'Guardar mi versión'}
          </button>
        </div>
      </form>
    </Layout>
  );
}
