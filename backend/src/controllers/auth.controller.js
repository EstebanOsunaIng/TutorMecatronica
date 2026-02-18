import { User } from '../models/User.model.js';
import { TeacherCode } from '../models/TeacherCode.model.js';
import { hashPassword, comparePassword } from '../utils/hash.js';
import { signToken } from '../utils/tokens.js';
import { isValidDocument, isValidEmail, isValidName, isValidPassword, isValidPhone, normalizeText } from '../utils/validators.js';

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
