import mongoose from 'mongoose';
import { User } from '../models/User.model.js';
import { Progress } from '../models/Progress.model.js';
import { Module } from '../models/Module.model.js';

function toObjectId(id) {
  if (!id) return null;
  if (!mongoose.Types.ObjectId.isValid(id)) return null;
  return new mongoose.Types.ObjectId(id);
}

function initials(name = '', lastName = '') {
  const a = String(name).trim()[0] || '';
  const b = String(lastName).trim()[0] || '';
  return (a + b).toUpperCase();
}

function isOnlineByLastSeen(lastSeenAt, thresholdMs = 30000) {
  if (!lastSeenAt) return false;
  const t = new Date(lastSeenAt).getTime();
  if (!Number.isFinite(t)) return false;
  return Date.now() - t <= thresholdMs;
}

export async function listStudents(req, res) {
  const q = String(req.query.q || '').trim();
  const students = await User.find({ role: 'STUDENT' })
    .sort({ lastLoginAt: -1, createdAt: -1 })
    .select('name lastName email profilePhotoUrl lastLoginAt lastSeenAt badgesCount');

  const normalizedQ = q.toLowerCase();
  const filteredStudents = normalizedQ
    ? students.filter((student) => {
      const fullName = `${student.name || ''} ${student.lastName || ''}`.toLowerCase();
      const safeEmail = String(student.email || '').toLowerCase();
      return fullName.includes(normalizedQ) || safeEmail.includes(normalizedQ);
    })
    : students;

  // Aggregate progress summary per student: avg % across started modules
  const ids = filteredStudents.map((s) => s._id);
  const summary = await Progress.aggregate([
    { $match: { userId: { $in: ids } } },
    {
      $group: {
        _id: '$userId',
        modulesStarted: { $sum: 1 },
        modulesCompleted: { $sum: { $cond: [{ $ifNull: ['$completedAt', false] }, 1, 0] } },
        avgProgress: { $avg: '$moduleProgressPercent' }
      }
    }
  ]);

  const byId = new Map(summary.map((s) => [String(s._id), s]));

  const result = filteredStudents.map((s) => {
    const item = byId.get(String(s._id));
    const overall = item?.avgProgress ? Math.round(item.avgProgress) : 0;
    return {
      _id: s._id,
      name: s.name,
      lastName: s.lastName,
      email: s.email,
      profilePhotoUrl: s.profilePhotoUrl || '',
      lastLoginAt: s.lastLoginAt || null,
      isOnline: isOnlineByLastSeen(s.lastSeenAt),
      badgesCount: s.badgesCount || 0,
      initials: initials(s.name, s.lastName),
      progress: {
        overallPercent: overall,
        modulesStarted: item?.modulesStarted || 0,
        modulesCompleted: item?.modulesCompleted || 0
      }
    };
  });

  res.json({ students: result });
}

function csvEscape(value) {
  const s = String(value ?? '');
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

export async function exportStudentsCsv(_req, res) {
  const students = await User.find({ role: 'STUDENT' })
    .sort({ createdAt: 1 })
    .select('name lastName email badgesCount createdAt');

  const ids = students.map((s) => s._id);
  const summary = await Progress.aggregate([
    { $match: { userId: { $in: ids } } },
    {
      $group: {
        _id: '$userId',
        modulesStarted: { $sum: 1 },
        modulesCompleted: { $sum: { $cond: [{ $ifNull: ['$completedAt', false] }, 1, 0] } },
        avgProgress: { $avg: '$moduleProgressPercent' }
      }
    }
  ]);
  const byId = new Map(summary.map((s) => [String(s._id), s]));

  const header = [
    '#',
    'Nombre estudiante',
    'Correo del estudiante',
    'Programa',
    'Proceso (%)',
    'Insignias',
    'Modulos completados'
  ];

  const rows = students.map((s, idx) => {
    const item = byId.get(String(s._id));
    const overall = item?.avgProgress ? Math.round(item.avgProgress) : 0;
    const modulesCompleted = item?.modulesCompleted || 0;
    return [
      String(idx + 1),
      `${s.name} ${s.lastName}`.trim(),
      s.email,
      'Ingenieria Mecatronica',
      String(overall),
      String(s.badgesCount || 0),
      String(modulesCompleted)
    ];
  });

  const csv =
    '\ufeff' +
    [header, ...rows]
      .map((line) => line.map(csvEscape).join(';'))
      .join('\n');

  const today = new Date().toISOString().slice(0, 10);
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="reporte-estudiantes-${today}.csv"`);
  res.setHeader('Cache-Control', 'no-store');
  res.status(200).send(csv);
}

export async function getStudentProgress(req, res) {
  const studentId = toObjectId(req.params.studentId);
  if (!studentId) return res.status(400).json({ error: 'Invalid studentId' });

  const student = await User.findById(studentId).select('role name lastName email badgesCount lastLoginAt');
  if (!student) return res.status(404).json({ error: 'Student not found' });
  if (student.role !== 'STUDENT') return res.status(400).json({ error: 'User is not a student' });

  const includeUnpublished = String(req.query.includeUnpublished || '') === '1';
  const moduleFilter = includeUnpublished ? {} : { isPublished: true };
  const modules = await Module.find(moduleFilter).sort({ createdAt: -1 }).select('title level category');
  const progress = await Progress.find({ userId: studentId, moduleId: { $in: modules.map((m) => m._id) } }).select(
    'moduleId moduleProgressPercent currentLevelOrder levelsCompleted completedAt startedAt updatedAt'
  );

  const progressByModule = new Map(progress.map((p) => [String(p.moduleId), p]));

  const modulesWithProgress = modules.map((m) => {
    const p = progressByModule.get(String(m._id));
    const percent = p?.moduleProgressPercent || 0;
    return {
      moduleId: m._id,
      title: m.title,
      level: m.level,
      category: m.category || 'General',
      percent,
      completedAt: p?.completedAt || null,
      startedAt: p?.startedAt || null,
      updatedAt: p?.updatedAt || null
    };
  });

  const started = progress.length;
  const completed = progress.filter((p) => !!p.completedAt).length;
  const overallPercent = started > 0 ? Math.round(progress.reduce((acc, p) => acc + (p.moduleProgressPercent || 0), 0) / started) : 0;

  res.json({
    student: {
      _id: student._id,
      name: student.name,
      lastName: student.lastName,
      email: student.email,
      badgesCount: student.badgesCount || 0,
      lastLoginAt: student.lastLoginAt || null
    },
    summary: {
      overallPercent,
      modulesStarted: started,
      modulesCompleted: completed,
      modulesTotal: modules.length
    },
    modules: modulesWithProgress
  });
}
