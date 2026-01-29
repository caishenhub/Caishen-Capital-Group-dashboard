import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { FINANCE_CONFIG } from '../../constants';

const data = [
  { name: 'Liquidez Inmediata', value: 80, color: '#ceff04' },
  { name: 'Capital Estratégico', value: 20, color: '#1d1c2d' },
];

const AssetDistributionDonut: React.FC = () => {
  return (
    <div className="h-64 w-full relative">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={80}
            outerRadius={105}
            paddingAngle={0}
            dataKey="value"
            animationDuration={1500}
            stroke="none"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip 
            contentStyle={{ backgroundColor: '#1d1c2d', border: 'none', borderRadius: '12px', color: '#fff' }}
            itemStyle={{ color: '#fff', fontSize: '11px', fontWeight: 700 }}
            formatter={(value) => [`${value}%`, '']}
          />
        </PieChart>
      </ResponsiveContainer>
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
        <span className="text-text-muted text-[10px] font-black uppercase tracking-tighter">AUM Global</span>
        <span className="text-accent text-3xl font-black tracking-tighter">
          $124,400
        </span>
      </div>
    </div>
  );
};

export default AssetDistributionDonut;