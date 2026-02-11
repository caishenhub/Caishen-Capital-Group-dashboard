
import React, { useState, useEffect, useMemo } from 'react';
import { 
  TrendingUp, 
  ShieldCheck, 
  Settings2,
  Users,
  Flag,
  LineChart,
  Bell,
  Globe,
  Coins,
  Activity,
  Wallet,
  Target,
  Info,
  X,
  Check,
  Zap,
  Bitcoin,
  FileText,
  RefreshCw,
  ImageIcon,
  CheckCircle2
} from 'lucide-react';
import EvolutionChart from './EvolutionChart';
import AssetDistributionDonut from './AssetDistributionDonut';
import NoticeModal from './NoticeModal';
import { CorporateNotice } from '../../types';
import DetailedOperationalReport from '../Portfolio/DetailedOperationalReport';
import { fetchCorporateNotices, fetchStrategicReport, fetchExecutiveKpis, fetchLiquidityProtocol, fetchTableData, findValue, StrategicReportSection, ExecutiveKpi, LiquidityItem, parseSheetNumber } from '../../lib/googleSheets';

interface KpiDetail {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
}

const ExecutiveSummary: React.FC = () => {
  const [activeDetail, setActiveDetail] = useState<KpiDetail | null>(null);
  const [showDetailedReport, setShowDetailedReport] = useState(false);
  const [strategicPreview, setStrategicPreview] = useState<StrategicReportSection | null>(null);
  const [liveKpis, setLiveKpis] = useState<Record<string, ExecutiveKpi>>({});
  const [liveLiquidity, setLiveLiquidity] = useState<LiquidityItem[]>([]);
  const [liveNotices, setLiveNotices] = useState<CorporateNotice[]>([]);
  const [readNoticeIds, setReadNoticeIds] = useState<string[]>(() => {
    const saved = localStorage.getItem('ccg_read_notices');
    return saved ? JSON.parse(saved) : [];
  });
  const [masterAum, setMasterAum] = useState<string>('---');
  const [selectedNotice, setSelectedNotice] = useState<CorporateNotice | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isNoticesLoading, setIsNoticesLoading] = useState(false);

  const formatCurrency = (val: string | number | undefined) => {
    if (val === undefined || val === null || val === '') return '---';
    const num = typeof val === 'string' ? parseFloat(val.replace(/[$,\s]/g, '')) : val;
    if (isNaN(num)) return val.toString();
    
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(num);
  };

  const loadData = async (ignoreCache = false) => {
    if (!ignoreCache) setIsLoading(true);
    else setIsNoticesLoading(true);
    
    try {
      const [reportData, kpiData, noticesData, liquidityData, configData] = await Promise.all([
        fetchStrategicReport(ignoreCache),
        fetchExecutiveKpis(ignoreCache),
        fetchCorporateNotices(ignoreCache),
        fetchLiquidityProtocol(ignoreCache),
        fetchTableData('CONFIG_MAESTRA', ignoreCache)
      ]);
      
      const previewBlock = reportData.find(s => s.tipo === 'PREVIEW') || reportData[0];
      setStrategicPreview(previewBlock);
      setLiveKpis(kpiData);
      setLiveNotices(noticesData);
      setLiveLiquidity(liquidityData);

      const aumRaw = findValue(configData[0], ['AUM_TOTAL_FONDO', 'total_aum', 'aum']);
      setMasterAum(formatCurrency(aumRaw));

    } catch (e) {
      console.error("Error loading summary data:", e);
    } finally {
      setIsLoading(false);
      setIsNoticesLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const formatKpiValue = (kpi: ExecutiveKpi | undefined) => {
    if (!kpi) return '---';
    if (kpi.tipo === 'moneda') return formatCurrency(kpi.valor);
    if (kpi.tipo === 'porcentaje') return `${kpi.valor.replace('.', ',')}%`;
    return kpi.valor || '---';
  };

  // Filtrar solo avisos NO LEÍDOS para que vayan "desapareciendo"
  const pendingNotices = useMemo(() => {
    return liveNotices.filter(n => !readNoticeIds.includes(n.id));
  }, [liveNotices, readNoticeIds]);

  const handleNoticeClick = (notice: CorporateNotice) => {
    setSelectedNotice(notice);
    // Marcar como leído
    if (!readNoticeIds.includes(notice.id)) {
      const updated = [...readNoticeIds, notice.id];
      setReadNoticeIds(updated);
      localStorage.setItem('ccg_read_notices', JSON.stringify(updated));
    }
  };

  const resetReadNotices = () => {
    setReadNoticeIds([]);
    localStorage.removeItem('ccg_read_notices');
  };

  const KPI_DETAILS: Record<string, KpiDetail> = {
    balance: { id: 'balance', title: liveKpis.balance?.titulo || 'AUM', description: 'Capital total gestionado.', icon: <Wallet size={24} /> },
    utilidad: { id: 'utilidad', title: liveKpis.utilidad?.titulo || 'Reserva', description: 'Fondo de cobertura.', icon: <ShieldCheck size={24} /> },
    ajuste: { id: 'ajuste', title: liveKpis.ajuste?.titulo || 'Ajuste', description: 'Control de desviaciones.', icon: <Activity size={24} /> },
    estabilidad: { id: 'estabilidad', title: liveKpis.estabilidad?.titulo || 'Estabilidad', description: 'Consistencia operativa.', icon: <Target size={24} /> }
  };

  if (isLoading && Object.keys(liveKpis).length === 0) {
    return (
      <div className="p-8 flex flex-col items-center justify-center py-40 gap-4">
        <RefreshCw size={40} className="animate-spin text-primary" />
        <p className="text-[10px] font-black uppercase tracking-widest text-text-muted">Sincronizando Resumen Maestro...</p>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 pb-24 space-y-10 animate-in fade-in duration-700 max-w-[1600px] mx-auto">
      {/* Cabecera */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
        <div className="space-y-1">
          <p className="text-text-muted text-[10px] font-bold uppercase tracking-widest leading-none mb-1">Caishen Capital Group • Panel de Gestión</p>
          <h1 className="text-accent text-3xl md:text-5xl font-black tracking-tighter uppercase leading-[0.9]">Análisis Consolidado</h1>
        </div>
        <button onClick={() => loadData(true)} className="flex items-center gap-4 px-8 py-3.5 bg-white border border-surface-border rounded-full shadow-sm hover:shadow-premium transition-all active:scale-95">
          <div className="size-2.5 bg-primary rounded-full animate-pulse shadow-neon"></div>
          <span className="text-[11px] font-black uppercase tracking-widest">Sincronizar Nube</span>
        </button>
      </div>

      {/* Grid de KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {Object.entries(KPI_DETAILS).map(([key, detail]) => (
          <div key={key} onClick={() => setActiveDetail(detail)} className="bg-white p-8 rounded-[40px] border border-surface-border shadow-sm flex flex-col h-[220px] transition-all hover:shadow-premium hover:-translate-y-1 cursor-pointer group">
            <div className="flex justify-between items-start mb-6">
              <span className="text-[10px] font-black text-text-muted uppercase tracking-widest">{detail.title}</span>
              <div className="p-2.5 bg-primary rounded-xl text-accent">{detail.icon}</div>
            </div>
            <h3 className="text-4xl font-black text-accent tracking-tighter mb-auto">{formatKpiValue(liveKpis[key])}</h3>
            <div className="mt-4 flex items-center justify-between">
               <span className="text-[9px] font-black bg-accent text-primary px-3 py-1.5 rounded-lg uppercase tracking-widest">
                 {liveKpis[key]?.subtexto || 'Verificado'}
               </span>
               <Info size={14} className="text-text-muted opacity-0 group-hover:opacity-100" />
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Avisos Corporativos con Lógica de Desvanecimiento */}
        <div id="seccion-avisos" className="bg-white rounded-[50px] p-8 md:p-12 border border-surface-border shadow-premium flex flex-col min-h-[600px] relative overflow-hidden">
          <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 mb-10 shrink-0">
            <div className="flex items-center gap-4">
              <div className="relative">
                <Bell size={28} className={pendingNotices.length > 0 ? 'text-accent animate-bounce' : 'text-text-muted opacity-30'} />
                {pendingNotices.length > 0 && (
                  <span className="absolute -top-1 -right-1 size-3.5 bg-primary rounded-full border-2 border-white shadow-neon"></span>
                )}
              </div>
              <h3 className="text-accent text-xl font-black uppercase tracking-widest">Avisos Pendientes ({pendingNotices.length})</h3>
            </div>
            {readNoticeIds.length > 0 && (
              <button onClick={resetReadNotices} className="text-[9px] font-black text-text-muted uppercase tracking-widest hover:text-accent transition-colors underline underline-offset-4">Restaurar Leídos</button>
            )}
          </header>

          <div className="flex-1 overflow-y-auto space-y-6 hide-scrollbar">
            {pendingNotices.length > 0 ? (
              pendingNotices.map((notice) => (
                <div 
                  key={notice.id} 
                  onClick={() => handleNoticeClick(notice)}
                  className="bg-surface-subtle/30 rounded-[40px] p-6 md:p-8 border border-surface-border transition-all hover:bg-white hover:shadow-premium hover:-translate-y-1 cursor-pointer group animate-in slide-in-from-right duration-500"
                >
                  <div className="flex justify-between items-start gap-4 mb-4">
                    <h4 className="text-accent text-base font-black uppercase line-clamp-1">{notice.title}</h4>
                    <span className="text-[8px] font-black text-text-muted uppercase tracking-widest whitespace-nowrap">{notice.date}</span>
                  </div>
                  <p className="text-text-secondary text-xs font-bold leading-relaxed line-clamp-2">{notice.description}</p>
                  <div className="mt-4 flex items-center gap-2 text-accent text-[9px] font-black uppercase tracking-widest group-hover:text-primary transition-colors">
                    <CheckCircle2 size={12} /> Marcar como leído
                  </div>
                </div>
              ))
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center space-y-4 opacity-40">
                <div className="size-20 bg-surface-subtle rounded-full flex items-center justify-center">
                  <CheckCircle2 size={40} className="text-green-500" />
                </div>
                <p className="text-[10px] font-black text-accent uppercase tracking-[0.3em]">Bandeja de avisos al día</p>
              </div>
            )}
          </div>
        </div>

        {/* Protocolo de Liquidez */}
        <div className="bg-accent rounded-[50px] p-8 md:p-12 shadow-2xl flex flex-col min-h-[600px] text-white overflow-hidden relative group">
          <header className="flex justify-between items-center mb-6 relative z-10">
            <h3 className="text-primary text-sm font-black uppercase tracking-[0.2em]">Protocolo de Liquidez</h3>
            <Zap size={24} className="text-primary animate-pulse shadow-neon" />
          </header>
          <div className="flex-1 flex flex-col justify-center items-center relative z-10 gap-10">
            <div className="w-full max-w-[320px]">
              <AssetDistributionDonut data={liveLiquidity} centerValue={masterAum} />
            </div>
            <div className="grid grid-cols-2 gap-10 w-full px-4 text-center">
              {liveLiquidity.slice(0, 2).map((item, idx) => (
                <div key={idx} className="space-y-2">
                  <span className="text-white/40 text-[9px] font-black uppercase tracking-widest">{item.name}</span>
                  <p className="text-4xl font-black tracking-tighter">{item.value}%</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Matriz Estratégica Previa */}
      <div className="bg-white rounded-[40px] border border-surface-border p-8 lg:p-12 shadow-premium">
        <div className="space-y-8">
          <div className="border-b border-gray-100 pb-6 flex flex-col md:flex-row justify-between items-end gap-4">
             <div className="space-y-1">
               <p className="text-text-muted text-[10px] font-black uppercase tracking-widest">Caishen Intelligence</p>
               <h3 className="text-accent text-3xl font-black uppercase tracking-tighter">{strategicPreview?.seccion_titulo || 'Informe de Gestión'}</h3>
             </div>
             <button onClick={() => setShowDetailedReport(true)} className="bg-accent text-white px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-black shadow-xl transition-all flex items-center gap-3">
               Ver Análisis Completo <FileText size={16} className="text-primary" />
             </button>
          </div>
          <p className="text-text-secondary text-lg leading-relaxed font-medium text-justify line-clamp-4">
            {strategicPreview?.contenido}
          </p>
        </div>
      </div>

      {/* Modales */}
      {selectedNotice && <NoticeModal notice={selectedNotice} onClose={() => setSelectedNotice(null)} />}
      
      {showDetailedReport && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-2 md:p-6">
          <div className="absolute inset-0 bg-accent/90 backdrop-blur-xl animate-in fade-in" onClick={() => setShowDetailedReport(false)} />
          
          {/* CONTENEDOR REDIMENSIONADO PARA MÓVIL */}
          <div className="relative w-full max-w-5xl h-[88vh] md:h-[92vh] bg-white rounded-[32px] md:rounded-[48px] shadow-2xl overflow-hidden animate-in zoom-in-95 flex flex-col border border-white/20">
            
            {/* Header Fijo */}
            <header className="px-6 py-5 md:px-12 md:py-10 border-b border-surface-border flex justify-between items-center bg-white shrink-0">
              <div className="flex items-center gap-4 md:gap-6">
                <div className="p-3 md:p-4 bg-accent rounded-2xl text-primary shadow-xl"><ShieldCheck size={24} md:size={32} /></div>
                <div>
                  <h2 className="text-xl md:text-3xl font-black text-accent tracking-tighter uppercase leading-none">Análisis Estratégico</h2>
                  <p className="text-[8px] md:text-[10px] font-black text-text-muted uppercase tracking-widest mt-1">Intelligence Verification v4.2</p>
                </div>
              </div>
              <button onClick={() => setShowDetailedReport(false)} className="p-2 hover:bg-surface-subtle rounded-full transition-colors text-text-muted">
                <X size={24} />
              </button>
            </header>

            {/* Cuerpo con Scroll Independiente */}
            <div className="flex-1 overflow-y-auto p-6 md:p-16 scroll-smooth hide-scrollbar bg-white">
              <DetailedOperationalReport />
            </div>

            {/* Footer Fijo con Botón de Salida Siempre Visible */}
            <footer className="px-6 py-5 md:px-12 md:py-8 border-t border-surface-border bg-gray-50/50 flex justify-center md:justify-end shrink-0">
              <button 
                onClick={() => setShowDetailedReport(false)}
                className="w-full md:w-auto bg-accent text-primary font-black px-12 py-5 rounded-[22px] hover:bg-black transition-all uppercase text-[11px] tracking-[0.2em] shadow-2xl active:scale-95 flex items-center justify-center gap-3"
              >
                <CheckCircle2 size={18} />
                Finalizar Consulta
              </button>
            </footer>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExecutiveSummary;
