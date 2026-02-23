
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
    { name: 'Sincronizando...', value: 100, color: '#32314d', subtext: '' }
  ];

  return (
    <div className="h-[400px] w-full relative flex items-center justify-center group/donut">
      {/* Glow de fondo dinámico */}
      <div className="absolute inset-0 bg-primary/5 rounded-full blur-[100px] scale-90 group-hover/donut:scale-100 transition-transform duration-1000"></div>
      
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          {/* Track de fondo para visibilidad de segmentos oscuros */}
          <Pie
            data={[{ value: 100 }]}
            cx="50%"
            cy="50%"
            innerRadius={120}
            outerRadius={150}
            fill="#2d2c3e"
            stroke="none"
            dataKey="value"
            isAnimationActive={false}
          />
          <Pie
            data={displayData}
            cx="50%"
            cy="50%"
            innerRadius={120}
            outerRadius={150}
            paddingAngle={2}
            dataKey="value"
            animationDuration={1500}
            stroke="none"
            startAngle={90}
            endAngle={450}
            cornerRadius={6}
          >
            {displayData.map((entry, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={entry.color} 
                className="outline-none"
                style={{ 
                  filter: entry.color === '#ceff04' 
                    ? 'drop-shadow(0 0 20px rgba(206,255,4,0.6))' 
                    : 'drop-shadow(0 0 8px rgba(255,255,255,0.05))' 
                }}
              />
            ))}
          </Pie>
          <Tooltip 
            contentStyle={{ 
              backgroundColor: 'rgba(29, 28, 45, 0.95)', 
              border: '1px solid rgba(255,255,255,0.1)', 
              borderRadius: '20px', 
              backdropFilter: 'blur(15px)',
              boxShadow: '0 25px 50px rgba(0,0,0,0.5)'
            }}
            itemStyle={{ color: '#fff', fontSize: '12px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}
            formatter={(value) => [`${value}%`, 'Distribución']}
          />
        </PieChart>
      </ResponsiveContainer>
      
      {/* TEXTO CENTRAL - AJUSTADO AL NUEVO TAMAÑO */}
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
        <div className="flex flex-col items-center animate-in fade-in zoom-in duration-1000">
          <span className="text-white/30 text-[11px] font-black uppercase tracking-[0.4em] mb-3">Patrimonio Total</span>
          <span className="text-white text-4xl md:text-5xl font-black tracking-tighter leading-none drop-shadow-2xl">
            {centerValue}
          </span>
          <div className="h-1.5 w-16 bg-primary rounded-full mt-5 shadow-neon animate-pulse"></div>
        </div>
      </div>
    </div>
  );
};

export default AssetDistributionDonut;
