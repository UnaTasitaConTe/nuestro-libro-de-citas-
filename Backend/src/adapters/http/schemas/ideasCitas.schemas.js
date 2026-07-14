const { z } = require('zod');
const IdeaCita = require('../../../domain/entities/IdeaCita');

const createIdeaSchema = z.object({
  titulo: z.string().min(1).max(200),
  descripcion: z.string().max(2000).optional(),
});

const updateIdeaSchema = createIdeaSchema.partial();

const moveIdeaSchema = z.object({
  estado: z.enum(IdeaCita.ESTADO_VALUES),
  orderedIds: z.array(z.coerce.number().int()).min(1),
});

module.exports = { createIdeaSchema, updateIdeaSchema, moveIdeaSchema };
