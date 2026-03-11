import nodemailer from 'nodemailer';
import { Resend } from 'resend';
import { env } from '../config/env.js';

let transporter = null;
let verifyPromise = null;
let resendClient = null;

function isResendProvider() {
  return env.mail.provider === 'resend';
}

function getSmtpConfig() {
  const port = env.mail.port || 587;
  const secure = env.mail.secure !== null ? env.mail.secure : port === 465;
  return {
    service: env.mail.service,
    host: env.mail.host,
    port,
    secure,
    user: env.mail.user,
    pass: env.mail.pass,
    from: env.mail.from,
    tlsRejectUnauthorized: env.mail.tlsRejectUnauthorized
  };
}

function sanitizeSmtpError(error) {
  return {
    code: error?.code || 'UNKNOWN',
    command: error?.command || null,
    responseCode: error?.responseCode || null,
    response: error?.response || null,
    message: error?.message || 'SMTP error'
  };
}

function ensureResendClient() {
  if (resendClient) return;
  if (!env.mail.resendApiKey) {
    throw new Error('RESEND_API_KEY is required when MAIL_PROVIDER=resend.');
  }
  resendClient = new Resend(env.mail.resendApiKey);
}

export function createTransporter() {
  if (isResendProvider()) return null;
  if (transporter) return transporter;

  const smtp = getSmtpConfig();
  const hasCredentials = Boolean(smtp.user && smtp.pass);
  const hasProvider = Boolean(smtp.service || smtp.host);

  if (!hasCredentials || !hasProvider) {
    throw new Error('SMTP config missing: set MAIL_HOST/MAIL_SERVICE, MAIL_PORT, MAIL_USER and MAIL_PASS.');
  }

  const transport = {
    port: smtp.port,
    secure: smtp.secure,
    tls: {
      rejectUnauthorized: smtp.tlsRejectUnauthorized
    },
    auth: {
      user: smtp.user,
      pass: smtp.pass
    }
  };

  if (smtp.service) {
    transport.service = smtp.service;
  } else {
    transport.host = smtp.host;
  }

  transporter = nodemailer.createTransport(transport);
  return transporter;
}

export async function verifyMailTransport({ force = false } = {}) {
  if (verifyPromise && !force) return verifyPromise;

  verifyPromise = (async () => {
    if (isResendProvider()) {
      try {
        ensureResendClient();
        console.info('[mail] Resend ready', {
          provider: env.mail.provider,
          from: env.mail.from
        });
        return { ok: true };
      } catch (error) {
        console.error('[mail] Resend verify failed', {
          provider: env.mail.provider,
          message: error?.message || 'Resend error'
        });
        return { ok: false, error: { message: error?.message || 'Resend error', code: 'RESEND_ERROR' } };
      }
    }

    const smtp = getSmtpConfig();
    try {
      const tx = createTransporter();
      await tx.verify();
      console.info('[mail] SMTP ready', {
        host: smtp.host || smtp.service,
        port: smtp.port,
        secure: smtp.secure,
        user: smtp.user
      });
      return { ok: true };
    } catch (error) {
      const details = sanitizeSmtpError(error);
      console.error('[mail] SMTP verify failed', {
        host: smtp.host || smtp.service,
        port: smtp.port,
        secure: smtp.secure,
        user: smtp.user,
        ...details
      });
      return { ok: false, error: details };
    }
  })();

  return verifyPromise;
}

async function sendMailChecked(mailOptions) {
  const verification = await verifyMailTransport();
  if (!verification.ok) {
    const error = new Error(verification.error?.message || 'SMTP verify failed');
    error.code = verification.error?.code || 'SMTP_VERIFY_FAILED';
    error.response = verification.error?.response || null;
    throw error;
  }

  if (isResendProvider()) {
    ensureResendClient();
    const { data, error } = await resendClient.emails.send({
      from: mailOptions.from,
      to: Array.isArray(mailOptions.to) ? mailOptions.to : [mailOptions.to],
      subject: mailOptions.subject,
      html: mailOptions.html,
      text: mailOptions.text,
      replyTo: process.env.MAIL_REPLY_TO || undefined,
      idempotencyKey: mailOptions.idempotencyKey
    });

    if (error) {
      console.error('[mail] resend send failed', {
        to: mailOptions?.to,
        subject: mailOptions?.subject,
        provider: env.mail.provider,
        message: error.message,
        name: error.name
      });
      const err = new Error(error.message || 'Resend error');
      err.code = error.name || 'RESEND_ERROR';
      throw err;
    }

    return { delivered: true, id: data?.id };
  }

  const tx = createTransporter();

  try {
    return await tx.sendMail(mailOptions);
  } catch (error) {
    const smtp = getSmtpConfig();
    const details = sanitizeSmtpError(error);
    console.error('[mail] send failed', {
      to: mailOptions?.to,
      subject: mailOptions?.subject,
      host: smtp.host || smtp.service,
      port: smtp.port,
      user: smtp.user,
      ...details
    });
    throw error;
  }
}

