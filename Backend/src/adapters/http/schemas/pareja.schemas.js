const { z } = require('zod');

const joinParejaSchema = z.object({
  inviteCode: z.string().min(1),
});

module.exports = { joinParejaSchema };
