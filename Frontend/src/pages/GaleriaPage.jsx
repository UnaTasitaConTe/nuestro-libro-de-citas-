import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import client from '../api/client';
import Layout from '../components/Layout';
import PageHeader from '../components/PageHeader';
import Pagination from '../components/Pagination';
import Lightbox from '../components/ui/Lightbox';
import usePageParam from '../hooks/usePageParam';
import { formatFecha } from '../utils/date';

const PAGE_SIZE = 24;

function GalleryImage({ photo, onClick }) {
  const imgRef = useRef(null);
  const [visible, setVisible] = useState(false);

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
      className="group relative aspect-square w-full overflow-hidden rounded-xl border border-line bg-card/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-ink-dark/50"
    >
      {visible && (
        <img
          src={photo.thumb_url || photo.foto_url}
          alt={photo.cita_nombre}
          loading="lazy"
          decoding="async"
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
      )}
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent px-2.5 pb-2 pt-8 opacity-0 transition-opacity group-hover:opacity-100">
        <p className="truncate text-xs font-medium text-white">{photo.cita_nombre}</p>
        <p className="text-[10px] text-white/70">{formatFecha(photo.cita_fecha)}</p>
      </div>
    </button>
  );
}

export default function GaleriaPage() {
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = usePageParam();
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [lightboxIdx, setLightboxIdx] = useState(null);
  // Separado de lightboxIdx: la foto sigue visible durante la animación de cierre.
  const [lightboxOpen, setLightboxOpen] = useState(false);

  useEffect(() => {
    setLoading(true);
    client
      .get('/citas/gallery', { params: { page, limit: PAGE_SIZE } })
      .then(({ data }) => {
        setPhotos(data.photos);
        setTotalPages(data.totalPages);
        setTotal(data.total);
      })
      .catch(() => setError('No se pudieron cargar las fotos'))
      .finally(() => setLoading(false));
  }, [page]);

  function goToPage(p) {
    setPage(p);
    setLightboxOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
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

  return (
    <Layout>
      <PageHeader
        eyebrow="Recuerdos"
        title="Galería de fotos 📸"
        subtitle={total > 0 ? `${total} foto${total !== 1 ? 's' : ''} de todas sus citas.` : 'Todas las fotos de sus citas en un solo lugar.'}
      />

      {error && <p className="alert alert-danger">{error}</p>}

      {loading && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="skeleton aspect-square rounded-xl" />
          ))}
        </div>
      )}

      {!loading && !error && photos.length === 0 && (
        <div className="surface flex flex-col items-center gap-3 border-dashed p-12 text-center">
          <span className="text-4xl">📷</span>
          <p className="font-display text-lg text-ink-strong">No hay fotos todavía</p>
          <p className="max-w-sm text-sm text-ink">
            Las fotos que agreguen a sus citas aparecerán aquí.
          </p>
        </div>
      )}

      {!loading && !error && photos.length > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
          {photos.map((photo, idx) => (
            <GalleryImage
              key={photo.id}
              photo={photo}
              onClick={() => openLightbox(idx)}
            />
          ))}
        </div>
      )}

      <Pagination page={page} totalPages={totalPages} onChange={goToPage} />

      <Lightbox
        open={lightboxOpen && Boolean(current)}
        onClose={closeLightbox}
        src={current?.foto_url}
        alt={current?.cita_nombre}
        onPrev={photos.length > 1 ? prevPhoto : undefined}
        onNext={photos.length > 1 ? nextPhoto : undefined}
        caption={
          current && (
            <>
              <Link
                to={`/citas/${current.cita_id}`}
                className="text-sm text-white/80 underline underline-offset-2 transition-colors hover:text-white"
                onClick={closeLightbox}
              >
                {current.cita_nombre}
              </Link>
              <p className="mt-0.5 text-xs text-white/50">{formatFecha(current.cita_fecha)}</p>
            </>
          )
        }
      />
    </Layout>
  );
}