export async function sendResetCodeEmail({ to, code, resetUrl = '' }) {
  const codeDigits = String(code || '')
    .split('')
    .map(
      (digit) => `
        <td style="padding:0 4px;">
          <div style="width:44px;height:54px;line-height:54px;text-align:center;border-radius:12px;background:#ffffff;border:1px solid #bfdbfe;font-size:28px;font-weight:800;color:#0f172a;box-shadow:0 6px 20px rgba(15,23,42,0.08);">${digit}</div>
        </td>
      `
    )
    .join('');

  const safeResetUrl = String(resetUrl || '').trim();
  const resetTextLine = safeResetUrl ? `\nTambien puedes abrir: ${safeResetUrl}\n` : '\n';
  const resetHtmlCta = safeResetUrl
    ? `<p style="margin:0 0 18px 0;"><a href="${safeResetUrl}" style="display:inline-block;padding:12px 18px;border-radius:12px;background:#0ea5e9;color:#ffffff;text-decoration:none;font-weight:700;">Ir a restablecer contrasena</a></p>`
    : '';

  await sendMailChecked({
    from: env.mail.from,
    to,
    subject: 'Codigo de recuperacion',
    text: `TuVir - Codigo de recuperacion\n\nRecibimos una solicitud para cambiar tu contrasena.\nCodigo: ${code}\nVence en 10 minutos.${resetTextLine}\nSi no solicitaste este cambio, ignora este correo.`,
    html: `
      <div style="margin:0;padding:0;background:#eef3fb;font-family:'Segoe UI',Arial,Helvetica,sans-serif;color:#0f172a;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#eef3fb;padding:24px 12px;">
          <tr>
            <td align="center">
              <table role="presentation" width="640" cellspacing="0" cellpadding="0" style="width:100%;max-width:640px;border-collapse:separate;background:#ffffff;border:1px solid #dbe6f5;border-radius:24px;box-shadow:0 20px 45px rgba(15,23,42,0.1);overflow:hidden;">
                <tr>
                  <td style="padding:0;">
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:linear-gradient(135deg,#0b2f59 0%,#0ea5e9 100%);">
                      <tr>
                        <td style="padding:24px 28px 20px 28px;">
                          <div style="font-size:11px;letter-spacing:1.8px;text-transform:uppercase;color:#dbeafe;font-weight:700;margin-bottom:12px;">TuVir | Tutor Mecatronica</div>
                          <h1 style="margin:0 0 8px 0;font-size:30px;line-height:1.2;color:#ffffff;">Codigo de recuperacion</h1>
                          <p style="margin:0;font-size:15px;line-height:1.6;color:#e0f2fe;max-width:500px;">Usa este codigo para restablecer tu contrasena. Por seguridad, solo estara activo durante 10 minutos.</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <tr>
                  <td style="padding:20px 22px 10px 22px;">
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#ffffff;border:1px solid #e2ecfa;border-radius:18px;box-shadow:0 10px 24px rgba(15,23,42,0.06);">
                      <tr>
                        <td style="padding:20px 18px 14px 18px;">
                    <p style="margin:0 0 12px 0;font-size:15px;line-height:1.6;color:#334155;">Recibimos una solicitud para cambiar la contrasena de tu cuenta <span style="font-weight:700;color:#0f172a;">${to}</span>.</p>
                    <p style="margin:0 0 16px 0;font-size:15px;line-height:1.6;color:#334155;">Ingresa el siguiente codigo en la pantalla de recuperacion:</p>

                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:linear-gradient(180deg,#eff6ff 0%,#f8fbff 100%);border:1px solid #dbeafe;border-radius:16px;padding:18px 8px;margin:0 0 14px 0;">
                      <tr>
                        <td align="center">
                          <table role="presentation" cellspacing="0" cellpadding="0" style="margin:0 auto;">
                            <tr>
                              ${codeDigits}
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>

                    <div style="margin:0 0 14px 0;padding:12px 14px;border-radius:12px;background:#f8fafc;border:1px solid #e2e8f0;">
                      <p style="margin:0 0 8px 0;font-size:13px;color:#334155;"><span style="font-weight:700;color:#0f172a;">Vigencia:</span> 10 minutos.</p>
                      <p style="margin:0;font-size:13px;color:#334155;"><span style="font-weight:700;color:#0f172a;">Seguridad:</span> Nunca compartas este codigo. El equipo de TuVir no te lo pedira por chat ni por telefono.</p>
                    </div>

                    ${resetHtmlCta}
                    <p style="margin:0 0 18px 0;font-size:13px;color:#64748b;">Si no solicitaste este cambio, puedes ignorar este correo sin realizar ninguna accion.</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <tr>
                  <td style="padding:14px 8px 0 8px;text-align:center;">
                    <p style="margin:0;font-size:12px;line-height:1.5;color:#64748b;">Este mensaje fue enviado automaticamente por TuVir.</p>
                    <p style="margin:4px 0 0 0;font-size:12px;line-height:1.5;color:#64748b;">Universitaria de Colombia - Plataforma de aprendizaje en mecatronica</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </div>
    `
  });
}

