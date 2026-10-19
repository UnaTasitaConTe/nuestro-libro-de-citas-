import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ImageOff } from 'lucide-react';
import client from '../api/client';
import Layout from '../components/Layout';
import PageHeader from '../components/PageHeader';
import Pagination from '../components/Pagination';
import Lightbox from '../components/ui/Lightbox';
import StatusMessage from '../components/ui/StatusMessage';
import usePageParam from '../hooks/usePageParam';
import { formatFecha } from '../utils/date';
import { scrollToTop } from '../utils/scroll';

const PAGE_SIZE = 24;
const countFormat = new Intl.NumberFormat('es');

function fotosLabel(n) {
  return `${countFormat.format(n)} ${n === 1 ? 'foto' : 'fotos'}`;
}

function GalleryImage({ photo, onClick }) {
  const imgRef = useRef(null);
  const [visible, setVisible] = useState(false);
  const fecha = formatFecha(photo.cita_fecha);

  useEffect(() => {
    const el = imgRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: '200px' }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <button
      ref={imgRef}
      type="button"
      onClick={onClick}
      // Nombre único y descriptivo (antes se leía "Picnic Picnic 2 de mayo…").
      aria-label={`Ampliar foto de ${photo.cita_nombre}, ${fecha}`}
      className="group relative block aspect-square w-full overflow-hidden rounded-xl border border-line bg-card/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-ink-dark focus-visible:ring-offset-2 focus-visible:ring-offset-paper"
    >
      {visible && (
        <img
          src={photo.thumb_url || photo.foto_url}
          alt=""
          loading="lazy"
          decoding="async"
          className="h-full w-full object-cover transition-transform duration-300 motion-safe:group-hover:scale-105"
        />
      )}
      {/* Pie visible con ratón al pasar o enfocar, y siempre en táctil (no hay hover). */}
      <span
        aria-hidden="true"
        className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 to-transparent px-2.5 pb-2 pt-8 text-left opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100 pointer-coarse:opacity-100"
      >
        <span className="block truncate text-xs font-medium text-white">{photo.cita_nombre}</span>
        <span className="block text-[11px] text-white/75">{fecha}</span>
      </span>
    </button>
  );
}

export default function GaleriaPage() {
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);
  const [page, setPage] = usePageParam();
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [lightboxIdx, setLightboxIdx] = useState(null);
  // Separado de lightboxIdx: la foto sigue visible durante la animación de cierre.
  const [lightboxOpen, setLightboxOpen] = useState(false);

  useEffect(() => {
    setLoading(true);
    setError('');
    client
      .get('/citas/gallery', { params: { page, limit: PAGE_SIZE } })
      .then(({ data }) => {
        setPhotos(data.photos);
        setTotalPages(data.totalPages);
        setTotal(data.total);
      })
      .catch(() => setError('No se pudieron cargar las fotos'))
      .finally(() => setLoading(false));
  }, [page, reloadKey]);

  function goToPage(p) {
    setPage(p);
    setLightboxOpen(false);
    scrollToTop();
  }

  const openLightbox = useCallback((idx) => {
    setLightboxIdx(idx);
    setLightboxOpen(true);
  }, []);
  const closeLightbox = useCallback(() => setLightboxOpen(false), []);
  const prevPhoto = useCallback(() => {
    setLightboxIdx((i) => (i > 0 ? i - 1 : photos.length - 1));
  }, [photos.length]);
  const nextPhoto = useCallback(() => {
    setLightboxIdx((i) => (i < photos.length - 1 ? i + 1 : 0));
  }, [photos.length]);

  const current = lightboxIdx !== null ? photos[lightboxIdx] : null;
  const summary = loading || error ? '' : totalPages > 1 ? `Página ${page} de ${totalPages}, ${fotosLabel(photos.length)}` : fotosLabel(photos.length);

  return (
    <Layout>
      <PageHeader
        title="Galería"
        subtitle={total > 0 ? `${fotosLabel(total)} de todas sus citas.` : 'Todas las fotos de sus citas en un solo lugar.'}
      />

      <StatusMessage className="sr-only">{loading ? 'Cargando fotos…' : summary}</StatusMessage>

      <StatusMessage tone="error" className="alert alert-danger">
        {error && (
          <>
            {error}. Revisa tu conexión y{' '}
            <button
              type="button"
              onClick={() => setReloadKey((k) => k + 1)}
              className="font-semibold underline underline-offset-4"
            >
              vuelve a intentarlo
            </button>
            .
          </>
        )}
      </StatusMessage>

      {loading && (
        <div aria-hidden="true" className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="skeleton aspect-square rounded-xl" />
          ))}
        </div>
      )}

      {!loading && !error && photos.length === 0 && (
        <div className="surface flex flex-col items-center gap-3 border-dashed p-12 text-center">
          <ImageOff aria-hidden="true" className="h-9 w-9 text-ink/70" strokeWidth={1.5} />
          <p className="font-display text-lg text-ink-strong">Todavía no hay fotos</p>
          <p className="max-w-sm text-sm text-ink">
            Las fotos que agreguen a sus citas aparecerán aquí.
          </p>
          <Link to="/" className="btn btn-secondary btn-sm mt-2 pointer-coarse:min-h-11">
            Ir a sus citas
          </Link>
        </div>
      )}

      {!loading && !error && photos.length > 0 && (
        <ul aria-label="Fotos" className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
          {photos.map((photo, idx) => (
            <li key={photo.id}>
              <GalleryImage photo={photo} onClick={() => openLightbox(idx)} />
            </li>
          ))}
        </ul>
      )}

      <Pagination page={page} totalPages={totalPages} onChange={goToPage} />

      <Lightbox
        open={lightboxOpen && Boolean(current)}
        onClose={closeLightbox}
        src={current?.foto_url}
        alt={current ? `Foto de ${current.cita_nombre}` : ''}
        onPrev={photos.length > 1 ? prevPhoto : undefined}
        onNext={photos.length > 1 ? nextPhoto : undefined}
        caption={
          current && (
            <>
              <Link
                to={`/citas/${current.cita_id}`}
                className="text-sm text-white/85 underline underline-offset-2 transition-colors hover:text-white"
                onClick={closeLightbox}
              >
                {current.cita_nombre}
              </Link>
              <p className="mt-0.5 text-xs text-white/60">{formatFecha(current.cita_fecha)}</p>
            </>
          )
        }
      />
    </Layout>
  );
}
