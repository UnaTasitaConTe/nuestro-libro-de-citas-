import { useEffect, useId, useRef, useState } from 'react';
import { Flame, ImagePlus } from 'lucide-react';
import HeartRating from './HeartRating';
import Field from './ui/Field';

// Estilos compartidos por los formularios de citas (crear, editar, mi versión).
export const labelClass = 'mb-1.5 block text-sm font-medium text-ink-strong';
export const inputClass = 'field';
export const textareaClass = 'field';

/**
 * URL de vista previa para un File con ciclo de vida seguro: se crea en un
 * efecto (no durante el render) y se libera al cambiar de archivo o desmontar.
 * Con StrictMode el efecto corre dos veces y la primera URL también se libera.
 */
function useObjectUrl(file) {
  const [url, setUrl] = useState(null);
  useEffect(() => {
    const objectUrl = URL.createObjectURL(file);
    setUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [file]);
  return url;
}

function NewPhotoPreview({ file, onRemove }) {
  const url = useObjectUrl(file);
  return (
    <li className="relative aspect-square overflow-hidden rounded-lg border border-ink-dark">
      {url && <img src={url} alt="" className="h-full w-full object-cover" />}
      <button
        type="button"
        onClick={onRemove}
        aria-label={`Quitar ${file.name}`}
        className="absolute right-0 top-0 flex h-11 w-11 items-start justify-end p-1"
      >
        <span aria-hidden="true" className="flex h-5 w-5 items-center justify-center rounded-full bg-paper/90 text-xs text-ink-dark">
          ×
        </span>
      </button>
    </li>
  );
}

const TEXT_FIELDS = [
  { key: 'queHicimos', label: 'Qué hicimos' },
  { key: 'comoTeSentiste', label: 'Cómo me sentí' },
  { key: 'loQueMasGusto', label: 'Lo que más me gustó' },
  { key: 'loQueMenosGusto', label: 'Lo que menos me gustó' },
];

export default function EntryFields({
  entry,
  setEntry,
  fotos,
  setFotos,
  existingPhotos = [],
  onRemoveExisting,
  valoracionError,
  ratingRef,
}) {
  const ids = useId();
  const ratingLabelId = `${ids}-valoracion`;
  const ratingErrorId = `${ids}-valoracion-error`;
  const photosLabelId = `${ids}-fotos`;

  // Claves estables por archivo (sin cambiar la forma de `fotos`, que sigue
  // siendo File[] para el FormData): quitar una foto no recrea las demás.
  const fileKeys = useRef(new WeakMap());
  const nextKey = useRef(0);
  function keyFor(file) {
    if (!fileKeys.current.has(file)) fileKeys.current.set(file, nextKey.current++);
    return fileKeys.current.get(file);
  }

  function update(field, value) {
    setEntry((f) => ({ ...f, [field]: value }));
  }

  function addFiles(fileList) {
    const newFiles = Array.from(fileList || []);
    if (newFiles.length) setFotos((prev) => [...prev, ...newFiles]);
  }

  function removeNewFile(file) {
    setFotos((prev) => prev.filter((f) => f !== file));
  }

  return (
    <div className="grid gap-8 md:grid-cols-2">
      <section aria-labelledby={photosLabelId} className="min-w-0">
        <p id={photosLabelId} className={labelClass}>
          Fotos
        </p>

        {existingPhotos.length > 0 && (
          <ul className="mb-2 grid grid-cols-3 gap-2" aria-label="Fotos guardadas">
            {existingPhotos.map((p) => (
              <li key={p.id} className="relative aspect-square overflow-hidden rounded-lg border border-line">
                <img src={p.thumb_url || p.foto_url} alt="" className="h-full w-full object-cover" />
                {onRemoveExisting && (
                  <button
                    type="button"
                    onClick={() => onRemoveExisting(p.id)}
                    aria-label="Borrar foto"
                    className="absolute right-0 top-0 flex h-11 w-11 items-start justify-end p-1"
                  >
                    <span aria-hidden="true" className="flex h-5 w-5 items-center justify-center rounded-full bg-paper/90 text-xs text-ink-dark">
                      ×
                    </span>
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}

        {fotos.length > 0 && (
          <ul className="mb-2 grid grid-cols-3 gap-2" aria-label="Fotos por subir">
            {fotos.map((file) => (
              <NewPhotoPreview key={keyFor(file)} file={file} onRemove={() => removeNewFile(file)} />
            ))}
          </ul>
        )}

        {/* El input queda accesible por teclado (sr-only, no display:none);
            el foco se dibuja en la zona con has-focus-visible. */}
        <label className="group flex aspect-[3/1] cursor-pointer items-center justify-center gap-2 overflow-hidden rounded-2xl border-2 border-dashed border-line bg-card/60 px-6 text-center text-sm text-ink transition-colors hover:border-ink-dark hover:text-ink-dark has-focus-visible:border-ink-dark has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-ink-dark">
          <ImagePlus className="h-5 w-5 shrink-0" strokeWidth={1.75} />
          Agregar fotos
          <input
            type="file"
            accept="image/*"
            multiple
            className="sr-only"
            onChange={(e) => {
              addFiles(e.target.files);
              e.target.value = '';
            }}
          />
        </label>
      </section>

      <div className="min-w-0">
        <p id={ratingLabelId} className={labelClass}>
          Valoración
        </p>
        <HeartRating
          value={entry.valoracion}
          onChange={(v) => update('valoracion', v)}
          labelledBy={ratingLabelId}
          describedBy={valoracionError ? ratingErrorId : undefined}
          invalid={Boolean(valoracionError)}
          groupRef={ratingRef}
        />
        {valoracionError && (
          <p id={ratingErrorId} className="mt-2 text-xs text-danger">
            {valoracionError}
          </p>
        )}
      </div>

      {TEXT_FIELDS.map(({ key, label }) => (
        <Field key={key} label={label} labelClassName={labelClass} className="min-w-0">
          {(field) => (
            <textarea
              {...field}
              name={key}
              rows={3}
              value={entry[key]}
              onChange={(e) => update(key, e.target.value)}
              className={textareaClass}
            />
          )}
        </Field>
      ))}

      <div className="md:col-span-2">
        <label className="group inline-flex cursor-pointer select-none items-center gap-3 pointer-coarse:min-h-11">
          <input
            type="checkbox"
            name="intimidad"
            checked={entry.intimidad || false}
            onChange={(e) => update('intimidad', e.target.checked)}
            className="peer sr-only"
          />
          <span
            aria-hidden="true"
            className={`flex h-6 w-6 items-center justify-center rounded-lg border transition-colors peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-ink-dark ${
              entry.intimidad ? 'border-passion bg-passion/15' : 'border-line bg-card/60'
            }`}
          >
            <Flame
              className={`h-3.5 w-3.5 text-passion transition-opacity ${entry.intimidad ? 'opacity-100' : 'opacity-0'}`}
              strokeWidth={2}
            />
          </span>
          <span className="text-sm text-ink transition-colors group-hover:text-ink-strong">Hubo intimidad</span>
        </label>
      </div>
    </div>
  );
}
