
import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { PortfolioCategory } from '../../lib/googleSheets';

interface AllocationPieChartProps {
  data: PortfolioCategory[];
  totalAum: number;
}

const AllocationPieChart: React.FC<AllocationPieChartProps> = ({ data, totalAum }) => {
  // Fallback si no hay datos
  const displayData = data.length > 0 ? data : [
    { name: 'Sincronizando...', value: 100, color: '#f3f4f6' }
  ];

  return (
    <div className="h-48 w-full relative">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={displayData}
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
            {displayData.map((entry, index) => (
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
            formatter={(value) => [`${value}%`, 'Distribución']}
          />
        </PieChart>
      </ResponsiveContainer>
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
        <span className="text-[10px] font-bold text-text-muted uppercase tracking-tighter">Total AUM</span>
        <span className="text-xl font-black text-accent tracking-tighter">
          ${(totalAum / 1000).toFixed(1)}k
        </span>
      </div>
    </div>
  );
};

export default AllocationPieChart;
