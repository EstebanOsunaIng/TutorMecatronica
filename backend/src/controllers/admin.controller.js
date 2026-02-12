import { TeacherCode } from '../models/TeacherCode.model.js';
import { Module } from '../models/Module.model.js';
import { Progress } from '../models/Progress.model.js';
import { User } from '../models/User.model.js';
import { addMinutes } from '../utils/time.js';

const MONTH_LABELS = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
const ROLE_LABELS = {
  STUDENT: 'estudiante',
  TEACHER: 'docente',
  ADMIN: 'admin'
};

function toMonthKey(date) {
  const d = new Date(date);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function buildMonthlyBuckets(monthsBack = 12) {
  const now = new Date();
  const buckets = [];
  for (let i = monthsBack - 1; i >= 0; i -= 1) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    buckets.push({
      key: toMonthKey(d),
      month: MONTH_LABELS[d.getMonth()],
      students: 0,
      teachers: 0
    });
  }
  return buckets;
}

function isValidMonthKey(monthKey) {
  return /^\d{4}-\d{2}$/.test(String(monthKey || ''));
}

function getMonthRange(monthKey) {
  const [y, m] = String(monthKey).split('-').map(Number);
  const start = new Date(y, m - 1, 1);
  const end = new Date(y, m, 1);
  return { start, end };
}

function getMonthLabel(monthKey) {
  const [y, m] = String(monthKey).split('-').map(Number);
  return `${MONTH_LABELS[Math.max(0, m - 1)]} ${y}`;
}

function buildRegistrationBuckets({ monthKey, granularity = 'week' }) {
  const { start } = getMonthRange(monthKey);
  const year = start.getFullYear();
  const month = start.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  if (granularity === 'day') {
    const buckets = [];
    for (let day = 1; day <= daysInMonth; day += 1) {
      buckets.push({
        id: day,
        label: `${String(day).padStart(2, '0')}`,
        students: 0,
        teachers: 0
      });
    }
    return buckets;
  }

  const totalWeeks = Math.ceil(daysInMonth / 7);
  const weeklyBuckets = [];
  for (let week = 1; week <= totalWeeks; week += 1) {
    weeklyBuckets.push({
      id: week,
      label: `Sem ${week}`,
      students: 0,
      teachers: 0
    });
  }
  return weeklyBuckets;
}

function buildRegistrationSeries({ users, monthKey, granularity = 'week' }) {
  const { start, end } = getMonthRange(monthKey);
  const buckets = buildRegistrationBuckets({ monthKey, granularity });
  const bucketById = new Map(buckets.map((bucket) => [bucket.id, bucket]));

  users.forEach((u) => {
    if (!u.createdAt) return;
    if (u.role !== 'STUDENT' && u.role !== 'TEACHER') return;
    const createdAt = new Date(u.createdAt);
    if (createdAt < start || createdAt >= end) return;

    const day = createdAt.getDate();
    const bucketId = granularity === 'day' ? day : Math.floor((day - 1) / 7) + 1;
    const bucket = bucketById.get(bucketId);
    if (!bucket) return;

    if (u.role === 'STUDENT') bucket.students += 1;
    if (u.role === 'TEACHER') bucket.teachers += 1;
  });

  return buckets;
}

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

