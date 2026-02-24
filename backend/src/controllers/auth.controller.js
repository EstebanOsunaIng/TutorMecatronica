import { User } from '../models/User.model.js';
import { TeacherCode } from '../models/TeacherCode.model.js';
import { PasswordChangeRequest } from '../models/PasswordChangeRequest.model.js';
import { hashPassword, comparePassword } from '../utils/hash.js';
import { signToken } from '../utils/tokens.js';
import { isValidDocument, isValidEmail, isValidName, isValidPassword, isValidPhone, normalizeText } from '../utils/validators.js';
import { sendPasswordChangeConfirmationEmail } from '../mail/mailer.js';
import { expirePendingPasswordChangeRequests } from '../services/passwordChange.service.js';
import { sha256 } from '../utils/otp.js';
import crypto from 'crypto';

function sanitizeUser(user) {
  const { passwordHash, ...safe } = user.toObject();
  return safe;
}

export async function register(req, res) {
  const { role, name, lastName, document, email, phone, password, teacherCode } = req.body;

  if (!['STUDENT', 'TEACHER', 'ADMIN'].includes(role)) {
    return res.status(400).json({ error: 'Invalid role' });
  }

  const safeName = normalizeText(name);
  const safeLastName = normalizeText(lastName);
  const safeDocument = normalizeText(document);
  const safePhone = normalizeText(phone);
  const safeEmail = normalizeText(email).toLowerCase();

  if (!isValidName(safeName)) return res.status(400).json({ error: 'Nombre invalido: solo letras y espacios.' });
  if (!isValidName(safeLastName)) return res.status(400).json({ error: 'Apellido invalido: solo letras y espacios.' });
  if (!isValidDocument(safeDocument)) return res.status(400).json({ error: 'Identificacion invalida: debe tener 10 digitos numericos.' });
  if (!isValidPhone(safePhone)) return res.status(400).json({ error: 'Celular invalido: debe tener 10 digitos numericos.' });
  if (!isValidEmail(safeEmail)) return res.status(400).json({ error: 'Correo invalido.' });
  if (!isValidPassword(password)) return res.status(400).json({ error: 'Contrasena invalida: minimo 6 caracteres.' });

  const exists = await User.findOne({ email: safeEmail });
  if (exists) return res.status(409).json({ error: 'Email already registered' });

  if (role === 'TEACHER') {
    if (!teacherCode) return res.status(400).json({ error: 'Teacher code required' });
    const code = await TeacherCode.findOne({ code: teacherCode, isUsed: false });
    if (!code) return res.status(400).json({ error: 'Invalid teacher code' });
    if (code.expiresAt < new Date()) return res.status(400).json({ error: 'Teacher code expired' });
  }

  const passwordHash = await hashPassword(password);
  const user = await User.create({
    role,
    name: safeName,
    lastName: safeLastName,
    document: safeDocument,
    email: safeEmail,
    phone: safePhone,
    passwordHash
  });

  if (role === 'TEACHER' && teacherCode) {
    await TeacherCode.findOneAndUpdate(
      { code: teacherCode },
      { $set: { isUsed: true, usedByUserId: user._id } },
      { new: true }
    );
  }

  return res.status(201).json({ user: sanitizeUser(user) });
}

export async function login(req, res) {
  const { email, password } = req.body;
  const safeEmail = normalizeText(email).toLowerCase();
  if (!isValidEmail(safeEmail)) return res.status(400).json({ error: 'Correo invalido.' });
  if (!isValidPassword(password)) return res.status(400).json({ error: 'Contrasena invalida.' });

  const user = await User.findOne({ email: safeEmail });
  if (!user) return res.status(401).json({ error: 'Invalid credentials' });

  if (!user.isActive) {
    return res.status(403).json({ error: 'Perfil inactivo. No puedes ingresar.' });
  }

  const ok = await comparePassword(password, user.passwordHash);
  if (!ok) return res.status(401).json({ error: 'Invalid credentials' });

  user.lastLoginAt = new Date();
  await user.save();

  const token = signToken({ id: user._id, role: user.role });
  return res.json({ token, user: sanitizeUser(user) });
}


export async function changePassword(req, res) {
  const { currentPassword, newPassword } = req.body;
  if (!isValidPassword(newPassword)) {
    return res.status(400).json({ error: 'Contrasena nueva invalida: minimo 6 caracteres.' });
  }

  const user = await User.findById(req.user.id);
  if (!user) return res.status(404).json({ error: 'User not found' });

  const ok = await comparePassword(currentPassword, user.passwordHash);
  if (!ok) return res.status(400).json({ error: 'Current password invalid' });

  user.passwordHash = await hashPassword(newPassword);
  await user.save();
  return res.json({ ok: true });
}

function backendPublicUrl(req) {
  return process.env.BACKEND_PUBLIC_URL || `${req.protocol}://${req.get('host')}`;
}

