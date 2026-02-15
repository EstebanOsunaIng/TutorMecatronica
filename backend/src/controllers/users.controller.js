import { User } from '../models/User.model.js';
import { hashPassword } from '../utils/hash.js';
import { createNotification } from '../services/notifications.service.js';

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

export async function createUserByAdmin(req, res) {
  const {
    role,
    name,
    lastName,
    document,
    email,
    phone = '',
    profilePhotoUrl = '',
    isActive = true,
    password
  } = req.body || {};

  if (!['STUDENT', 'TEACHER'].includes(role)) {
    return res.status(400).json({ error: 'Role must be STUDENT or TEACHER' });
  }

  if (!name || !lastName || !document || !email || !password) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  if (String(password).trim().length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters' });
  }

  const normalizedEmail = String(email).trim().toLowerCase();
  const exists = await User.findOne({ email: normalizedEmail });
  if (exists) {
    return res.status(409).json({ error: 'Email already registered' });
  }

  const passwordHash = await hashPassword(String(password));

  const user = await User.create({
    role,
    name: String(name).trim(),
    lastName: String(lastName).trim(),
    document: String(document).trim(),
    email: normalizedEmail,
    phone: String(phone).trim(),
    profilePhotoUrl: String(profilePhotoUrl).trim(),
    isActive: Boolean(isActive),
    passwordHash
  });

  await createNotification({
    userId: req.user.id,
    title: 'Usuario registrado',
    message: `Se creó un nuevo usuario con rol ${role === 'STUDENT' ? 'Estudiante' : 'Docente'}.`,
    type: 'USUARIO_CREADO'
  });
  return res.status(201).json({ user: sanitizeUser(user) });
}

export async function deleteUser(req, res) {
  const { id } = req.params;
  const user = await User.findByIdAndDelete(id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json({ ok: true });
}
