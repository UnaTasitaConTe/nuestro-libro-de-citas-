class InMemoryCitaRepository {
  constructor({ userRows = [] } = {}) {
    this.citas = [];
    this.entries = [];
    this.photos = [];
    this.userRows = userRows;
    this.nextCitaId = 1;
    this.nextEntryId = 1;
    this.nextPhotoId = 1;
  }

  _userName(userId) {
    const user = this.userRows.find((u) => u.id === userId);
    return user ? user.name : null;
  }

  _withPhotos(entry) {
    return {
      ...entry,
      photos: this.photos
        .filter((p) => p.entry_id === entry.id)
        .sort((a, b) => a.orden - b.orden || a.id - b.id),
    };
  }

  async countByPareja(parejaId) {
    return this.citas.filter((c) => c.pareja_id === parejaId).length;
  }

  async findPageByPareja(parejaId, { limit, offset }) {
    return this.citas
      .filter((c) => c.pareja_id === parejaId)
      .sort((a, b) => new Date(b.fecha) - new Date(a.fecha))
      .slice(offset, offset + limit);
  }

  async findEntriesWithUserByCitaIds(citaIds) {
    return this.entries
      .filter((e) => citaIds.includes(e.cita_id))
      .map((e) => ({ ...e, user_name: this._userName(e.user_id) }));
  }

  async findPhotosByCitaIds(citaIds) {
    const entryIds = this.entries.filter((e) => citaIds.includes(e.cita_id)).map((e) => e.id);
    return this.photos.filter((p) => entryIds.includes(p.entry_id));
  }

  async listWithEntries(parejaId, { limit, offset }) {
    const total = await this.countByPareja(parejaId);
    const citas = await this.findPageByPareja(parejaId, { limit, offset });
    const citaIds = citas.map((c) => c.id);
    const entries = await this.findEntriesWithUserByCitaIds(citaIds);

    return {
      citas: citas.map((c) => ({
        ...c,
        entries: entries.filter((e) => e.cita_id === c.id).map((e) => this._withPhotos(e)),
      })),
      total,
    };
  }

  async findByIdAndPareja(citaId, parejaId) {
    return this.citas.find((c) => c.id === citaId && c.pareja_id === parejaId) || null;
  }

  async getCitaWithEntries(citaId, parejaId) {
    const cita = await this.findByIdAndPareja(citaId, parejaId);
    if (!cita) return null;

    const entries = await this.findEntriesWithUserByCitaIds([citaId]);
    return { ...cita, entries: entries.map((e) => this._withPhotos(e)) };
  }

  async create({ parejaId, nombre, fecha, lugar, repetiriamos }) {
    const cita = {
      id: this.nextCitaId++,
      pareja_id: parejaId,
      nombre,
      fecha,
      lugar,
      repetiriamos,
      created_at: new Date().toISOString(),
    };
    this.citas.push(cita);
    return cita;
  }

  async createEntry({ citaId, userId, valoracion, queHicimos, comoTeSentiste, loQueMasGusto, loQueMenosGusto }) {
    const entry = {
      id: this.nextEntryId++,
      cita_id: citaId,
      user_id: userId,
      valoracion,
      que_hicimos: queHicimos ?? null,
      como_te_sentiste: comoTeSentiste ?? null,
      lo_que_mas_gusto: loQueMasGusto ?? null,
      lo_que_menos_gusto: loQueMenosGusto ?? null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    this.entries.push(entry);
    return { id: entry.id };
  }

  async addPhoto({ entryId, fotoUrl, orden }) {
    this.photos.push({
      id: this.nextPhotoId++,
      entry_id: entryId,
      foto_url: fotoUrl,
      orden,
      created_at: new Date().toISOString(),
    });
  }

  async updateFields(citaId, parejaId, { fecha, lugar, repetiriamos }) {
    const cita = await this.findByIdAndPareja(citaId, parejaId);
    if (!cita) return false;
    if (fecha != null) cita.fecha = fecha;
    if (lugar != null) cita.lugar = lugar;
    if (repetiriamos != null) cita.repetiriamos = repetiriamos;
    return true;
  }

  async upsertEntry({ citaId, userId, valoracion, queHicimos, comoTeSentiste, loQueMasGusto, loQueMenosGusto }) {
    const existing = this.entries.find((e) => e.cita_id === citaId && e.user_id === userId);
    if (existing) {
      existing.valoracion = valoracion;
      existing.que_hicimos = queHicimos ?? null;
      existing.como_te_sentiste = comoTeSentiste ?? null;
      existing.lo_que_mas_gusto = loQueMasGusto ?? null;
      existing.lo_que_menos_gusto = loQueMenosGusto ?? null;
      existing.updated_at = new Date().toISOString();
      return { id: existing.id };
    }
    return this.createEntry({ citaId, userId, valoracion, queHicimos, comoTeSentiste, loQueMasGusto, loQueMenosGusto });
  }

  async findEntryByCitaAndUser(citaId, userId) {
    const entry = this.entries.find((e) => e.cita_id === citaId && e.user_id === userId);
    return entry ? { id: entry.id } : null;
  }

  async getMaxOrden(entryId) {
    const orders = this.photos.filter((p) => p.entry_id === entryId).map((p) => p.orden);
    return orders.length ? Math.max(...orders) : -1;
  }

  async deletePhoto(fotoId, citaId) {
    const entryIds = this.entries.filter((e) => e.cita_id === citaId).map((e) => e.id);
    const index = this.photos.findIndex((p) => p.id === fotoId && entryIds.includes(p.entry_id));
    if (index === -1) return null;
    const [removed] = this.photos.splice(index, 1);
    return removed.foto_url;
  }

  async findEntryIdsByCita(citaId) {
    return this.entries.filter((e) => e.cita_id === citaId).map((e) => e.id);
  }

  async findPhotoUrlsByEntryIds(entryIds) {
    return this.photos.filter((p) => entryIds.includes(p.entry_id)).map((p) => p.foto_url);
  }

  async deleteById(citaId, parejaId) {
    this.citas = this.citas.filter((c) => !(c.id === citaId && c.pareja_id === parejaId));
    const entryIds = this.entries.filter((e) => e.cita_id === citaId).map((e) => e.id);
    this.entries = this.entries.filter((e) => e.cita_id !== citaId);
    this.photos = this.photos.filter((p) => !entryIds.includes(p.entry_id));
  }

  _snapshot() {
    return {
      citas: this.citas.map((c) => ({ ...c })),
      entries: this.entries.map((e) => ({ ...e })),
      photos: this.photos.map((p) => ({ ...p })),
      nextCitaId: this.nextCitaId,
      nextEntryId: this.nextEntryId,
      nextPhotoId: this.nextPhotoId,
    };
  }

  _restore(snapshot) {
    this.citas = snapshot.citas;
    this.entries = snapshot.entries;
    this.photos = snapshot.photos;
    this.nextCitaId = snapshot.nextCitaId;
    this.nextEntryId = snapshot.nextEntryId;
    this.nextPhotoId = snapshot.nextPhotoId;
  }
}

module.exports = InMemoryCitaRepository;
