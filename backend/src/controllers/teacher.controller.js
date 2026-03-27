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

function normalizeSearchValue(value) {
  return String(value || '').trim().toLowerCase();
}

function parseDateQuery(value, endOfDay = false) {
  if (!value) return null;
  const parsed = new Date(String(value));
  if (Number.isNaN(parsed.getTime())) return null;
  if (endOfDay) parsed.setHours(23, 59, 59, 999);
  else parsed.setHours(0, 0, 0, 0);
  return parsed;
}

function parseIntegerQuery(value) {
  if (value === undefined || value === null || value === '') return null;
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return null;
  return Math.floor(parsed);
}

function parseStudentsReportFilters(rawQuery) {
  const q = String(rawQuery.q || '').trim();

  const lastLoginFrom = parseDateQuery(rawQuery.lastLoginFrom, false);
  if (rawQuery.lastLoginFrom && !lastLoginFrom) {
    return { error: 'Fecha inicial de ultimo acceso invalida.' };
  }

  const lastLoginTo = parseDateQuery(rawQuery.lastLoginTo, true);
  if (rawQuery.lastLoginTo && !lastLoginTo) {
    return { error: 'Fecha final de ultimo acceso invalida.' };
  }

  const progressMin = parseIntegerQuery(rawQuery.progressMin);
  const progressMax = parseIntegerQuery(rawQuery.progressMax);
  if (rawQuery.progressMin !== undefined && rawQuery.progressMin !== '' && progressMin === null) {
    return { error: 'Progreso minimo invalido.' };
  }
  if (rawQuery.progressMax !== undefined && rawQuery.progressMax !== '' && progressMax === null) {
    return { error: 'Progreso maximo invalido.' };
  }
  if (progressMin !== null && (progressMin < 0 || progressMin > 100)) {
    return { error: 'Progreso minimo fuera de rango (0-100).' };
  }
  if (progressMax !== null && (progressMax < 0 || progressMax > 100)) {
    return { error: 'Progreso maximo fuera de rango (0-100).' };
  }
  if (progressMin !== null && progressMax !== null && progressMin > progressMax) {
    return { error: 'El progreso minimo no puede ser mayor al maximo.' };
  }

  const badges = typeof rawQuery.badges === 'string'
    ? [...new Set(rawQuery.badges
      .split(',')
      .map((value) => parseIntegerQuery(value))
      .filter((value) => Number.isInteger(value) && value >= 0 && value <= 5))]
    : [];

  const sortByRaw = String(rawQuery.sortBy || '').trim();
  const allowedSortBy = ['student', 'lastLoginAt', 'progress', 'badgesCount'];
  const sortBy = allowedSortBy.includes(sortByRaw) ? sortByRaw : 'lastLoginAt';
  const sortOrder = String(rawQuery.sortOrder || '').toLowerCase() === 'asc' ? 'asc' : 'desc';

  return {
    filters: {
      q,
      lastLoginFrom,
      lastLoginTo,
      progressMin,
      progressMax,
      badges,
      sortBy,
      sortOrder
    }
  };
}

async function buildStudentsReport(filters) {
  const mongoQuery = { role: 'STUDENT' };

  if (filters.lastLoginFrom || filters.lastLoginTo) {
    mongoQuery.lastLoginAt = {};
    if (filters.lastLoginFrom) mongoQuery.lastLoginAt.$gte = filters.lastLoginFrom;
    if (filters.lastLoginTo) mongoQuery.lastLoginAt.$lte = filters.lastLoginTo;
  }

  if (filters.badges.length) {
    mongoQuery.badgesCount = { $in: filters.badges };
  }

  const dbSortFieldMap = {
    lastLoginAt: 'lastLoginAt',
    badgesCount: 'badgesCount'
  };
  const dbSortField = dbSortFieldMap[filters.sortBy] || 'lastLoginAt';
  const dbSortOrder = filters.sortOrder === 'asc' ? 1 : -1;

  const students = await User.find(mongoQuery)
    .sort({ [dbSortField]: dbSortOrder, createdAt: -1, _id: -1 })
    .select('name lastName email profilePhotoUrl lastLoginAt lastSeenAt badgesCount');

  const normalizedQ = normalizeSearchValue(filters.q);
  const nameFilteredStudents = normalizedQ
    ? students.filter((student) => {
      const fullName = `${normalizeSearchValue(student.name)} ${normalizeSearchValue(student.lastName)}`.trim();
      const safeEmail = normalizeSearchValue(student.email);
      return fullName.includes(normalizedQ) || safeEmail.includes(normalizedQ);
    })
    : students;

  const ids = nameFilteredStudents.map((s) => s._id);
  const summary = ids.length
    ? await Progress.aggregate([
      { $match: { userId: { $in: ids } } },
      {
        $group: {
          _id: '$userId',
          modulesStarted: { $sum: 1 },
          modulesCompleted: { $sum: { $cond: [{ $ifNull: ['$completedAt', false] }, 1, 0] } },
          avgProgress: { $avg: '$moduleProgressPercent' }
        }
      }
    ])
    : [];

  const byId = new Map(summary.map((s) => [String(s._id), s]));

  const withMetrics = nameFilteredStudents.map((s) => {
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

  const filteredByProgress = withMetrics.filter((s) => {
    const percent = s.progress?.overallPercent || 0;
    if (filters.progressMin !== null && percent < filters.progressMin) return false;
    if (filters.progressMax !== null && percent > filters.progressMax) return false;
    return true;
  });

  const sortMultiplier = filters.sortOrder === 'asc' ? 1 : -1;
  filteredByProgress.sort((a, b) => {
    if (filters.sortBy === 'student') {
      const aName = `${normalizeSearchValue(a.name)} ${normalizeSearchValue(a.lastName)}`.trim();
      const bName = `${normalizeSearchValue(b.name)} ${normalizeSearchValue(b.lastName)}`.trim();
      if (aName === bName) return 0;
      return aName > bName ? sortMultiplier : -sortMultiplier;
    }
    if (filters.sortBy === 'progress') {
      const aValue = a.progress?.overallPercent || 0;
      const bValue = b.progress?.overallPercent || 0;
      if (aValue === bValue) return 0;
      return (aValue - bValue) * sortMultiplier;
    }
    if (filters.sortBy === 'badgesCount') {
      const aValue = a.badgesCount || 0;
      const bValue = b.badgesCount || 0;
      if (aValue === bValue) return 0;
      return (aValue - bValue) * sortMultiplier;
    }
    const aDate = a.lastLoginAt ? new Date(a.lastLoginAt).getTime() : 0;
    const bDate = b.lastLoginAt ? new Date(b.lastLoginAt).getTime() : 0;
    if (aDate === bDate) return 0;
    return (aDate - bDate) * sortMultiplier;
  });

  return filteredByProgress;
}

export async function listStudents(req, res) {
  const { filters, error } = parseStudentsReportFilters(req.query || {});
  if (error) return res.status(400).json({ error });

  const students = await buildStudentsReport(filters);
  res.json({ students });
}

function csvEscape(value) {
  const s = String(value ?? '');
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

export async function exportStudentsCsv(req, res) {
  const { filters, error } = parseStudentsReportFilters(req.query || {});
  if (error) return res.status(400).json({ error });

  const students = await buildStudentsReport(filters);

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
    return [
      String(idx + 1),
      `${s.name} ${s.lastName}`.trim(),
      s.email,
      'Ingenieria Mecatronica',
      String(s.progress?.overallPercent || 0),
      String(s.badgesCount || 0),
      String(s.progress?.modulesCompleted || 0)
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
