
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

const AllocationPieChart: React.FC = () => {
  return (
    <div className="h-48 w-full relative">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={80}
            paddingAngle={5}
            dataKey="value"
            animationBegin={0}
            animationDuration={1500}
            stroke="none"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
            ))}
          </Pie>
          <Tooltip 
            contentStyle={{ 
              borderRadius: '16px', 
              border: 'none', 
              backgroundColor: '#1d1c2d',
              boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
              color: '#fff'
            }}
            itemStyle={{ fontSize: '12px', fontWeight: 700, color: '#fff' }}
            labelStyle={{ display: 'none' }}
          />
        </PieChart>
      </ResponsiveContainer>
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
        <span className="text-[10px] font-bold text-text-muted uppercase tracking-tighter">Total AUM</span>
        <span className="text-xl font-black text-accent tracking-tighter">
          ${(FINANCE_CONFIG.GLOBAL_AUM / 1000).toFixed(1)}k
        </span>
      </div>
    </div>
  );
};

export default AllocationPieChart;
