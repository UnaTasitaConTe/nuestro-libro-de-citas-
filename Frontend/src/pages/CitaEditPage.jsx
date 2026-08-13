import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import client from '../api/client';
import Layout from '../components/Layout';
import { inputClass } from '../components/EntryFields';
import { REPETIRIAMOS_OPTIONS } from '../constants/repetiriamos';

export default function CitaEditPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [nombre, setNombre] = useState('');
  const [fecha, setFecha] = useState('');
  const [lugar, setLugar] = useState('');
  const [repetiriamos, setRepetiriamos] = useState('SI');
  const [loadError, setLoadError] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    client
      .get(`/citas/${id}`)
      .then(({ data }) => {
        setNombre(data.nombre);
        setFecha(data.fecha.slice(0, 10));
        setLugar(data.lugar);
        setRepetiriamos(data.repetiriamos);
      })
      .catch(() => setLoadError('No se pudo cargar la cita'));
  }, [id]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await client.patch(`/citas/${id}`, { nombre, fecha, lugar, repetiriamos });
      navigate(`/citas/${id}`);
    } catch (err) {
      setError(err.response?.data?.error || 'Error al guardar los cambios');
    } finally {
      setLoading(false);
    }
  }

  if (loadError) {
    return (
      <Layout>
        <p className="text-red-400">{loadError}</p>
      </Layout>
    );
  }

  return (
    <Layout>
      <h2 className="font-display text-xl sm:text-2xl mb-6 text-ink-dark">Editar cita ✏️</h2>

      {error && <p className="text-red-400 mb-4">{error}</p>}

      <form onSubmit={handleSubmit} className="flex flex-col gap-6 max-w-xl">
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm mb-1 text-ink">Nombre de la cita</label>
            <input
              required
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              className={inputClass}
            />
          </div>

          <div>
            <label className="block text-sm mb-1 text-ink">Fecha</label>
            <input
              type="date"
              required
              value={fecha}
              onChange={(e) => setFecha(e.target.value)}
              className={inputClass}
            />
          </div>

          <div>
            <label className="block text-sm mb-1 text-ink">Lugar</label>
            <input required value={lugar} onChange={(e) => setLugar(e.target.value)} className={inputClass} />
          </div>

          <div>
            <label className="block text-sm mb-1 text-ink">¿Repetiríamos?</label>
            <div className="flex flex-wrap gap-2">
              {REPETIRIAMOS_OPTIONS.map((opt) => (
                <label
                  key={opt.value}
                  className={`flex items-center gap-2 text-sm rounded-full border px-3 py-1.5 cursor-pointer transition-colors ${
                    repetiriamos === opt.value
                      ? 'border-ink-dark bg-ink-dark/10 text-ink-dark'
                      : 'border-line text-ink hover:border-ink-dark/50'
                  }`}
                >
                  <input
                    type="radio"
                    name="repetiriamos"
                    value={opt.value}
                    checked={repetiriamos === opt.value}
                    onChange={() => setRepetiriamos(opt.value)}
                    className="accent-[color:var(--color-ink-dark)]"
                  />
                  {opt.label}
                </label>
              ))}
            </div>
          </div>
        </div>

        <p className="text-sm text-ink rounded-xl bg-royal-light/10 border border-royal-light/20 px-4 py-3">
          Esto solo cambia los datos compartidos de la cita. Las versiones personales de cada quien
          se editan desde "editar mi versión".
        </p>

        <div>
          <button
            type="submit"
            disabled={loading}
            className="rounded-full bg-gradient-to-r from-ink-dark to-amber-400 text-paper font-display font-semibold px-8 py-2.5 shadow-[0_4px_20px_rgba(255,204,51,0.35)] hover:shadow-[0_4px_28px_rgba(255,204,51,0.5)] hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 transition-all"
          >
            {loading ? 'Guardando...' : 'Guardar cambios'}
          </button>
        </div>
      </form>
    </Layout>
  );
}