export async function sendRegisterOtpEmail({ to, otp, expiresMinutes = 15 }) {
  const codeDigits = String(otp || '')
    .split('')
    .map(
      (digit) => `
        <td style="padding:0 4px;">
          <div style="width:44px;height:54px;line-height:54px;text-align:center;border-radius:12px;background:#ffffff;border:1px solid #bfdbfe;font-size:28px;font-weight:800;color:#0f172a;box-shadow:0 6px 20px rgba(15,23,42,0.08);">${digit}</div>
        </td>
      `
    )
    .join('');

  await sendMailChecked({
    from: env.mail.from,
    to,
    subject: 'Verificacion de correo',
    text: `Estas intentando crear una cuenta.\nCodigo OTP: ${otp}\nValido por ${expiresMinutes} minutos.\n\nSi no fuiste tu, ignora este mensaje.`,
    html: `
      <div style="margin:0;padding:0;background:#eef3fb;font-family:'Segoe UI',Arial,Helvetica,sans-serif;color:#0f172a;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#eef3fb;padding:24px 12px;">
          <tr><td align="center">
            <table role="presentation" width="640" cellspacing="0" cellpadding="0" style="width:100%;max-width:640px;border-collapse:separate;background:#ffffff;border:1px solid #dbe6f5;border-radius:24px;box-shadow:0 20px 45px rgba(15,23,42,0.1);overflow:hidden;">
              <tr><td style="padding:0;">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:linear-gradient(135deg,#0b2f59 0%,#0ea5e9 100%);">
                  <tr><td style="padding:24px 28px 20px 28px;">
                    <div style="font-size:11px;letter-spacing:1.8px;text-transform:uppercase;color:#dbeafe;font-weight:700;margin-bottom:12px;">TuVir | Tutor Mecatronica</div>
                    <h1 style="margin:0 0 8px 0;font-size:30px;line-height:1.2;color:#ffffff;">Verificacion de correo</h1>
                    <p style="margin:0;font-size:15px;line-height:1.6;color:#e0f2fe;max-width:500px;">Estas intentando crear una cuenta. Ingresa este codigo para confirmar tu correo.</p>
                  </td></tr>
                </table>
              </td></tr>
              <tr><td style="padding:24px;">
                <p style="margin:0 0 14px 0;font-size:15px;line-height:1.6;color:#334155;">Usa este codigo para verificar <strong>${to}</strong>.</p>
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:linear-gradient(180deg,#eff6ff 0%,#f8fbff 100%);border:1px solid #dbeafe;border-radius:16px;padding:18px 8px;margin:0 0 14px 0;">
                  <tr><td align="center">
                    <table role="presentation" cellspacing="0" cellpadding="0" style="margin:0 auto;"><tr>${codeDigits}</tr></table>
                  </td></tr>
                </table>
                <p style="margin:0 0 10px 0;font-size:13px;color:#334155;"><strong>Vigencia:</strong> ${expiresMinutes} minutos.</p>
                <p style="margin:0;font-size:13px;color:#64748b;">Si no solicitaste este mensaje, ignora este correo.</p>
              </td></tr>
            </table>
          </td></tr>
        </table>
      </div>
    `
  });
}

