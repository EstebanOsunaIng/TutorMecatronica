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

function normalizeSearchValue(value) {
  return String(value || '').trim().toLowerCase();
}

function parseBooleanQuery(value) {
  if (typeof value === 'boolean') return value;
  if (typeof value !== 'string') return undefined;
  const normalized = value.trim().toLowerCase();
  if (!normalized) return undefined;
  if (['true', '1', 'yes'].includes(normalized)) return true;
  if (['false', '0', 'no'].includes(normalized)) return false;
  return undefined;
}

function parseDateQuery(value, endOfDay = false) {
  if (!value) return null;
  const parsed = new Date(String(value));
  if (Number.isNaN(parsed.getTime())) return null;
  if (endOfDay) parsed.setHours(23, 59, 59, 999);
  else parsed.setHours(0, 0, 0, 0);
  return parsed;
}

export async function listUsers(req, res) {
  const {
    q,
    name,
    lastName,
    email,
    document,
    role,
    roles,
    isActive,
    isActiveList,
    lastLoginFrom,
    lastLoginTo,
    createdFrom,
    createdTo,
    sortBy,
    sortOrder
  } = req.query;

  const query = {};

  const parsedRoles = typeof roles === 'string'
    ? roles
      .split(',')
      .map((value) => value.trim().toUpperCase())
      .filter((value) => ['STUDENT', 'TEACHER', 'ADMIN'].includes(value))
    : [];

  if (parsedRoles.length) {
    query.role = { $in: parsedRoles };
  } else if (typeof role === 'string' && ['STUDENT', 'TEACHER', 'ADMIN'].includes(role)) {
    query.role = role;
  }

  const parsedIsActiveList = typeof isActiveList === 'string'
    ? isActiveList
      .split(',')
      .map((value) => parseBooleanQuery(value))
      .filter((value) => typeof value === 'boolean')
    : [];
  const uniqueIsActive = [...new Set(parsedIsActiveList)];

  if (uniqueIsActive.length === 1) {
    query.isActive = uniqueIsActive[0];
  }

  const isActiveFilter = parseBooleanQuery(isActive);
  if (typeof isActiveFilter === 'boolean' && uniqueIsActive.length === 0) {
    query.isActive = isActiveFilter;
  }

  const normalizedEmail = typeof email === 'string' ? normalizeEmailForLookup(email) : '';
  if (normalizedEmail) {
    query.emailHash = hashLookupValue(normalizedEmail);
  }

  const normalizedDocument = typeof document === 'string' ? normalizeDocumentForLookup(document) : '';
  if (normalizedDocument) {
    query.documentHash = hashLookupValue(normalizedDocument);
  }

  const parsedLastLoginFrom = parseDateQuery(lastLoginFrom, false);
  const parsedLastLoginTo = parseDateQuery(lastLoginTo, true);
  if (lastLoginFrom && !parsedLastLoginFrom) {
    return res.status(400).json({ error: 'Fecha inicial de ultimo acceso invalida.' });
  }
  if (lastLoginTo && !parsedLastLoginTo) {
    return res.status(400).json({ error: 'Fecha final de ultimo acceso invalida.' });
  }
  if (parsedLastLoginFrom || parsedLastLoginTo) {
    query.lastLoginAt = {};
    if (parsedLastLoginFrom) query.lastLoginAt.$gte = parsedLastLoginFrom;
    if (parsedLastLoginTo) query.lastLoginAt.$lte = parsedLastLoginTo;
  }

  const parsedCreatedFrom = parseDateQuery(createdFrom, false);
  const parsedCreatedTo = parseDateQuery(createdTo, true);
  if (createdFrom && !parsedCreatedFrom) {
    return res.status(400).json({ error: 'Fecha inicial de registro invalida.' });
  }
  if (createdTo && !parsedCreatedTo) {
    return res.status(400).json({ error: 'Fecha final de registro invalida.' });
  }
  if (parsedCreatedFrom || parsedCreatedTo) {
    query.createdAt = {};
    if (parsedCreatedFrom) query.createdAt.$gte = parsedCreatedFrom;
    if (parsedCreatedTo) query.createdAt.$lte = parsedCreatedTo;
  }

  const normalizedSortOrder = String(sortOrder || '').toLowerCase() === 'desc' ? -1 : 1;
  const sortableFields = {
    role: 'role',
    isActive: 'isActive',
    lastLoginAt: 'lastLoginAt',
    createdAt: 'createdAt'
  };
  const mongoSortField = sortableFields[String(sortBy || '').trim()];
  const mongoSort = mongoSortField
    ? { [mongoSortField]: normalizedSortOrder, _id: -1 }
    : { createdAt: -1, _id: -1 };

  const users = await User.find(query).sort(mongoSort);
  const normalizedQ = normalizeSearchValue(q);
  const normalizedName = normalizeSearchValue(name);
  const normalizedLastName = normalizeSearchValue(lastName);

  const filteredUsers = users.filter((u) => {
    const safeName = normalizeSearchValue(u.name);
    const safeLastName = normalizeSearchValue(u.lastName);
    const safeEmail = normalizeSearchValue(u.email);
    const safeDocument = normalizeSearchValue(u.document);

    if (normalizedName && !safeName.includes(normalizedName)) return false;
    if (normalizedLastName && !safeLastName.includes(normalizedLastName)) return false;

    if (normalizedQ) {
      const fullName = `${safeName} ${safeLastName}`.trim();
      if (!fullName.includes(normalizedQ) && !safeEmail.includes(normalizedQ) && !safeDocument.includes(normalizedQ)) {
        return false;
      }
    }

    return true;
  });

  if (String(sortBy || '').trim() === 'user') {
    filteredUsers.sort((a, b) => {
      const aValue = `${normalizeSearchValue(a.name)} ${normalizeSearchValue(a.lastName)}`.trim();
      const bValue = `${normalizeSearchValue(b.name)} ${normalizeSearchValue(b.lastName)}`.trim();
      if (aValue === bValue) return 0;
      return normalizedSortOrder === 1 ? (aValue > bValue ? 1 : -1) : (aValue < bValue ? 1 : -1);
    });
  }

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
