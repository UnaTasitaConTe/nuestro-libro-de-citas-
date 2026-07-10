import HeartRating from './HeartRating';

export const textareaClass =
  'w-full rounded-xl border border-line bg-card/60 p-3 outline-none focus:border-ink-dark focus:ring-2 focus:ring-ink-dark/30 transition';
export const inputClass =
  'w-full rounded-xl border border-line bg-card/60 px-4 py-2 outline-none focus:border-ink-dark focus:ring-2 focus:ring-ink-dark/30 transition';

export default function EntryFields({
  entry,
  setEntry,
  fotos,
  setFotos,
  existingPhotos = [],
  onRemoveExisting,
}) {
  function update(field, value) {
    setEntry((f) => ({ ...f, [field]: value }));
  }

  function addFiles(fileList) {
    const newFiles = Array.from(fileList || []);
    if (newFiles.length) setFotos((prev) => [...prev, ...newFiles]);
  }

  function removeNewFile(index) {
    setFotos((prev) => prev.filter((_, i) => i !== index));
  }

  return (
    <div className="grid md:grid-cols-2 gap-8">
      <div>
        <label className="block text-sm mb-1 text-ink">Fotos</label>

        {existingPhotos.length > 0 && (
          <div className="grid grid-cols-3 gap-2 mb-2">
            {existingPhotos.map((p) => (
              <div key={p.id} className="relative aspect-square rounded-lg overflow-hidden border border-line">
                <img src={p.foto_url} alt="" className="w-full h-full object-cover" />
                {onRemoveExisting && (
                  <button
                    type="button"
                    onClick={() => onRemoveExisting(p.id)}
                    aria-label="Borrar foto"
                    className="absolute top-1 right-1 w-5 h-5 rounded-full bg-paper/90 text-ink-dark text-xs flex items-center justify-center"
                  >
                    ×
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        {fotos.length > 0 && (
          <div className="grid grid-cols-3 gap-2 mb-2">
            {fotos.map((f, i) => (
              <div key={i} className="relative aspect-square rounded-lg overflow-hidden border border-ink-dark">
                <img src={URL.createObjectURL(f)} alt="" className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => removeNewFile(i)}
                  aria-label="Quitar foto"
                  className="absolute top-1 right-1 w-5 h-5 rounded-full bg-paper/90 text-ink-dark text-xs flex items-center justify-center"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}

        <label className="group block rounded-2xl bg-card/60 border-2 border-dashed border-line hover:border-ink-dark aspect-[3/1] flex items-center justify-center overflow-hidden cursor-pointer transition-colors">
          <span className="text-ink text-sm text-center px-6 group-hover:text-ink-dark transition-colors">
            📸 Agregar fotos
          </span>
          <input
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => {
              addFiles(e.target.files);
              e.target.value = '';
            }}
          />
        </label>
      </div>

      <div>
        <label className="block text-sm mb-1 text-ink">Valoración</label>
        <HeartRating value={entry.valoracion} onChange={(v) => update('valoracion', v)} />
      </div>

      <div>
        <label className="block text-sm mb-1 text-ink">Qué hicimos</label>
        <textarea
          rows={3}
          value={entry.queHicimos}
          onChange={(e) => update('queHicimos', e.target.value)}
          className={textareaClass}
        />
      </div>

      <div>
        <label className="block text-sm mb-1 text-ink">Cómo me sentí</label>
        <textarea
          rows={3}
          value={entry.comoTeSentiste}
          onChange={(e) => update('comoTeSentiste', e.target.value)}
          className={textareaClass}
        />
      </div>

      <div>
        <label className="block text-sm mb-1 text-ink">Lo que más me gustó</label>
        <textarea
          rows={3}
          value={entry.loQueMasGusto}
          onChange={(e) => update('loQueMasGusto', e.target.value)}
          className={textareaClass}
        />
      </div>

      <div>
        <label className="block text-sm mb-1 text-ink">Lo que menos me gustó</label>
        <textarea
          rows={3}
          value={entry.loQueMenosGusto}
          onChange={(e) => update('loQueMenosGusto', e.target.value)}
          className={textareaClass}
        />
      </div>
    </div>
  );
}
