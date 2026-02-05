import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

export default function WeeklyParticipationChart({ data }) {
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <XAxis dataKey="week" stroke="#64748b" fontSize={10} />
          <YAxis stroke="#64748b" fontSize={10} />
          <Tooltip />
          <Bar dataKey="students" fill="#199ef0" radius={[8, 8, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
