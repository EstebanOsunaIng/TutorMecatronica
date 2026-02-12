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

  const progress = await Progress.findOneAndUpdate(
    { userId: req.user.id, moduleId },
    { $setOnInsert: { userId: req.user.id, moduleId } },
    { new: true, upsert: true }
  );

  if (!progress.levelsCompleted.includes(levelOrder)) {
    progress.levelsCompleted.push(levelOrder);
  }
  progress.currentLevelOrder = Math.min(levelOrder + 1, totalLevels);
  progress.moduleProgressPercent = Math.round((progress.levelsCompleted.length / totalLevels) * 100);

  let badge = null;
  if (progress.moduleProgressPercent === 100 && !progress.completedAt) {
    progress.completedAt = new Date();
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
        startedAt: new Date()
      }
    },
    { new: true }
  );

  if (!progress) {
    return res.status(404).json({ error: 'Progress not found for this module' });
  }

  res.json({ progress });
}
