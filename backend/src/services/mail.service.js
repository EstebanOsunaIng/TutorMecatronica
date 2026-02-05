import nodemailer from 'nodemailer';
import { env } from '../config/env.js';

let transporter = null;

function getTransporter() {
  if (transporter) return transporter;
  if (!env.mail.host || !env.mail.user) return null;
  transporter = nodemailer.createTransport({
    host: env.mail.host,
    port: env.mail.port || 587,
    secure: false,
    auth: {
      user: env.mail.user,
      pass: env.mail.pass
    }
  });
  return transporter;
}

export async function sendMail({ to, subject, text }) {
  const tx = getTransporter();
  if (!tx) {
    console.log('[mail] skipped (no config):', { to, subject, text });
    return { delivered: false };
  }
  await tx.sendMail({ from: env.mail.from, to, subject, text });
  return { delivered: true };
}
