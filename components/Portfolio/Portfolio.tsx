
import React, { useState, useEffect, useMemo } from 'react';
import { 
  Globe, 
  Activity, 
  Coins, 
  Landmark, 
  Shield, 
  BarChart3, 
  Layers, 
  FileText, 
  X,
  LayoutGrid,
  ShieldCheck,
  Zap
} from 'lucide-react';
import AssetDonutChart from './AssetDonutChart';
import DetailedOperationalReport from './DetailedOperationalReport';
import { 
  PortfolioCategory, 
  PortfolioKpi,
  fetchPortfolioStructure, 
  fetchPortfolioKpis, 
  fetchTableData,
  findValue,
  parseSheetNumber
} from '../../lib/googleSheets';

const Portfolio: React.FC = () => {
  const [showModal, setShowModal] = useState(false);
  const [portfolioData, setPortfolioData] = useState<PortfolioCategory[]>([]);
  const [kpis, setKpis] = useState<PortfolioKpi[]>([]);
  const [globalAum, setGlobalAum] = useState(0);
  const [isLoadingMetadata, setIsLoadingMetadata] = useState(true);

  const loadPortfolioMetadata = async () => {
    try {
      const [pData, kpiData, configData] = await Promise.all([
        fetchPortfolioStructure(),
        fetchPortfolioKpis(),
        fetchTableData('CONFIG_MAESTRA')
      ]);
      setPortfolioData(pData);
      setKpis(kpiData);
      
      const aum = parseSheetNumber(findValue(configData[0], ['AUM_TOTAL_FONDO', 'total_aum']));
      setGlobalAum(aum);
    } catch (e) {
      console.error("Error loading portfolio metadata:", e);
    } finally {
      setIsLoadingMetadata(false);
    }
  };

  useEffect(() => {
    loadPortfolioMetadata();
    const interval = setInterval(loadPortfolioMetadata, 120000);
    return () => clearInterval(interval);
  }, []);

  const getKpiIcon = (type: string) => {
    switch(type) {
      case 'diversificacion': return Layers;
      case 'exposicion': return BarChart3;
      case 'riesgo': return Shield;
      default: return Activity;
    }
  };

  if (isLoadingMetadata && kpis.length === 0) {
    return (
      <div className="p-8 flex flex-col items-center justify-center py-40 gap-4">
        <div className="size-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
        <p className="text-[10px] font-black uppercase tracking-widest text-text-muted">Cargando Portafolio Institucional...</p>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-10 space-y-8 md:space-y-12 animate-in fade-in duration-700 max-w-[1800px] mx-auto">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <h1 className="text-[#1d1c2d] text-3xl md:text-5xl font-black tracking-tighter mb-1 uppercase leading-none">Gestión Institucional</h1>
          <p className="text-text-secondary text-xs md:text-lg font-medium mt-2">Administración privada de activos y exposición de capital corporativo.</p>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          className="w-full md:w-auto flex items-center justify-center gap-3 px-8 py-4 bg-[#1d1c2d] text-white hover:bg-black rounded-2xl transition-all shadow-xl active:scale-95 group"
        >
          <FileText size={18} className="text-[#ceff04] group-hover:scale-110 transition-transform" />
          <span className="text-[11px] font-black uppercase tracking-widest">Informe Estratégico</span>
        </button>
      </header>

      {/* TARJETAS KPI */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {kpis.length > 0 ? kpis.map((kpi, i) => {
          const Icon = getKpiIcon(kpi.type);
          const isExposicion = kpi.type === 'exposicion';
          
          let displaySub = kpi.sub;
          if (isExposicion && globalAum > 0) {
            const pctVal = parseSheetNumber(kpi.value);
            const dollarVal = (globalAum * (pctVal / 100)) / 1000;
            displaySub = `$${dollarVal.toFixed(1)}k ${kpi.label}`;
          }

          return (
            <div key={i} className="bg-white border border-surface-border rounded-[32px] md:rounded-[40px] p-6 md:p-10 shadow-sm hover:shadow-premium hover:-translate-y-1 transition-all group overflow-hidden">
              <div className="flex justify-between items-start mb-6 md:mb-10">
                <span className="text-[#9ca3af] text-[10px] md:text-[12px] font-black uppercase tracking-[0.2em]">{kpi.label}</span>
                <div className="p-2 md:p-2.5 bg-primary rounded-xl shadow-sm shrink-0">
                  <Icon size={18} className="text-accent" />
                </div>
              </div>
              <h4 className="text-3xl md:text-5xl font-black tracking-tighter mb-2 text-[#1d1c2d] break-words">
                {kpi.value}
              </h4>
              <p className="text-[10px] md:text-[12px] font-black text-[#6b7280] uppercase tracking-[0.15em] line-clamp-2">{displaySub}</p>
            </div>
          );
        }) : [1,2,3].map(i => (
          <div key={i} className="bg-white border border-surface-border rounded-[32px] p-6 md:p-10 animate-pulse h-[200px] md:h-[240px]">
             <div className="flex justify-between items-start mb-10"><div className="h-4 w-32 bg-gray-100 rounded-lg"></div><div className="size-10 bg-gray-100 rounded-xl"></div></div>
             <div className="h-10 w-48 bg-gray-100 rounded-2xl mb-4"></div>
             <div className="h-4 w-24 bg-gray-100 rounded-lg"></div>
          </div>
        ))}
      </div>

      <div className="space-y-8">
        <div className="bg-white rounded-[40px] border border-surface-border p-6 md:p-14 shadow-premium">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 mb-12">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-surface-subtle rounded-2xl shadow-inner shrink-0"><LayoutGrid size={24} className="text-[#1d1c2d]" /></div>
              <div>
                <h3 className="text-[#1d1c2d] text-2xl md:text-3xl font-black tracking-tighter uppercase leading-none">Activos Gestionados</h3>
                <p className="text-[9px] md:text-[10px] font-black text-[#9ca3af] uppercase tracking-[0.15em] mt-1 text-left">Desglose patrimonial por categoría</p>
              </div>
            </div>
            <div className="flex items-center gap-4 md:gap-6 px-6 md:px-8 py-4 bg-surface-subtle rounded-3xl border border-surface-border w-full md:w-auto justify-between md:justify-start">
               <div className="flex flex-col">
                  <span className="text-[8px] md:text-[9px] font-black text-[#9ca3af] uppercase tracking-widest">Global AUM</span>
                  <span className="text-lg md:text-xl font-black text-[#1d1c2d] leading-none">${(globalAum / 1000).toFixed(1)}k</span>
               </div>
               <div className="w-px h-8 bg-gray-200"></div>
               <div className="flex flex-col">
                  <span className="text-[8px] md:text-[9px] font-black text-[#9ca3af] uppercase tracking-widest">Categorías</span>
                  <span className="text-lg md:text-xl font-black text-[#1d1c2d] leading-none">{portfolioData.length}</span>
               </div>
            </div>
          </div>
          
          <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-24">
            <div className="w-full lg:w-[45%] h-[300px] md:h-[450px]">
              <AssetDonutChart data={portfolioData} totalAum={globalAum} />
            </div>
            
            <div className="w-full lg:w-[55%] grid grid-cols-1 sm:grid-cols-2 gap-x-8 md:gap-x-12 gap-y-6 md:gap-y-8">
              {portfolioData.map((item) => (
                <div key={item.name} className="flex flex-col gap-2 group border-b border-gray-50 pb-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="size-2.5 rounded-full shadow-sm" style={{ backgroundColor: item.color }}></div>
                      <span className="text-[12px] md:text-[14px] font-bold text-[#6b7280] group-hover:text-[#1d1c2d] transition-colors">{item.name}</span>
                    </div>
                    <span className="text-[16px] md:text-[18px] font-black text-[#1d1c2d]">{item.value}%</span>
                  </div>
                  <div className="flex items-center justify-between pl-5">
                    <div className="h-1.5 flex-1 bg-gray-100 rounded-full overflow-hidden mr-4">
                       <div className="h-full transition-all duration-1000" style={{ backgroundColor: item.color, width: `${item.value}%` }}></div>
                    </div>
                    <span className="text-[10px] font-black text-text-muted uppercase tracking-tighter whitespace-nowrap">
                      ${((globalAum * (item.value / 100)) / 1000).toFixed(1)}k
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-[#1d1c2d] rounded-[40px] p-8 md:p-10 text-white shadow-xl relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-8">
             <div className="absolute top-0 right-0 p-10 opacity-5 pointer-events-none translate-x-1/4 -translate-y-1/4">
               <ShieldCheck size={200} />
             </div>
             
             <div className="flex flex-col md:flex-row items-center gap-6 md:gap-8 relative z-10 w-full">
                <div className="shrink-0 flex items-center justify-center p-4 bg-white/10 rounded-3xl border border-white/10 shadow-inner">
                   <ShieldCheck size={40} className="text-[#ceff04]" />
                </div>
                <div className="space-y-3 text-center md:text-left flex-1">
                   <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
                     <span className="bg-[#ceff04] text-[#1d1c2d] text-[9px] font-black px-4 py-1.5 rounded-full uppercase tracking-widest shadow-neon">Auditada 2026</span>
                     <span className="text-gray-400 text-[9px] font-black uppercase tracking-widest flex items-center gap-2">
                       <Zap size={10} className="text-[#ceff04] animate-pulse" /> Security Active
                     </span>
                   </div>
                   <h3 className="text-2xl md:text-3xl font-black uppercase tracking-tighter leading-tight">Resiliencia Patrimonial Corporativa</h3>
                   <p className="text-gray-300 text-xs md:text-sm font-medium max-w-3xl leading-relaxed">
                     Nuestra arquitectura financiera está blindada mediante protocolos de diversificación de capital y auditoría de gestión en tiempo real.
                   </p>
                </div>
             </div>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-2 md:p-4">
          <div className="absolute inset-0 bg-accent/80 backdrop-blur-2xl animate-in fade-in duration-300" onClick={() => setShowModal(false)} />
          <div className="relative w-full max-w-5xl h-[92vh] md:max-h-[95vh] bg-white rounded-[24px] md:rounded-[40px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 flex flex-col border border-white/20">
            <header className="px-6 py-4 md:p-10 border-b border-surface-border flex justify-between items-center bg-white shrink-0">
              <div className="flex items-center gap-3 md:gap-6">
                <div className="p-2 md:p-4 bg-[#1d1c2d] rounded-xl md:rounded-[24px] text-[#ceff04] shadow-xl">
                  {/* Fixed: Remove non-existent md:size and use responsive Tailwind classes */}
                  <ShieldCheck className="size-5 md:size-7" />
                </div>
                <div>
                  <h2 className="text-lg md:text-2xl font-black text-[#1d1c2d] tracking-tighter uppercase leading-none">Análisis Estratégico</h2>
                  <p className="text-[8px] md:text-[10px] font-black text-[#9ca3af] uppercase tracking-widest mt-0.5 md:mt-1">Intelligence Verification v4.2</p>
                </div>
              </div>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-[#f8f9fa] rounded-full transition-all text-[#9ca3af] hover:text-[#1d1c2d]">
                {/* Fixed: Remove non-existent md:size and use responsive Tailwind classes */}
                <X className="size-5 md:size-6" />
              </button>
            </header>
            <div className="flex-1 overflow-y-auto p-6 md:p-16 scroll-smooth hide-scrollbar bg-white">
              <DetailedOperationalReport />
            </div>
            <footer className="px-6 py-4 md:p-10 border-t border-surface-border bg-white flex justify-end shrink-0">
              <button 
                onClick={() => setShowModal(false)}
                className="w-full md:w-auto bg-[#1d1c2d] text-[#ceff04] font-black px-8 md:px-12 py-3.5 md:py-4 rounded-xl md:rounded-[20px] hover:bg-black transition-all uppercase text-[9px] md:text-[10px] tracking-widest shadow-2xl active:scale-95"
              >
                Finalizar Consulta
              </button>
            </footer>
          </div>
        </div>
      )}
    </div>
  );
};

export default Portfolio;
