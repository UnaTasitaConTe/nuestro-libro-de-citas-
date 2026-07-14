class InMemoryIdeaCitaRepository {
  constructor() {
    this.ideas = [];
    this.nextId = 1;
  }

  async listByPareja(parejaId) {
    return this.ideas
      .filter((i) => i.pareja_id === parejaId)
      .sort((a, b) => a.estado.localeCompare(b.estado) || a.orden - b.orden || a.id - b.id);
  }

  async findByIdAndPareja(id, parejaId) {
    return this.ideas.find((i) => i.id === id && i.pareja_id === parejaId) || null;
  }

  async create({ parejaId, userId, titulo, descripcion, orden }) {
    const idea = {
      id: this.nextId++,
      pareja_id: parejaId,
      created_by: userId,
      titulo,
      descripcion: descripcion ?? null,
      estado: 'POR_HACER',
      orden,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    this.ideas.push(idea);
    return idea;
  }

  async updateFields(id, parejaId, { titulo, descripcion }) {
    const idea = await this.findByIdAndPareja(id, parejaId);
    if (!idea) return false;
    if (titulo != null) idea.titulo = titulo;
    if (descripcion != null) idea.descripcion = descripcion;
    idea.updated_at = new Date().toISOString();
    return true;
  }

  async getMaxOrden(parejaId, estado) {
    const ordenes = this.ideas
      .filter((i) => i.pareja_id === parejaId && i.estado === estado)
      .map((i) => i.orden);
    return ordenes.length ? Math.max(...ordenes) : -1;
  }

  async setEstadoAndReorder({ parejaId, id, estado, orderedIds }) {
    const idea = await this.findByIdAndPareja(id, parejaId);
    if (idea) idea.estado = estado;

    orderedIds.forEach((orderedId, index) => {
      const item = this.ideas.find((i) => i.id === orderedId && i.pareja_id === parejaId);
      if (item) item.orden = index;
    });
  }

  async deleteById(id, parejaId) {
    this.ideas = this.ideas.filter((i) => !(i.id === id && i.pareja_id === parejaId));
  }

  _snapshot() {
    return { ideas: this.ideas.map((i) => ({ ...i })), nextId: this.nextId };
  }

  _restore(snapshot) {
    this.ideas = snapshot.ideas;
    this.nextId = snapshot.nextId;
  }
}

module.exports = InMemoryIdeaCitaRepository;
