import { useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Trash2 } from 'lucide-react';

export default function BacklogCard({ idea, onSave, onDelete }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: idea.id,
  });
  const [editing, setEditing] = useState(false);
  const [titulo, setTitulo] = useState(idea.titulo);
  const [descripcion, setDescripcion] = useState(idea.descripcion || '');

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  function save() {
    setEditing(false);
    const nextTitulo = titulo.trim() || idea.titulo;
    setTitulo(nextTitulo);
    if (nextTitulo !== idea.titulo || descripcion !== (idea.descripcion || '')) {
      onSave({ titulo: nextTitulo, descripcion });
    }
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="group surface card-hover p-3.5"
    >
      <div className="flex items-start gap-2">
        <button
          type="button"
          aria-label="Arrastrar tarjeta"
          className="mt-0.5 shrink-0 cursor-grab touch-none text-ink/40 transition-colors hover:text-ink-dark active:cursor-grabbing"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="h-4 w-4" strokeWidth={1.75} />
        </button>

        <div className="min-w-0 flex-1">
          {editing ? (
            <div className="space-y-2">
              <input
                autoFocus
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
                onBlur={save}
                onKeyDown={(e) => e.key === 'Enter' && save()}
                className="w-full border-b border-line bg-transparent pb-1 font-hand text-xl text-ink-dark outline-none focus:border-ink-dark"
              />
              <textarea
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
                onBlur={save}
                placeholder="Descripción (opcional)"
                rows={2}
                className="w-full resize-none border-b border-line bg-transparent pb-1 text-xs text-ink outline-none focus:border-ink-dark"
              />
            </div>
          ) : (
            <div onClick={() => setEditing(true)} className="cursor-text">
              <p className="font-hand text-xl leading-tight text-ink-dark">{idea.titulo}</p>
              {idea.descripcion && (
                <p className="mt-1 whitespace-pre-wrap text-xs leading-relaxed text-ink/70">
                  {idea.descripcion}
                </p>
              )}
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={() => onDelete(idea.id)}
          aria-label="Borrar idea"
          className="shrink-0 rounded-lg p-1 text-ink/40 opacity-0 transition-all hover:bg-danger/10 hover:text-danger focus-visible:opacity-100 group-hover:opacity-100"
        >
          <Trash2 className="h-4 w-4" strokeWidth={1.75} />
        </button>
      </div>
    </div>
  );
}
