
import React, { useMemo, useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  TrendingUp, 
  PieChart as PieIcon, 
  DollarSign, 
  Target,
  Calendar,
  Layers,
  Award,
  ArrowUpRight,
  Clock,
  CheckCircle2
} from 'lucide-react';
import { FINANCE_CONFIG, calculateUserFinance, FINANCIAL_HISTORY, getStoredYield, getPayoutStatus } from '../../constants';
import FinancialControl from '../Admin/FinancialControl';

interface ShareholderProfileProps {
  user: any;
  onBack: () => void;
}

const ShareholderProfile: React.FC<ShareholderProfileProps> = ({ user, onBack }) => {
  // Filtro exclusivo para Juan Andres Suarez (#USR-008)
  const isJuanAndres = user.uid === '#USR-008';
  
  // Mes de ingreso: 8 para Juan Andres (Septiembre)
  const joinMonth = isJuanAndres ? 8 : 0;
  
  const [selectedYear, setSelectedYear] = useState(2025);
  const [updateKey, setUpdateKey] = useState(0);
  
  // Calculamos finanzas inyectando los datos específicos autorizados para el usuario #USR-008
  const finances = useMemo(() => {
    const baseFinances = calculateUserFinance(user.shares, selectedYear, joinMonth);
    
    // Aplicación de parámetros autorizados para Juan Andres Suarez en 2025
    if (isJuanAndres && selectedYear === 2025) {
      return {
        ...baseFinances,
        participation: '4.00%',
        balance: 4977.00, // Capital base fijo autorizado
        annualYieldPct: 9.13, // ROI 2025 (%) = (454.40 / 4,977.00) * 100
        annualProfit: 454.40, // Suma: 114.47 + 108.50 + 119.45 + 111.98
      };
    }
    return baseFinances;
  }, [user.shares, selectedYear, updateKey, joinMonth, isJuanAndres]);
  
  const isAdmin = user.uid === '#ADM-001';

  useEffect(() => {
    const handleUpdate = () => setUpdateKey(prev => prev + 1);
    window.addEventListener('finance_update', handleUpdate);
    return () => window.removeEventListener('finance_update', handleUpdate);
  }, []);

  const monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

  // Datos específicos autorizados para el último cuatrimestre 2025 (#USR-008)
  const realDataJuanAndres = [
    { pct: 2.30, usd: 114.47 }, // Septiembre (idx 8)
    { pct: 2.18, usd: 108.50 }, // Octubre (idx 9)
    { pct: 2.40, usd: 119.45 }, // Noviembre (idx 10)
    { pct: 2.25, usd: 111.98 }  // Diciembre (idx 11)
  ];

  const availableYears = isJuanAndres ? [2025, 2026] : [2023, 2024, 2025, 2026];

  return (
    <div className="bg-[#fcfcfc] min-h-full animate-in fade-in slide-in-from-right-4 duration-500 pb-20 overflow-y-auto">
      <main className="flex-1 flex flex-col p-4 md:p-8 lg:p-10 max-w-[1600px] mx-auto w-full gap-8">
        
        <button onClick={onBack} className="flex items-center gap-2 text-text-muted hover:text-accent font-black text-[10px] uppercase tracking-widest transition-all w-fit group">
          <div className="p-2 bg-white rounded-xl border border-surface-border group-hover:border-primary transition-all">
            <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
          </div>
          <span>Volver a la Gestión de Accionistas</span>
        </button>

        <header className="bg-white rounded-[32px] shadow-premium border border-surface-border p-8 lg:p-10 relative overflow-hidden group">
          <div className="flex flex-col md:flex-row gap-8 md:items-center justify-between relative z-10">
            <div className="flex items-center gap-6">
              <div className={`size-20 lg:size-24 rounded-[28px] ${user.color} flex items-center justify-center font-black text-2xl shadow-lg`}>{user.initials}</div>
              <div>
                <h1 className="text-3xl lg:text-4xl font-black text-accent tracking-tighter">{user.name}</h1>
                <div className="flex flex-wrap gap-y-2 gap-x-4 text-[11px] font-bold text-text-secondary mt-2">
                  <span className="flex items-center gap-1.5 bg-surface-subtle px-3 py-1.5 rounded-xl border border-surface-border"><Layers size={14} className="text-accent" /> {user.uid}</span>
                  <span className="flex items-center gap-1.5 bg-surface-subtle px-3 py-1.5 rounded-xl border border-surface-border"><Calendar size={14} className="text-accent" /> {isAdmin ? 'Administrador Maestro' : 'Socio CCG'}</span>
                </div>
              </div>
            </div>
            <div className="flex flex-col items-start md:items-end border-l-4 border-primary/30 md:border-l-0 md:border-r-4 md:pr-8 border-gray-100">
              <span className="text-[10px] font-black text-text-muted uppercase tracking-widest">Inversión Total Activa</span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-3xl lg:text-5xl font-black text-accent tracking-tighter">${finances.balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                <span className="text-xs font-black text-text-muted">USD</span>
              </div>
            </div>
          </div>
        </header>

        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { label: 'Acciones Poseídas', value: user.shares.toString(), sub: 'Fondo CCG', icon: Target },
            { label: 'Participación', value: finances.participation, sub: 'Fondo Global', icon: PieIcon },
            { label: `Rendimiento ${selectedYear}`, value: `+${finances.annualYieldPct.toFixed(2)}%`, sub: 'ROI del Accionista', icon: TrendingUp },
            { label: 'Utilidad Generada', value: `+$${finances.annualProfit.toLocaleString('en-US', { minimumFractionDigits: 2 })}`, sub: 'Cierre de Periodo', icon: Award },
          ].map((stat, i) => (
            <div key={i} className="bg-white rounded-[32px] shadow-sm border border-surface-border p-7 flex flex-col justify-between hover:shadow-premium transition-all min-h-[160px]">
              <div className="flex justify-between items-start mb-4">
                <div className={`p-3 rounded-2xl bg-surface-subtle`}><stat.icon size={20} className="text-accent" /></div>
              </div>
              <div>
                <h3 className="text-[10px] font-black text-text-muted uppercase tracking-widest mb-1">{stat.label}</h3>
                <div className="flex items-baseline gap-1.5"><span className="text-3xl font-black text-accent tracking-tighter">{stat.value}</span></div>
                <p className="text-[10px] font-bold text-text-secondary mt-1 uppercase tracking-tight">{stat.sub}</p>
              </div>
            </div>
          ))}
        </section>

        <div className="bg-white rounded-[40px] shadow-premium border border-surface-border overflow-hidden">
          <div className="p-8 lg:p-10 border-b border-surface-border flex justify-between items-center bg-surface-subtle/30">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-white rounded-2xl border border-surface-border shadow-sm"><Calendar size={20} className="text-accent" /></div>
              <h2 className="text-xl font-black text-accent tracking-tight">Desglose de Dividendos</h2>
            </div>
            <select value={selectedYear} onChange={(e) => setSelectedYear(parseInt(e.target.value))} className="bg-white border border-surface-border rounded-xl px-6 py-2 text-xs font-black uppercase shadow-sm">
              {availableYears.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[600px]">
              <thead>
                <tr className="text-[10px] font-black text-text-muted uppercase tracking-widest border-b border-surface-border">
                  <th className="px-8 py-5">Mes Operativo</th>
                  <th className="px-8 py-5 text-right">Rentabilidad %</th>
                  <th className="px-8 py-5 text-right">Utilidad (USD)</th>
                  <th className="px-8 py-5 text-center">Estatus</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {monthNames.map((month, idx) => {
                  // Filtro para usuarios con ingreso posterior
                  if (selectedYear === 2025 && idx < joinMonth) {
                    return null;
                  }

                  let displayYield: number;
                  let displayProfit: number;
                  const status = getPayoutStatus(selectedYear, idx);

                  // Lógica específica para Juan Andres Suarez en 2025
                  if (isJuanAndres && selectedYear === 2025 && idx >= 8 && idx <= 11) {
                    const realValues = realDataJuanAndres[idx - 8];
                    displayYield = realValues.pct / 100;
                    displayProfit = realValues.usd;
                  } else {
                    displayYield = getStoredYield(selectedYear, idx);
                    displayProfit = finances.balance * displayYield;
                  }

                  const formattedProfit = displayProfit.toLocaleString('en-US', { minimumFractionDigits: 2 });

                  return (
                    <tr key={`${selectedYear}-${idx}-${updateKey}`} className="hover:bg-surface-subtle/50 transition-colors">
                      <td className="px-8 py-6 flex items-center gap-4">
                        <span className="text-sm font-black text-accent">{month}</span>
                      </td>
                      <td className="px-8 py-6 text-right font-black text-accent">
                        {displayYield !== 0 ? `+${(displayYield * 100).toFixed(2)}%` : '0.00%'}
                      </td>
                      <td className="px-8 py-6 text-right font-bold text-text-secondary">${formattedProfit}</td>
                      <td className="px-8 py-6 text-center">
                        <span className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border shadow-sm ${
                          status === 'PAID' ? 'bg-green-50 text-green-700 border-green-100' : 'bg-orange-50 text-orange-700 border-orange-100'
                        }`}>
                          {status === 'PAID' ? <CheckCircle2 size={12}/> : <Clock size={12}/>}
                          {status === 'PAID' ? 'PAGADO' : 'PENDIENTE'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {isAdmin && <FinancialControl />}
      </main>
    </div>
  );
};

export default ShareholderProfile;
