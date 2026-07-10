import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import client from '../api/client';
import Layout from '../components/Layout';
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
      <div className="flex items-center justify-between mb-8">
        <h2 className="font-display text-xl sm:text-2xl text-ink-dark">Nuestras citas</h2>
        <Link
          to="/citas/nueva"
          className="rounded-full bg-gradient-to-r from-ink-dark to-amber-400 text-paper font-display font-semibold px-5 py-2 text-sm shadow-[0_4px_20px_rgba(255,204,51,0.35)] hover:shadow-[0_4px_28px_rgba(255,204,51,0.5)] hover:scale-[1.03] active:scale-[0.98] transition-all"
        >
          + Nueva cita
        </Link>
      </div>

      {loading && <p className="text-ink">Cargando...</p>}
      {error && <p className="text-red-400">{error}</p>}

      {!loading && !error && citas.length === 0 && (
        <div className="rounded-3xl border border-dashed border-line p-10 text-center">
          <p className="text-ink">Aún no han registrado ninguna cita. ¡Empiecen hoy!</p>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-x-8 gap-y-12 px-2">
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
