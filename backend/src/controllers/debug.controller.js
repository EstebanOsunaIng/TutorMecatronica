import { env } from '../config/env.js';
import { sendDiagnosticEmail, verifyMailTransport } from '../mail/mailer.js';

function hasValidDebugToken(req) {
  const isProduction = String(process.env.NODE_ENV || 'development').toLowerCase() === 'production';
  if (!env.mail.debugToken) {
    return !isProduction;
  }

  const incoming = String(req.get('x-debug-token') || req.query?.token || '').trim();
  if (!incoming) return false;
  return env.mail.debugToken && incoming === env.mail.debugToken;
}

function isDebugMailEnabled() {
  const isProduction = String(process.env.NODE_ENV || 'development').toLowerCase() === 'production';
  if (!isProduction) return true;
  return env.mail.debugEnabled;
}

export async function debugMail(req, res) {
  if (!isDebugMailEnabled()) {
    return res.status(404).json({ success: false, error: 'Debug mail endpoint disabled.' });
  }

  if (!hasValidDebugToken(req)) {
    return res.status(403).json({ success: false, error: 'Invalid debug token.' });
  }

  const to = String(env.mail.testTo || '').trim();
  if (!to) {
    return res.status(400).json({ success: false, error: 'MAIL_TEST_TO is missing.' });
  }

  const verify = await verifyMailTransport({ force: true });
  if (!verify.ok) {
    return res.status(500).json({
      success: false,
      stage: 'verify',
      error: verify.error?.message || 'SMTP verify failed',
      code: verify.error?.code || null,
      response: verify.error?.response || null
    });
  }

  const now = new Date().toISOString();
  try {
    await sendDiagnosticEmail({
      to,
      subject: 'SMTP debug test',
      text: `SMTP debug email sent successfully at ${now}.`
    });
    return res.json({ success: true, to, sentAt: now });
  } catch (error) {
    return res.status(500).json({
      success: false,
      stage: 'send',
      error: error?.message || 'Mail send failed',
      code: error?.code || null,
      response: error?.response || null
    });
  }
}
