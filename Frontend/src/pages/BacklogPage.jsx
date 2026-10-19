import { useEffect, useRef, useState } from 'react';
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  closestCorners,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { Plus } from 'lucide-react';
import client from '../api/client';
import Layout from '../components/Layout';
import PageHeader from '../components/PageHeader';
import BacklogColumn from '../components/BacklogColumn';
import StatusMessage from '../components/ui/StatusMessage';
import { IDEA_ESTADOS } from '../constants/ideaEstado';

const ESTADO_LABEL = Object.fromEntries(IDEA_ESTADOS.map(({ key, label }) => [key, label]));

// Instrucciones y anuncios del arrastre por teclado en español (dnd-kit los trae en inglés).
const SCREEN_READER_INSTRUCTIONS = {
  draggable:
    'Para mover una idea, pulsa Espacio. Usa las flechas para cambiarla de sitio o de columna, ' +
    'Espacio para soltarla y Escape para cancelar. También puedes usar el selector «Mover a».',
};

export default function BacklogPage() {
  const [ideas, setIdeas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionError, setActionError] = useState('');
  const [status, setStatus] = useState('');
  const [nuevoTitulo, setNuevoTitulo] = useState('');
  const [creating, setCreating] = useState(false);
  const [activeIdea, setActiveIdea] = useState(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );
  const wsRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);

  useEffect(() => {
    fetchIdeas();
  }, []);

  useEffect(() => {
    function connect() {
      const token = localStorage.getItem('token');
      if (!token) return;

      const protocol = location.protocol === 'https:' ? 'wss:' : 'ws:';
      const ws = new WebSocket(
        `${protocol}//${location.host}/api/ideas-citas/ws?token=${encodeURIComponent(token)}`
      );
      wsRef.current = ws;

      ws.onmessage = () => fetchIdeas({ silent: true });
      ws.onclose = () => {
        reconnectTimeoutRef.current = setTimeout(connect, 3000);
      };
    }

    connect();

    return () => {
      clearTimeout(reconnectTimeoutRef.current);
      wsRef.current?.close();
    };
  }, []);

  function fetchIdeas({ silent = false } = {}) {
    if (!silent) {
      setLoading(true);
      setError('');
    }
    return client
      .get('/ideas-citas')
      .then(({ data }) => setIdeas(data))
      .catch(() => {
        if (!silent) setError('No se pudieron cargar las ideas');
      })
      .finally(() => {
        if (!silent) setLoading(false);
      });
  }

  function titleOf(id) {
    return ideas.find((i) => i.id === id)?.titulo ?? 'la idea';
  }

  async function handleCrear(e) {
    e.preventDefault();
    const titulo = nuevoTitulo.trim();
    if (!titulo) return;
    setActionError('');
    setCreating(true);
    setNuevoTitulo('');
    try {
      const { data } = await client.post('/ideas-citas', { titulo });
      setIdeas((prev) => [...prev, data]);
      setStatus(`Idea «${titulo}» agregada a ${ESTADO_LABEL[data.estado] ?? 'Por hacer'}.`);
    } catch (err) {
      // Si falla, el texto vuelve al campo para no perderlo.
      setNuevoTitulo(titulo);
      setActionError(err.response?.data?.error || 'No se pudo agregar la idea. Vuelve a intentarlo.');
    } finally {
      setCreating(false);
    }
  }

  async function handleSave(id, data) {
    setActionError('');
    try {
      const { data: updated } = await client.patch(`/ideas-citas/${id}`, data);
      setIdeas((prev) => prev.map((i) => (i.id === id ? updated : i)));
      setStatus('Cambios guardados.');
    } catch (err) {
      setActionError(err.response?.data?.error || 'No se pudieron guardar los cambios de la idea.');
      fetchIdeas({ silent: true });
    }
  }

  async function handleDelete(id) {
    const titulo = titleOf(id);
    setActionError('');
    setIdeas((prev) => prev.filter((i) => i.id !== id));
    try {
      await client.delete(`/ideas-citas/${id}`);
      setStatus(`Idea «${titulo}» borrada.`);
    } catch (err) {
      // El borrado es optimista: si falla, se recupera el estado del servidor.
      setActionError(err.response?.data?.error || `No se pudo borrar «${titulo}».`);
      fetchIdeas({ silent: true });
    }
  }

  /**
   * Mueve una idea a `targetEstado`, delante de `overId` (o al final si no hay).
   * Misma petición para el arrastre (puntero o teclado) y para el selector "Mover a".
   */
  async function moveIdea(activeId, targetEstado, overId = null) {
    const activeIdea = ideas.find((i) => i.id === activeId);
    if (!activeIdea || !targetEstado) return false;

    const destItems = ideas
      .filter((i) => i.id !== activeId && i.estado === targetEstado)
      .sort((a, b) => a.orden - b.orden);

    const overIndex = destItems.findIndex((i) => i.id === overId);
    const insertIndex = overIndex === -1 ? destItems.length : overIndex;
    destItems.splice(insertIndex, 0, activeIdea);

    if (targetEstado === activeIdea.estado && destItems.every((i, idx) => i.orden === idx)) {
      return false;
    }

    const orderedIds = destItems.map((i) => i.id);
    const ordenById = new Map(orderedIds.map((id, idx) => [id, idx]));

    setActionError('');
    setIdeas((prev) =>
      prev.map((i) =>
        ordenById.has(i.id) ? { ...i, estado: targetEstado, orden: ordenById.get(i.id) } : i
      )
    );

    try {
      await client.patch(`/ideas-citas/${activeId}/mover`, { estado: targetEstado, orderedIds });
    } catch {
      setActionError(`No se pudo mover «${activeIdea.titulo}».`);
      fetchIdeas();
    }
    return true;
  }

  async function handleMoveSelect(id, targetEstado) {
    const moved = await moveIdea(id, targetEstado);
    if (!moved) return;
    setStatus(`«${titleOf(id)}» movida a ${ESTADO_LABEL[targetEstado]}.`);
    // La tarjeta cambia de columna y se vuelve a montar: el foco vuelve a su selector.
    requestAnimationFrame(() => document.getElementById(`mover-${id}`)?.focus());
  }

  function handleDragStart(event) {
    setActiveIdea(ideas.find((i) => i.id === event.active.id) || null);
  }

  async function handleDragEnd(event) {
    const { active, over } = event;
    setActiveIdea(null);
    if (!over) return;

    const targetEstado = IDEA_ESTADOS.some((e) => e.key === over.id)
      ? over.id
      : ideas.find((i) => i.id === over.id)?.estado;
    await moveIdea(active.id, targetEstado, over.id);
  }

  function describeTarget(over) {
    if (!over) return 'fuera de las columnas';
    if (ESTADO_LABEL[over.id]) return `la columna ${ESTADO_LABEL[over.id]}`;
    const idea = ideas.find((i) => i.id === over.id);
    return idea ? `«${idea.titulo}», en ${ESTADO_LABEL[idea.estado]}` : 'otra posición';
  }

  const announcements = {
    onDragStart: ({ active }) => `Has tomado «${titleOf(active.id)}».`,
    onDragOver: ({ active, over }) => `«${titleOf(active.id)}» está sobre ${describeTarget(over)}.`,
    onDragEnd: ({ active, over }) =>
      over ? `«${titleOf(active.id)}» soltada en ${describeTarget(over)}.` : `«${titleOf(active.id)}» vuelve a su sitio.`,
    onDragCancel: ({ active }) => `Movimiento cancelado. «${titleOf(active.id)}» vuelve a su sitio.`,
  };

  return (
    <Layout>
      <PageHeader
        title="Backlog de citas"
        subtitle="Ideas para sus próximas citas. Arrástralas o usa «Mover a» para organizarlas."
      />

      <form onSubmit={handleCrear} className="mb-8 flex flex-col gap-2 sm:flex-row">
        <label htmlFor="nueva-idea" className="sr-only">
          Nueva idea de cita
        </label>
        <input
          id="nueva-idea"
          name="titulo"
          autoComplete="off"
          maxLength={200}
          value={nuevoTitulo}
          onChange={(e) => setNuevoTitulo(e.target.value)}
          placeholder="Ver el amanecer desde el mirador…"
          className="field flex-1"
        />
        <button type="submit" disabled={creating || !nuevoTitulo.trim()} className="btn btn-primary">
          <Plus aria-hidden="true" className="h-4 w-4" strokeWidth={2} />
          {creating ? 'Agregando…' : 'Agregar idea'}
        </button>
      </form>

      <StatusMessage className="sr-only">{status}</StatusMessage>
      <StatusMessage tone="error" className="alert alert-danger mb-6">
        {actionError}
      </StatusMessage>

      {loading && (
        <div aria-busy="true" className="grid gap-6 lg:grid-cols-3">
          <p role="status" className="sr-only">Cargando ideas…</p>
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="skeleton h-56 rounded-3xl" />
          ))}
        </div>
      )}

      {!loading && error && (
        <p role="alert" className="alert alert-danger">
          {error}. Revisa tu conexión y{' '}
          <button type="button" onClick={() => fetchIdeas()} className="font-semibold underline underline-offset-4">
            vuelve a intentarlo
          </button>
          .
        </p>
      )}

      {!loading && !error && (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          onDragCancel={() => setActiveIdea(null)}
          accessibility={{ announcements, screenReaderInstructions: SCREEN_READER_INSTRUCTIONS }}
        >
          {/* Una columna bajo 1024 px: tres de 260 px no caben con la barra lateral. */}
          <div className="grid gap-6 lg:grid-cols-3">
            {IDEA_ESTADOS.map(({ key, label }) => (
              <BacklogColumn
                key={key}
                estado={key}
                label={label}
                ideas={ideas.filter((i) => i.estado === key).sort((a, b) => a.orden - b.orden)}
                onSave={handleSave}
                onDelete={handleDelete}
                onMove={handleMoveSelect}
              />
            ))}
          </div>

          <DragOverlay>
            {activeIdea && (
              <div className="rotate-2 rounded-2xl border border-ink-dark/40 bg-card p-3 shadow-overlay">
                <p className="font-hand text-xl leading-tight text-ink-dark">{activeIdea.titulo}</p>
              </div>
            )}
          </DragOverlay>
        </DndContext>
      )}
    </Layout>
  );
}
