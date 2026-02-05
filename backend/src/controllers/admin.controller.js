import { TeacherCode } from '../models/TeacherCode.model.js';
import { addMinutes } from '../utils/time.js';

function generateCode() {
  return Math.random().toString(36).slice(2, 8).toUpperCase();
}

export async function createTeacherCode(req, res) {
  const code = generateCode();
  const expiresAt = addMinutes(new Date(), 60 * 24 * 7);
  const record = await TeacherCode.create({
    code,
    createdByAdminId: req.user.id,
    expiresAt
  });
  res.status(201).json({ code: record.code, expiresAt: record.expiresAt });
}

export async function listTeacherCodes(_req, res) {
  const codes = await TeacherCode.find().sort({ createdAt: -1 });
  res.json({ codes });
}
