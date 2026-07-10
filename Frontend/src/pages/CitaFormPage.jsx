import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import client from '../api/client';
import Layout from '../components/Layout';
import EntryFields, { inputClass } from '../components/EntryFields';
import { REPETIRIAMOS_OPTIONS } from '../constants/repetiriamos';

const emptyEntry = {
  valoracion: 0,
  queHicimos: '',
  comoTeSentiste: '',
  loQueMasGusto: '',
  loQueMenosGusto: '',
};

export default function CitaFormPage() {
  const navigate = useNavigate();
  const [nombre, setNombre] = useState('');
  const [fecha, setFecha] = useState('');
  const [lugar, setLugar] = useState('');
  const [repetiriamos, setRepetiriamos] = useState('SI');
  const [entry, setEntry] = useState(emptyEntry);
  const [fotos, setFotos] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

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
      body.append('nombre', nombre);
      body.append('fecha', fecha);
      body.append('lugar', lugar);
      body.append('repetiriamos', repetiriamos);
      body.append('valoracion', entry.valoracion);
      body.append('queHicimos', entry.queHicimos);
      body.append('comoTeSentiste', entry.comoTeSentiste);
      body.append('loQueMasGusto', entry.loQueMasGusto);
      body.append('loQueMenosGusto', entry.loQueMenosGusto);
      fotos.forEach((f) => body.append('fotos', f));

      const { data } = await client.post('/citas', body);
      navigate(`/citas/${data.id}`);
    } catch (err) {
      setError(err.response?.data?.error || 'Error al guardar la cita');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Layout>
      <h2 className="font-display text-xl sm:text-2xl mb-6 text-ink-dark">Nueva cita ✨</h2>

      {error && <p className="text-red-400 mb-4">{error}</p>}

      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm mb-1 text-ink">Nombre de la cita</label>
            <input
              required
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Ej: Nuestra primera cita"
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
          Nombre, fecha, lugar y "¿repetiríamos?" se guardan una sola vez para toda la cita. Lo
          demás es tu propia versión — tu pareja podrá agregar la suya después.
        </p>

        <EntryFields entry={entry} setEntry={setEntry} fotos={fotos} setFotos={setFotos} />

        <div>
          <button
            type="submit"
            disabled={loading}
            className="rounded-full bg-gradient-to-r from-ink-dark to-amber-400 text-paper font-display font-semibold px-8 py-2.5 shadow-[0_4px_20px_rgba(255,204,51,0.35)] hover:shadow-[0_4px_28px_rgba(255,204,51,0.5)] hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 transition-all"
          >
            {loading ? 'Guardando...' : 'Guardar cita'}
          </button>
        </div>
      </form>
    </Layout>
  );
}