export async function getDashboardMetrics(req, res) {
  const monthBuckets = buildMonthlyBuckets(12);
  const defaultMonth = monthBuckets[monthBuckets.length - 1]?.key || toMonthKey(new Date());
  const requestedMonth = isValidMonthKey(req.query.month) ? req.query.month : defaultMonth;
  const granularity = req.query.granularity === 'day' ? 'day' : 'week';

  const [users, modules] = await Promise.all([
    User.find({}, 'role isActive badgesCount createdAt lastLoginAt name lastName').lean(),
    Module.find({}, 'title createdAt').lean()
  ]);

  const students = users.filter((u) => u.role === 'STUDENT');
  const totalStudents = students.length;
  const activeStudents = students.filter((u) => u.isActive).length;
  const totalUsers = users.length;
  const activeUsers = users.filter((u) => u.isActive).length;
  const certifications = students.reduce((sum, u) => sum + (u.badgesCount || 0), 0);

  const studentIds = students.map((u) => u._id);
  const progressRows = studentIds.length
    ? await Progress.find(
      { userId: { $in: studentIds } },
      'userId moduleId moduleProgressPercent timeSpentSeconds completedAt updatedAt startedAt'
    ).lean()
    : [];

  const progressWithTime = progressRows.filter((p) => Number(p.timeSpentSeconds) > 0);
  const averageTimeMinutes = progressWithTime.length
    ? Math.round(
      progressWithTime.reduce((sum, p) => sum + Number(p.timeSpentSeconds || 0), 0) /
          progressWithTime.length /
          60
    )
    : 0;

  const registrations = buildRegistrationSeries({
    users,
    monthKey: requestedMonth,
    granularity
  });

  const rolesCount = users.reduce(
    (acc, u) => {
      if (acc[u.role] !== undefined) acc[u.role] += 1;
      return acc;
    },
    { STUDENT: 0, TEACHER: 0, ADMIN: 0 }
  );

  const byModuleId = new Map(
    modules.map((m) => [
      String(m._id),
      {
        moduleId: String(m._id),
        moduleTitle: m.title,
        startedUsers: new Set(),
        completedUsers: new Set()
      }
    ])
  );

  progressRows.forEach((p) => {
    const entry = byModuleId.get(String(p.moduleId));
    if (!entry) return;
    const userId = String(p.userId);
    const percent = Number(p.moduleProgressPercent || 0);
    if (percent > 0) {
      entry.startedUsers.add(userId);
    }
    if (percent === 100) {
      entry.completedUsers.add(userId);
      entry.startedUsers.add(userId);
    }
  });

  const modulesStatus = Array.from(byModuleId.values())
    .map((entry) => {
      const completed = entry.completedUsers.size;
      const started = entry.startedUsers.size;
      return {
        moduleId: entry.moduleId,
        moduleTitle: entry.moduleTitle,
        completed,
        inProgress: Math.max(started - completed, 0),
        notStarted: Math.max(totalStudents - started, 0)
      };
    })
    .sort((a, b) => (b.completed + b.inProgress) - (a.completed + a.inProgress))
    .slice(0, 5);

  const usersById = new Map(users.map((u) => [String(u._id), u]));
  const modulesById = new Map(modules.map((m) => [String(m._id), m]));

  const recentActivity = [];
  users.forEach((u) => {
    if (u.createdAt) {
      recentActivity.push({
        id: `created-${u._id}`,
        type: 'register',
        title: `${u.name} ${u.lastName}`,
        detail: `Se registro como ${ROLE_LABELS[u.role] || 'usuario'}`,
        at: u.createdAt
      });
    }
    if (u.lastLoginAt) {
      recentActivity.push({
        id: `login-${u._id}`,
        type: 'login',
        title: `${u.name} ${u.lastName}`,
        detail: 'Inicio sesion',
        at: u.lastLoginAt
      });
    }
  });

  progressRows.forEach((p) => {
    if (!p.completedAt) return;
    const user = usersById.get(String(p.userId));
    const moduleItem = modulesById.get(String(p.moduleId));
    if (!user || !moduleItem) return;
    recentActivity.push({
      id: `module-${p._id}`,
      type: 'module_complete',
      title: `${user.name} ${user.lastName}`,
      detail: `Completo ${moduleItem.title}`,
      at: p.completedAt
    });
  });

  recentActivity.sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());

  res.json({
    overview: {
      totalUsers,
      activeUsers,
      activeStudents,
      averageTimeMinutes,
      certifications,
      updatedAt: new Date()
    },
    registrations,
    registrationFilters: {
      month: requestedMonth,
      granularity,
      monthOptions: monthBuckets.map((bucket) => ({
        value: bucket.key,
        label: getMonthLabel(bucket.key)
      }))
    },
    roleDistribution: [
      { role: 'STUDENT', label: 'Estudiantes', value: rolesCount.STUDENT },
      { role: 'TEACHER', label: 'Docentes', value: rolesCount.TEACHER },
      { role: 'ADMIN', label: 'Admins', value: rolesCount.ADMIN }
    ],
    modulesStatus,
    recentActivity: recentActivity.slice(0, 6)
  });
}
