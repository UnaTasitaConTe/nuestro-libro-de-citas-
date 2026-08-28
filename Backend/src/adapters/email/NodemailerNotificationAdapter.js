const nodemailer = require('nodemailer');

let transporter = null;

function getTransporter() {
  if (transporter) return transporter;
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) return null;

  transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
  return transporter;
}

class NodemailerNotificationAdapter {
  async notifyEntryRecorded({ to, authorName, citaNombre, citaId }) {
    const t = getTransporter();
    if (!t) {
      console.warn('SMTP no configurado; se omite el envío de notificación por correo');
      return;
    }

    const frontendUrl = process.env.FRONTEND_URL || '';
    const link = frontendUrl ? `${frontendUrl}/citas/${citaId}` : null;

    try {
      await t.sendMail({
        from: process.env.SMTP_FROM || process.env.SMTP_USER,
        to,
        subject: `${authorName} contó su versión de "${citaNombre}" 💛`,
        text: [
          `${authorName} acaba de contar su versión de la cita "${citaNombre}".`,
          link ? `Míralo aquí: ${link}` : null,
        ]
          .filter(Boolean)
          .join('\n\n'),
        html: [
          `<p><strong>${authorName}</strong> acaba de contar su versión de la cita "<strong>${citaNombre}</strong>".</p>`,
          link ? `<p><a href="${link}">Míralo aquí</a></p>` : '',
        ].join(''),
      });
    } catch (err) {
      console.error('Error enviando notificación por correo:', err.message);
    }
  }

  async notifyNudge({ to, authorName, citaNombre, citaId }) {
    const t = getTransporter();
    if (!t) {
      console.warn('SMTP no configurado; se omite el envío de recordatorio');
      return;
    }

    const frontendUrl = process.env.FRONTEND_URL || '';
    const link = frontendUrl ? `${frontendUrl}/citas/${citaId}/mi-entrada` : null;

    try {
      await t.sendMail({
        from: process.env.SMTP_FROM || process.env.SMTP_USER,
        to,
        subject: `${authorName} quiere leer tu versión de "${citaNombre}" 💌`,
        text: [
          `¡Hey! ${authorName} ya contó su versión de la cita "${citaNombre}" y quiere leer la tuya.`,
          '¿Te animas a escribirla? Solo toma un minuto 💛',
          link ? `Escribe tu versión aquí: ${link}` : null,
        ]
          .filter(Boolean)
          .join('\n\n'),
        html: [
          `<p>¡Hey! <strong>${authorName}</strong> ya contó su versión de la cita "<strong>${citaNombre}</strong>" y quiere leer la tuya.</p>`,
          `<p>¿Te animas a escribirla? Solo toma un minuto 💛</p>`,
          link ? `<p><a href="${link}">Escribe tu versión aquí</a></p>` : '',
        ].join(''),
      });
    } catch (err) {
      console.error('Error enviando recordatorio por correo:', err.message);
    }
  }
}

module.exports = NodemailerNotificationAdapter;
