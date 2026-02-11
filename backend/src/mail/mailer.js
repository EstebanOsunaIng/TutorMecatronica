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

  await transporter.sendMail({
    from: process.env.MAIL_FROM,
    to,
    subject: 'Codigo de recuperacion',
    html: `
      <div style="background:#f6f7fb;padding:32px 16px;font-family:Arial,Helvetica,sans-serif;color:#111;">
        <div style="max-width:620px;margin:0 auto;background:#ffffff;border-radius:14px;padding:28px 28px 24px;box-shadow:0 8px 24px rgba(16,24,40,0.08);">
          <div style="font-size:12px;letter-spacing:2px;text-transform:uppercase;color:#6b7280;font-weight:700;">Tutor Mecatronica</div>
          <h1 style="margin:14px 0 10px;font-size:28px;line-height:1.2;color:#0f172a;">Tu codigo de seguridad</h1>
          <p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#334155;">Recibimos una solicitud para cambiar tu contraseña. Usa el siguiente codigo para continuar con el proceso.</p>
          <div style="margin:20px 0 18px;padding:18px 20px;background:#f1f5f9;border:1px solid #e2e8f0;border-radius:12px;text-align:center;">
            <div style="font-size:34px;letter-spacing:6px;font-weight:700;color:#111827;">${code}</div>
          </div>
          <p style="margin:0 0 12px;font-size:13px;color:#64748b;">Este codigo expira en 10 minutos.</p>
          <p style="margin:0;font-size:13px;color:#64748b;">Si no solicitaste este cambio, puedes ignorar este correo.</p>
        </div>
      </div>
    `
  });
}
