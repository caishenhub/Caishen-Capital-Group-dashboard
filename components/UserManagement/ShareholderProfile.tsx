
import React, { useMemo, useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  TrendingUp, 
  TrendingDown,
  PieChart as PieIcon, 
  DollarSign, 
  Target,
  Calendar,
  Layers,
  Award,
  ArrowUpRight,
  Clock,
  CheckCircle2,
  RefreshCw,
  FileSpreadsheet,
  AlertCircle
} from 'lucide-react';
import { fetchTableData } from '../../lib/googleSheets';

interface ShareholderProfileProps {
  user: any;
  onBack: () => void;
}

const ShareholderProfile: React.FC<ShareholderProfileProps> = ({ user, onBack }) => {
  const [selectedYear, setSelectedYear] = useState(2025);
  const [dividends, setDividends] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [config, setConfig] = useState<any>(null);

  const syncProfileData = async () => {
    setIsLoading(true);
    try {
      const [allDividends, masterConfig] = await Promise.all([
        fetchTableData('DIVIDENDOS_SOCIOS'),
        fetchTableData('CONFIG_MAESTRA')
      ]);
      
      const userDividends = allDividends.filter(d => {
        const rowUid = String(d.UID_SOCIO || d.uid || d.Uid || '').trim().toLowerCase();
        const targetUid = String(user.uid).trim().toLowerCase();
        return rowUid === targetUid;
      });
      
      setDividends(userDividends);
      setConfig(masterConfig[0]);
    } catch (e) {
      console.error("Error cargando perfil dinámico:", e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    syncProfileData();
  }, [user.uid]);

  const stats = useMemo(() => {
    const yearDividends = dividends.filter(d => parseInt(d.ANIO || d.anio || d.Anio) === selectedYear);
    
    const totalProfit = yearDividends.reduce((acc, d) => {
      const val = parseFloat(String(d.UTILIDAD_NETA_USD || d.utility || 0).replace(',', '.'));
      return acc + (isNaN(val) ? 0 : val);
    }, 0);

    const totalYield = yearDividends.reduce((acc, d) => {
      const val = parseFloat(String(d.RENTABILIDAD_MES_PCT || d.yield || 0).replace(',', '.'));
      return acc + (isNaN(val) ? 0 : val);
    }, 0);
    
    const nominalValue = parseFloat(String(config?.VALOR_NOMINAL_ACCION || 248.85).replace(',', '.'));
    const balance = user.shares * nominalValue;

    return {
      balance,
      totalProfit,
      totalYield,
      participation: ((user.shares / (parseInt(config?.TOTAL_ACCIONES_FONDO) || 500)) * 100).toFixed(2)
    };
  }, [dividends, selectedYear, config, user.shares]);

  const monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

  const formatYield = (val: number) => {
    const pct = (val * 100).toFixed(2);
    return val >= 0 ? `+${pct}%` : `${pct}%`;
  };

  return (
    <div className="bg-[#fcfcfc] min-h-full animate-in fade-in slide-in-from-right-4 duration-500 pb-20 overflow-y-auto">
      <main className="flex-1 flex flex-col p-4 md:p-8 lg:p-10 max-w-[1600px] mx-auto w-full gap-8">
        
        <div className="flex justify-between items-center">
          <button onClick={onBack} className="flex items-center gap-2 text-text-muted hover:text-accent font-black text-[10px] uppercase tracking-widest transition-all w-fit group">
            <div className="p-2 bg-white rounded-xl border border-surface-border group-hover:border-primary transition-all">
              <ArrowLeft size={16} />
            </div>
            <span>Volver al Padrón</span>
          </button>
          <button 
            onClick={syncProfileData} 
            disabled={isLoading}
            className="p-3 bg-white border border-surface-border rounded-xl text-accent hover:bg-surface-subtle transition-all active:rotate-180 disabled:opacity-50"
          >
            <RefreshCw size={18} className={isLoading ? 'animate-spin' : ''} />
          </button>
        </div>

        <header className="bg-white rounded-[32px] shadow-premium border border-surface-border p-8 lg:p-10 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-10 opacity-5 pointer-events-none">
            <Target size={150} className="text-accent" />
          </div>
          <div className="flex flex-col md:flex-row gap-8 md:items-center justify-between relative z-10">
            <div className="flex items-center gap-6">
              <div className={`size-20 lg:size-24 rounded-[28px] ${user.color || 'bg-accent text-primary'} flex items-center justify-center font-black text-2xl shadow-xl`}>
                {user.initials || 'S'}
              </div>
              <div>
                <h1 className="text-3xl lg:text-4xl font-black text-accent tracking-tighter uppercase leading-none">{user.name}</h1>
                <div className="flex items-center gap-2 mt-3">
                  <span className="px-3 py-1 bg-primary/10 text-accent text-[10px] font-black rounded-lg uppercase tracking-widest border border-primary/20">
                    {user.uid}
                  </span>
                  <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Socio Auditado</span>
                </div>
              </div>
            </div>
            <div className="text-left md:text-right bg-surface-subtle/50 p-6 rounded-[24px] border border-surface-border md:min-w-[320px]">
              <span className="text-[10px] font-black text-text-muted uppercase tracking-widest">Capital Nominal Asignado</span>
              <div className="flex items-baseline gap-2 mt-1 justify-start md:justify-end">
                <span className="text-3xl lg:text-5xl font-black text-accent tracking-tighter">
                  ${stats.balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </span>
                <span className="text-xs font-black text-text-muted">USD</span>
              </div>
            </div>
          </div>
        </header>

        {isLoading ? (
          <div className="py-24 flex flex-col items-center justify-center gap-6">
            <div className="relative">
              <div className="size-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
              <RefreshCw size={24} className="absolute inset-0 m-auto text-primary animate-pulse" />
            </div>
            <div className="text-center space-y-1">
              <p className="text-xs font-black text-accent uppercase tracking-[0.3em]">Sincronizando Libro de Liquidaciones</p>
              <p className="text-[10px] font-bold text-text-muted uppercase">Conectando con base de datos maestra...</p>
            </div>
          </div>
        ) : (
          <>
            <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { label: 'Acciones', value: user.shares.toString(), sub: 'Padrón Oficial', icon: Target, variant: 'neutral' },
                { label: 'Participación', value: stats.participation + '%', sub: 'Fondo Global', icon: PieIcon, variant: 'neutral' },
                { 
                  label: `Rendimiento ${selectedYear}`, 
                  value: formatYield(stats.totalYield), 
                  sub: 'Acumulado Anual', 
                  icon: stats.totalYield >= 0 ? TrendingUp : TrendingDown,
                  variant: stats.totalYield >= 0 ? 'positive' : 'negative'
                },
                { 
                  label: 'Utilidad Neta', 
                  value: `$${stats.totalProfit.toLocaleString('en-US', { minimumFractionDigits: 2 })}`, 
                  sub: 'Dispersado en Cuenta', 
                  icon: DollarSign,
                  variant: stats.totalProfit >= 0 ? 'positive' : 'negative'
                },
              ].map((stat, i) => (
                <div key={i} className={`bg-white rounded-[32px] shadow-sm border p-7 flex flex-col justify-between hover:shadow-premium transition-all group ${
                  stat.variant === 'negative' ? 'border-red-100 bg-red-50/10' : 'border-surface-border'
                }`}>
                  <div className={`p-3 w-fit rounded-2xl mb-4 transition-colors ${
                    stat.variant === 'negative' ? 'bg-red-50 text-red-600' : 
                    stat.variant === 'positive' ? 'bg-green-50 text-green-600' : 'bg-surface-subtle text-accent'
                  }`}>
                    <stat.icon size={20} />
                  </div>
                  <h3 className="text-[10px] font-black text-text-muted uppercase tracking-widest mb-1">{stat.label}</h3>
                  <div className={`text-3xl font-black tracking-tighter ${
                    stat.variant === 'negative' ? 'text-red-600' : 'text-accent'
                  }`}>{stat.value}</div>
                  <p className="text-[10px] font-bold text-text-secondary mt-1 uppercase tracking-tight">{stat.sub}</p>
                </div>
              ))}
            </section>

            <div className="bg-white rounded-[40px] shadow-premium border border-surface-border overflow-hidden">
              <div className="p-8 lg:p-10 border-b border-surface-border flex flex-col sm:flex-row justify-between items-center gap-6 bg-surface-subtle/30">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-accent rounded-xl text-primary shadow-lg"><FileSpreadsheet size={20}/></div>
                  <div>
                    <h2 className="text-xl font-black text-accent tracking-tight uppercase">Liquidaciones Registradas</h2>
                    <p className="text-[9px] font-bold text-text-muted uppercase tracking-widest mt-1">Auditoría Individual de Retornos</p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 bg-white p-1.5 rounded-2xl border border-surface-border shadow-sm overflow-x-auto hide-scrollbar max-w-full">
                  {[2022, 2023, 2024, 2025, 2026].map(year => (
                    <button
                      key={year}
                      onClick={() => setSelectedYear(year)}
                      className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all whitespace-nowrap ${selectedYear === year ? 'bg-accent text-white shadow-md scale-105' : 'text-text-muted hover:bg-gray-50'}`}
                    >
                      {year}
                    </button>
                  ))}
                </div>
              </div>
              
              <div className="overflow-x-auto min-h-[400px] relative">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-surface-subtle/20 text-[10px] font-black text-text-muted uppercase tracking-widest border-b border-surface-border">
                      <th className="px-8 py-5">Mes Operativo</th>
                      <th className="px-8 py-5 text-right">Rentabilidad</th>
                      <th className="px-8 py-5 text-right">Utilidad Neta (USD)</th>
                      <th className="px-8 py-5 text-center">Estatus</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {dividends
                      .filter(d => parseInt(d.ANIO || d.anio || d.Anio) === selectedYear)
                      .sort((a, b) => parseInt(a.MES || a.mes) - parseInt(b.MES || b.mes))
                      .map((d, idx) => {
                        const mYield = parseFloat(String(d.RENTABILIDAD_MES_PCT || d.yield || 0).replace(',', '.'));
                        const mProfit = parseFloat(String(d.UTILIDAD_NETA_USD || d.utility || 0).replace(',', '.'));
                        
                        return (
                          <tr key={idx} className="hover:bg-surface-subtle/50 transition-colors group">
                            <td className="px-8 py-6 font-black text-accent uppercase text-sm">
                              {monthNames[parseInt(d.MES || d.mes) - 1]}
                            </td>
                            <td className={`px-8 py-6 text-right font-black ${mYield >= 0 ? 'text-accent' : 'text-red-600'}`}>
                              {formatYield(mYield)}
                            </td>
                            <td className={`px-8 py-6 text-right font-black ${mProfit >= 0 ? 'text-accent' : 'text-red-600'}`}>
                              ${mProfit.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                            </td>
                            <td className="px-8 py-6 text-center">
                              <span className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest border shadow-sm ${
                                (d.ESTATUS_PAGO || d.status) === 'PAGADO' ? 'bg-green-50 text-green-700 border-green-100' : 'bg-orange-50 text-orange-700 border-orange-100'
                              }`}>
                                {(d.ESTATUS_PAGO || d.status) === 'PAGADO' ? <CheckCircle2 size={12} className="animate-in zoom-in"/> : <Clock size={12} className="animate-pulse"/>}
                                {d.ESTATUS_PAGO || d.status || 'PENDIENTE'}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
                {dividends.filter(d => parseInt(d.ANIO || d.anio || d.Anio) === selectedYear).length === 0 && (
                  <div className="py-24 text-center text-text-muted flex flex-col items-center animate-in fade-in duration-500">
                    <div className="p-8 bg-surface-subtle rounded-full mb-4 opacity-20">
                      <AlertCircle size={64} />
                    </div>
                    <p className="text-xs font-black uppercase tracking-[0.3em]">Sin liquidaciones para {selectedYear}</p>
                    <p className="text-[10px] font-bold mt-2 opacity-60">Consulte al Área Administrativa para reportes de periodos anteriores.</p>
                  </div>
                )}
              </div>
              <div className="p-8 bg-surface-subtle/20 border-t border-gray-50">
                <div className="flex items-start gap-4 text-text-muted">
                  <Award size={18} className="text-accent shrink-0 mt-0.5" />
                  <p className="text-[10px] font-bold leading-relaxed max-w-3xl uppercase tracking-tight">
                    Nota institucional: Los presentes registros de liquidación corresponden al cierre contable de cada período y han sido elaborados conforme a los lineamientos internos de control y reporte. La información reflejada ha sido revisada, validada y certificada por el Comité Técnico de Inversión, en el marco de los procesos de supervisión, auditoría y gestión de riesgo institucional vigentes.
                  </p>
                </div>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
};

export default ShareholderProfile;
