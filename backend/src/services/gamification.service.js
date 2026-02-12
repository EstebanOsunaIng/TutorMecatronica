import { Badge } from '../models/Badge.model.js';
import { User } from '../models/User.model.js';
import { RankingSnapshot } from '../models/RankingSnapshot.model.js';
import { Notification } from '../models/Notification.model.js';
import { createNotification } from './notifications.service.js';

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

  const moduleTitle = badge.name?.replace(/^Insignia:\s*/i, '').trim() || 'tu modulo';
  await createNotification({
    userId: user._id,
    title: 'Insignia obtenida',
    message: `Has obtenido la insignia del modulo '${moduleTitle}'.`,
    type: 'INSIGNIA_OBTENIDA'
  });

  await recalculateRankingNotifications();

  return { unlocked: true, badgeId: badge._id };
}

export async function recalculateRankingNotifications() {
  const students = await User.find({ role: 'STUDENT' })
    .sort({ badgesCount: -1, completedModulesCount: -1, lastBadgeUnlockedAt: 1 })
    .select('_id name lastName');

  const ranking = students.map((user, index) => ({
    userId: user._id,
    position: index + 1,
    name: `${user.name} ${user.lastName || ''}`.trim()
  }));

  const lastSnapshot = await RankingSnapshot.findOne().sort({ generatedAt: -1 });
  const prevMap = new Map();
  if (Array.isArray(lastSnapshot?.top)) {
    lastSnapshot.top.forEach((item) => {
      if (item?.userId) prevMap.set(String(item.userId), Number(item.position));
    });
  }

  const notifications = [];

  ranking.forEach((entry, index) => {
    const userId = String(entry.userId);
    const prev = prevMap.get(userId);
    if (!prev || prev === entry.position) return;

    if (entry.position < prev) {
      if (entry.position === 1) {
        notifications.push({
          userId: entry.userId,
          title: 'Nuevo Top 1',
          message: 'Ahora eres Top 1 del ranking.',
          type: 'TOP_1'
        });
      } else {
        notifications.push({
          userId: entry.userId,
          title: 'Ranking actualizado',
          message: `Subiste al puesto #${entry.position} del ranking.`,
          type: 'RANKING_SUBIO'
        });
      }
    }

    if (entry.position > prev) {
      notifications.push({
        userId: entry.userId,
        title: 'Ranking actualizado',
        message: `Bajaste al puesto #${entry.position} del ranking.`,
        type: 'RANKING_BAJO'
      });

      const above = ranking[index - 1];
      if (above?.name) {
        notifications.push({
          userId: entry.userId,
          title: 'Te han superado',
          message: `${above.name} te ha superado en el ranking.`,
          type: 'FUE_SUPERADO'
        });
      }
    }
  });

  if (notifications.length > 0) {
    await Notification.insertMany(notifications);
  }

  await RankingSnapshot.create({
    generatedAt: new Date(),
    top: ranking.map((entry) => ({ userId: entry.userId, position: entry.position }))
  });
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
