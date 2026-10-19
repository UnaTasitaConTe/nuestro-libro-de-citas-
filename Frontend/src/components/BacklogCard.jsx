import { useRef, useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Trash2 } from 'lucide-react';
import { IDEA_ESTADOS } from '../constants/ideaEstado';

/**
 * Tarjeta de idea. Tres formas de moverla: arrastrar con el puntero, arrastrar
 * con el teclado (asa: Espacio, flechas, Espacio) o el selector "Mover a",
 * que funciona igual con un toque o con un lector de pantalla.
 */
export default function BacklogCard({ idea, onSave, onDelete, onMove }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: idea.id,
  });
  const [editing, setEditing] = useState(false);
  const [titulo, setTitulo] = useState(idea.titulo);
  const [descripcion, setDescripcion] = useState(idea.descripcion || '');
  const editorRef = useRef(null);
  const editButtonRef = useRef(null);

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  function startEditing() {
    setTitulo(idea.titulo);
    setDescripcion(idea.descripcion || '');
    setEditing(true);
  }

  function finishEditing({ save }) {
    setEditing(false);
    if (save) {
      const nextTitulo = titulo.trim() || idea.titulo;
      setTitulo(nextTitulo);
      if (nextTitulo !== idea.titulo || descripcion !== (idea.descripcion || '')) {
        onSave({ titulo: nextTitulo, descripcion });
      }
    }
    // El foco vuelve al título para seguir navegando desde la misma tarjeta.
    requestAnimationFrame(() => editButtonRef.current?.focus());
  }

  // Se guarda al salir del editor, no al pasar del título a la descripción
  // (antes el blur del título cerraba el editor y la descripción no se podía editar).
  function handleEditorBlur(event) {
    if (!editorRef.current?.contains(event.relatedTarget)) finishEditing({ save: true });
  }

  function handleEditorKeyDown(event) {
    if (event.key === 'Escape') {
      event.preventDefault();
      event.stopPropagation();
      finishEditing({ save: false });
    } else if (event.key === 'Enter' && (event.target.tagName === 'INPUT' || event.metaKey || event.ctrlKey)) {
      event.preventDefault();
      finishEditing({ save: true });
    }
  }

  const moveId = `mover-${idea.id}`;
  const descriptionId = `idea-descripcion-${idea.id}`;

  return (
    <li ref={setNodeRef} style={style} className="group surface card-hover list-none p-3.5">
      <div className="flex items-start gap-2">
        <button
          type="button"
          aria-label={`Mover «${idea.titulo}» (arrastrar)`}
          className="mt-0.5 grid shrink-0 cursor-grab touch-none place-items-center rounded-md text-ink/60 transition-colors hover:text-ink-dark active:cursor-grabbing pointer-coarse:h-11 pointer-coarse:w-8"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="h-4 w-4" strokeWidth={1.75} />
        </button>

        <div className="min-w-0 flex-1">
          {editing ? (
            <div ref={editorRef} onBlur={handleEditorBlur} onKeyDown={handleEditorKeyDown} className="space-y-2">
              <input
                // autoFocus: el editor se abre a petición del usuario y el foco debe entrar en él.
                autoFocus
                aria-label="Título de la idea"
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
                maxLength={200}
                className="w-full border-b border-line bg-transparent pb-1 font-hand text-xl text-ink-dark focus:border-ink-dark"
              />
              <textarea
                aria-label="Descripción de la idea (opcional)"
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
                placeholder="Descripción (opcional)…"
                maxLength={2000}
                rows={2}
                className="w-full resize-none border-b border-line bg-transparent pb-1 text-xs text-ink focus:border-ink-dark"
              />
              <p className="text-[11px] text-ink/80">Enter guarda; Esc cancela.</p>
            </div>
          ) : (
            <>
              <button
                ref={editButtonRef}
                type="button"
                onClick={startEditing}
                // El nombre contiene el texto visible del botón (WCAG 2.5.3); la
                // descripción va fuera y se asocia como descripción.
                aria-label={`Editar «${idea.titulo}»`}
                aria-describedby={idea.descripcion ? descriptionId : undefined}
                className="block w-full cursor-text rounded-md text-left"
              >
                <span className="block break-words font-hand text-xl leading-tight text-ink-dark">{idea.titulo}</span>
              </button>
              {idea.descripcion && (
                <p id={descriptionId} className="mt-1 whitespace-pre-wrap break-words text-xs leading-relaxed text-ink/80">
                  {idea.descripcion}
                </p>
              )}
            </>
          )}

          {!editing && (
            <div className="mt-2 flex items-center gap-1.5">
              <label htmlFor={moveId} className="sr-only">
                Mover «{idea.titulo}» a
              </label>
              <select
                id={moveId}
                value={idea.estado}
                onChange={(e) => onMove(idea.id, e.target.value)}
                className="rounded-md border border-line bg-paper px-1.5 py-0.5 text-[11px] text-ink pointer-coarse:min-h-9"
              >
                {IDEA_ESTADOS.map(({ key, label }) => (
                  <option key={key} value={key}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Siempre visible en táctil (no hay hover); con ratón aparece al pasar o enfocar. */}
        <button
          type="button"
          onClick={() => onDelete(idea.id)}
          aria-label={`Borrar «${idea.titulo}»`}
          className="grid shrink-0 place-items-center rounded-lg p-1 text-ink/60 opacity-0 transition-[opacity,background-color,color] hover:bg-danger/10 hover:text-danger focus-visible:opacity-100 group-hover:opacity-100 group-focus-within:opacity-100 pointer-coarse:h-11 pointer-coarse:w-11 pointer-coarse:opacity-100"
        >
          <Trash2 className="h-4 w-4" strokeWidth={1.75} />
        </button>
      </div>
    </li>
  );
}
