import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import client from '../api/client';
import Layout from '../components/Layout';
import PageHeader from '../components/PageHeader';
import CitaCard from '../components/CitaCard';
import Pagination from '../components/Pagination';

const PAGE_SIZE = 10;

export default function CitasListPage() {
  const [citas, setCitas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    setLoading(true);
    client
      .get('/citas', { params: { page, limit: PAGE_SIZE } })
      .then(({ data }) => {
        setCitas(data.citas);
        setTotalPages(data.totalPages);
      })
      .catch(() => setError('No se pudieron cargar las citas'))
      .finally(() => setLoading(false));
  }, [page]);

  function goToPage(p) {
    setPage(p);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  return (
    <Layout>
      <PageHeader
        eyebrow="Nuestro álbum"
        title="Nuestras citas"
        subtitle="Cada polaroid guarda dos versiones de la misma noche."
        actions={
          <Link to="/citas/nueva" className="btn btn-primary">
            + Nueva cita
          </Link>
        }
      />

      {loading && (
        <div className="grid grid-cols-1 gap-x-8 gap-y-12 px-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="skeleton aspect-[3/4] rounded-md" />
          ))}
        </div>
      )}

      {error && <p className="alert alert-danger">{error}</p>}

      {!loading && !error && citas.length === 0 && (
        <div className="surface flex flex-col items-center gap-3 border-dashed p-12 text-center">
          <span className="text-4xl">💫</span>
          <p className="font-display text-lg text-ink-strong">Todavía no hay citas</p>
          <p className="max-w-sm text-sm text-ink">
            Aún no han registrado ninguna cita. ¡Empiecen hoy y guarden su primer recuerdo!
          </p>
          <Link to="/citas/nueva" className="btn btn-primary mt-2">
            Crear la primera cita
          </Link>
        </div>
      )}

      <div className="grid grid-cols-1 gap-x-8 gap-y-12 px-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {citas.map((cita, i) => (
          <div key={cita.id} className="fade-in-up" style={{ animationDelay: `${i * 0.06}s` }}>
            <CitaCard cita={cita} />
          </div>
        ))}
      </div>

      <Pagination page={page} totalPages={totalPages} onChange={goToPage} />
    </Layout>
  );
}
