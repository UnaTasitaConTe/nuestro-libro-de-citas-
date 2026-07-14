/**
 * @typedef {Object} IdeaCitaRepository
 * @property {(parejaId: number) => Promise<object[]>} listByPareja
 * @property {(id: number, parejaId: number) => Promise<object|null>} findByIdAndPareja
 * @property {(data: {parejaId: number, userId: number, titulo: string, descripcion?: string, orden: number}) => Promise<object>} create
 * @property {(id: number, parejaId: number, data: {titulo?: string, descripcion?: string}) => Promise<boolean>} updateFields
 * @property {(parejaId: number, estado: string) => Promise<number>} getMaxOrden
 * @property {(data: {parejaId: number, id: number, estado: string, orderedIds: number[]}) => Promise<void>} setEstadoAndReorder
 * @property {(id: number, parejaId: number) => Promise<void>} deleteById
 */
module.exports = {};
