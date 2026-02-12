import React, { useMemo } from 'react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts';

function safeDate(value) {
  const t = new Date(value).getTime();
  return Number.isFinite(t) ? new Date(t) : null;
}

function startOfDay(d) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function startOfWeekMonday(d) {
  const day = d.getDay();
  const diff = (day + 6) % 7; // Monday=0
  const base = startOfDay(d);
  base.setDate(base.getDate() - diff);
  return base;
}

function startOfMonth(d) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

function formatLabel(range, d) {
  if (!d) return '';
  if (range === 'day') {
    return d.toLocaleDateString('es-CO', { weekday: 'short' });
  }
  if (range === 'week') {
    return d.toLocaleDateString('es-CO', { day: '2-digit', month: 'short' });
  }
  return d.toLocaleDateString('es-CO', { month: 'short' });
}

function buildBuckets(range) {
  const now = new Date();
  if (range === 'day') {
    const end = startOfDay(now);
    return Array.from({ length: 7 }).map((_, i) => {
      const d = new Date(end);
      d.setDate(d.getDate() - (6 - i));
      const key = d.toISOString().slice(0, 10);
      return { key, date: d };
    });
  }
  if (range === 'week') {
    const end = startOfWeekMonday(now);
    return Array.from({ length: 4 }).map((_, i) => {
      const d = new Date(end);
      d.setDate(d.getDate() - 7 * (3 - i));
      const key = d.toISOString().slice(0, 10);
      return { key, date: d };
    });
  }

  const end = startOfMonth(now);
  return Array.from({ length: 6 }).map((_, i) => {
    const d = new Date(end);
    d.setMonth(d.getMonth() - (5 - i));
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    return { key, date: d };
  });
}

function bucketKey(range, d) {
  if (range === 'day') return startOfDay(d).toISOString().slice(0, 10);
  if (range === 'week') return startOfWeekMonday(d).toISOString().slice(0, 10);
  const m = startOfMonth(d);
  return `${m.getFullYear()}-${String(m.getMonth() + 1).padStart(2, '0')}`;
}

export default function ActivityChart({ progressRows, range = 'week', isDark }) {
  const data = useMemo(() => {
    const buckets = buildBuckets(range);
    const counts = new Map(buckets.map((b) => [b.key, 0]));

    for (const row of progressRows || []) {
      const d = safeDate(row?.updatedAt || row?.completedAt || row?.startedAt);
      if (!d) continue;
      const key = bucketKey(range, d);
      if (!counts.has(key)) continue;
      counts.set(key, (counts.get(key) || 0) + 1);
    }

    return buckets.map((b) => ({
      key: b.key,
      label: formatLabel(range, b.date),
      value: counts.get(b.key) || 0
    }));
  }, [progressRows, range]);

  const stroke = isDark ? '#38bdf8' : '#1d4f91';
  const grid = isDark ? 'rgba(148,163,184,0.22)' : 'rgba(15,42,75,0.10)';
  const axis = isDark ? '#94a3b8' : '#64748b';

  return (
    <div className="h-56 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 10, left: -18, bottom: 0 }}>
          <defs>
            <linearGradient id="activityFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={stroke} stopOpacity={0.35} />
              <stop offset="95%" stopColor={stroke} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke={grid} />
          <XAxis dataKey="label" stroke={axis} fontSize={11} />
          <YAxis stroke={axis} fontSize={11} allowDecimals={false} />
          <Tooltip
            contentStyle={{
              background: isDark ? 'rgba(15, 23, 42, 0.92)' : 'rgba(255,255,255,0.96)',
              border: isDark ? '1px solid rgba(51,65,85,0.6)' : '1px solid rgba(148,163,184,0.35)',
              borderRadius: 12
            }}
            labelStyle={{ color: isDark ? '#e2e8f0' : '#0f172a', fontWeight: 700 }}
            itemStyle={{ color: isDark ? '#e2e8f0' : '#0f172a' }}
            formatter={(v) => [v, 'Actividad']}
          />
          <Area type="monotone" dataKey="value" stroke={stroke} strokeWidth={2} fill="url(#activityFill)" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
