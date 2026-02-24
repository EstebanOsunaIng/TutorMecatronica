import { PasswordChangeRequest } from '../models/PasswordChangeRequest.model.js';
import { User } from '../models/User.model.js';
import { sendPasswordChangeExpiredAlertEmail } from '../mail/mailer.js';

let expirySweepInterval = null;

export async function expirePendingPasswordChangeRequests() {
  const now = new Date();
  const expiredPending = await PasswordChangeRequest.find({
    status: { $in: ['pending', 'confirmed'] },
    $or: [{ expiresAt: { $lt: now } }, { confirmedUntil: { $lt: now } }]
  });

  for (const req of expiredPending) {
    req.status = 'expired';
    await req.save();

    if (!req.alertSent) {
      const user = await User.findById(req.userId).select('email');
      const email = user?.email || req.email;
      if (email) {
        try {
          await sendPasswordChangeExpiredAlertEmail({ to: email });
          req.alertSent = true;
          await req.save();
        } catch (err) {
          console.error('[password-change] failed to send expiration alert', err?.message || err);
        }
      }
    }

    console.info('[password-change]', {
      userId: String(req.userId),
      status: 'expired',
      date: new Date().toISOString()
    });
  }
}

export function startPasswordChangeExpirySweep() {
  if (expirySweepInterval) return;
  expirySweepInterval = setInterval(() => {
    expirePendingPasswordChangeRequests().catch((err) => {
      console.error('[password-change] expiry sweep failed', err?.message || err);
    });
  }, 60 * 1000);
}
