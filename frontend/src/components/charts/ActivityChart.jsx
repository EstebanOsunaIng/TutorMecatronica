import React, { useMemo } from 'react';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

function buildActivityData(progressRows = [], range = 'week') {
  const labelsByRange = {
    day: ['Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab', 'Dom'],
    week: ['S1', 'S2', 'S3', 'S4'],
    month: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun']
  };

  const labels = labelsByRange[range] || labelsByRange.week;
  const base = labels.map((label) => ({ label, value: 0 }));

  if (!Array.isArray(progressRows) || progressRows.length === 0) return base;

  progressRows.forEach((row, index) => {
    const dateValue = row?.updatedAt || row?.completedAt || row?.createdAt;
    let bucket = index % labels.length;

    if (dateValue) {
      const date = new Date(dateValue);
      if (!Number.isNaN(date.getTime())) {
        if (range === 'day') {
          const day = date.getDay();
          bucket = (day + 6) % 7;
        } else if (range === 'week') {
          bucket = Math.min(3, Math.max(0, Math.floor((date.getDate() - 1) / 7)));
        } else if (range === 'month') {
          bucket = date.getMonth() % labels.length;
        }
      }
    }

    const progress = Number(row?.moduleProgressPercent || 0);
    const score = Number.isFinite(progress) ? progress : 0;
    base[bucket].value += Math.max(2, Math.round(score / 20));
  });

  return base;
}

export default function ActivityChart({ progressRows = [], range = 'week', isDark = false }) {
  const data = useMemo(() => buildActivityData(progressRows, range), [progressRows, range]);

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 12, left: -12, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#1f2937' : '#e2e8f0'} />
          <XAxis dataKey="label" stroke={isDark ? '#cbd5e1' : '#64748b'} fontSize={11} />
          <YAxis stroke={isDark ? '#cbd5e1' : '#64748b'} fontSize={11} allowDecimals={false} />
          <Tooltip />
          <Area type="monotone" dataKey="value" stroke="#0ea5e9" fill="#0ea5e933" strokeWidth={2.5} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