export async function sendPasswordChangeConfirmationEmail({ to, confirmUrl }) {
  await sendMailChecked({
    from: env.mail.from,
    to,
    subject: 'Confirma el cambio de contrasena',
    text: `Recibimos una solicitud para cambiar tu contrasena.\nConfirma aqui: ${confirmUrl}\n\nSi no solicitaste este cambio, ignora este correo.`,
    html: `
      <div style="margin:0;padding:0;background:#eef3fb;font-family:'Segoe UI',Arial,Helvetica,sans-serif;color:#0f172a;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#eef3fb;padding:24px 12px;">
          <tr><td align="center">
            <table role="presentation" width="640" cellspacing="0" cellpadding="0" style="width:100%;max-width:640px;border-collapse:separate;background:#ffffff;border:1px solid #dbe6f5;border-radius:24px;box-shadow:0 20px 45px rgba(15,23,42,0.1);overflow:hidden;">
              <tr><td style="padding:0;">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:linear-gradient(135deg,#0b2f59 0%,#0ea5e9 100%);">
                  <tr><td style="padding:24px 28px 20px 28px;">
                    <div style="font-size:11px;letter-spacing:1.8px;text-transform:uppercase;color:#dbeafe;font-weight:700;margin-bottom:12px;">TuVir | Tutor Mecatronica</div>
                    <h1 style="margin:0 0 8px 0;font-size:30px;line-height:1.2;color:#ffffff;">Confirma el cambio de contrasena</h1>
                    <p style="margin:0;font-size:15px;line-height:1.6;color:#e0f2fe;max-width:500px;">Confirma el cambio de contrasena desde el enlace seguro.</p>
                  </td></tr>
                </table>
              </td></tr>
              <tr><td style="padding:24px;">
                <p style="margin:0 0 14px 0;font-size:15px;line-height:1.6;color:#334155;">Si fuiste tu, confirma el cambio de contrasena:</p>
                <p style="margin:0 0 18px 0;">
                  <a href="${confirmUrl}" style="display:inline-block;padding:12px 18px;border-radius:12px;background:#0ea5e9;color:#ffffff;text-decoration:none;font-weight:700;">Confirmar cambio</a>
                </p>
                <p style="margin:0;font-size:13px;color:#64748b;">Si no solicitaste este cambio, ignora este correo.</p>
              </td></tr>
            </table>
          </td></tr>
        </table>
      </div>
    `
  });
}

export async function sendPasswordChangeExpiredAlertEmail({ to }) {
  await sendMailChecked({
    from: env.mail.from,
    to,
    subject: 'Alerta de seguridad - cambio de contrasena',
    text: 'Intentaron cambiar tu contrasena. No se confirmo la solicitud y el enlace expiro.',
    html: `
      <div style="margin:0;padding:0;background:#eef3fb;font-family:'Segoe UI',Arial,Helvetica,sans-serif;color:#0f172a;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#eef3fb;padding:24px 12px;">
          <tr><td align="center">
            <table role="presentation" width="640" cellspacing="0" cellpadding="0" style="width:100%;max-width:640px;border-collapse:separate;background:#ffffff;border:1px solid #dbe6f5;border-radius:24px;box-shadow:0 20px 45px rgba(15,23,42,0.1);overflow:hidden;">
              <tr><td style="padding:24px;">
                <h1 style="margin:0 0 8px 0;font-size:26px;line-height:1.2;color:#0f172a;">Alerta de seguridad</h1>
                <p style="margin:0;font-size:15px;line-height:1.6;color:#334155;">Se intento cambiar tu contrasena, pero la solicitud no fue confirmada y expiro.</p>
              </td></tr>
            </table>
          </td></tr>
        </table>
      </div>
    `
  });
}

export async function sendDiagnosticEmail({ to, subject, text }) {
  await sendMailChecked({
    from: env.mail.from,
    to,
    subject,
    text,
    html: `<pre style="font-family:Arial, sans-serif;">${text}</pre>`
  });
}
