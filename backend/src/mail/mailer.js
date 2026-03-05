import nodemailer from 'nodemailer';

export function createTransporter() {
  const transport = {
    port: Number(process.env.MAIL_PORT),
    secure: process.env.MAIL_SECURE === 'true',
    tls: {
      rejectUnauthorized: process.env.MAIL_TLS_REJECT_UNAUTHORIZED !== 'false'
    },
    auth: {
      user: process.env.MAIL_USER,
      pass: process.env.MAIL_PASS
    }
  };

  if (process.env.MAIL_SERVICE) {
    transport.service = process.env.MAIL_SERVICE;
  } else {
    transport.host = process.env.MAIL_HOST;
  }

  return nodemailer.createTransport(transport);
}

export async function sendResetCodeEmail({ to, code }) {
  const transporter = createTransporter();

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

  await transporter.sendMail({
    from: process.env.MAIL_FROM,
    to,
    subject: 'Codigo de recuperacion',
    text: `TuVir - Codigo de recuperacion\n\nRecibimos una solicitud para cambiar tu contrasena.\nCodigo: ${code}\nVence en 10 minutos.\n\nSi no solicitaste este cambio, ignora este correo.`,
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

export async function sendPasswordChangeConfirmationEmail({ to, confirmUrl }) {
  const transporter = createTransporter();
  await transporter.sendMail({
    from: process.env.MAIL_FROM,
    to,
    subject: 'Confirmación de cambio de contraseña',
    text: `Se solicitó un cambio de contraseña para tu cuenta.
Confirma aquí: ${confirmUrl}
Este enlace vence en 5 minutos.
Si no fuiste tú, ignora este mensaje.`,
    html: `
      <div style="margin:0;padding:0;background:#eef3fb;font-family:'Segoe UI',Arial,Helvetica,sans-serif;color:#0f172a;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#eef3fb;padding:24px 12px;">
          <tr><td align="center">
            <table role="presentation" width="640" cellspacing="0" cellpadding="0" style="width:100%;max-width:640px;border-collapse:separate;background:#ffffff;border:1px solid #dbe6f5;border-radius:24px;box-shadow:0 20px 45px rgba(15,23,42,0.1);overflow:hidden;">
              <tr><td style="padding:0;">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:linear-gradient(135deg,#0b2f59 0%,#0ea5e9 100%);">
                  <tr><td style="padding:24px 28px 20px 28px;">
                    <div style="font-size:11px;letter-spacing:1.8px;text-transform:uppercase;color:#dbeafe;font-weight:700;margin-bottom:12px;">TuVir | Tutor Mecatronica</div>
                    <h1 style="margin:0 0 8px 0;font-size:30px;line-height:1.2;color:#ffffff;">Confirmación de cambio</h1>
                    <p style="margin:0;font-size:15px;line-height:1.6;color:#e0f2fe;max-width:500px;">Se solicitó un cambio de contraseña para tu cuenta.</p>
                  </td></tr>
                </table>
              </td></tr>
              <tr><td style="padding:22px;">
                <p style="margin:0 0 14px 0;font-size:15px;line-height:1.6;color:#334155;">Pulsa el botón para confirmar el cambio. El enlace vence en 5 minutos.</p>
                <p style="margin:0 0 18px 0;">
                  <a href="${confirmUrl}" style="display:inline-block;padding:12px 18px;border-radius:12px;background:#0ea5e9;color:#ffffff;text-decoration:none;font-weight:700;">Confirmar cambio</a>
                </p>
                <p style="margin:0;font-size:13px;color:#64748b;">Si no fuiste tú, ignora este mensaje.</p>
              </td></tr>
            </table>
          </td></tr>
        </table>
      </div>
    `
  });
}

export async function sendPasswordChangeExpiredAlertEmail({ to }) {
  const transporter = createTransporter();
  await transporter.sendMail({
    from: process.env.MAIL_FROM,
    to,
    subject: 'Intentaron cambiar tu contraseña',
    text: 'Se intentó cambiar la contraseña de tu cuenta pero no se confirmó dentro del tiempo de seguridad. Si no fuiste tú, revisa tu cuenta.',
    html: `
      <div style="margin:0;padding:0;background:#eef3fb;font-family:'Segoe UI',Arial,Helvetica,sans-serif;color:#0f172a;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#eef3fb;padding:24px 12px;">
          <tr><td align="center">
            <table role="presentation" width="640" cellspacing="0" cellpadding="0" style="width:100%;max-width:640px;border-collapse:separate;background:#ffffff;border:1px solid #dbe6f5;border-radius:24px;box-shadow:0 20px 45px rgba(15,23,42,0.1);overflow:hidden;">
              <tr><td style="padding:0;">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:linear-gradient(135deg,#0b2f59 0%,#0ea5e9 100%);">
                  <tr><td style="padding:24px 28px 20px 28px;">
                    <h1 style="margin:0;font-size:28px;line-height:1.2;color:#ffffff;">Alerta de seguridad</h1>
                  </td></tr>
                </table>
              </td></tr>
              <tr><td style="padding:22px;">
                <p style="margin:0;font-size:15px;line-height:1.6;color:#334155;">Se intentó cambiar la contraseña de tu cuenta pero no se confirmó dentro del tiempo de seguridad. Si no fuiste tú, revisa tu cuenta.</p>
              </td></tr>
            </table>
          </td></tr>
        </table>
      </div>
    `
  });
}

export async function sendRegisterOtpEmail({ to, otp, expiresMinutes = 15 }) {
  const transporter = createTransporter();
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

  await transporter.sendMail({
    from: process.env.MAIL_FROM,
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
