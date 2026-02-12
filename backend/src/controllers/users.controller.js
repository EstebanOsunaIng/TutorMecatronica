import { User } from '../models/User.model.js';

function sanitizeUser(user) {
  const { passwordHash, ...safe } = user.toObject();
  return safe;
}

export async function listUsers(req, res) {
  const { q } = req.query;
  const filter = q
    ? { $or: [{ name: new RegExp(q, 'i') }, { lastName: new RegExp(q, 'i') }] }
    : {};
  const users = await User.find(filter).select('-passwordHash');
  res.json({ users });
}

export async function getMe(req, res) {
  const user = await User.findById(req.user.id).select('-passwordHash');
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json({ user });
}

export async function updateMe(req, res) {
  const updates = {};
  if (typeof req.body.phone === 'string') updates.phone = req.body.phone;
  if (typeof req.body.profilePhotoUrl === 'string') updates.profilePhotoUrl = req.body.profilePhotoUrl;
  if (typeof req.body.notificationsMuted === 'boolean') updates.notificationsMuted = req.body.notificationsMuted;
  const user = await User.findByIdAndUpdate(req.user.id, updates, { new: true }).select('-passwordHash');
  res.json({ user });
}

export async function updateUser(req, res) {
  const { id } = req.params;
  const updates = req.body || {};
  delete updates.passwordHash;
  const user = await User.findByIdAndUpdate(id, updates, { new: true }).select('-passwordHash');
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json({ user });
}

export async function deleteUser(req, res) {
  const { id } = req.params;
  const user = await User.findByIdAndDelete(id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json({ ok: true });
}
