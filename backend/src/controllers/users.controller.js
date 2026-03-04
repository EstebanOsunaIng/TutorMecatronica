import { User } from '../models/User.model.js';
import { hashPassword } from '../utils/hash.js';
import { createNotification } from '../services/notifications.service.js';
import {
  isValidDocument,
  isValidEmail,
  isValidName,
  isValidPassword,
  isValidPhone,
  normalizeText,
  PASSWORD_POLICY_MESSAGE
} from '../utils/validators.js';
import { hashLookupValue, normalizeDocumentForLookup, normalizeEmailForLookup } from '../utils/fieldCrypto.js';

function sanitizeUser(user, role = 'ADMIN') {
  const { passwordHash, emailHash, documentHash, ...safe } = user.toObject();
  if (role === 'TEACHER') {
    delete safe.phone;
  }
  return safe;
}

export async function listUsers(req, res) {
  const { q } = req.query;
  const users = await User.find({});
  const normalizedQ = String(q || '').trim().toLowerCase();
  const filteredUsers = normalizedQ
    ? users.filter((u) => {
      const fullName = `${u.name || ''} ${u.lastName || ''}`.toLowerCase();
      const safeEmail = String(u.email || '').toLowerCase();
      return fullName.includes(normalizedQ) || safeEmail.includes(normalizedQ);
    })
    : users;
  res.json({ users: filteredUsers.map((u) => sanitizeUser(u, req.user?.role || 'ADMIN')) });
}

