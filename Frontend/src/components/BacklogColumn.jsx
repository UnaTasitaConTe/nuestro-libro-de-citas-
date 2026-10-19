import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import BacklogCard from './BacklogCard';

export default function BacklogColumn({ estado, label, ideas, onSave, onDelete, onMove }) {
  const { setNodeRef, isOver } = useDroppable({ id: estado });
  const headingId = `columna-${estado}`;

  return (
    <section aria-labelledby={headingId} className="min-w-0">
      <div className="mb-3 flex items-center gap-2">
        <h2 id={headingId} className="font-display text-base font-semibold text-ink-strong">
          {label}
        </h2>
        <span className="chip chip-gold px-2 py-0.5 text-[11px] tabular-nums">
          {ideas.length}
          <span className="sr-only"> {ideas.length === 1 ? 'idea' : 'ideas'}</span>
        </span>
      </div>

      <div
        ref={setNodeRef}
        className={`min-h-[220px] rounded-3xl border border-dashed p-3 transition-[border-color,background-color,box-shadow] duration-300 ${
          isOver
            ? 'border-ink-dark bg-ink-dark/5 shadow-[inset_0_0_30px_-12px_rgba(255,204,51,0.5)]'
            : 'border-line bg-card/25'
        }`}
      >
        <SortableContext items={ideas.map((i) => i.id)} strategy={verticalListSortingStrategy}>
          {ideas.length > 0 && (
            <ul aria-labelledby={headingId} className="space-y-2.5">
              {ideas.map((idea) => (
                <BacklogCard
                  key={idea.id}
                  idea={idea}
                  onSave={(data) => onSave(idea.id, data)}
                  onDelete={onDelete}
                  onMove={onMove}
                />
              ))}
            </ul>
          )}
        </SortableContext>

        {ideas.length === 0 && (
          <p className="py-8 text-center text-xs text-ink/70">Sin ideas todavía.</p>
        )}
      </div>
    </section>
  );
}
