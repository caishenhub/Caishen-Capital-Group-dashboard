
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
    // Primero abrimos el modal para que el usuario pueda LEER
    setSelectedNotice(notice);
  };

  const handleCloseNotice = () => {
    if (selectedNotice) {
      // Al cerrar el modal, asumimos que se leyó y marcamos como leído para sacarlo de "Pendientes"
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
          <p>La administración del portafolio se desarrolla bajo supervisión permanente del Comité Técnico Operativo, quien evalúa condiciones de mercado, estabilidad estructural y sostenibilidad del capital antes de cada decisión estratégica.</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Diversificación dinámica de activos</li>
            <li>Ajustes operativos según entorno macroeconómico</li>
            <li>Control continuo de exposición agregada</li>
            <li>Supervisión técnica permanente</li>
          </ul>
          <p className="font-bold border-t border-gray-100 pt-3">Objetivo: Proteger el capital estructural y garantizar estabilidad operativa sostenida.</p>
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
          <ul className="list-disc pl-5 space-y-1">
            <li>Respaldo estructural ante eventos adversos</li>
            <li>Estabilidad operativa continua</li>
            <li>Gestión eficiente de capital estratégico</li>
            <li>Programación ordenada de obligaciones financieras</li>
          </ul>
          <p className="font-bold border-t border-gray-100 pt-3">Objetivo: Mantener solvencia permanente y estabilidad patrimonial sin comprometer la estructura operativa.</p>
        </div>
      )
    },
    { 
      title: 'Política de Cobertura', status: 'ACTIVA', desc: 'Protección contra volatilidad sistémica.', icon: Target,
      fullContent: (
        <div className="space-y-4">
          <p className="font-bold text-accent">Política de Protección Patrimonial</p>
          <p>La cobertura estructural se orienta a la mitigación de volatilidad general del portafolio y a la preservación del capital institucional.</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Diversificación sectorial estratégica</li>
            <li>Ajuste progresivo de exposición según condiciones de mercado</li>
            <li>Priorización de estabilidad sobre especulación</li>
            <li>Gestión prudente del capital operativo</li>
          </ul>
          <p>En escenarios de alta incertidumbre financiera, la compañía prioriza la reducción de exposición y el fortalecimiento de la estructura de liquidez.</p>
          <p className="font-bold border-t border-gray-100 pt-3">Objetivo: Preservar el equilibrio patrimonial y la continuidad operativa ante variaciones del mercado.</p>
        </div>
      )
    },
    { 
      title: 'Política de Utilidades', status: 'DEFINIDA', desc: 'Distribución programada y estable.', icon: FileText,
      fullContent: (
        <div className="space-y-4">
          <p className="font-bold text-accent">Política de Distribución Mensual de Utilidades</p>
          <p>La distribución de utilidades se realiza de manera mensual, conforme al cierre contable consolidado del periodo.</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Consolidación financiera mensual</li>
            <li>Validación técnica por el Comité</li>
            <li>Asignación proporcional según participación accionaria</li>
            <li>Aporte parcial destinado al fortalecimiento estructural del capital</li>
          </ul>
          <p>La distribución se realiza bajo criterios de sostenibilidad y estabilidad patrimonial.</p>
          <p className="font-bold border-t border-gray-100 pt-3">Objetivo: Garantizar equilibrio entre rentabilidad periódica y solidez estructural de la compañía.</p>
        </div>
      )
    },
    { 
      title: 'Política de Reinversión', status: 'CRECIENTE', desc: 'Capitalización de excedentes estratégicos.', icon: TrendingUp,
      fullContent: (
        <div className="space-y-4">
          <p className="font-bold text-accent">Política de Capitalización Estratégica</p>
          <p>La reinversión de utilidades fortalece el crecimiento estructural del portafolio y la consolidación patrimonial.</p>
          <p>Las utilidades pueden destinarse a:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Expansión operativa</li>
            <li>Desarrollo tecnológico</li>
            <li>Fortalecimiento de la Reserva Técnica</li>
            <li>Integración de nuevos sectores estratégicos</li>
          </ul>
          <p className="font-bold border-t border-gray-100 pt-3">Objetivo: Consolidar crecimiento sostenible y fortalecimiento patrimonial progresivo.</p>
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
      {/* Cabecera Principal */}
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
          <div key={key} onClick={() => setActiveDetail(detail)} className="bg-white p-8 rounded-[40px] border border-surface-border shadow-sm flex flex-col h-[240px] transition-all hover:shadow-premium hover:-translate-y-1 cursor-pointer group relative overflow-hidden">
            <div className="flex justify-between items-start mb-6">
              <span className="text-[10px] md:text-[11px] font-black text-text-muted uppercase tracking-[0.15em] leading-tight max-w-[70%]">{detail.title}</span>
              <div className="size-12 bg-primary rounded-2xl text-accent flex items-center justify-center shadow-sm">
                {/* Fixed: Cast detail.icon to ReactElement<any> to fix 'size' property error */}
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
        {/* Avisos Corporativos */}
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
                    <button 
                      onClick={(e) => { e.stopPropagation(); markAsRead(notice.id); }}
                      className="p-2 hover:bg-primary/20 rounded-lg text-text-muted hover:text-accent transition-all"
                      title="Marcar como leído sin abrir"
                    >
                      <CheckCircle2 size={16} />
                    </button>
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

      {/* Matriz Estratégica */}
      <div className="bg-white rounded-[40px] border border-surface-border p-8 lg:p-14 shadow-premium">
        <div className="space-y-10">
          <div className="space-y-2">
            <p className="text-text-muted text-[11px] font-black uppercase tracking-[0.35em] leading-none mb-2">Caishen Intelligence Hub</p>
            <h3 className="text-accent text-4xl lg:text-5xl font-black uppercase tracking-tighter leading-none">
              {strategicPreview?.seccion_titulo || 'Análisis Institucional'}
            </h3>
          </div>
          
          <div className="max-w-none">
            <p className="text-text-secondary text-lg lg:text-xl leading-relaxed font-medium text-justify line-clamp-6 opacity-90">
              {strategicPreview?.contenido || 'Cargando análisis institucional del comité operativo...'}
            </p>
          </div>

          <div className="pt-10 border-t border-gray-100 flex flex-col md:flex-row justify-between items-center gap-8">
             <div className="flex items-center gap-5 bg-surface-subtle/60 p-5 rounded-3xl border border-surface-border shadow-sm">
                <div className="flex -space-x-4 overflow-hidden">
                  <div className="size-12 rounded-full border-2 border-primary bg-white flex items-center justify-center shadow-sm z-10">
                    <img src="https://i.ibb.co/zT3RhhT9/CAISHEN-NO-FONDO-AZUL-1.png" className="size-8 object-cover" alt="CCG" />
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

      {/* MARCO DE CONTROL FINANCIERO */}
      <section className="space-y-8 pt-10 border-t border-surface-border">
        <div className="flex items-center gap-6">
          <h2 className="text-accent text-lg md:text-xl font-black uppercase tracking-[0.2em] whitespace-nowrap">Marco de Control Financiero</h2>
          <div className="h-px bg-surface-border flex-1"></div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
          {POLICIES.map((policy, idx) => {
            const Icon = policy.icon;
            return (
              <div 
                key={idx} 
                onClick={() => setSelectedPolicy(policy)}
                className="bg-white border border-surface-border rounded-[32px] p-8 space-y-6 shadow-sm hover:shadow-premium transition-all group cursor-pointer"
              >
                <div className="flex items-center gap-3 opacity-40 group-hover:opacity-100 transition-opacity">
                  <Icon size={16} className="text-accent" />
                  <span className="text-[9px] font-black uppercase tracking-[0.15em] text-text-muted">Estado: {policy.status}</span>
                </div>
                <div className="space-y-2">
                  <h4 className="text-xs font-black text-accent uppercase tracking-tight">{policy.title}</h4>
                  <p className="text-[10px] md:text-[11px] text-text-secondary font-medium leading-relaxed">{policy.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* MODAL DE POLÍTICA */}
      {selectedPolicy && (
        <div className="fixed inset-0 z-[1100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-accent/70 backdrop-blur-md animate-in fade-in" onClick={() => setSelectedPolicy(null)} />
          <div className="relative w-full max-w-xl bg-white rounded-[40px] shadow-2xl p-8 md:p-12 animate-in zoom-in-95 border border-white/20 flex flex-col">
            <button onClick={() => setSelectedPolicy(null)} className="absolute top-8 right-8 p-2 text-text-muted hover:bg-gray-100 rounded-full transition-all">
              <X size={24} />
            </button>
            <div className="flex items-center gap-4 mb-8">
              <div className="size-16 bg-primary rounded-2xl text-accent flex items-center justify-center shadow-sm">
                <selectedPolicy.icon size={32} />
              </div>
              <div>
                <h3 className="text-xl font-black text-accent uppercase tracking-tighter leading-tight">{selectedPolicy.title}</h3>
                <span className="text-[10px] font-black text-text-muted uppercase tracking-widest">Estado: {selectedPolicy.status}</span>
              </div>
            </div>
            <div className="text-text-secondary text-sm md:text-base leading-relaxed font-medium text-justify max-h-[60vh] overflow-y-auto pr-4 hide-scrollbar">
              {selectedPolicy.fullContent}
            </div>
            <button onClick={() => setSelectedPolicy(null)} className="w-full mt-10 bg-accent text-white font-black py-4 rounded-2xl uppercase text-[10px] tracking-widest shadow-xl active:scale-95 transition-all">
              Entendido
            </button>
          </div>
        </div>
      )}

      {/* MODAL DE DETALLE DE KPI */}
      {activeDetail && (
        <div className="fixed inset-0 z-[1100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-accent/60 backdrop-blur-md animate-in fade-in" onClick={() => setActiveDetail(null)} />
          <div className="relative w-full max-w-lg bg-white rounded-[40px] shadow-2xl p-8 md:p-12 animate-in zoom-in-95 border border-white/20 text-center flex flex-col items-center gap-6">
            <button onClick={() => setActiveDetail(null)} className="absolute top-6 right-6 p-2 text-text-muted hover:bg-gray-100 rounded-full transition-all">
              <X size={20} />
            </button>
            <div className="size-20 bg-primary rounded-3xl text-accent flex items-center justify-center shadow-neon">
              {/* Fixed: Cast activeDetail.icon to ReactElement<any> to fix 'size' property error */}
              {React.cloneElement(activeDetail.icon as React.ReactElement<any>, { size: 40 })}
            </div>
            <div className="space-y-3">
              <h3 className="text-2xl font-black text-accent uppercase tracking-tighter">{activeDetail.title}</h3>
              <p className="text-[10px] font-black text-text-muted uppercase tracking-[0.3em]">Detalle Técnico Operativo</p>
            </div>
            <p className="text-text-secondary text-sm md:text-base leading-relaxed font-medium text-justify">
              {activeDetail.description}
            </p>
            <button onClick={() => setActiveDetail(null)} className="w-full bg-accent text-white font-black py-4 rounded-2xl uppercase text-[10px] tracking-widest shadow-xl">
              Entendido
            </button>
          </div>
        </div>
      )}

      {selectedNotice && (
        <NoticeModal 
          notice={selectedNotice} 
          onClose={handleCloseNotice} 
        />
      )}

      {showDetailedReport && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-2 md:p-6">
          <div className="absolute inset-0 bg-accent/90 backdrop-blur-xl animate-in fade-in" onClick={() => setShowDetailedReport(false)} />
          <div className="relative w-full max-w-5xl h-[92vh] bg-white rounded-[32px] md:rounded-[48px] shadow-2xl overflow-hidden animate-in zoom-in-95 flex flex-col border border-white/20">
            <header className="px-6 py-5 md:px-12 md:py-8 border-b border-surface-border flex justify-between items-center bg-white shrink-0">
              <div className="flex items-center gap-6">
                <div>
                  <h2 className="text-lg md:text-2xl font-black text-accent tracking-tighter uppercase leading-none">Análisis Estratégico</h2>
                  <p className="text-[8px] md:text-[10px] font-black text-text-muted uppercase tracking-widest mt-1">Intelligence Verification v4.2</p>
                </div>
              </div>
              <button onClick={() => setShowDetailedReport(false)} className="p-2 hover:bg-surface-subtle rounded-full transition-colors text-text-muted">
                <X size={24} />
              </button>
            </header>
            <div className="flex-1 overflow-y-auto p-6 md:p-16 scroll-smooth hide-scrollbar bg-white">
              <DetailedOperationalReport />
            </div>
            <footer className="px-6 py-5 md:px-12 md:py-8 border-t border-surface-border bg-gray-50/50 flex justify-center md:justify-end shrink-0">
              <button onClick={() => setShowDetailedReport(false)} className="w-full md:w-auto bg-accent text-primary font-black px-12 py-5 rounded-[22px] hover:bg-black transition-all uppercase text-[11px] tracking-[0.2em] shadow-2xl active:scale-95 flex items-center justify-center gap-3">
                <CheckCircle2 size={18} /> Finalizar Consulta
              </button>
            </footer>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExecutiveSummary;
