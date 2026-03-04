import { Progress } from '../models/Progress.model.js';
import { LessonLevel } from '../models/LessonLevel.model.js';
import { unlockBadgeForModule } from '../services/gamification.service.js';

function normalizeModuleOrders(levelRows) {
  const values = (Array.isArray(levelRows) ? levelRows : [])
    .map((item) => Number(item?.order))
    .filter((value) => Number.isFinite(value) && value > 0);
  return [...new Set(values)].sort((a, b) => a - b);
}

function arraysEqual(a = [], b = []) {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i += 1) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}

function reconcileProgressWithOrders(progress, moduleOrders) {
  const orders = normalizeModuleOrders(moduleOrders);
  const validOrderSet = new Set(orders);

  const previousCompleted = Array.isArray(progress.levelsCompleted) ? progress.levelsCompleted : [];
  const nextCompleted = [...new Set(previousCompleted)]
    .map((value) => Number(value))
    .filter((value) => Number.isFinite(value) && validOrderSet.has(value))
    .sort((a, b) => a - b);

  if (!arraysEqual(previousCompleted, nextCompleted)) {
    progress.levelsCompleted = nextCompleted;
  }

  if (!orders.length) {
    progress.currentLevelOrder = 1;
    progress.moduleProgressPercent = 0;
    progress.completedAt = null;
    return;
  }

  const completedSet = new Set(nextCompleted);
  const firstPendingOrder = orders.find((order) => !completedSet.has(order));
  const nextCurrentOrder = firstPendingOrder || orders[orders.length - 1];
  const nextPercent = Math.round((nextCompleted.length / orders.length) * 100);

  progress.currentLevelOrder = nextCurrentOrder;
  progress.moduleProgressPercent = nextPercent;

  if (nextPercent < 100) {
    progress.completedAt = null;
  }
}

async function getModuleOrderRows(moduleId) {
  return LessonLevel.find({ moduleId }).sort({ order: 1 }).select('order').lean();
}

export async function getMyProgress(req, res) {
  const progressRows = await Progress.find({ userId: req.user.id });

  for (const row of progressRows) {
    const moduleOrderRows = await getModuleOrderRows(row.moduleId);
    const beforeCurrent = Number(row.currentLevelOrder || 1);
    const beforePercent = Number(row.moduleProgressPercent || 0);
    const beforeCompleted = Array.isArray(row.levelsCompleted) ? [...row.levelsCompleted] : [];

    reconcileProgressWithOrders(row, moduleOrderRows);

    const completedChanged = !arraysEqual(beforeCompleted, row.levelsCompleted || []);
    if (
      completedChanged ||
      beforeCurrent !== Number(row.currentLevelOrder || 1) ||
      beforePercent !== Number(row.moduleProgressPercent || 0)
    ) {
      await row.save();
    }
  }

  res.json({ progress: progressRows });
}

export async function completeLevel(req, res) {
  const { moduleId, levelOrder } = req.body;
  const moduleOrderRows = await getModuleOrderRows(moduleId);
  const moduleOrders = normalizeModuleOrders(moduleOrderRows);
  if (!moduleOrders.length) return res.status(400).json({ error: 'Module has no levels' });

  const numericLevelOrder = Number(levelOrder);
  if (!Number.isFinite(numericLevelOrder) || !moduleOrders.includes(numericLevelOrder)) {
    return res.status(400).json({ error: 'Nivel invalido para este modulo.' });
  }

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

  const previousPercent = Number(progress.moduleProgressPercent || 0);

  if (!progress.levelsCompleted.includes(numericLevelOrder)) {
    progress.levelsCompleted.push(numericLevelOrder);
  }
  reconcileProgressWithOrders(progress, moduleOrderRows);

  let badge = null;
  if (progress.moduleProgressPercent === 100 && previousPercent < 100) {
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
