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
      <h2>Restablecer contrasena</h2>
      <p>Tu codigo es:</p>
      <h1>${code}</h1>
      <p>Expira en 10 minutos.</p>
    `
  });
}
