
import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { LiquidityItem } from '../../lib/googleSheets';

interface AssetDistributionDonutProps {
  data: LiquidityItem[];
  centerValue: string;
}

const AssetDistributionDonut: React.FC<AssetDistributionDonutProps> = ({ data, centerValue }) => {
  // Fallback si no hay datos
  const displayData = data.length > 0 ? data : [
    { name: 'Sincronizando...', value: 100, color: '#2d2c3e', subtext: '' }
  ];

  return (
    <div className="h-72 w-full relative flex items-center justify-center">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={displayData}
            cx="50%"
            cy="50%"
            innerRadius={85}
            outerRadius={110}
            paddingAngle={0}
            dataKey="value"
            animationDuration={1500}
            stroke="none"
            startAngle={90}
            endAngle={450}
          >
            {displayData.map((entry, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={entry.color} 
                style={{ filter: entry.color === '#ceff04' ? 'drop-shadow(0 0 12px rgba(206,255,4,0.4))' : 'none' }}
              />
            ))}
          </Pie>
          <Tooltip 
            contentStyle={{ backgroundColor: '#1d1c2d', border: 'none', borderRadius: '12px', color: '#fff' }}
            itemStyle={{ color: '#fff', fontSize: '11px', fontWeight: 700 }}
            formatter={(value) => [`${value}%`, '']}
          />
        </PieChart>
      </ResponsiveContainer>
      
      {/* TEXTO CENTRAL - CORRECCIÓN DE CONTRASTE */}
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none mt-[-5px]">
        <span className="text-white/40 text-[9px] font-black uppercase tracking-[0.2em] mb-1">AUM GLOBAL</span>
        <span className="text-white text-3xl font-black tracking-tighter leading-none">
          {centerValue}
        </span>
        <div className="h-1 w-8 bg-primary rounded-full mt-3 shadow-neon"></div>
      </div>
    </div>
  );
};

export default AssetDistributionDonut;
