/**
 * @typedef {Object} CitaRepository
 * @property {(parejaId: number) => Promise<number>} countByPareja
 * @property {(parejaId: number, opts: {limit: number, offset: number}) => Promise<object[]>} findPageByPareja
 * @property {(citaIds: number[]) => Promise<object[]>} findEntriesWithUserByCitaIds
 * @property {(citaIds: number[]) => Promise<object[]>} findPhotosByCitaIds
 * @property {(parejaId: number, opts: {limit: number, offset: number}) => Promise<{citas: object[], total: number}>} listWithEntries
 * @property {(citaId: number, parejaId: number) => Promise<object|null>} getCitaWithEntries
 * @property {(citaId: number, parejaId: number) => Promise<object|null>} findByIdAndPareja
 * @property {(data: {parejaId: number, nombre: string, fecha: string, lugar: string, repetiriamos: string}) => Promise<object>} create
 * @property {(data: {citaId: number, userId: number, valoracion: number, queHicimos?: string, comoTeSentiste?: string, loQueMasGusto?: string, loQueMenosGusto?: string}) => Promise<{id: number}>} createEntry
 * @property {(data: {entryId: number, fotoUrl: string, orden: number}) => Promise<void>} addPhoto
 * @property {(citaId: number, parejaId: number, data: {fecha?: string, lugar?: string, repetiriamos?: string}) => Promise<boolean>} updateFields
 * @property {(data: {citaId: number, userId: number, valoracion: number, queHicimos?: string, comoTeSentiste?: string, loQueMasGusto?: string, loQueMenosGusto?: string}) => Promise<{id: number}>} upsertEntry
 * @property {(citaId: number, userId: number) => Promise<{id: number}|null>} findEntryByCitaAndUser
 * @property {(entryId: number) => Promise<number>} getMaxOrden
 * @property {(fotoId: number, citaId: number) => Promise<string|null>} deletePhoto
 * @property {(citaId: number) => Promise<number[]>} findEntryIdsByCita
 * @property {(entryIds: number[]) => Promise<string[]>} findPhotoUrlsByEntryIds
 * @property {(citaId: number, parejaId: number) => Promise<void>} deleteById
 */
module.exports = {};