export async function getMe(req, res) {
  const user = await User.findById(req.user.id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json({ user: sanitizeUser(user, req.user?.role || 'ADMIN') });
}

export async function updateMe(req, res) {
  const updates = {};
  if (typeof req.body.phone === 'string') {
    const safePhone = normalizeText(req.body.phone);
    if (safePhone && !isValidPhone(safePhone)) {
      return res.status(400).json({ error: 'Celular invalido: debe tener 10 digitos numericos.' });
    }
    updates.phone = safePhone;
  }
  if (typeof req.body.profilePhotoUrl === 'string') updates.profilePhotoUrl = req.body.profilePhotoUrl;
  if (typeof req.body.notificationsMuted === 'boolean') updates.notificationsMuted = req.body.notificationsMuted;
  if (typeof req.body.onboardingCompleted === 'boolean') updates.onboardingCompleted = req.body.onboardingCompleted;
  if (typeof req.body.onboardingVersion === 'number' && Number.isFinite(req.body.onboardingVersion)) {
    updates.onboardingVersion = Math.max(1, Math.floor(req.body.onboardingVersion));
  }
  if (typeof req.body.onboardingSeenAt === 'string' || req.body.onboardingSeenAt instanceof Date) {
    const value = new Date(req.body.onboardingSeenAt);
    if (!Number.isNaN(value.getTime())) updates.onboardingSeenAt = value;
  }
  const user = await User.findById(req.user.id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  Object.assign(user, updates);
  await user.save();
  res.json({ user: sanitizeUser(user, req.user?.role || 'ADMIN') });
}

export async function updateUser(req, res) {
  const { id } = req.params;
  const payload = req.body || {};
  const updates = {};

  if (typeof payload.role === 'string') {
    if (!['STUDENT', 'TEACHER', 'ADMIN'].includes(payload.role)) {
      return res.status(400).json({ error: 'Invalid role' });
    }
    updates.role = payload.role;
  }

  if (typeof payload.name === 'string') {
    const safeName = normalizeText(payload.name);
    if (!isValidName(safeName)) return res.status(400).json({ error: 'Nombre invalido: solo letras y espacios.' });
    updates.name = safeName;
  }

  if (typeof payload.lastName === 'string') {
    const safeLastName = normalizeText(payload.lastName);
    if (!isValidName(safeLastName)) return res.status(400).json({ error: 'Apellido invalido: solo letras y espacios.' });
    updates.lastName = safeLastName;
  }

  if (typeof payload.document === 'string') {
    const safeDocument = normalizeText(payload.document);
    if (!isValidDocument(safeDocument)) return res.status(400).json({ error: 'Identificacion invalida: debe tener 10 digitos numericos.' });
    updates.document = safeDocument;
  }

  if (typeof payload.email === 'string') {
    const normalizedEmail = normalizeEmailForLookup(payload.email);
    if (!isValidEmail(normalizedEmail)) return res.status(400).json({ error: 'Correo invalido.' });

    const existing = await User.findOne({ emailHash: hashLookupValue(normalizedEmail), _id: { $ne: id } }).select('_id');
    if (existing) return res.status(409).json({ error: 'Email already registered' });
    updates.email = normalizedEmail;
  }

  if (typeof payload.phone === 'string') {
    const safePhone = normalizeText(payload.phone);
    if (safePhone && !isValidPhone(safePhone)) {
      return res.status(400).json({ error: 'Celular invalido: debe tener 10 digitos numericos.' });
    }
    updates.phone = safePhone;
  }

  if (typeof payload.profilePhotoUrl === 'string') updates.profilePhotoUrl = String(payload.profilePhotoUrl).trim();
  if (typeof payload.isActive === 'boolean') updates.isActive = payload.isActive;

  if (Object.keys(updates).length === 0) {
    return res.status(400).json({ error: 'No valid fields to update' });
  }

  const user = await User.findById(id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  if (typeof updates.document === 'string') {
    const docHash = hashLookupValue(normalizeDocumentForLookup(updates.document));
    const existingByDocument = await User.findOne({ documentHash: docHash, _id: { $ne: id } }).select('_id');
    if (existingByDocument) return res.status(409).json({ error: 'Document already registered' });
  }
  Object.assign(user, updates);
  await user.save();
  res.json({ user: sanitizeUser(user, req.user?.role || 'ADMIN') });
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

  const safeName = normalizeText(name);
  const safeLastName = normalizeText(lastName);
  const safeDocument = normalizeDocumentForLookup(document);
  const safePhone = normalizeText(phone);
  const normalizedEmail = normalizeEmailForLookup(email);

  if (!isValidName(safeName)) return res.status(400).json({ error: 'Nombre invalido: solo letras y espacios.' });
  if (!isValidName(safeLastName)) return res.status(400).json({ error: 'Apellido invalido: solo letras y espacios.' });
  if (!isValidDocument(safeDocument)) return res.status(400).json({ error: 'Identificacion invalida: debe tener 10 digitos numericos.' });
  if (!isValidPhone(safePhone)) return res.status(400).json({ error: 'Celular invalido: debe tener 10 digitos numericos.' });
  if (!isValidEmail(normalizedEmail)) return res.status(400).json({ error: 'Correo invalido.' });
  if (!isValidPassword(password)) return res.status(400).json({ error: PASSWORD_POLICY_MESSAGE });

  const exists = await User.findOne({ emailHash: hashLookupValue(normalizedEmail) });
  if (exists) {
    return res.status(409).json({ error: 'Email already registered' });
  }
  const existsByDocument = await User.findOne({ documentHash: hashLookupValue(safeDocument) }).select('_id');
  if (existsByDocument) {
    return res.status(409).json({ error: 'Document already registered' });
  }

  const passwordHash = await hashPassword(String(password));

  const user = await User.create({
    role,
    name: safeName,
    lastName: safeLastName,
    document: safeDocument,
    email: normalizedEmail,
    phone: safePhone,
    profilePhotoUrl: String(profilePhotoUrl).trim(),
    isActive: Boolean(isActive),
    emailVerified: Boolean(isActive),
    status: Boolean(isActive) ? 'ACTIVE' : 'SUSPENDED',
    passwordHash
  });

  await createNotification({
    userId: req.user.id,
    title: 'Usuario registrado',
    message: `Se creó un nuevo usuario con rol ${role === 'STUDENT' ? 'Estudiante' : 'Docente'}.`,
    type: 'USUARIO_CREADO'
  });
  return res.status(201).json({ user: sanitizeUser(user, req.user?.role || 'ADMIN') });
}

export async function deleteUser(req, res) {
  const { id } = req.params;
  const user = await User.findByIdAndDelete(id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json({ ok: true });
}
