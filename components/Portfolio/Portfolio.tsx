
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
  Database,
  RefreshCw,
  Search,
  History,
  TrendingUp,
  FileSpreadsheet,
  LayoutGrid,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Zap
} from 'lucide-react';
import AssetDonutChart from './AssetDonutChart';
import DetailedOperationalReport from './DetailedOperationalReport';
import { 
  fetchExecutionsFromApi, 
  ExecutionData, 
  MarketCategory, 
  fetchPortfolioStructure, 
  fetchPortfolioKpis, 
  PortfolioCategory, 
  PortfolioKpi,
  fetchTableData,
  findValue,
  parseSheetNumber
} from '../../lib/googleSheets';

const Portfolio: React.FC = () => {
  const [showModal, setShowModal] = useState(false);
  const [execData, setExecData] = useState<ExecutionData>({ closed: [], open: [] });
  const [portfolioData, setPortfolioData] = useState<PortfolioCategory[]>([]);
  const [kpis, setKpis] = useState<PortfolioKpi[]>([]);
  const [globalAum, setGlobalAum] = useState(0);

  const [activeTab, setActiveTab] = useState<'closed' | 'open'>('closed');
  const [activeMarket, setActiveMarket] = useState<MarketCategory>('forex');
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 20;

  const markets = [
    { id: 'forex' as MarketCategory, name: 'Forex', icon: Globe },
    { id: 'stocks' as MarketCategory, name: 'Acciones', icon: Landmark },
    { id: 'commodities' as MarketCategory, name: 'Commodities', icon: Coins },
  ];

  const syncExecData = async (category: MarketCategory) => {
    setIsLoading(true);
    try {
      const result = await fetchExecutionsFromApi(category);
      setExecData(result);
      setCurrentPage(1);
    } catch (e) {
      console.error(`Error sync ${category}:`, e);
    } finally {
      setIsLoading(false);
    }
  };

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
    }
  };

  useEffect(() => {
    syncExecData(activeMarket);
    loadPortfolioMetadata();
    
    const interval = setInterval(loadPortfolioMetadata, 120000);
    return () => clearInterval(interval);
  }, [activeMarket]);

  const filteredExecData = useMemo(() => {
    const list = activeTab === 'closed' ? execData.closed : execData.open;
    return list.filter(item => {
      return item.symbol.toLowerCase().includes(searchTerm.toLowerCase()) || 
             item.ticket.toLowerCase().includes(searchTerm.toLowerCase());
    });
  }, [execData, activeTab, searchTerm]);

  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return filteredExecData.slice(startIndex, startIndex + pageSize);
  }, [filteredExecData, currentPage]);

  const totalPages = Math.ceil(filteredExecData.length / pageSize) || 1;

  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, searchTerm]);

  const getKpiIcon = (type: string) => {
    switch(type) {
      case 'diversificacion': return Layers;
      case 'exposicion': return BarChart3;
      case 'riesgo': return Shield;
      default: return Activity;
    }
  };

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

      {/* TARJETAS KPI CON DISEÑO UNIFICADO Y RESPONSIVO */}
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

        <div className="space-y-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-4 self-start">
              <div className="p-2.5 bg-[#1d1c2d] rounded-2xl text-[#ceff04] shadow-lg shrink-0"><Database size={20} /></div>
              <div>
                <h2 className="text-[#1d1c2d] text-xl md:text-2xl font-black tracking-tighter uppercase leading-none">Libro de Operaciones</h2>
                <p className="text-[9px] font-bold text-text-muted uppercase tracking-widest mt-1">Verificación Institucional en Tiempo Real</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2 bg-white p-1.5 rounded-3xl border border-surface-border shadow-sm overflow-x-auto w-full md:w-auto hide-scrollbar">
              {markets.map((m) => (
                <button
                  key={m.id}
                  onClick={() => setActiveMarket(m.id)}
                  className={`flex-1 md:flex-none flex items-center justify-center gap-2.5 px-6 py-3 rounded-2xl transition-all whitespace-nowrap ${
                    activeMarket === m.id 
                      ? 'bg-[#ceff04] text-[#1d1c2d] shadow-md font-black scale-105' 
                      : 'text-text-muted hover:bg-gray-50 font-bold'
                  }`}
                >
                  <m.icon size={14} />
                  <span className="text-[10px] uppercase tracking-widest">{m.name}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="bg-white border border-surface-border rounded-[40px] overflow-hidden shadow-premium relative flex flex-col">
            <div className="p-6 md:p-10 border-b border-surface-border flex flex-col lg:flex-row gap-8 lg:gap-10 justify-between items-center bg-surface-subtle/20">
              <div className="flex bg-white p-1 rounded-2xl border border-surface-border w-full lg:w-auto shadow-sm">
                <button 
                  onClick={() => setActiveTab('closed')}
                  className={`flex-1 lg:flex-none flex items-center justify-center gap-3 px-6 md:px-10 py-3.5 rounded-xl text-[10px] font-black uppercase transition-all ${activeTab === 'closed' ? 'bg-[#1d1c2d] text-white shadow-lg' : 'text-[#6b7280] hover:text-[#1d1c2d]'}`}
                >
                  <History size={14} /> Histórico
                </button>
                <button 
                  onClick={() => setActiveTab('open')}
                  className={`flex-1 lg:flex-none flex items-center justify-center gap-3 px-6 md:px-10 py-3.5 rounded-xl text-[10px] font-black uppercase transition-all ${activeTab === 'open' ? 'bg-[#ceff04] text-[#1d1c2d] shadow-md' : 'text-[#6b7280] hover:text-[#1d1c2d]'}`}
                >
                  <TrendingUp size={14} /> En Curso
                </button>
              </div>

              <div className="flex flex-col md:flex-row gap-4 w-full lg:w-auto flex-1 max-w-2xl">
                <div className="relative flex-1">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#9ca3af]" size={16} />
                  <input 
                    type="text"
                    placeholder="Filtrar Activo..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-12 pr-4 py-3.5 bg-white border border-surface-border rounded-2xl text-[11px] font-black text-[#1d1c2d] focus:ring-[#ceff04] focus:border-[#ceff04] transition-all"
                  />
                </div>
                
                <button 
                  onClick={() => syncExecData(activeMarket)}
                  disabled={isLoading}
                  className="flex items-center justify-center gap-3 px-6 py-3 bg-white border border-surface-border rounded-full hover:shadow-premium transition-all active:scale-95 text-accent group cursor-pointer"
                >
                  <div className="relative flex size-2">
                    <span className={`animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75 ${isLoading ? 'duration-300' : 'duration-1000'}`}></span>
                    <span className="relative inline-flex rounded-full size-2 bg-primary"></span>
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-widest whitespace-nowrap">
                    {isLoading ? 'Sync...' : 'Nube'}
                  </span>
                </button>
              </div>
            </div>

            <div className="min-h-[400px] relative overflow-x-auto">
              {isLoading && (
                <div className="absolute inset-0 bg-white/60 backdrop-blur-md z-50 flex flex-col items-center justify-center gap-4">
                  <div className="p-5 bg-[#1d1c2d] rounded-2xl shadow-xl animate-bounce">
                    <RefreshCw size={32} className="text-[#ceff04] animate-spin" />
                  </div>
                  <p className="text-[11px] font-black text-[#1d1c2d] uppercase tracking-widest">Validando Gestión...</p>
                </div>
              )}

              <table className="w-full text-left border-collapse min-w-[1000px]">
                <thead>
                  <tr className="bg-[#f8f9fa] text-[9px] font-black text-[#9ca3af] uppercase tracking-[0.2em] border-b border-surface-border">
                    <th className="px-8 py-6">Ticket</th>
                    <th className="px-4 py-6">Instrumento</th>
                    <th className="px-4 py-6">Acción</th>
                    <th className="px-4 py-6">Apertura</th>
                    {activeTab === 'closed' && <th className="px-4 py-6">Cierre</th>}
                    <th className="px-4 py-6 text-right">Neto USD</th>
                    <th className="px-8 py-6 text-right">Rendimiento %</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {paginatedData.map((ex, idx) => (
                    <tr key={ex.ticket || idx} className="hover:bg-[#fcfcfc] transition-colors group">
                      <td className="px-8 py-6 text-[10px] font-black text-[#9ca3af]">#{ex.ticket}</td>
                      <td className="px-4 py-6 text-[13px] font-black text-[#1d1c2d]">{ex.symbol}</td>
                      <td className="px-4 py-6">
                        <span className={`text-[9px] font-black uppercase px-3 py-1 rounded-lg border ${ex.side.toLowerCase().includes('buy') ? 'bg-blue-50 text-blue-700 border-blue-100' : 'bg-red-50 text-red-700 border-red-100'}`}>
                          {ex.side}
                        </span>
                      </td>
                      <td className="px-4 py-6 text-[11px] font-bold text-[#6b7280]">{ex.open_time}</td>
                      {activeTab === 'closed' && <td className="px-4 py-6 text-[11px] font-bold text-[#6b7280]">{ex.close_time}</td>}
                      <td className={`px-4 py-6 text-[13px] font-black text-right ${ex.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {ex.profit.toLocaleString('es-ES', { minimumFractionDigits: 2 })} USD
                      </td>
                      <td className={`px-8 py-6 text-[13px] font-black text-right ${ex.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {ex.gain}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {filteredExecData.length === 0 && !isLoading && (
                <div className="py-24 text-center text-text-muted flex flex-col items-center justify-center space-y-4">
                  <FileSpreadsheet size={48} className="opacity-10" />
                  <p className="font-black uppercase tracking-widest text-[10px]">Sin registros patrimoniales</p>
                </div>
              )}
            </div>

            {filteredExecData.length > 0 && (
              <div className="p-6 md:p-8 border-t border-surface-border bg-white flex flex-col sm:flex-row items-center justify-between gap-6">
                <div className="text-[10px] font-black text-[#9ca3af] uppercase tracking-widest">
                  Operaciones: <span className="text-[#1d1c2d]">{filteredExecData.length}</span>
                </div>
                <div className="flex items-center gap-3">
                  <button 
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className="p-2.5 rounded-xl border border-surface-border text-[#1d1c2d] hover:bg-surface-subtle disabled:opacity-30 transition-all"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-black text-accent uppercase tracking-widest px-4 py-2 bg-surface-subtle rounded-lg">Página {currentPage} / {totalPages}</span>
                  </div>
                  <button 
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                    className="p-2.5 rounded-xl border border-surface-border text-[#1d1c2d] hover:bg-surface-subtle disabled:opacity-30 transition-all"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-accent/80 backdrop-blur-2xl animate-in fade-in duration-300" onClick={() => setShowModal(false)} />
          <div className="relative w-full max-w-5xl max-h-[95vh] bg-white rounded-[40px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 flex flex-col border border-white/20">
            <header className="p-8 md:p-10 border-b border-surface-border flex justify-between items-center bg-white shrink-0">
              <div className="flex items-center gap-4 md:gap-6">
                <div className="p-3 md:p-4 bg-[#1d1c2d] rounded-[20px] md:rounded-[24px] text-[#ceff04] shadow-xl"><ShieldCheck size={28} /></div>
                <div>
                  <h2 className="text-xl md:text-2xl font-black text-[#1d1c2d] tracking-tighter uppercase leading-none">Análisis Estratégico</h2>
                  <p className="text-[10px] font-black text-[#9ca3af] uppercase tracking-widest mt-1">Intelligence Verification v4.2</p>
                </div>
              </div>
              <button onClick={() => setShowModal(false)} className="p-3 hover:bg-[#f8f9fa] rounded-full transition-all text-[#9ca3af] hover:text-[#1d1c2d]">
                <X size={24} />
              </button>
            </header>
            <div className="flex-1 overflow-y-auto p-8 md:p-16 scroll-smooth hide-scrollbar bg-white">
              <DetailedOperationalReport />
            </div>
            <footer className="p-8 md:p-10 border-t border-surface-border bg-white flex justify-end shrink-0">
              <button 
                onClick={() => setShowModal(false)}
                className="w-full md:w-auto bg-[#1d1c2d] text-[#ceff04] font-black px-12 py-4 rounded-[20px] hover:bg-black transition-all uppercase text-[10px] tracking-widest shadow-2xl active:scale-95"
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
