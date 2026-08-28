const { NotFoundError, ValidationError } = require('../../domain/errors');

function makeNudgePartner({ citaRepository, userRepository, notificationPort, cachePort }) {
  async function execute({ citaId, parejaId, userId, userName }) {
    const cita = await citaRepository.findByIdAndPareja(citaId, parejaId);
    if (!cita) {
      throw new NotFoundError('Cita no encontrada');
    }

    // Verificar que el usuario ya tiene su versión escrita
    const myEntry = await citaRepository.findEntryByCitaAndUser(citaId, userId);
    if (!myEntry) {
      throw new ValidationError('Primero debes escribir tu versión antes de recordar a tu pareja');
    }

    // Verificar que la pareja NO ha escrito su versión aún
    const partnerEmail = await userRepository.findPartnerEmail(parejaId, userId);
    if (!partnerEmail) {
      throw new ValidationError('No se encontró a tu pareja');
    }

    const partnerId = await userRepository.findPartnerIdByPareja(parejaId, userId);
    if (partnerId) {
      const partnerEntry = await citaRepository.findEntryByCitaAndUser(citaId, partnerId);
      if (partnerEntry) {
        throw new ValidationError('Tu pareja ya escribió su versión de esta cita');
      }
    }

    // Rate limit: máximo 1 nudge por cita cada 24 horas
    const nudgeKey = `nudge:${parejaId}:${citaId}`;
    const lastNudge = await cachePort.get(nudgeKey);
    if (lastNudge) {
      throw new ValidationError('Ya enviaste un recordatorio para esta cita recientemente. Espera 24 horas.');
    }

    await notificationPort.notifyNudge({
      to: partnerEmail,
      authorName: userName,
      citaNombre: cita.nombre,
      citaId,
    });

    // Marcar que se envió (expira en 24h)
    await cachePort.set(nudgeKey, '1', 60 * 60 * 24);

    return { sent: true };
  }

  return { execute };
}

module.exports = makeNudgePartner;
