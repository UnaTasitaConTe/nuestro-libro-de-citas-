import { useEffect, useRef, useState } from 'react';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  closestCorners,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import client from '../api/client';
import Layout from '../components/Layout';
import PageHeader from '../components/PageHeader';
import BacklogColumn from '../components/BacklogColumn';
import { IDEA_ESTADOS } from '../constants/ideaEstado';

export default function BacklogPage() {
  const [ideas, setIdeas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [nuevoTitulo, setNuevoTitulo] = useState('');
  const [activeIdea, setActiveIdea] = useState(null);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));
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
    if (!silent) setLoading(true);
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

  async function handleCrear(e) {
    e.preventDefault();
    const titulo = nuevoTitulo.trim();
    if (!titulo) return;
    setNuevoTitulo('');
    const { data } = await client.post('/ideas-citas', { titulo });
    setIdeas((prev) => [...prev, data]);
  }

  async function handleSave(id, data) {
    const { data: updated } = await client.patch(`/ideas-citas/${id}`, data);
    setIdeas((prev) => prev.map((i) => (i.id === id ? updated : i)));
  }

  async function handleDelete(id) {
    setIdeas((prev) => prev.filter((i) => i.id !== id));
    await client.delete(`/ideas-citas/${id}`);
  }

  function handleDragStart(event) {
    setActiveIdea(ideas.find((i) => i.id === event.active.id) || null);
  }

  async function handleDragEnd(event) {
    const { active, over } = event;
    setActiveIdea(null);
    if (!over) return;

    const activeIdea = ideas.find((i) => i.id === active.id);
    if (!activeIdea) return;

    const targetEstado = IDEA_ESTADOS.some((e) => e.key === over.id)
      ? over.id
      : ideas.find((i) => i.id === over.id)?.estado;
    if (!targetEstado) return;

    const destItems = ideas
      .filter((i) => i.id !== active.id && i.estado === targetEstado)
      .sort((a, b) => a.orden - b.orden);

    const overIndex = destItems.findIndex((i) => i.id === over.id);
    const insertIndex = overIndex === -1 ? destItems.length : overIndex;
    destItems.splice(insertIndex, 0, activeIdea);

    if (targetEstado === activeIdea.estado && destItems.every((i, idx) => i.orden === idx)) {
      return;
    }

    const orderedIds = destItems.map((i) => i.id);
    const ordenById = new Map(orderedIds.map((id, idx) => [id, idx]));

    setIdeas((prev) =>
      prev.map((i) =>
        ordenById.has(i.id) ? { ...i, estado: targetEstado, orden: ordenById.get(i.id) } : i
      )
    );

    try {
      await client.patch(`/ideas-citas/${active.id}/mover`, { estado: targetEstado, orderedIds });
    } catch {
      fetchIdeas();
    }
  }

  return (
    <Layout>
      <PageHeader
        eyebrow="Planes por vivir"
        title="Backlog de citas"
        subtitle="Arrastra las ideas entre columnas para organizar lo que viene."
      />

      <form onSubmit={handleCrear} className="mb-8 flex flex-col gap-2 sm:flex-row">
        <input
          value={nuevoTitulo}
          onChange={(e) => setNuevoTitulo(e.target.value)}
          placeholder="Nueva idea de cita..."
          aria-label="Nueva idea de cita"
          className="field flex-1"
        />
        <button type="submit" disabled={!nuevoTitulo.trim()} className="btn btn-primary">
          + Agregar
        </button>
      </form>

      {loading && (
        <div className="grid gap-6 sm:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="skeleton h-56 rounded-3xl" />
          ))}
        </div>
      )}
      {error && <p className="alert alert-danger">{error}</p>}

      {!loading && !error && (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div className="flex flex-col gap-6 sm:flex-row">
            {IDEA_ESTADOS.map(({ key, label }) => (
              <BacklogColumn
                key={key}
                estado={key}
                label={label}
                ideas={ideas.filter((i) => i.estado === key).sort((a, b) => a.orden - b.orden)}
                onSave={handleSave}
                onDelete={handleDelete}
              />
            ))}
          </div>

          <DragOverlay>
            {activeIdea && (
              <div className="rotate-2 rounded-2xl border border-ink-dark/40 bg-card p-3 shadow-[0_20px_44px_-14px_rgba(3,6,20,0.85)]">
                <p className="font-hand text-xl leading-tight text-ink-dark">{activeIdea.titulo}</p>
              </div>
            )}
          </DragOverlay>
        </DndContext>
      )}
    </Layout>
  );
}
