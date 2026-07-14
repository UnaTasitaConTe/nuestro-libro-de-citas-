import { useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

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
      className="rounded-2xl border border-line bg-card p-3 shadow-sm hover:shadow-md transition-shadow"
    >
      <div className="flex items-start gap-2">
        <button
          type="button"
          aria-label="Arrastrar tarjeta"
          className="mt-0.5 cursor-grab active:cursor-grabbing text-ink/60 touch-none"
          {...attributes}
          {...listeners}
        >
          ⠿
        </button>

        <div className="flex-1 min-w-0">
          {editing ? (
            <div className="space-y-1">
              <input
                autoFocus
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
                onBlur={save}
                onKeyDown={(e) => e.key === 'Enter' && save()}
                className="w-full bg-transparent border-b border-line text-ink-dark font-hand text-lg focus:outline-none"
              />
              <textarea
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
                onBlur={save}
                placeholder="Descripción (opcional)"
                rows={2}
                className="w-full bg-transparent border-b border-line text-ink text-xs focus:outline-none resize-none"
              />
            </div>
          ) : (
            <div onClick={() => setEditing(true)} className="cursor-text">
              <p className="font-hand text-lg text-ink-dark leading-tight">{idea.titulo}</p>
              {idea.descripcion && (
                <p className="text-ink/60 text-xs mt-1 whitespace-pre-wrap">{idea.descripcion}</p>
              )}
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={() => onDelete(idea.id)}
          aria-label="Borrar idea"
          className="text-ink/60 hover:text-red-400 transition-colors text-sm"
        >
          ×
        </button>
      </div>
    </div>
  );
}
