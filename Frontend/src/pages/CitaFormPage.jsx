import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import client from '../api/client';
import Layout from '../components/Layout';
import PageHeader from '../components/PageHeader';
import EntryFields, { inputClass } from '../components/EntryFields';
import { REPETIRIAMOS_OPTIONS } from '../constants/repetiriamos';

const emptyEntry = {
  valoracion: 0,
  queHicimos: '',
  comoTeSentiste: '',
  loQueMasGusto: '',
  loQueMenosGusto: '',
  intimidad: false,
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
      body.append('intimidad', entry.intimidad);
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
      <PageHeader
        eyebrow="Nuevo recuerdo"
        title="Nueva cita ✨"
        subtitle="Cuenta tu versión ahora; tu pareja podrá agregar la suya después."
      />

      {error && <p className="alert alert-danger mb-6">{error}</p>}

      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        <section className="surface p-5 sm:p-6">
          <div className="grid gap-5 sm:grid-cols-2">
            <div className="min-w-0">
              <label className="field-label" htmlFor="cita-nombre">
                Nombre de la cita
              </label>
              <input
                id="cita-nombre"
                required
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="Ej: Nuestra primera cita"
                className={inputClass}
              />
            </div>

            <div className="min-w-0">
              <label className="field-label" htmlFor="cita-fecha">
                Fecha
              </label>
              <input
                id="cita-fecha"
                type="date"
                required
                value={fecha}
                onChange={(e) => setFecha(e.target.value)}
                className={inputClass}
              />
            </div>

            <div className="min-w-0">
              <label className="field-label" htmlFor="cita-lugar">
                Lugar
              </label>
              <input
                id="cita-lugar"
                required
                value={lugar}
                onChange={(e) => setLugar(e.target.value)}
                placeholder="¿Dónde fue?"
                className={inputClass}
              />
            </div>

            <div className="min-w-0">
              <span className="field-label">¿Repetiríamos?</span>
              <div className="flex flex-wrap gap-2">
                {REPETIRIAMOS_OPTIONS.map((opt) => (
                  <label
                    key={opt.value}
                    className={`flex cursor-pointer items-center gap-2 rounded-full border px-3.5 py-2 text-sm transition-all duration-200 ${
                      repetiriamos === opt.value
                        ? 'border-ink-dark bg-ink-dark/10 text-ink-dark shadow-[0_0_0_3px_rgba(255,204,51,0.12)]'
                        : 'border-line text-ink hover:-translate-y-0.5 hover:border-ink-dark/50'
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
        </section>

        <p className="alert alert-info">
          Nombre, fecha, lugar y "¿repetiríamos?" se guardan una sola vez para toda la cita. Lo
          demás es tu propia versión — tu pareja podrá agregar la suya después.
        </p>

        <EntryFields entry={entry} setEntry={setEntry} fotos={fotos} setFotos={setFotos} />

        <div className="form-actions">
          <button type="submit" disabled={loading} className="btn btn-primary btn-lg">
            {loading ? 'Guardando...' : 'Guardar cita'}
          </button>
        </div>
      </form>
    </Layout>
  );
}
