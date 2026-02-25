import { User } from '../models/User.model.js';
import { TeacherCode } from '../models/TeacherCode.model.js';
import { PasswordChangeRequest } from '../models/PasswordChangeRequest.model.js';
import { RegisterEmailVerification } from '../models/RegisterEmailVerification.model.js';
import { hashPassword, comparePassword } from '../utils/hash.js';
import { signToken } from '../utils/tokens.js';
import { isValidDocument, isValidEmail, isValidName, isValidPassword, isValidPhone, normalizeText } from '../utils/validators.js';
import { sendPasswordChangeConfirmationEmail, sendRegisterOtpEmail } from '../mail/mailer.js';
import { expirePendingPasswordChangeRequests } from '../services/passwordChange.service.js';
import { generateOtp6, hashOtp, sha256 } from '../utils/otp.js';
import { domainHasMailRecords } from '../utils/emailDns.js';
import crypto from 'crypto';

const OTP_EXPIRES_MS = 15 * 60 * 1000;
const OTP_COOLDOWN_MS = 60 * 1000;
const OTP_MAX_ATTEMPTS = 5;
const OTP_MAX_RESEND = 3;
const OTP_RESEND_WINDOW_MS = 10 * 60 * 1000;

function sanitizeUser(user) {
  const { passwordHash, ...safe } = user.toObject();
  return safe;
}

function isLegacyVerificationUser(user) {
  if (!user || typeof user.$isDefault !== 'function') return false;
  return user.$isDefault('status') && user.$isDefault('emailVerified');
}

