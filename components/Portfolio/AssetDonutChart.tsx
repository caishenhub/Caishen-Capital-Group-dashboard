
import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { FINANCE_CONFIG } from '../../constants';

const data = [
  { name: 'Forex', value: 20.6, color: '#1d1c2d' },
  { name: 'Derivados', value: 30.9, color: '#D4AF37' },
  { name: 'Acciones', value: 10.3, color: '#60a5fa' },
  { name: 'Inmobiliario', value: 25.8, color: '#ceff04' },
  { name: 'Algorítmico', value: 12.4, color: '#9CA3AF' },
];

const AssetDonutChart: React.FC = () => {
  return (
    <div className="w-full h-full relative">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius="65%"
            outerRadius="85%"
            paddingAngle={4}
            dataKey="value"
            stroke="none"
            animationDuration={1500}
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip 
            contentStyle={{ 
              backgroundColor: '#1d1c2d', 
              border: 'none', 
              borderRadius: '16px',
              padding: '12px',
              boxShadow: '0 10px 25px rgba(0,0,0,0.2)'
            }}
            itemStyle={{ color: '#fff', fontSize: '12px', fontWeight: 700 }}
            labelStyle={{ display: 'none' }}
          />
        </PieChart>
      </ResponsiveContainer>
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
        <span className="text-text-muted text-[9px] md:text-[11px] font-bold uppercase tracking-widest mb-1">AUM Global</span>
        <span className="text-accent text-xl md:text-3xl font-black tracking-tighter">
          ${(FINANCE_CONFIG.GLOBAL_AUM / 1000).toFixed(1)}k
        </span>
      </div>
    </div>
  );
};

export default AssetDonutChart;
