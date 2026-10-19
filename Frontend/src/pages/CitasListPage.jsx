import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { BookHeart, Plus } from 'lucide-react';
import client from '../api/client';
import Layout from '../components/Layout';
import PageHeader from '../components/PageHeader';
import CitaCard from '../components/CitaCard';
import Pagination from '../components/Pagination';
import StatusMessage from '../components/ui/StatusMessage';
import usePageParam from '../hooks/usePageParam';
import { scrollToTop } from '../utils/scroll';

const PAGE_SIZE = 10;
// Escalonado de entrada corto (skill animate: 30–80 ms) y con tope.
const STAGGER_S = 0.05;
const MAX_STAGGER_ITEMS = 6;

export default function CitasListPage() {
  const [citas, setCitas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);
  const [page, setPage] = usePageParam();
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    setLoading(true);
    setError('');
    client
      .get('/citas', { params: { page, limit: PAGE_SIZE } })
      .then(({ data }) => {
        setCitas(data.citas);
        setTotalPages(data.totalPages);
      })
      .catch(() => setError('No se pudieron cargar las citas'))
      .finally(() => setLoading(false));
  }, [page, reloadKey]);

  function goToPage(p) {
    setPage(p);
    scrollToTop();
  }

  const summary =
    loading || error
      ? ''
      : totalPages > 1
        ? `Página ${page} de ${totalPages}: ${citas.length} ${citas.length === 1 ? 'cita' : 'citas'}`
        : `${citas.length} ${citas.length === 1 ? 'cita' : 'citas'}`;

  return (
    <Layout>
      <PageHeader
        title="Nuestras citas"
        subtitle="Cada polaroid guarda dos versiones de la misma noche."
        actions={
          <Link to="/citas/nueva" className="btn btn-primary pointer-coarse:min-h-11">
            <Plus aria-hidden="true" className="h-4 w-4" strokeWidth={2} />
            Nueva cita
          </Link>
        }
      />

      <StatusMessage className="sr-only">{loading ? 'Cargando citas…' : summary}</StatusMessage>

      {loading && (
        <div
          aria-hidden="true"
          className="grid grid-cols-1 gap-x-8 gap-y-12 px-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5"
        >
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="skeleton aspect-[3/4] rounded-md" />
          ))}
        </div>
      )}

      {!loading && error && (
        <p role="alert" className="alert alert-danger">
          {error}. Revisa tu conexión y{' '}
          <button
            type="button"
            onClick={() => setReloadKey((k) => k + 1)}
            className="font-semibold underline underline-offset-4"
          >
            vuelve a intentarlo
          </button>
          .
        </p>
      )}

      {!loading && !error && citas.length === 0 && (
        <div className="surface flex flex-col items-center gap-3 border-dashed p-12 text-center">
          <BookHeart aria-hidden="true" className="h-9 w-9 text-ink-dark" strokeWidth={1.5} />
          <h2 className="font-display text-lg text-ink-strong">Su álbum está vacío</h2>
          <p className="max-w-sm text-sm text-ink">
            Registren su primera cita: cada uno podrá contar su versión y agregar fotos.
          </p>
          <Link to="/citas/nueva" className="btn btn-primary mt-2 pointer-coarse:min-h-11">
            Registrar la primera cita
          </Link>
        </div>
      )}

      {!loading && !error && citas.length > 0 && (
        <ul
          aria-label="Citas"
          className="grid grid-cols-1 gap-x-8 gap-y-12 px-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5"
        >
          {citas.map((cita, i) => (
            <li
              key={cita.id}
              className="fade-in-up"
              style={{ animationDelay: `${Math.min(i, MAX_STAGGER_ITEMS) * STAGGER_S}s` }}
            >
              <CitaCard cita={cita} />
            </li>
          ))}
        </ul>
      )}

      <Pagination page={page} totalPages={totalPages} onChange={goToPage} label="Páginas del álbum" />
    </Layout>
  );
}
