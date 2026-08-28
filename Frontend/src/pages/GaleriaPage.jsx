import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { X } from 'lucide-react';
import client from '../api/client';
import Layout from '../components/Layout';
import PageHeader from '../components/PageHeader';
import Pagination from '../components/Pagination';
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

function Lightbox({ photo, onClose, onPrev, onNext }) {
  useEffect(() => {
    function handleKey(e) {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') onPrev();
      if (e.key === 'ArrowRight') onNext();
    }
    document.addEventListener('keydown', handleKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleKey);
      document.body.style.overflow = '';
    };
  }, [onClose, onPrev, onNext]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/95"
      onClick={onClose}
    >
      <button
        type="button"
        onClick={onClose}
        className="absolute right-4 top-4 z-10 rounded-full bg-white/10 p-2 text-white hover:bg-white/20 transition"
        aria-label="Cerrar"
      >
        <X className="h-5 w-5" />
      </button>

      {/* Prev */}
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); onPrev(); }}
        className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full bg-white/10 px-3 py-2 text-2xl text-white hover:bg-white/20 transition"
        aria-label="Foto anterior"
      >
        ‹
      </button>

      {/* Image */}
      <div className="max-h-[85vh] max-w-[90vw]" onClick={(e) => e.stopPropagation()}>
        <img
          src={photo.foto_url}
          alt={photo.cita_nombre}
          className="max-h-[85vh] max-w-[90vw] rounded-lg object-contain shadow-2xl"
        />
        <div className="mt-3 text-center">
          <Link
            to={`/citas/${photo.cita_id}`}
            className="text-sm text-white/80 hover:text-white underline underline-offset-2 transition"
            onClick={onClose}
          >
            {photo.cita_nombre}
          </Link>
          <p className="text-xs text-white/50 mt-0.5">{formatFecha(photo.cita_fecha)}</p>
        </div>
      </div>

      {/* Next */}
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); onNext(); }}
        className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-white/10 px-3 py-2 text-2xl text-white hover:bg-white/20 transition"
        aria-label="Foto siguiente"
      >
        ›
      </button>
    </div>
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
    setLightboxIdx(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  const openLightbox = useCallback((idx) => setLightboxIdx(idx), []);
  const closeLightbox = useCallback(() => setLightboxIdx(null), []);
  const prevPhoto = useCallback(() => {
    setLightboxIdx((i) => (i > 0 ? i - 1 : photos.length - 1));
  }, [photos.length]);
  const nextPhoto = useCallback(() => {
    setLightboxIdx((i) => (i < photos.length - 1 ? i + 1 : 0));
  }, [photos.length]);

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

      {lightboxIdx !== null && photos[lightboxIdx] && (
        <Lightbox
          photo={photos[lightboxIdx]}
          onClose={closeLightbox}
          onPrev={prevPhoto}
          onNext={nextPhoto}
        />
      )}
    </Layout>
  );
}
