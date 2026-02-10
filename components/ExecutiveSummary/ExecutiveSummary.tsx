
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
  ImageIcon
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
  const [masterAum, setMasterAum] = useState<string>('---');
  const [selectedNotice, setSelectedNotice] = useState<CorporateNotice | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isNoticesLoading, setIsNoticesLoading] = useState(false);
  const [lastReadId, setLastReadId] = useState(localStorage.getItem('last_read_notice') || '');

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

  const formatPercentage = (val: string | number | undefined) => {
    if (val === undefined || val === null || val === '') return '---%';
    const cleanVal = typeof val === 'string' ? val.replace(/[%\s]/g, '') : val;
    const num = typeof cleanVal === 'string' ? parseFloat(cleanVal) : cleanVal;
    
    if (isNaN(num)) return val.toString();
    return `${num.toString().replace('.', ',')}%`;
  };

  const formatKpiValue = (kpi: ExecutiveKpi | undefined) => {
    if (!kpi) return '---';
    if (kpi.tipo === 'moneda') return formatCurrency(kpi.valor);
    if (kpi.tipo === 'porcentaje') return formatPercentage(kpi.valor);
    return kpi.valor || '---';
  };

  const hasNewNotices = liveNotices.length > 0 && liveNotices[0].id !== lastReadId;

  const handleNoticeClick = (notice: CorporateNotice) => {
    setSelectedNotice(notice);
    if (liveNotices.length > 0) {
      const latestId = liveNotices[0].id;
      localStorage.setItem('last_read_notice', latestId);
      setLastReadId(latestId);
    }
  };

  const KPI_DETAILS: Record<string, KpiDetail> = {
    balance: {
      id: 'balance',
      title: liveKpis.balance?.titulo || 'Balance Total (AUM)',
      description: 'Capital total consolidado bajo gestión.',
      icon: <Wallet size={24} className="text-accent" />
    },
    utilidad: {
      id: 'utilidad',
      title: liveKpis.utilidad?.titulo || 'Reserva Técnica',
      description: 'Cobertura del fondo de reserva institucional.',
      icon: <ShieldCheck size={24} className="text-accent" />
    },
    ajuste: {
      id: 'ajuste',
      title: liveKpis.ajuste?.titulo || 'Ajuste Operativo',
      description: 'Métrica de control de desviaciones operativas.',
      icon: <Activity size={18} className="text-accent" />
    },
    estabilidad: {
      id: 'estabilidad',
      title: liveKpis.estabilidad?.titulo || 'Estabilidad',
      description: 'Consistencia estructural del modelo.',
      icon: <Target size={24} className="text-accent" />
    }
  };

  const kpiCardClass = "bg-white p-8 rounded-[45px] border border-surface-border shadow-sm flex flex-col h-[240px] transition-all duration-300 group cursor-pointer relative overflow-hidden hover:shadow-premium hover:-translate-y-1";
  const labelClass = "text-[10px] font-black text-text-muted uppercase tracking-[0.15em] leading-tight";
  const valueClass = "text-[42px] font-black text-accent tracking-tighter leading-none";

  if (isLoading && Object.keys(liveKpis).length === 0) {
    return (
      <div className="p-8 flex flex-col items-center justify-center py-40 gap-4">
        <RefreshCw size={40} className="animate-spin text-primary" />
        <p className="text-[10px] font-black uppercase tracking-widest text-text-muted">Sincronizando Resumen Maestro...</p>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 pb-24 space-y-10 animate-in fade-in duration-700">
      {/* 1. Cabecera Alineada */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
        <div className="space-y-1 flex-1">
          <p className="text-text-muted text-[10px] font-bold uppercase tracking-widest leading-none mb-1">Caishen Capital Group • Panel Corporativo</p>
          <h1 className="text-accent text-3xl md:text-5xl font-black tracking-tighter uppercase leading-[0.9]">Resumen consolidado hoy</h1>
        </div>
        
        <div className="shrink-0 self-center md:self-auto">
          <button 
            onClick={() => loadData(true)}
            disabled={isLoading || isNoticesLoading}
            className="flex items-center gap-4 px-8 py-3.5 bg-white border border-surface-border rounded-full hover:shadow-premium transition-all active:scale-95 text-accent group cursor-pointer"
          >
            <div className="relative flex size-3">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75 ${isLoading ? 'duration-300' : 'duration-1000'}`}></span>
              <span className="relative inline-flex rounded-full size-3 bg-primary shadow-[0_0_12px_rgba(206,255,4,0.8)]"></span>
            </div>
            <span className="text-[11px] font-black uppercase tracking-[0.25em] leading-none">
              {isLoading ? 'Sincronizando...' : 'Nube Institucional'}
            </span>
          </button>
        </div>
      </div>

      {/* 2. Grid de KPIs con Fondo Verde e Iconos Negros */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div onClick={() => setActiveDetail(KPI_DETAILS.balance)} className={kpiCardClass}>
          <div className="flex justify-between items-start">
            <span className={labelClass}>{liveKpis.balance?.titulo || 'Balance Total (AUM)'}</span>
            <div className="p-2.5 bg-primary rounded-xl shadow-sm">
              <Wallet size={18} className="text-accent" />
            </div>
          </div>
          <div className="flex-1 flex items-center py-4">
            <h3 className={valueClass}>{formatKpiValue(liveKpis.balance)}</h3>
          </div>
          <div className="mt-auto pt-2 flex items-center justify-between h-10">
            <div className="bg-accent text-primary text-[10px] font-black px-4 py-2 rounded-xl w-fit flex items-center gap-2 shadow-lg uppercase tracking-widest">
              <Activity size={12} className="text-primary" />
              {liveKpis.balance?.subtexto || 'Actualizado al cierre'}
            </div>
            <Info size={14} className="text-text-muted opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        </div>

        <div onClick={() => setActiveDetail(KPI_DETAILS.utilidad)} className={kpiCardClass}>
          <div className="flex justify-between items-start">
            <span className={labelClass}>{liveKpis.utilidad?.titulo || 'Reserva Técnica'}</span>
            <div className="p-2.5 bg-primary rounded-xl shadow-sm">
              <ShieldCheck size={18} className="text-accent" />
            </div>
          </div>
          <div className="flex-1 flex items-center py-4">
            <h3 className={valueClass}>{formatKpiValue(liveKpis.utilidad)}</h3>
          </div>
          <div className="mt-auto pt-2 flex items-center justify-between h-10 w-full gap-4">
            <div className="h-3 flex-1 bg-surface-subtle rounded-full overflow-hidden p-0.5 border border-surface-border">
              <div 
                className="h-full bg-primary rounded-full transition-all duration-1000 shadow-[0_0_8px_rgba(206,255,4,0.5)]" 
                style={{ width: `${liveKpis.utilidad?.progreso || 0}%` }}
              ></div>
            </div>
            <Info size={14} className="text-text-muted opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        </div>

        <div onClick={() => setActiveDetail(KPI_DETAILS.ajuste)} className={kpiCardClass}>
          <div className="flex justify-between items-start">
            <span className={labelClass}>{liveKpis.ajuste?.titulo || 'Ajuste Operativo'}</span>
            <div className="p-2.5 bg-primary rounded-xl shadow-sm">
              <Activity size={18} className="text-accent" />
            </div>
          </div>
          <div className="flex-1 flex items-center py-4">
            <h3 className={valueClass}>{formatKpiValue(liveKpis.ajuste)}</h3>
          </div>
          <div className="mt-auto pt-2 flex items-center justify-between h-10 w-full">
            <div className="bg-accent text-primary text-[10px] font-black px-5 py-2 rounded-xl uppercase tracking-widest shadow-xl">
              {liveKpis.ajuste?.subtexto || 'Sin Ajustes Críticos'}
            </div>
            <Info size={14} className="text-text-muted opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        </div>

        <div onClick={() => setActiveDetail(KPI_DETAILS.estabilidad)} className={kpiCardClass}>
          <div className="flex justify-between items-start">
            <span className={labelClass}>{liveKpis.estabilidad?.titulo || 'Estabilidad del Portafolio'}</span>
            <div className="p-2.5 bg-primary rounded-xl shadow-sm">
              <Target size={18} className="text-accent" />
            </div>
          </div>
          <div className="flex-1 flex items-center py-4">
            <h3 className={valueClass}>{formatKpiValue(liveKpis.estabilidad)}</h3>
          </div>
          <div className="mt-auto pt-2 flex items-center justify-between h-10 w-full gap-4">
            <div className="h-1.5 bg-primary rounded-full shadow-[0_0_12px_rgba(206,255,4,0.4)] transition-all duration-1000" style={{ width: `${liveKpis.estabilidad?.progreso || 0}%` }}></div>
            <Info size={14} className="text-text-muted opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        </div>
      </div>

      {/* Grid de Avisos y Protocolos de Liquidez */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 scroll-mt-24">
        {/* AVISOS CORPORATIVOS */}
        <div id="seccion-avisos" className="bg-white rounded-[50px] p-8 md:p-12 border border-surface-border shadow-premium flex flex-col min-h-[600px] relative overflow-hidden">
          <header className="flex items-center justify-between mb-10 shrink-0 relative z-10">
            <div className="flex items-center gap-4">
              <div className="relative">
                <Bell 
                  size={28} 
                  className={`transition-all duration-500 ${hasNewNotices ? 'text-red-600 animate-pulse' : 'text-accent opacity-30'}`} 
                />
                {hasNewNotices && (
                  <span className="absolute -top-1 -right-1 size-3.5 bg-red-600 rounded-full animate-ping border-2 border-white shadow-[0_0_10px_rgba(220,38,38,0.5)]"></span>
                )}
              </div>
              <h3 className="text-accent text-xl font-black uppercase tracking-widest leading-none">
                Avisos Corporativos ({liveNotices.length})
              </h3>
            </div>
            
            <button 
              onClick={() => loadData(true)}
              disabled={isNoticesLoading}
              className="flex items-center gap-2 px-5 py-2.5 bg-white border border-surface-border rounded-full hover:shadow-premium transition-all active:scale-95 text-accent group cursor-pointer"
            >
              <div className="relative flex size-2">
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75 ${isNoticesLoading ? 'duration-300' : 'duration-1000'}`}></span>
                <span className="relative inline-flex rounded-full size-2 bg-primary"></span>
              </div>
              <span className="text-[10px] font-black uppercase tracking-[0.2em]">
                {isNoticesLoading ? 'Refrescando...' : 'Nube Institucional'}
              </span>
            </button>
          </header>

          <div className="flex-1 overflow-y-auto space-y-6 pr-2 hide-scrollbar relative z-10">
            {isNoticesLoading ? (
              <div className="py-24 flex flex-col items-center justify-center gap-3 opacity-30 h-full">
                <RefreshCw className="animate-spin" size={32} />
                <span className="text-[10px] font-black uppercase tracking-[0.3em]">Sincronizando...</span>
              </div>
            ) : liveNotices.length > 0 ? (
              liveNotices.map((notice) => (
                <div 
                  key={notice.id} 
                  onClick={() => handleNoticeClick(notice)}
                  className="bg-surface-subtle/30 rounded-[40px] p-6 md:p-8 border border-surface-border relative group transition-all hover:bg-white hover:shadow-premium hover:-translate-y-1 cursor-pointer"
                >
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
                    <div className="flex items-center gap-3">
                      <div className="size-2.5 bg-primary rounded-full shadow-[0_0_10px_rgba(206,255,4,0.6)] animate-pulse"></div>
                      <h4 className="text-accent text-base font-black tracking-tight leading-none uppercase line-clamp-1">
                        {notice.title}
                      </h4>
                    </div>
                    <span className="text-[9px] font-black text-accent opacity-80 uppercase tracking-widest bg-white border border-surface-border px-3 py-1 rounded-xl whitespace-nowrap shadow-sm shrink-0">
                      {notice.date}
                    </span>
                  </div>
                  <div className="space-y-4">
                    <p className="text-text-secondary text-xs font-bold leading-relaxed line-clamp-2">
                      {notice.description}
                    </p>
                    {notice.imageUrl && (
                      <div className="rounded-[24px] overflow-hidden border border-surface-border shadow-sm h-32 group-hover:scale-[1.02] transition-transform duration-500">
                        <img src={notice.imageUrl} alt={notice.title} className="w-full h-full object-cover" />
                      </div>
                    )}
                    <div className="flex pt-1">
                      <button className="text-accent text-[10px] font-black uppercase tracking-widest border-b-2 border-primary pb-0.5 group-hover:border-accent transition-all">
                        Leer Comunicado
                      </button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-24 text-center bg-surface-subtle/20 rounded-[40px] border-2 border-dashed border-surface-border h-full flex items-center justify-center">
                <p className="text-[10px] font-black text-text-muted uppercase tracking-[0.4em]">Sin avisos institucionales</p>
              </div>
            )}
          </div>
        </div>

        {/* PROTOCOLO DE LIQUIDEZ */}
        <div className="bg-accent rounded-[50px] p-8 md:p-12 shadow-2xl flex flex-col min-h-[600px] text-white overflow-hidden relative group">
          <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none group-hover:scale-105 transition-transform duration-1000">
             <div className="size-[300px] border-[2px] border-white rounded-full"></div>
             <div className="size-[450px] border-[2px] border-white rounded-full absolute"></div>
             <div className="size-[600px] border-[2px] border-white rounded-full absolute"></div>
          </div>

          <header className="flex justify-between items-center mb-6 shrink-0 relative z-10">
            <h3 className="text-primary text-sm font-black uppercase tracking-[0.2em]">Protocolo de Liquidez</h3>
            <Zap size={24} className="text-primary animate-pulse shadow-neon" />
          </header>

          <div className="flex-1 flex flex-col justify-center items-center gap-10 relative z-10">
            <div className="w-full max-w-[320px]">
              <AssetDistributionDonut 
                data={liveLiquidity} 
                centerValue={masterAum} 
              />
            </div>

            <div className="grid grid-cols-2 gap-10 w-full px-4">
              {liveLiquidity.slice(0, 2).map((item, idx) => (
                <div key={idx} className="space-y-3">
                  <span className={`${idx === 0 ? 'text-primary' : 'text-white/40'} text-[10px] font-black uppercase tracking-[0.2em]`}>
                    {item.name}
                  </span>
                  <p className="text-4xl font-black tracking-tighter leading-none">{item.value}%</p>
                  <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">{item.subtext}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* MATRIZ ESTRATÉGICA DETALLADA */}
      <div className="bg-white rounded-[40px] border border-surface-border p-6 lg:p-10 shadow-premium overflow-hidden">
        <div className="flex flex-col space-y-6">
          {/* Cabecera del Análisis */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 border-b border-gray-50 pb-5">
            <div className="space-y-1">
              <p className="text-text-muted text-[10px] font-black uppercase tracking-[0.3em]">Caishen Intelligence Hub</p>
              <h3 className="text-accent text-3xl font-black tracking-tighter uppercase leading-none">
                {strategicPreview?.seccion_titulo || 'Análisis Institucional'}
              </h3>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="flex -space-x-3 overflow-hidden">
                <img src="https://i.ibb.co/zT3RhhT9/CAISHEN-NO-FONDI-AZUL-1.png" className="size-10 rounded-full border-2 border-primary bg-white object-cover shadow-sm" alt="CCG" />
                <img src="https://i.ibb.co/NgZbhx17/legal-Count.png" className="size-10 rounded-full border-2 border-accent bg-white object-cover shadow-sm" alt="Legal" />
              </div>
              <div className="flex flex-col">
                <span className="text-[9px] font-black text-text-muted uppercase tracking-[0.18em] leading-tight">COMITÉ TÉCNICO OPERATIVO</span>
                <span className="text-[11px] font-black text-accent tracking-tight uppercase">VERIFICADO 2026</span>
              </div>
            </div>
          </div>

          {/* Contenido Principal */}
          <div className="max-w-none">
            <div className="text-text-secondary text-base md:text-lg leading-relaxed font-medium whitespace-pre-wrap text-justify">
              {strategicPreview?.contenido || 'Cargando análisis institucional...'}
            </div>
          </div>

          {/* Footer del Análisis */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-gray-50">
            <div className="flex items-center gap-3 text-text-muted">
              <Info size={14} className="text-primary" />
              <p className="text-[10px] font-bold uppercase tracking-widest">Análisis estratégico trimestral vigente.</p>
            </div>
            <button 
              onClick={() => setShowDetailedReport(true)} 
              className="bg-accent text-white hover:bg-black font-black px-8 py-4 rounded-[20px] transition-all uppercase text-[10px] tracking-[0.2em] shadow-xl shrink-0 flex items-center gap-3 group"
            >
              Ver Informe Estratégico Completo
              <FileText size={16} className="text-primary group-hover:scale-110 transition-transform" />
            </button>
          </div>
        </div>
      </div>

      {/* MODALES */}
      {selectedNotice && <NoticeModal notice={selectedNotice} onClose={() => setSelectedNotice(null)} />}
      
      {showDetailedReport && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-accent/80 backdrop-blur-md" onClick={() => setShowDetailedReport(false)} />
          <div className="relative w-full max-w-6xl max-h-[95vh] bg-white rounded-[60px] shadow-2xl overflow-hidden flex flex-col border border-white/20 animate-in zoom-in-95 duration-500">
            <header className="p-8 md:p-10 border-b border-surface-border flex justify-between items-center shrink-0 bg-white">
              <div className="flex items-center gap-6">
                <div className="p-4 bg-accent rounded-[24px] text-primary shadow-xl"><FileText size={32} /></div>
                <div>
                  <h2 className="text-2xl font-black text-accent tracking-tighter uppercase leading-none">Informe Estratégico Trimestral</h2>
                  <p className="text-[11px] font-black text-text-muted uppercase tracking-[0.3em] mt-2">Institutional Intelligence Hub • CCG</p>
                </div>
              </div>
              <button onClick={() => setShowDetailedReport(false)} className="p-4 hover:bg-surface-subtle rounded-full transition-all text-text-muted"><X size={28} /></button>
            </header>
            <div className="flex-1 overflow-y-auto p-12 lg:p-20 scroll-smooth hide-scrollbar bg-white">
               <DetailedOperationalReport />
            </div>
            <footer className="p-10 border-t border-surface-border bg-surface-subtle/20 flex justify-end shrink-0">
              <button onClick={() => setShowDetailedReport(false)} className="bg-accent text-primary font-black px-16 py-5 rounded-[24px] uppercase text-[11px] tracking-[0.3em] shadow-2xl active:scale-95">Finalizar Lectura</button>
            </footer>
          </div>
        </div>
      )}

      {activeDetail && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-accent/40 backdrop-blur-sm" onClick={() => setActiveDetail(null)} />
          <div className="relative w-full max-w-lg bg-white rounded-[40px] shadow-2xl overflow-hidden">
            <div className="p-10 text-center space-y-8">
              <div className="mx-auto size-16 bg-primary rounded-[20px] flex items-center justify-center">
                {React.cloneElement(activeDetail.icon as React.ReactElement, { size: 32, className: "text-accent" })}
              </div>
              <div className="space-y-4 text-center">
                <h3 className="text-2xl font-black text-accent tracking-tighter uppercase">{activeDetail.title}</h3>
                <div className="h-1 w-12 bg-primary mx-auto rounded-full"></div>
                <p className="text-text-secondary text-sm leading-relaxed font-medium px-4">{activeDetail.description}</p>
              </div>
              <button onClick={() => setActiveDetail(null)} className="w-full bg-accent text-white font-black py-5 rounded-2xl uppercase text-xs tracking-widest">Entendido</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExecutiveSummary;