export async function requestPasswordChangeConfirmation(req, res) {
  const user = await User.findById(req.user.id);
  if (!user) return res.status(404).json({ error: 'Usuario no encontrado.' });

  const email = normalizeText(req.body?.email).toLowerCase();
  if (!isValidEmail(email)) return res.status(400).json({ error: 'Correo invalido.' });
  if (email !== String(user.email || '').toLowerCase()) {
    return res.status(400).json({ error: 'El correo debe coincidir con tu cuenta.' });
  }

  await expirePendingPasswordChangeRequests();
  await PasswordChangeRequest.updateMany(
    { userId: user._id, status: { $in: ['pending', 'confirmed'] } },
    { $set: { status: 'expired' } }
  );

  const rawToken = crypto.randomBytes(32).toString('hex');
  const tokenHash = sha256(rawToken);
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

  const requestRow = await PasswordChangeRequest.create({
    userId: user._id,
    email,
    tokenHash,
    status: 'pending',
    requestIp: req.ip,
    expiresAt
  });

  const confirmUrl = `${backendPublicUrl(req)}/api/auth/change-password/confirm?token=${encodeURIComponent(rawToken)}`;
  await sendPasswordChangeConfirmationEmail({ to: email, confirmUrl });

  console.info('[password-change]', {
    userId: String(user._id),
    ip: req.ip,
    date: new Date().toISOString(),
    status: 'solicitado'
  });

  return res.json({
    ok: true,
    requestId: String(requestRow._id),
    expiresAt: requestRow.expiresAt
  });
}

export async function confirmPasswordChangeRequest(req, res) {
  const token = String(req.query?.token || '').trim();
  if (!token) return res.status(400).send('Token invalido.');

  await expirePendingPasswordChangeRequests();

  const tokenHash = sha256(token);
  const requestRow = await PasswordChangeRequest.findOne({ tokenHash, status: 'pending' });
  if (!requestRow) return res.status(400).send('Solicitud invalida o expirada.');
  if (requestRow.expiresAt < new Date()) {
    requestRow.status = 'expired';
    await requestRow.save();
    return res.status(400).send('Solicitud expirada.');
  }

  requestRow.status = 'confirmed';
  requestRow.confirmedAt = new Date();
  requestRow.confirmedUntil = new Date(Date.now() + 10 * 60 * 1000);
  await requestRow.save();

  console.info('[password-change]', {
    userId: String(requestRow.userId),
    ip: req.ip,
    date: new Date().toISOString(),
    status: 'confirmado'
  });

  return res.send('Confirmacion exitosa. Regresa a la plataforma para cambiar tu contraseña.');
}

export async function getPasswordChangeStatus(req, res) {
  await expirePendingPasswordChangeRequests();
  const requestId = String(req.params.requestId || '').trim();
  if (!requestId) return res.status(400).json({ error: 'Solicitud invalida.' });

  const requestRow = await PasswordChangeRequest.findOne({ _id: requestId, userId: req.user.id });
  if (!requestRow) return res.status(404).json({ error: 'Solicitud no encontrada.' });

  let status = requestRow.status;
  if (status === 'confirmed' && requestRow.confirmedUntil && requestRow.confirmedUntil < new Date()) {
    status = 'expired';
    requestRow.status = 'expired';
    await requestRow.save();
  }

  return res.json({
    status,
    expiresAt: requestRow.expiresAt,
    confirmedUntil: requestRow.confirmedUntil || null
  });
}

export async function completePasswordChange(req, res) {
  await expirePendingPasswordChangeRequests();
  const { requestId, newPassword, confirmPassword } = req.body;
  if (!requestId) return res.status(400).json({ error: 'Solicitud invalida.' });
  if (!isValidPassword(newPassword)) {
    return res.status(400).json({ error: 'Contrasena nueva invalida: minimo 6 caracteres.' });
  }
  if (String(newPassword) !== String(confirmPassword || '')) {
    return res.status(400).json({ error: 'Las contrasenas no coinciden.' });
  }

  const requestRow = await PasswordChangeRequest.findOne({ _id: requestId, userId: req.user.id });
  if (!requestRow) return res.status(404).json({ error: 'Solicitud no encontrada.' });
  if (requestRow.status !== 'confirmed') {
    return res.status(400).json({ error: 'Debes confirmar el cambio por correo antes de continuar.' });
  }
  if (!requestRow.confirmedUntil || requestRow.confirmedUntil < new Date()) {
    requestRow.status = 'expired';
    await requestRow.save();
    return res.status(400).json({ error: 'La confirmacion expiro. Solicita una nueva.' });
  }

  const user = await User.findById(req.user.id);
  if (!user) return res.status(404).json({ error: 'Usuario no encontrado.' });
  user.passwordHash = await hashPassword(newPassword);
  await user.save();

  requestRow.status = 'used';
  requestRow.usedAt = new Date();
  await requestRow.save();

  console.info('[password-change]', {
    userId: String(user._id),
    ip: req.ip,
    date: new Date().toISOString(),
    status: 'usado'
  });

  return res.json({ ok: true });
}
