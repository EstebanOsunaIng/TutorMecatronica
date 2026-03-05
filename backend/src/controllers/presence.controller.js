import { User } from '../models/User.model.js';

export async function pingPresence(req, res) {
  await User.findByIdAndUpdate(req.user.id, {
    $set: { lastSeenAt: new Date(), isActive: true }
  });
  res.json({ ok: true });
}
