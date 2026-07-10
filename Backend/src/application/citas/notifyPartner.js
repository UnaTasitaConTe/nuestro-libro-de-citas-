async function notifyPartner({ userRepository, notificationPort, parejaId, authorUserId, authorName, citaNombre, citaId }) {
  const partnerEmail = await userRepository.findPartnerEmail(parejaId, authorUserId);
  if (!partnerEmail) return;
  await notificationPort.notifyEntryRecorded({ to: partnerEmail, authorName, citaNombre, citaId });
}

module.exports = notifyPartner;
