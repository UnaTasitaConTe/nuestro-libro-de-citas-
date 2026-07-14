import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import BacklogCard from './BacklogCard';

export default function BacklogColumn({ estado, label, ideas, onSave, onDelete, children }) {
  const { setNodeRef, isOver } = useDroppable({ id: estado });

  return (
    <div className="flex-1 min-w-[260px]">
      <div className="flex items-center gap-2 mb-3">
        <h3 className="font-display font-semibold text-ink-dark">{label}</h3>
        <span className="text-xs text-ink/60 bg-card border border-line rounded-full px-2 py-0.5">
          {ideas.length}
        </span>
      </div>

      <div
        ref={setNodeRef}
        className={`rounded-3xl border border-dashed p-3 min-h-[200px] space-y-2 transition-colors ${
          isOver ? 'border-ink-dark bg-card/40' : 'border-line'
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
          <p className="text-ink/50 text-xs text-center py-6">Sin ideas todavía</p>
        )}
      </div>
    </div>
  );
}
