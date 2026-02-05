import { Badge } from '../models/Badge.model.js';
import { User } from '../models/User.model.js';

export async function unlockBadgeForModule({ userId, moduleId }) {
  const badge = await Badge.findOne({ moduleId });
  if (!badge) return { unlocked: false };

  const user = await User.findById(userId);
  if (!user) return { unlocked: false };

  const already = user.badgesUnlocked?.some((b) => String(b) === String(badge._id));
  if (already) return { unlocked: false };

  user.badgesUnlocked.push(badge._id);
  user.badgesCount = (user.badgesCount || 0) + 1;
  user.completedModulesCount = (user.completedModulesCount || 0) + 1;
  user.lastBadgeUnlockedAt = new Date();
  await user.save();

  return { unlocked: true, badgeId: badge._id };
}

export async function getRankingTop5() {
  return User.find({ role: 'STUDENT' })
    .sort({ badgesCount: -1, completedModulesCount: -1, lastBadgeUnlockedAt: 1 })
    .limit(5)
    .select('name lastName badgesCount');
}

export async function getRankingPosition(userId) {
  const users = await User.find({ role: 'STUDENT' })
    .sort({ badgesCount: -1, completedModulesCount: -1, lastBadgeUnlockedAt: 1 })
    .select('_id badgesCount');

  const index = users.findIndex((u) => String(u._id) === String(userId));
  return { position: index >= 0 ? index + 1 : null, total: users.length };
}
