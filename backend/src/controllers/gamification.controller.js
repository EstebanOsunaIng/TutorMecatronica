import { Badge } from '../models/Badge.model.js';
import { User } from '../models/User.model.js';
import { getRankingTop5, getRankingPosition } from '../services/gamification.service.js';

export async function listBadges(req, res) {
  const badges = await Badge.find();
  const user = await User.findById(req.user.id).select('badgesUnlocked');
  res.json({ badges, unlocked: user?.badgesUnlocked || [] });
}

export async function rankingTop5(_req, res) {
  const top = await getRankingTop5();
  res.json({ top });
}

export async function rankingMe(req, res) {
  const position = await getRankingPosition(req.user.id);
  res.json(position);
}
