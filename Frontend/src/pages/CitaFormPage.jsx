import { useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import client from '../api/client';
import Layout from '../components/Layout';
import PageHeader from '../components/PageHeader';
import EntryFields, { inputClass, labelClass } from '../components/EntryFields';
import RepetiriamosField from '../components/RepetiriamosField';
import Field from '../components/ui/Field';
import StatusMessage from '../components/ui/StatusMessage';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import useUnsavedChanges from '../hooks/useUnsavedChanges';

const emptyEntry = {
  valoracion: 0,
  queHicimos: '',
  comoTeSentiste: '',
  loQueMasGusto: '',
  loQueMenosGusto: '',
  intimidad: false,
};

const VALORACION_REQUERIDA = 'Elige una valoración de al menos 1 corazón.';

export default function CitaFormPage() {
  const navigate = useNavigate();
  const [nombre, setNombre] = useState('');
  const [fecha, setFecha] = useState('');
  const [lugar, setLugar] = useState('');
  const [repetiriamos, setRepetiriamos] = useState('SI');
  const [entry, setEntry] = useState(emptyEntry);
  const [fotos, setFotos] = useState([]);
  const [error, setError] = useState('');
  const [valoracionError, setValoracionError] = useState('');
  const [loading, setLoading] = useState(false);
  const ratingRef = useRef(null);

  const isDirty =
    Boolean(nombre || fecha || lugar || fotos.length) ||
    repetiriamos !== 'SI' ||
    Object.keys(emptyEntry).some((k) => entry[k] !== emptyEntry[k]);
  const unsaved = useUnsavedChanges(isDirty);

  function updateEntry(next) {
    setEntry(next);
    setValoracionError('');
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    if (!entry.valoracion) {
      setValoracionError(VALORACION_REQUERIDA);
      ratingRef.current?.querySelector('[role="radio"][tabindex="0"]')?.focus();
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
      unsaved.allowNavigation(); // guardado: salir ya no pierde nada
      navigate(`/citas/${data.id}`);
    } catch (err) {
      setError(err.response?.data?.error || 'No se pudo guardar la cita. Revisa los datos y vuelve a intentarlo.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Layout>
      <PageHeader
        title="Nueva cita"
        subtitle="Cuenta tu versión ahora; tu pareja podrá agregar la suya después."
      />

      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        <section aria-labelledby="cita-datos" className="surface p-5 sm:p-6">
          <h2 id="cita-datos" className="font-display text-lg font-semibold text-ink-strong">
            La cita
          </h2>
          <p className="mt-1 text-sm text-ink">
            Se guarda una sola vez para los dos.
          </p>

          <div className="mt-5 grid gap-5 sm:grid-cols-2">
            <Field label="Nombre de la cita" labelClassName={labelClass} className="min-w-0">
              {(field) => (
                <input
                  {...field}
                  name="nombre"
                  required
                  autoComplete="off"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  placeholder="Nuestra primera cita…"
                  className={inputClass}
                />
              )}
            </Field>

            <Field label="Fecha" labelClassName={labelClass} className="min-w-0">
              {(field) => (
                <input
                  {...field}
                  name="fecha"
                  type="date"
                  required
                  value={fecha}
                  onChange={(e) => setFecha(e.target.value)}
                  className={inputClass}
                />
              )}
            </Field>

            <Field label="Lugar" labelClassName={labelClass} className="min-w-0">
              {(field) => (
                <input
                  {...field}
                  name="lugar"
                  required
                  autoComplete="off"
                  value={lugar}
                  onChange={(e) => setLugar(e.target.value)}
                  placeholder="El café de la esquina…"
                  className={inputClass}
                />
              )}
            </Field>

            <RepetiriamosField value={repetiriamos} onChange={setRepetiriamos} legendClassName={labelClass} />
          </div>
        </section>

        <section aria-labelledby="cita-version" className="surface p-5 sm:p-6">
          <h2 id="cita-version" className="font-display text-lg font-semibold text-ink-strong">
            Tu versión
          </h2>
          <p className="mb-5 mt-1 text-sm text-ink">
            Solo la tuya: tu pareja contará la suya después.
          </p>
          <EntryFields
            entry={entry}
            setEntry={updateEntry}
            fotos={fotos}
            setFotos={setFotos}
            valoracionError={valoracionError}
            ratingRef={ratingRef}
          />
        </section>

        <StatusMessage tone="error" className="alert alert-danger">
          {error}
        </StatusMessage>

        <div className="form-actions">
          <button type="submit" disabled={loading} className="btn btn-primary btn-lg">
            {loading ? 'Guardando…' : 'Guardar cita'}
          </button>
          <Link to="/" className="btn btn-ghost btn-lg">
            Cancelar
          </Link>
        </div>
      </form>

      <ConfirmDialog {...unsaved.dialogProps} />
    </Layout>
  );
}
