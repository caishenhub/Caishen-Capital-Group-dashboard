
import React, { useState, useEffect, useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { RefreshCw } from 'lucide-react';
import { fetchPerformanceHistory } from '../../lib/googleSheets';

interface CustomTooltipProps {
  active?: boolean;
  payload?: any[];
  selectedYear: number | 'General';
}

const CustomTooltip = ({ active, payload, selectedYear }: CustomTooltipProps) => {
  if (active && payload && payload.length) {
    const item = payload[0].payload;
    const pYield = parseFloat(item.pYield);
    const bYield = parseFloat(item.bYield);
    
    return (
      <div className="bg-[#1d1c2d] border-none rounded-2xl p-4 shadow-2xl ring-1 ring-white/10 scale-90 md:scale-100 origin-top-left">
        <p className="text-[10px] font-black text-text-muted uppercase tracking-widest mb-3 border-b border-white/5 pb-2">
          {item.name} {item.year}
        </p>
        <div className="space-y-1.5 min-w-[150px]">
          <div className="flex justify-between items-center gap-6">
            <span className="text-[11px] font-bold text-white/70 uppercase">CCG</span>
            <span className={`text-xs font-black ${pYield >= 0 ? 'text-primary' : 'text-red-400'}`}>
              {pYield > 0 ? '+' : ''}{pYield.toFixed(2)}%
            </span>
          </div>
          <div className="flex justify-between items-center gap-6">
            <span className="text-[11px] font-bold text-white/70 uppercase">SPY500</span>
            <span className={`text-xs font-black ${bYield >= 0 ? 'text-white' : 'text-red-400'}`}>
              {bYield > 0 ? '+' : ''}{bYield.toFixed(2)}%
            </span>
          </div>
        </div>
      </div>
    );
  }
  return null;
};

const PerformanceChart: React.FC<{ initialYear?: number | 'General' }> = ({ initialYear = 2025 }) => {
  const [selectedYear, setSelectedYear] = useState<number | 'General'>(initialYear);
  const [fullHistory, setFullHistory] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setSelectedYear(initialYear);
  }, [initialYear]);

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        const data = await fetchPerformanceHistory();
        setFullHistory(data);
      } catch (e) {
        console.error("Error cargando historial de rendimientos:", e);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, []);

  const activeData = useMemo(() => {
    if (isLoading) return [];
    if (selectedYear === 'General') {
      return fullHistory.map((d, i) => ({
        ...d,
        label: (i === 0 || fullHistory[i-1].year !== d.year) ? d.year : ''
      }));
    }
    return fullHistory.filter(d => d.year === String(selectedYear)).map(d => ({ ...d, label: d.name }));
  }, [selectedYear, fullHistory, isLoading]);

  if (isLoading) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center gap-3">
        <RefreshCw size={32} className="text-primary animate-spin" />
        <p className="text-[10px] font-black text-text-muted uppercase tracking-widest">Sincronizando Historial...</p>
      </div>
    );
  }

  return (
    <div className="w-full h-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={activeData} margin={{ top: 10, right: 30, left: -20, bottom: 20 }}>
          <defs>
            <linearGradient id="colorPortfolio" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#ceff04" stopOpacity={0.2} />
              <stop offset="95%" stopColor="#ceff04" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f1f1" />
          <XAxis 
            dataKey="label" 
            axisLine={false} 
            tickLine={false} 
            tick={{ fontSize: 9, fill: '#9CA3AF', fontWeight: 800 }}
            interval={selectedYear === 'General' ? 5 : 0}
            dy={15}
          />
          <YAxis hide domain={['dataMin - 50', 'dataMax + 50']} />
          <Tooltip content={<CustomTooltip selectedYear={selectedYear} />} />
          <Legend 
            verticalAlign="top" 
            align="right" 
            iconType="circle"
            wrapperStyle={{ paddingBottom: '30px', fontSize: '9px', fontWeight: 800, textTransform: 'uppercase' }}
            formatter={(value) => <span className="text-accent ml-1">{value === 'portfolio' ? 'CCG' : 'SPY500'}</span>}
          />
          <Area 
            type="monotone" 
            dataKey="benchmark" 
            name="benchmark" 
            stroke="#1d1c2d" 
            strokeWidth={1.5} 
            strokeDasharray="5 5" 
            fill="transparent" 
            animationDuration={1500}
          />
          <Area 
            type="monotone" 
            dataKey="portfolio" 
            name="portfolio" 
            stroke="#ceff04" 
            strokeWidth={4} 
            fill="url(#colorPortfolio)" 
            animationDuration={1000} 
            style={{ filter: 'drop-shadow(0px 0px 8px rgba(206, 255, 4, 0.3))' }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

export default PerformanceChart;
