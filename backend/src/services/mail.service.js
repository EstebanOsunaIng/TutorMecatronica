import nodemailer from 'nodemailer';
import { env } from '../config/env.js';

let transporter = null;

function getTransporter() {
  if (transporter) return transporter;
  const hasCredentials = Boolean(env.mail.user && env.mail.pass);
  const hasProvider = Boolean(env.mail.service || env.mail.host);
  if (!hasCredentials || !hasProvider) return null;

  const port = env.mail.port || 587;
  const secure = env.mail.secure !== null ? env.mail.secure : port === 465;

  const transportConfig = {
    port,
    secure,
    auth: {
      user: env.mail.user,
      pass: env.mail.pass
    }
  };

  if (env.mail.service) {
    transportConfig.service = env.mail.service;
  } else {
    transportConfig.host = env.mail.host;
  }

  transporter = nodemailer.createTransport(transportConfig);
  return transporter;
}

export async function sendMail({ to, subject, text }) {
  const tx = getTransporter();
  if (!tx) {
    console.log('[mail] skipped (no config):', { to, subject, text });
    return { delivered: false };
  }
  await tx.sendMail({ from: env.mail.from || env.mail.user, to, subject, text });
  return { delivered: true };
}
