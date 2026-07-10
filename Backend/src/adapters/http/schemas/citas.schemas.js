const { z } = require('zod');
const Cita = require('../../../domain/entities/Cita');
const CitaEntry = require('../../../domain/entities/CitaEntry');

const MAX_FOTOS = CitaEntry.MAX_FOTOS_POR_REQUEST;

const entryBodySchema = z.object({
  valoracion: z.coerce.number().int().min(1).max(5),
  queHicimos: z.string().optional(),
  comoTeSentiste: z.string().optional(),
  loQueMasGusto: z.string().optional(),
  loQueMenosGusto: z.string().optional(),
});

const citaFieldsSchema = z.object({
  nombre: z.string().min(1),
  fecha: z.string().refine((v) => !Number.isNaN(Date.parse(v)), 'Fecha inválida'),
  lugar: z.string().min(1),
  repetiriamos: z.enum(Cita.REPETIRIAMOS_VALUES),
});

const createCitaSchema = entryBodySchema.merge(citaFieldsSchema);

const updateCitaSchema = z.object({
  fecha: z.string().refine((v) => !Number.isNaN(Date.parse(v)), 'Fecha inválida').optional(),
  lugar: z.string().min(1).optional(),
  repetiriamos: z.enum(Cita.REPETIRIAMOS_VALUES).optional(),
});

module.exports = { MAX_FOTOS, entryBodySchema, citaFieldsSchema, createCitaSchema, updateCitaSchema };
