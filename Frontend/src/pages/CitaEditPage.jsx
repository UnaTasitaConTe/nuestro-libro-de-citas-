import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import client from '../api/client';
import Layout from '../components/Layout';
import PageHeader from '../components/PageHeader';
import { inputClass, labelClass } from '../components/EntryFields';
import RepetiriamosField from '../components/RepetiriamosField';
import Field from '../components/ui/Field';
import StatusMessage from '../components/ui/StatusMessage';

export default function CitaEditPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [nombre, setNombre] = useState('');
  const [fecha, setFecha] = useState('');
  const [lugar, setLugar] = useState('');
  const [repetiriamos, setRepetiriamos] = useState('SI');
  const [loaded, setLoaded] = useState(false);
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
        setLoaded(true);
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
      setError(err.response?.data?.error || 'No se pudieron guardar los cambios. Vuelve a intentarlo.');
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

  return (
    <Layout>
      <PageHeader title="Editar cita" subtitle="Cambia los datos que comparten los dos." />

      {!loaded ? (
        <div className="max-w-xl space-y-4" aria-busy="true">
          <p role="status" className="sr-only">Cargando la cita…</p>
          <div className="skeleton h-64 rounded-3xl" />
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="flex max-w-xl flex-col gap-6">
          <div className="surface grid gap-5 p-5 sm:grid-cols-2 sm:p-6">
            <Field label="Nombre de la cita" labelClassName={labelClass} className="min-w-0">
              {(field) => (
                <input
                  {...field}
                  name="nombre"
                  required
                  autoComplete="off"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
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
                  className={inputClass}
                />
              )}
            </Field>

            <RepetiriamosField value={repetiriamos} onChange={setRepetiriamos} legendClassName={labelClass} />
          </div>

          <p className="alert alert-info">
            Esto solo cambia los datos compartidos de la cita. Cada versión personal se edita desde{' '}
            <Link to={`/citas/${id}/mi-entrada`} className="font-semibold text-royal-light underline underline-offset-4">
              Editar mi versión
            </Link>
            .
          </p>

          <StatusMessage tone="error" className="alert alert-danger">
            {error}
          </StatusMessage>

          <div className="form-actions">
            <button type="submit" disabled={loading} className="btn btn-primary btn-lg">
              {loading ? 'Guardando…' : 'Guardar cambios'}
            </button>
            <Link to={`/citas/${id}`} className="btn btn-ghost btn-lg">
              Cancelar
            </Link>
          </div>
        </form>
      )}
    </Layout>
  );
}
