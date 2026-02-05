import React from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

export default function ProgressChart({ data }) {
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data}>
          <XAxis dataKey="week" stroke="#64748b" fontSize={10} />
          <YAxis stroke="#64748b" fontSize={10} />
          <Tooltip />
          <Area type="monotone" dataKey="percentage" stroke="#199ef0" fill="#199ef033" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
