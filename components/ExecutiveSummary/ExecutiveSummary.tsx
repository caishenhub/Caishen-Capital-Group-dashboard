
import React, { useState, useEffect, useMemo } from 'react';
import { 
  TrendingUp, 
  ShieldCheck, 
  Activity,
  Wallet,
  Target,
  Info,
  X,
  Bell,
  Zap,
  FileText,
  RefreshCw,
  CheckCircle2,
  Shield,
  Landmark,
  Eye
} from 'lucide-react';
import AssetDistributionDonut from './AssetDistributionDonut';
import NoticeModal from './NoticeModal';
import { CorporateNotice } from '../../types';
import DetailedOperationalReport from '../Portfolio/DetailedOperationalReport';
import { fetchCorporateNotices, fetchStrategicReport, fetchExecutiveKpis, fetchLiquidityProtocol, fetchTableData, findValue, StrategicReportSection, ExecutiveKpi, LiquidityItem } from '../../lib/googleSheets';

interface KpiDetail {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
}

interface PolicyDetail {
  title: string;
  status: string;
  desc: string;
  icon: any;
  fullContent: React.ReactNode;
}

const ExecutiveSummary: React.FC = () => {
  const [activeDetail, setActiveDetail] = useState<KpiDetail | null>(null);
  const [selectedPolicy, setSelectedPolicy] = useState<PolicyDetail | null>(null);
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

  const pendingNotices = useMemo(() => {
    return liveNotices.filter(n => !readNoticeIds.includes(n.id));
  }, [liveNotices, readNoticeIds]);

  const markAsRead = (id: string) => {
    if (!readNoticeIds.includes(id)) {
      const updated = [...readNoticeIds, id];
      setReadNoticeIds(updated);
      localStorage.setItem('ccg_read_notices', JSON.stringify(updated));
    }
  };

  const handleNoticeClick = (notice: CorporateNotice) => {
    setSelectedNotice(notice);
  };

  const handleCloseNotice = () => {
    if (selectedNotice) {
      markAsRead(selectedNotice.id);
      setSelectedNotice(null);
    }
  };

  const KPI_DETAILS: Record<string, KpiDetail> = {
    balance: { id: 'balance', title: liveKpis.balance?.titulo || 'BALANCE TOTAL (AUM)', description: 'Representa el capital total bajo gestión (Assets Under Management). Este valor refleja la solidez financiera agregada del portafolio en el periodo actual.', icon: <Wallet size={24} /> },
    utilidad: { id: 'utilidad', title: liveKpis.utilidad?.titulo || 'RESERVA TÉCNICA', description: 'Porcentaje de fondos destinados a la cobertura y protección patrimonial. Garantiza la liquidez inmediata para el cumplimiento de las políticas de riesgo.', icon: <ShieldCheck size={24} /> },
    ajuste: { id: 'ajuste', title: liveKpis.ajuste?.titulo || 'AJUSTE OPERATIVO', description: 'Control técnico sobre las desviaciones operativas. Mide la eficiencia de la ejecución institucional frente a las proyecciones estratégicas.', icon: <Activity size={24} /> },
    estabilidad: { id: 'estabilidad', title: liveKpis.estabilidad?.titulo || 'ESTABILIDAD DEL PORTAFOLIO', description: 'Indicador sintético de volatilidad controlada. Determina el grado de consistencia y preservación del capital ante variaciones del mercado global.', icon: <Target size={24} /> }
  };

  const POLICIES: PolicyDetail[] = [
    { 
      title: 'Política de Riesgo', status: 'ÓPTIMO', desc: 'Mitigación activa y diversificación dinámica.', icon: Shield,
      fullContent: (
        <div className="space-y-4">
          <p className="font-bold text-accent">Política de Gestión Integral del Riesgo</p>
          <p>La estructura de riesgo de Caishen Capital Group S.A.S. se fundamenta en la preservación patrimonial, el control estructural de la exposición y la disciplina operativa institucional.</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Diversificación dinámica de activos</li>
            <li>Ajustes operativos según entorno macroeconómico</li>
            <li>Control continuo de exposición agregada</li>
            <li>Supervisión técnica permanente</li>
          </ul>
        </div>
      )
    },
    { 
      title: 'Política de Liquidez', status: 'SUPERVISADA', desc: 'Mantenimiento de ratios de solvencia inmediata.', icon: Landmark,
      fullContent: (
        <div className="space-y-4">
          <p className="font-bold text-accent">Política de Liquidez y Solvencia Estructural</p>
          <p>La liquidez de la compañía se organiza bajo un esquema de alta disponibilidad patrimonial.</p>
          <p>La Reserva Técnica mantiene un nivel de liquidez inmediata del 100%, garantizando capacidad de respuesta ante escenarios de mercado y cumplimiento de compromisos operativos.</p>
        </div>
      )
    },
    { 
      title: 'Política de Cobertura', status: 'ACTIVA', desc: 'Protección contra volatilidad sistémica.', icon: Target,
      fullContent: (
        <div className="space-y-4">
          <p className="font-bold text-accent">Política de Protección Patrimonial</p>
          <p>La cobertura estructural se orienta a la mitigación de volatilidad general del portafolio y a la preservación del capital institucional.</p>
        </div>
      )
    },
    { 
      title: 'Política de Utilidades', status: 'DEFINIDA', desc: 'Distribución programada y estable.', icon: FileText,
      fullContent: (
        <div className="space-y-4">
          <p className="font-bold text-accent">Política de Distribución Mensual de Utilidades</p>
          <p>La distribución de utilidades se realiza de manera mensual, conforme al cierre contable consolidado del periodo.</p>
        </div>
      )
    },
    { 
      title: 'Política de Reinversión', status: 'CRECIENTE', desc: 'Capitalización de excedentes estratégicos.', icon: TrendingUp,
      fullContent: (
        <div className="space-y-4">
          <p className="font-bold text-accent">Política de Capitalización Estratégica</p>
          <p>La reinversión de utilidades fortalece el crecimiento estructural del portafolio y la consolidación patrimonial.</p>
        </div>
      )
    }
  ];

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

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {Object.entries(KPI_DETAILS).map(([key, detail]) => (
          <div key={key} onClick={() => setActiveDetail(detail)} className="bg-white p-8 rounded-[40px] border border-surface-border shadow-sm flex flex-col h-[240px] transition-all hover:shadow-premium hover:-translate-y-1 cursor-pointer group relative overflow-hidden">
            <div className="flex justify-between items-start mb-6">
              <span className="text-[10px] md:text-[11px] font-black text-text-muted uppercase tracking-[0.15em] leading-tight max-w-[70%]">{detail.title}</span>
              <div className="size-12 bg-primary rounded-2xl text-accent flex items-center justify-center shadow-sm">
                {React.cloneElement(detail.icon as React.ReactElement<any>, { size: 24 })}
              </div>
            </div>
            <div className="mb-auto">
              <h3 className="text-4xl lg:text-5xl font-black text-accent tracking-tighter leading-none">{formatKpiValue(liveKpis[key])}</h3>
            </div>
            <div className="mt-6 pt-4 border-t border-gray-50 flex items-center justify-between">
               <span className="text-[9px] md:text-[10px] font-black text-text-muted uppercase tracking-[0.2em] leading-relaxed">
                 {liveKpis[key]?.subtexto || 'Verificado al cierre'}
               </span>
               <div className="p-1.5 hover:bg-surface-subtle rounded-lg transition-colors">
                <Info size={14} className="text-text-muted opacity-30 group-hover:opacity-100" />
               </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
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
                  <div className="mt-4 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-accent text-[9px] font-black uppercase tracking-widest group-hover:text-primary transition-colors">
                      <Eye size={12} /> Leer Comunicado Completo
                    </div>
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

        <div className="bg-accent rounded-[50px] p-8 md:p-12 shadow-2xl flex flex-col min-h-[600px] text-white overflow-hidden relative group">
          <header className="flex justify-between items-center mb-6 relative z-10">
            <h3 className="text-primary text-sm font-black uppercase tracking-[0.2em]">Protocolo de Liquidez</h3>
            <Zap size={24} className="text-primary animate-pulse shadow-neon" />
          </header>
          <div className="flex-1 flex flex-col justify-center items-center relative z-10 gap-10">
            <div className="w-full max-w-[320px]">
              <AssetDistributionDonut data={liveLiquidity} centerValue={masterAum} />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-[40px] border border-surface-border p-8 lg:p-14 shadow-premium">
        <div className="space-y-10">
          <div className="space-y-2">
            <p className="text-text-muted text-[11px] font-black uppercase tracking-[0.35em] leading-none mb-2">Caishen Intelligence Hub</p>
            <h3 className="text-accent text-4xl lg:text-5xl font-black uppercase tracking-tighter leading-none">
              {strategicPreview?.seccion_titulo || 'Análisis Institucional'}
            </h3>
          </div>
          <div className="pt-10 border-t border-gray-100 flex flex-col md:flex-row justify-between items-center gap-8">
             <div className="flex items-center gap-5 bg-surface-subtle/60 p-5 rounded-3xl border border-surface-border shadow-sm">
                <div className="flex -space-x-4 overflow-hidden">
                  <div className="size-12 rounded-full border-2 border-primary bg-white flex items-center justify-center shadow-sm z-10">
                    <img src="https://i.ibb.co/zT3RhhT9/CAISHEN-NO-FONDO-AZUL-1.png" className="size-8 object-contain" alt="CCG" />
                  </div>
                  <div className="size-12 rounded-full border-2 border-accent bg-white flex items-center justify-center shadow-sm">
                    <img src="https://i.ibb.co/NgZbhx17/legal-Count.png" className="size-8 object-cover" alt="Legal" />
                  </div>
                </div>
                <div className="flex flex-col">
                  <span className="text-[9px] font-black text-text-muted uppercase tracking-[0.2em] leading-tight">COMITÉ TÉCNICO OPERATIVO</span>
                  <span className="text-[12px] font-black text-accent tracking-tight uppercase">VERIFICADO 2026</span>
                </div>
              </div>
             <button 
               onClick={() => setShowDetailedReport(true)} 
               className="w-full md:w-auto bg-accent text-white hover:bg-black font-black px-12 py-5 rounded-[24px] transition-all uppercase text-[11px] tracking-[0.2em] shadow-xl hover:-translate-y-1 active:scale-95 flex items-center justify-center gap-4 group"
             >
               Ver Análisis Completo 
               <FileText size={18} className="text-primary group-hover:scale-110 transition-transform" />
             </button>
          </div>
        </div>
      </div>
      
      {/* Modal de Análisis Institucional Completo */}
      {showDetailedReport && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-2 md:p-4">
          <div className="absolute inset-0 bg-accent/80 backdrop-blur-2xl animate-in fade-in duration-300" onClick={() => setShowDetailedReport(false)} />
          <div className="relative w-full max-w-5xl h-[92vh] md:max-h-[95vh] bg-white rounded-[24px] md:rounded-[40px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 flex flex-col border border-white/20">
            <header className="px-6 py-4 md:p-10 border-b border-surface-border flex justify-between items-center bg-white shrink-0">
              <div className="flex items-center gap-3 md:gap-6">
                <div className="p-2 md:p-4 bg-[#1d1c2d] rounded-xl md:rounded-[24px] text-[#ceff04] shadow-xl">
                  <ShieldCheck className="size-5 md:size-7" />
                </div>
                <div>
                  <h2 className="text-lg md:text-2xl font-black text-[#1d1c2d] tracking-tighter uppercase leading-none">Análisis Estratégico</h2>
                  <p className="text-[8px] md:text-[10px] font-black text-[#9ca3af] uppercase tracking-widest mt-0.5 md:mt-1">Intelligence Verification v4.2</p>
                </div>
              </div>
              <button onClick={() => setShowDetailedReport(false)} className="p-2 hover:bg-[#f8f9fa] rounded-full transition-all text-[#9ca3af] hover:text-[#1d1c2d]">
                <X className="size-5 md:size-6" />
              </button>
            </header>
            <div className="flex-1 overflow-y-auto p-6 md:p-16 scroll-smooth hide-scrollbar bg-white">
              <DetailedOperationalReport />
            </div>
            <footer className="px-6 py-4 md:p-10 border-t border-surface-border bg-white flex justify-end shrink-0">
              <button 
                onClick={() => setShowDetailedReport(false)}
                className="w-full md:w-auto bg-[#1d1c2d] text-[#ceff04] font-black px-8 md:px-12 py-3.5 md:py-4 rounded-xl md:rounded-[20px] hover:bg-black transition-all uppercase text-[9px] md:text-[10px] tracking-widest shadow-2xl active:scale-95"
              >
                Finalizar Consulta
              </button>
            </footer>
          </div>
        </div>
      )}

      {selectedNotice && (
        <NoticeModal 
          notice={selectedNotice} 
          onClose={handleCloseNotice} 
        />
      )}
    </div>
  );
};

export default ExecutiveSummary;
