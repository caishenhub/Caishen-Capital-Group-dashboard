
import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { PortfolioCategory } from '../../lib/googleSheets';

interface AssetDonutChartProps {
  data: PortfolioCategory[];
  totalAum: number;
}

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const { name, value, color } = payload[0].payload;
    return (
      <div className="bg-[#1d1c2d] border border-white/10 rounded-2xl p-4 shadow-[0_20px_50px_rgba(0,0,0,0.5)] animate-in zoom-in-95 duration-200">
        <div className="flex items-center gap-2 mb-1">
          <div className="size-2 rounded-full" style={{ backgroundColor: color }}></div>
          <p className="text-[#9ca3af] text-[10px] font-black uppercase tracking-[0.2em]">{name}</p>
        </div>
        <p className="text-white text-xl font-black tracking-tighter">
          {value}%
        </p>
      </div>
    );
  }
  return null;
};

const AssetDonutChart: React.FC<AssetDonutChartProps> = ({ data, totalAum }) => {
  const displayData = data.length > 0 ? data : [{ name: 'Sincronizando...', value: 100, color: '#f3f4f6' }];

  return (
    <div className="w-full h-full relative">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={displayData}
            cx="50%"
            cy="50%"
            innerRadius="68%"
            outerRadius="92%"
            paddingAngle={6}
            dataKey="value"
            stroke="none"
            animationDuration={1500}
            startAngle={90}
            endAngle={450}
          >
            {displayData.map((entry, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={entry.color} 
                className="hover:opacity-80 transition-opacity cursor-pointer outline-none"
              />
            ))}
          </Pie>
          <Tooltip 
            content={<CustomTooltip />} 
            cursor={{ stroke: 'none' }}
            wrapperStyle={{ outline: 'none', zIndex: 100 }}
          />
        </PieChart>
      </ResponsiveContainer>
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none translate-y-[-8px]">
        <span className="text-[#9ca3af] text-[12px] font-black uppercase tracking-[0.2em] mb-2">Total AUM</span>
        <span className="text-[#1d1c2d] text-4xl font-black tracking-tighter leading-none">
          ${(totalAum / 1000).toFixed(1)}k
        </span>
        <div className="h-1.5 w-10 bg-[#ceff04] rounded-full mt-3 shadow-[0_0_15px_rgba(206,255,4,0.6)]"></div>
      </div>
    </div>
  );
};

export default AssetDonutChart;