export async function register(req, res) {
  const { role, name, lastName, document, email, phone, password, teacherCode } = req.body;

  if (!['STUDENT', 'TEACHER'].includes(role)) {
    return res.status(400).json({ error: 'Role not allowed for public registration' });
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

  const domain = safeEmail.split('@')[1] || '';
  const hasMailRecords = await domainHasMailRecords(domain);
  if (!hasMailRecords) {
    return res.status(400).json({ error: 'Dominio no valido o no puede recibir correos.' });
  }

  const existsByEmail = await User.findOne({ email: safeEmail }).select('_id status emailVerified').lean();
  if (existsByEmail) {
    if (existsByEmail.status === 'PENDING_VERIFICATION' || existsByEmail.emailVerified === false) {
      let verification;
      try {
        verification = await issueEmailVerificationOtp({
          user: existsByEmail,
          email: safeEmail,
          ip: req.ip,
          userAgent: String(req.get('user-agent') || '')
        });
      } catch (error) {
        return res.status(error.status || 500).json({
          error: error.message || 'No se pudo enviar el codigo de verificacion.',
          cooldownSeconds: error.cooldownSeconds || 0
        });
      }
      return res.status(200).json({
        verificationRequired: true,
        userId: String(existsByEmail._id),
        email: safeEmail,
        expiresInMinutes: 15,
        cooldownSeconds: Math.max(0, Math.ceil((new Date(verification.nextResendAt).getTime() - Date.now()) / 1000))
      });
    }
    return res.status(409).json({ error: 'El correo ya esta registrado.' });
  }
  const existsByDocument = await User.findOne({ document: safeDocument }).select('_id').lean();
  if (existsByDocument) return res.status(409).json({ error: 'La identificacion ya esta registrada.' });

  if (role === 'TEACHER') {
    if (!teacherCode) return res.status(400).json({ error: 'Codigo docente requerido.' });
    const code = await TeacherCode.findOne({ code: teacherCode, isUsed: false });
    if (!code) return res.status(400).json({ error: 'Codigo docente invalido.' });
    if (code.expiresAt < new Date()) return res.status(400).json({ error: 'Codigo docente expirado.' });
  }

  const passwordHash = await hashPassword(password);
  const user = await User.create({
    role,
    name: safeName,
    lastName: safeLastName,
    document: safeDocument,
    email: safeEmail,
    phone: safePhone,
    passwordHash,
    emailVerified: false,
    status: 'PENDING_VERIFICATION'
  });

  if (role === 'TEACHER' && teacherCode) {
    await TeacherCode.findOneAndUpdate(
      { code: teacherCode },
      { $set: { isUsed: true, usedByUserId: user._id } },
      { new: true }
    );
  }

  let verification;
  try {
    verification = await issueEmailVerificationOtp({
      user,
      email: safeEmail,
      ip: req.ip,
      userAgent: String(req.get('user-agent') || '')
    });
  } catch (error) {
    return res.status(error.status || 500).json({
      error: error.message || 'No se pudo enviar el codigo de verificacion.',
      cooldownSeconds: error.cooldownSeconds || 0
    });
  }

  return res.status(201).json({
    verificationRequired: true,
    userId: String(user._id),
    email: safeEmail,
    expiresInMinutes: 15,
    cooldownSeconds: Math.max(0, Math.ceil((new Date(verification.nextResendAt).getTime() - Date.now()) / 1000))
  });
}

export async function login(req, res) {
  const { email, password } = req.body;
  const safeEmail = normalizeText(email).toLowerCase();
  if (!isValidEmail(safeEmail)) return res.status(400).json({ error: 'Correo invalido.' });
  if (!isValidPassword(password)) return res.status(400).json({ error: 'Contrasena invalida.' });

  const user = await User.findOne({ email: safeEmail });
  if (!user) return res.status(401).json({ error: 'Invalid credentials' });

  if (isLegacyVerificationUser(user)) {
    user.status = 'ACTIVE';
    user.emailVerified = true;
  }

  if (user.status === 'PENDING_VERIFICATION' || user.emailVerified === false) {
    return res.status(403).json({ error: 'Debes verificar tu correo antes de iniciar sesion.' });
  }

  if (user.status === 'SUSPENDED') {
    return res.status(403).json({ error: 'Perfil suspendido. Contacta al administrador.' });
  }

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

function frontendPublicUrl(req) {
  if (process.env.FRONTEND_PUBLIC_URL) {
    return String(process.env.FRONTEND_PUBLIC_URL).replace(/\/$/, '');
  }
  return '';
}

function normalizeRedirectPath(value, fallback = '') {
  const raw = String(value || '').trim();
  if (!raw.startsWith('/')) return fallback;
  if (raw.startsWith('//')) return fallback;
  return raw;
}

function normalizeOrigin(value) {
  const raw = String(value || '').trim();
  if (!raw) return '';
  try {
    const parsed = new URL(raw);
    if (!['http:', 'https:'].includes(parsed.protocol)) return '';
    return parsed.origin;
  } catch (_err) {
    return '';
  }
}

async function expirePendingRegisterEmailVerifications(email = null) {
  const now = new Date();
  const filter = {
    status: 'PENDING',
    expiresAt: { $lt: now }
  };
  if (email) filter.email = email;
  await RegisterEmailVerification.updateMany(filter, { $set: { status: 'EXPIRED' } });
}

async function cleanupOldRegisterEmailVerifications() {
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  await RegisterEmailVerification.deleteMany({ updatedAt: { $lt: sevenDaysAgo } });
}

async function issueEmailVerificationOtp({ user, email, ip, userAgent, force = false }) {
  await expirePendingRegisterEmailVerifications(email);

  const existing = await RegisterEmailVerification.findOne({ email });
  const now = Date.now();
  const nowDate = new Date(now);

  if (!force && existing?.nextResendAt && existing.nextResendAt > nowDate) {
    const error = new Error('Espera un momento antes de reenviar el codigo.');
    error.status = 429;
    error.cooldownSeconds = Math.max(1, Math.ceil((new Date(existing.nextResendAt).getTime() - now) / 1000));
    throw error;
  }

  const resendWindowActive = existing?.lastSentAt && now - new Date(existing.lastSentAt).getTime() < OTP_RESEND_WINDOW_MS;
  const resendCount = resendWindowActive ? (existing?.resendCount || 0) + 1 : 1;
  if (resendCount > OTP_MAX_RESEND) {
    const error = new Error('Has alcanzado el limite de reenvios. Intenta mas tarde.');
    error.status = 429;
    throw error;
  }

  const otp = generateOtp6();
  const otpHash = hashOtp(email, otp);
  const expiresAt = new Date(now + OTP_EXPIRES_MS);
  const nextResendAt = new Date(now + OTP_COOLDOWN_MS);

  const verification = await RegisterEmailVerification.findOneAndUpdate(
    { email },
    {
      $set: {
        userId: user?._id,
        email,
        otpHash,
        status: 'PENDING',
        expiresAt,
        verifiedAt: null,
        attemptCount: 0,
        maxAttempts: OTP_MAX_ATTEMPTS,
        resendCount,
        nextResendAt,
        lastSentAt: nowDate,
        ip,
        userAgent
      }
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  await sendRegisterOtpEmail({ to: email, otp, expiresMinutes: 15 });
  return verification;
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

  const redirectPath = normalizeRedirectPath(req.body?.redirectPath, '/');
  const redirectOrigin = normalizeOrigin(req.body?.clientOrigin);

  const requestRow = await PasswordChangeRequest.create({
    userId: user._id,
    email,
    tokenHash,
    status: 'pending',
    requestIp: req.ip,
    redirectPath,
    redirectOrigin,
    expiresAt
  });

  const query = new URLSearchParams({ token: rawToken });
  if (redirectPath) query.set('redirect', redirectPath);
  const confirmUrl = `${backendPublicUrl(req)}/api/auth/change-password/confirm?${query.toString()}`;
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
  const redirectPathFromQuery = normalizeRedirectPath(req.query?.redirect, '');

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
  requestRow.alertSent = true;
  await requestRow.save();

  console.info('[password-change]', {
    userId: String(requestRow.userId),
    ip: req.ip,
    date: new Date().toISOString(),
    status: 'confirmado'
  });

  const frontendUrl = requestRow.redirectOrigin || frontendPublicUrl(req);
  const redirectPath = requestRow.redirectPath || redirectPathFromQuery;
  if (frontendUrl && redirectPath) {
    const query = new URLSearchParams({ passwordChange: 'confirmed', requestId: String(requestRow._id) });
    return res.redirect(302, `${frontendUrl}${redirectPath}?${query.toString()}`);
  }

  return res.send('Confirmacion exitosa. Regresa a la plataforma para cambiar tu contrasena.');
}

export async function verifyRegistrationEmail(req, res) {
  const email = normalizeText(req.query?.email).toLowerCase();
  if (!isValidEmail(email)) {
    return res.json({
      exists: false,
      verified: false,
      available: false,
      pendingVerification: false,
      userId: null,
      message: 'Correo no valido.'
    });
  }

  const domain = email.split('@')[1] || '';
  const hasMailRecords = await domainHasMailRecords(domain);
  if (!hasMailRecords) {
    return res.json({
      exists: false,
      verified: false,
      available: false,
      pendingVerification: false,
      userId: null,
      message: 'Dominio no valido o no puede recibir correos.'
    });
  }

  const existing = await User.findOne({ email }).select('_id status emailVerified').lean();
  if (existing) {
    const isPending = existing.status === 'PENDING_VERIFICATION' || existing.emailVerified === false;
    if (isPending) {
      return res.json({
        exists: true,
        verified: false,
        available: true,
        pendingVerification: true,
        userId: String(existing._id),
        message: 'Este correo ya tiene una cuenta pendiente. Reenviaremos un nuevo codigo.'
      });
    }

    return res.json({
      exists: true,
      verified: Boolean(existing.emailVerified),
      available: false,
      pendingVerification: false,
      userId: String(existing._id),
      message: 'El correo ya esta registrado.'
    });
  }

  return res.json({
    exists: true,
    verified: false,
    available: true,
    pendingVerification: false,
    userId: null,
    message: 'Correo valido para registro.'
  });
}

export async function requestRegisterEmailVerification(req, res) {
  const email = normalizeText(req.body?.email).toLowerCase();
  const userId = String(req.body?.userId || '').trim();
  if (!isValidEmail(email)) return res.status(400).json({ error: 'Correo no valido.' });

  const domain = email.split('@')[1] || '';
  const hasMailRecords = await domainHasMailRecords(domain);
  if (!hasMailRecords) return res.status(400).json({ error: 'Dominio no valido o no puede recibir correos.' });

  const userFilter = userId ? { _id: userId, email } : { email };
  const user = await User.findOne(userFilter);
  if (!user) return res.status(404).json({ error: 'Usuario pendiente no encontrado.' });
  if (user.status === 'ACTIVE' && user.emailVerified) {
    return res.json({ ok: true, message: 'El correo ya fue verificado.', expiresInMinutes: 0, cooldownSeconds: 0 });
  }

  try {
    const verification = await issueEmailVerificationOtp({
      user,
      email,
      ip: req.ip,
      userAgent: String(req.get('user-agent') || '')
    });
    return res.json({
      ok: true,
      message: 'Correo de verificacion enviado.',
      expiresInMinutes: 15,
      cooldownSeconds: Math.max(0, Math.ceil((new Date(verification.nextResendAt).getTime() - Date.now()) / 1000))
    });
  } catch (error) {
    return res.status(error.status || 500).json({
      error: error.message || 'No se pudo enviar la verificacion.',
      cooldownSeconds: error.cooldownSeconds || 0
    });
  }
}

export async function getRegisterEmailVerificationStatus(req, res) {
  const email = normalizeText(req.query?.email).toLowerCase();
  if (!isValidEmail(email)) return res.status(400).json({ error: 'Correo no valido.' });

  await cleanupOldRegisterEmailVerifications();
  await expirePendingRegisterEmailVerifications(email);
  const record = await RegisterEmailVerification.findOne({ email });
  if (!record) {
    return res.json({ status: 'NONE', expiresAt: null, remainingSeconds: 0, nextResendSeconds: 0 });
  }

  if (record.status === 'VERIFIED' && record.verifiedAt) {
    const user = await User.findById(record.userId).select('status emailVerified').lean();
    if (!user || user.status !== 'ACTIVE' || !user.emailVerified) {
      record.status = 'EXPIRED';
      await record.save();
    }
  }

  const remainingSeconds =
    record.status === 'PENDING' ? Math.max(0, Math.ceil((new Date(record.expiresAt).getTime() - Date.now()) / 1000)) : 0;
  const nextResendSeconds =
    record.nextResendAt && record.nextResendAt > new Date()
      ? Math.max(0, Math.ceil((new Date(record.nextResendAt).getTime() - Date.now()) / 1000))
      : 0;

  return res.json({
    status: record.status,
    expiresAt: record.expiresAt,
    remainingSeconds,
    nextResendSeconds
  });
}

export async function verifyRegisterEmailCode(req, res) {
  const email = normalizeText(req.body?.email).toLowerCase();
  const otp = String(req.body?.otp || '').trim();
  if (!isValidEmail(email)) return res.status(400).json({ error: 'Correo invalido.' });
  if (!/^\d{6}$/.test(otp)) return res.status(400).json({ error: 'Codigo incorrecto.' });

  await expirePendingRegisterEmailVerifications(email);

  const record = await RegisterEmailVerification.findOne({ email });
  if (!record || record.status !== 'PENDING') {
    return res.status(400).json({ error: 'Codigo expirado. Solicita un nuevo codigo.' });
  }

  if (record.expiresAt < new Date()) {
    record.status = 'EXPIRED';
    await record.save();
    return res.status(400).json({ error: 'Codigo expirado. Solicita un nuevo codigo.' });
  }

  if ((record.attemptCount || 0) >= (record.maxAttempts || OTP_MAX_ATTEMPTS)) {
    record.status = 'EXPIRED';
    await record.save();
    return res.status(429).json({ error: 'Demasiados intentos, solicita un nuevo codigo.' });
  }

  const incomingHash = hashOtp(email, otp);
  if (incomingHash !== record.otpHash) {
    record.attemptCount = (record.attemptCount || 0) + 1;
    if (record.attemptCount >= (record.maxAttempts || OTP_MAX_ATTEMPTS)) {
      record.status = 'EXPIRED';
      await record.save();
      return res.status(429).json({ error: 'Demasiados intentos, solicita un nuevo codigo.' });
    }
    await record.save();
    return res.status(400).json({ error: 'Codigo incorrecto.' });
  }

  record.status = 'VERIFIED';
  record.verifiedAt = new Date();
  record.otpHash = '';
  await record.save();

  const user = await User.findById(record.userId);
  if (!user) return res.status(404).json({ error: 'Usuario no encontrado.' });
  user.emailVerified = true;
  user.status = 'ACTIVE';
  await user.save();

  return res.json({ ok: true, message: 'Correo verificado exitosamente.' });
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
