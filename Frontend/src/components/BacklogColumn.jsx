import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import BacklogCard from './BacklogCard';

export default function BacklogColumn({ estado, label, ideas, onSave, onDelete, children }) {
  const { setNodeRef, isOver } = useDroppable({ id: estado });

  return (
    <section className="min-w-0 flex-1 sm:min-w-[260px]">
      <div className="mb-3 flex items-center gap-2">
        <h3 className="font-display text-sm font-semibold uppercase tracking-widest text-ink-strong">
          {label}
        </h3>
        <span className="chip chip-gold px-2 py-0.5 text-[11px]">{ideas.length}</span>
      </div>

      <div
        ref={setNodeRef}
        className={`min-h-[220px] space-y-2.5 rounded-3xl border border-dashed p-3 transition-all duration-300 ${
          isOver
            ? 'border-ink-dark bg-ink-dark/5 shadow-[inset_0_0_30px_-12px_rgba(255,204,51,0.5)]'
            : 'border-line bg-card/25'
        }`}
      >
        {children}

        <SortableContext items={ideas.map((i) => i.id)} strategy={verticalListSortingStrategy}>
          {ideas.map((idea) => (
            <BacklogCard
              key={idea.id}
              idea={idea}
              onSave={(data) => onSave(idea.id, data)}
              onDelete={onDelete}
            />
          ))}
        </SortableContext>

        {ideas.length === 0 && (
          <p className="py-8 text-center text-xs text-ink/50">Sin ideas todavía</p>
        )}
      </div>
    </section>
  );
}
