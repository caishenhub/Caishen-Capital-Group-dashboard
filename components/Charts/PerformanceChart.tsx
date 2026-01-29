
import React, { useState, useEffect, useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { FINANCIAL_HISTORY, getStoredYield } from '../../constants';

// DATASETS CRONOLÓGICOS (Valores normalizados para continuidad)
const data2022 = [
  { name: 'ENE', year: '2022', portfolio: 1000000, benchmark: 1000000, pYield: -4.80, bYield: -5.2 },
  { name: 'FEB', year: '2022', portfolio: 964000, benchmark: 948000, pYield: -3.60, bYield: -3.1 },
  { name: 'MAR', year: '2022', portfolio: 987136, benchmark: 982000, pYield: 2.40, bYield: 3.6 },
  { name: 'ABR', year: '2022', portfolio: 892371, benchmark: 896000, pYield: -9.60, bYield: -8.8 },
  { name: 'MAY', year: '2022', portfolio: 881662, benchmark: 897000, pYield: -1.20, bYield: 0.1 },
  { name: 'JUN', year: '2022', portfolio: 812011, benchmark: 822000, pYield: -7.90, bYield: -8.3 },
  { name: 'JUL', year: '2022', portfolio: 863980, benchmark: 896000, pYield: 6.40, bYield: 9.1 },
  { name: 'AGO', year: '2022', portfolio: 830284, benchmark: 858000, pYield: -3.90, bYield: -4.2 },
  { name: 'SEP', year: '2022', portfolio: 762201, benchmark: 778000, pYield: -8.20, bYield: -9.3 },
  { name: 'OCT', year: '2022', portfolio: 804884, benchmark: 840000, pYield: 5.60, bYield: 8.0 },
  { name: 'NOV', year: '2022', portfolio: 830640, benchmark: 885000, pYield: 3.20, bYield: 5.4 },
  { name: 'DIC', year: '2022', portfolio: 780000, benchmark: 832000, pYield: -6.10, bYield: -5.9 },
];

const data2023 = [
  { name: 'ENE', year: '2023', portfolio: 806520, benchmark: 883500, pYield: 3.40, bYield: 6.2 },
  { name: 'FEB', year: '2023', portfolio: 829505, benchmark: 860500, pYield: 2.85, bYield: -2.6 },
  { name: 'MAR', year: '2023', portfolio: 812086, benchmark: 890500, pYield: -2.10, bYield: 3.5 },
  { name: 'ABR', year: '2023', portfolio: 846599, benchmark: 903800, pYield: 4.25, bYield: 1.5 },
  { name: 'MAY', year: '2023', portfolio: 879617, benchmark: 906000, pYield: 3.90, bYield: 0.2 },
  { name: 'JUN', year: '2023', portfolio: 903806, benchmark: 964800, pYield: 2.75, bYield: 6.5 },
  { name: 'JUL', year: '2023', portfolio: 888894, benchmark: 994700, pYield: -1.65, bYield: 3.1 },
  { name: 'AGO', year: '2023', portfolio: 938672, benchmark: 977800, pYield: 5.60, bYield: -1.7 },
  { name: 'SEP', year: '2023', portfolio: 910981, benchmark: 930100, pYield: -2.95, bYield: -4.9 },
  { name: 'OCT', year: '2023', portfolio: 954708, benchmark: 909600, pYield: 4.80, bYield: -2.2 },
  { name: 'NOV', year: '2023', portfolio: 974757, benchmark: 991400, pYield: 2.10, bYield: 9.0 },
  { name: 'DIC', year: '2023', portfolio: 992790, benchmark: 1035000, pYield: 1.85, bYield: 4.4 },
];

const data2024 = [
  { name: 'ENE', year: '2024', portfolio: 1023566, benchmark: 1052000, pYield: 3.10, bYield: 1.6 },
  { name: 'FEB', year: '2024', portfolio: 1048644, benchmark: 1107000, pYield: 2.45, bYield: 5.2 },
  { name: 'MAR', year: '2024', portfolio: 1029768, benchmark: 1141000, pYield: -1.80, bYield: 3.1 },
  { name: 'ABR', year: '2024', portfolio: 1077137, benchmark: 1093000, pYield: 4.60, bYield: -4.2 },
  { name: 'MAY', year: '2024', portfolio: 1133148, benchmark: 1146000, pYield: 5.20, bYield: 4.8 },
  { name: 'JUN', year: '2024', portfolio: 1176774, benchmark: 1186000, pYield: 3.85, bYield: 3.5 },
  { name: 'JUL', year: '2024', portfolio: 1149708, benchmark: 1198000, pYield: -2.30, bYield: 1.1 },
  { name: 'AGO', year: '2024', portfolio: 1223290, benchmark: 1225000, pYield: 6.40, bYield: 2.3 },
  { name: 'SEP', year: '2024', portfolio: 1258765, benchmark: 1251000, pYield: 2.90, bYield: 2.1 },
  { name: 'OCT', year: '2024', portfolio: 1311004, benchmark: 1238000, pYield: 4.15, bYield: -1.0 },
  { name: 'NOV', year: '2024', portfolio: 1333946, benchmark: 1308000, pYield: 1.75, bYield: 5.7 },
  { name: 'DIC', year: '2024', portfolio: 1359958, benchmark: 1334000, pYield: 1.95, bYield: 2.0 },
];

const data2025 = [
  { name: 'ENE', year: '2025', portfolio: 1407556, benchmark: 1360000, pYield: 3.50, bYield: 1.9 },
  { name: 'FEB', year: '2025', portfolio: 1437115, benchmark: 1345000, pYield: 2.10, bYield: -1.1 },
  { name: 'MAR', year: '2025', portfolio: 1491725, benchmark: 1380000, pYield: 3.80, bYield: 2.6 },
  { name: 'ABR', year: '2025', portfolio: 1528271, benchmark: 1395000, pYield: 2.45, bYield: 1.1 },
  { name: 'MAY', year: '2025', portfolio: 1576412, benchmark: 1420000, pYield: 3.15, bYield: 1.8 },
  { name: 'JUN', year: '2025', portfolio: 1622128, benchmark: 1450000, pYield: 2.90, bYield: 2.1 },
  { name: 'JUL', year: '2025', portfolio: 1666736, benchmark: 1475000, pYield: 2.75, bYield: 1.7 },
  { name: 'AGO', year: '2025', portfolio: 1720072, benchmark: 1495000, pYield: 3.20, bYield: 1.4 },
  { name: 'SEP', year: '2025', portfolio: 1769094, benchmark: 1520000, pYield: 2.85, bYield: 1.7 },
  { name: 'OCT', year: '2025', portfolio: 1823936, benchmark: 1515000, pYield: 3.10, bYield: -0.3 },
  { name: 'NOV', year: '2025', portfolio: 1877742, benchmark: 1550000, pYield: 2.95, bYield: 2.3 },
  { name: 'DIC', year: '2025', portfolio: 1900618, benchmark: 1580000, pYield: 2.68, bYield: 1.9 },
];

const data2026 = [
  { name: 'ENE', year: '2026', portfolio: 1900618, benchmark: 1580000, pYield: 0, bYield: 0 },
];

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const item = payload[0].payload;
    
    // Obtenemos el mes de forma numérica para consultar el rendimiento real
    const monthNames = ['ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN', 'JUL', 'AGO', 'SEP', 'OCT', 'NOV', 'DIC'];
    const monthIdx = monthNames.indexOf(item.name);
    const yearNum = parseInt(item.year);
    
    // Obtenemos el rendimiento real almacenado o el histórico para que siempre sea preciso
    const realYield = getStoredYield(yearNum, monthIdx) * 100;
    
    const colorCaishen = realYield >= 0 ? 'text-primary' : 'text-red-400';
    const colorSP500 = item.bYield >= 0 ? 'text-white' : 'text-red-400';
    
    return (
      <div className="bg-[#1d1c2d] border-none rounded-2xl p-4 shadow-2xl ring-1 ring-white/10 scale-90 md:scale-100 origin-top-left">
        <p className="text-[10px] font-black text-text-muted uppercase tracking-widest mb-3 border-b border-white/5 pb-2">
          {item.name} {item.year}
        </p>
        <div className="space-y-1.5 min-w-[150px]">
          <div className="flex justify-between items-center gap-6">
            <span className="text-[11px] font-bold text-white/70 uppercase">CCG</span>
            <span className={`text-xs font-black ${colorCaishen}`}>
              {realYield > 0 ? '+' : ''}{realYield.toFixed(2)}%
            </span>
          </div>
          <div className="flex justify-between items-center gap-6">
            <span className="text-[11px] font-bold text-white/70 uppercase">SPY500</span>
            <span className={`text-xs font-black ${colorSP500}`}>
              {item.bYield > 0 ? '+' : ''}{item.bYield}%
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

  useEffect(() => {
    setSelectedYear(initialYear);
  }, [initialYear]);

  const activeData = useMemo(() => {
    if (selectedYear === 'General') {
      const allData = [...data2022, ...data2023, ...data2024, ...data2025, ...data2026];
      return allData.map((d, i) => ({
        ...d,
        id: `${d.year}-${d.name}`,
        label: (i === 0 || allData[i-1].year !== d.year) ? d.year : ''
      }));
    }

    const sourceData = (() => {
      switch (selectedYear) {
        case 2022: return data2022;
        case 2023: return data2023;
        case 2024: return data2024;
        case 2025: return data2025;
        case 2026: return data2026;
        default: return data2025;
      }
    })();
    
    return sourceData.map(d => ({ ...d, label: d.name, id: `${d.year}-${d.name}` }));
  }, [selectedYear]);

  return (
    <div className="w-full h-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={activeData} margin={{ top: 10, right: 30, left: -10, bottom: 20 }}>
          <defs>
            <linearGradient id="colorPortfolio" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#ceff04" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#ceff04" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f1f1" />
          <XAxis 
            dataKey="label" 
            axisLine={false} 
            tickLine={false} 
            tick={{ fontSize: 9, fill: '#9CA3AF', fontWeight: 800 }}
            interval={0}
            dy={15}
          />
          <YAxis hide domain={['dataMin - 50000', 'dataMax + 50000']} />
          <Tooltip content={<CustomTooltip />} />
          <Legend 
            verticalAlign="top" 
            align="right" 
            iconType="circle"
            wrapperStyle={{ paddingBottom: '30px', fontSize: '9px', fontWeight: 800, textTransform: 'uppercase' }}
            formatter={(value) => <span className="text-text-main ml-1">{value === 'portfolio' ? 'CCG' : 'SPY500'}</span>}
          />
          <Area type="monotone" dataKey="benchmark" name="benchmark" stroke="#1d1c2d" strokeWidth={1} strokeDasharray="4 4" fill="transparent" />
          <Area type="monotone" dataKey="portfolio" name="portfolio" stroke="#ceff04" strokeWidth={3} fill="url(#colorPortfolio)" animationDuration={1000} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

export default PerformanceChart;
