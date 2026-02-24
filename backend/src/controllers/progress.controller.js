import { Progress } from '../models/Progress.model.js';
import { LessonLevel } from '../models/LessonLevel.model.js';
import { unlockBadgeForModule } from '../services/gamification.service.js';

export async function getMyProgress(req, res) {
  const progress = await Progress.find({ userId: req.user.id });
  res.json({ progress });
}

export async function completeLevel(req, res) {
  const { moduleId, levelOrder } = req.body;
  const totalLevels = await LessonLevel.countDocuments({ moduleId });
  if (!totalLevels) return res.status(400).json({ error: 'Module has no levels' });

  let progress = await Progress.findOne({ userId: req.user.id, moduleId });
  if (!progress) {
    progress = await Progress.create({ userId: req.user.id, moduleId });
  }

  const now = new Date();
  const previousActivityTs = progress.updatedAt
    ? new Date(progress.updatedAt).getTime()
    : new Date(progress.startedAt || now).getTime();
  if (Number.isFinite(previousActivityTs)) {
    const deltaSeconds = Math.round((now.getTime() - previousActivityTs) / 1000);
    // Count only realistic active time windows between level actions.
    if (deltaSeconds > 0 && deltaSeconds <= 3600) {
      progress.timeSpentSeconds = Number(progress.timeSpentSeconds || 0) + deltaSeconds;
    }
  }

  if (!progress.levelsCompleted.includes(levelOrder)) {
    progress.levelsCompleted.push(levelOrder);
  }
  progress.currentLevelOrder = Math.min(levelOrder + 1, totalLevels);
  progress.moduleProgressPercent = Math.round((progress.levelsCompleted.length / totalLevels) * 100);

  let badge = null;
  if (progress.moduleProgressPercent === 100 && !progress.completedAt) {
    progress.completedAt = now;
    const unlocked = await unlockBadgeForModule({ userId: req.user.id, moduleId });
    badge = unlocked.unlocked ? unlocked.badgeId : null;
  }

  await progress.save();
  res.json({ progress, badgeUnlocked: badge });
}

export async function restartModule(req, res) {
  const { moduleId } = req.body;
  if (!moduleId) return res.status(400).json({ error: 'moduleId is required' });

  const progress = await Progress.findOneAndUpdate(
    { userId: req.user.id, moduleId },
    {
      $set: {
        currentLevelOrder: 1,
        levelsCompleted: [],
        moduleProgressPercent: 0,
        completedAt: null,
        startedAt: new Date(),
        timeSpentSeconds: 0
      }
    },
    { new: true }
  );

  if (!progress) {
    return res.status(404).json({ error: 'Progress not found for this module' });
  }

  res.json({ progress });
}
