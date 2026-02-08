
import React, { useState, useEffect, useMemo } from 'react';
import { 
  Globe, 
  Activity, 
  Coins, 
  Landmark, 
  Shield, 
  BarChart3, 
  Fingerprint, 
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
  
  // Paginación
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
      case 'diversificacion': return Fingerprint;
      case 'exposicion': return BarChart3;
      case 'riesgo': return Shield;
      default: return Activity;
    }
  };

  return (
    <div className="p-4 md:p-10 space-y-8 md:space-y-12 animate-in fade-in duration-700 max-w-[1800px] mx-auto">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <h1 className="text-[#1d1c2d] text-3xl md:text-5xl font-black tracking-tighter mb-1 uppercase">Portfolio Global</h1>
          <p className="text-text-secondary text-xs md:text-lg font-medium">Gestión institucional de activos y exposición de capital.</p>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-8 py-4 bg-[#1d1c2d] text-white hover:bg-black rounded-2xl transition-all shadow-xl active:scale-95 group"
        >
          <FileText size={18} className="text-[#ceff04] group-hover:scale-110 transition-transform" />
          <span className="text-[11px] font-black uppercase tracking-widest">Informe Trimestral</span>
        </button>
      </header>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {kpis.length > 0 ? kpis.map((kpi, i) => {
          const Icon = getKpiIcon(kpi.type);
          const isRiesgo = kpi.type === 'riesgo';
          const isExposicion = kpi.type === 'exposicion';
          
          // Cálculo dinámico para subtexto de exposición (Ej: $234.6k)
          let displaySub = kpi.sub;
          if (isExposicion && globalAum > 0) {
            const pctVal = parseSheetNumber(kpi.value);
            const dollarVal = (globalAum * (pctVal / 100)) / 1000;
            displaySub = `$${dollarVal.toFixed(1)}k ${kpi.label}`;
          }

          return (
            <div key={i} className="bg-white border border-surface-border rounded-[40px] p-10 shadow-sm hover:shadow-premium hover:-translate-y-1 transition-all group">
              <div className="flex justify-between items-start mb-10">
                <span className="text-[#9ca3af] text-[12px] font-black uppercase tracking-[0.2em]">{kpi.label}</span>
                <div className="p-2 bg-surface-subtle rounded-xl group-hover:bg-[#1d1c2d] group-hover:text-white transition-colors">
                  <Icon size={20} />
                </div>
              </div>
              <h4 className={`text-5xl font-black tracking-tighter mb-2 ${isRiesgo ? 'text-[#ceff04] drop-shadow-[0_0_10px_rgba(206,255,4,0.3)]' : 'text-[#1d1c2d]'}`}>
                {kpi.value}
              </h4>
              <p className="text-[12px] font-black text-[#6b7280] uppercase tracking-[0.15em]">{displaySub}</p>
            </div>
          );
        }) : [1,2,3].map(i => (
          <div key={i} className="bg-white border border-surface-border rounded-[40px] p-10 animate-pulse h-[240px]">
             <div className="flex justify-between items-start mb-10"><div className="h-4 w-32 bg-gray-100 rounded-lg"></div><div className="size-10 bg-gray-100 rounded-xl"></div></div>
             <div className="h-12 w-48 bg-gray-100 rounded-2xl mb-4"></div>
             <div className="h-4 w-24 bg-gray-100 rounded-lg"></div>
          </div>
        ))}
      </div>

      {/* Main Content Layout */}
      <div className="space-y-8">
        {/* Managed Assets Section */}
        <div className="bg-white rounded-[50px] border border-surface-border p-8 md:p-14 shadow-premium">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-surface-subtle rounded-2xl shadow-inner"><LayoutGrid size={24} className="text-[#1d1c2d]" /></div>
              <div>
                <h3 className="text-[#1d1c2d] text-2xl md:text-3xl font-black tracking-tighter uppercase leading-none">Activos Gestionados</h3>
                <p className="text-[10px] font-black text-[#9ca3af] uppercase tracking-[0.15em] mt-1 text-left">Desglose institucional de posiciones por categoría operativa</p>
              </div>
            </div>
            <div className="flex items-center gap-6 px-8 py-4 bg-surface-subtle rounded-3xl border border-surface-border">
               <div className="flex flex-col">
                  <span className="text-[9px] font-black text-[#9ca3af] uppercase tracking-widest">Global AUM</span>
                  <span className="text-xl font-black text-[#1d1c2d] leading-none">${(globalAum / 1000).toFixed(1)}k</span>
               </div>
               <div className="w-px h-8 bg-gray-200"></div>
               <div className="flex flex-col">
                  <span className="text-[9px] font-black text-[#9ca3af] uppercase tracking-widest">Categorías</span>
                  <span className="text-xl font-black text-[#1d1c2d] leading-none">{portfolioData.length}</span>
               </div>
            </div>
          </div>
          
          <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-24">
            <div className="w-full lg:w-[45%] h-[450px]">
              <AssetDonutChart data={portfolioData} totalAum={globalAum} />
            </div>
            
            <div className="w-full lg:w-[55%] grid grid-cols-1 sm:grid-cols-2 gap-x-12 gap-y-8">
              {portfolioData.map((item) => (
                <div key={item.name} className="flex flex-col gap-3 group border-b border-gray-50 pb-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="size-3 rounded-full shadow-sm group-hover:scale-125 transition-transform" style={{ backgroundColor: item.color }}></div>
                      <span className="text-[14px] font-bold text-[#6b7280] group-hover:text-[#1d1c2d] transition-colors">{item.name}</span>
                    </div>
                    <span className="text-[18px] font-black text-[#1d1c2d]">{item.value}%</span>
                  </div>
                  <div className="flex items-center justify-between pl-6">
                    <div className="h-1.5 flex-1 bg-gray-100 rounded-full overflow-hidden mr-4">
                       <div className="h-full transition-all duration-1000" style={{ backgroundColor: item.color, width: `${item.value}%` }}></div>
                    </div>
                    <span className="text-[11px] font-black text-text-muted uppercase tracking-tighter">
                      ${((globalAum * (item.value / 100)) / 1000).toFixed(1)}k
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Structural Resilience */}
        <div className="bg-[#1d1c2d] rounded-[40px] p-8 md:p-10 text-white shadow-xl relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-8">
             <div className="absolute top-0 right-0 p-10 opacity-5 pointer-events-none translate-x-1/4 -translate-y-1/4">
               <ShieldCheck size={200} />
             </div>
             
             <div className="flex flex-col md:flex-row items-center gap-8 relative z-10 w-full">
                <div className="shrink-0 flex items-center justify-center p-4 bg-white/10 rounded-3xl border border-white/10 shadow-inner">
                   <ShieldCheck size={40} className="text-[#ceff04]" />
                </div>
                <div className="space-y-2 text-center md:text-left flex-1">
                   <div className="flex items-center justify-center md:justify-start gap-3">
                     <span className="bg-[#ceff04] text-[#1d1c2d] text-[10px] font-black px-4 py-1.5 rounded-full uppercase tracking-widest shadow-neon">Auditada 2026</span>
                     <span className="text-gray-400 text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                       <Zap size={10} className="text-[#ceff04] animate-pulse" /> Security Active
                     </span>
                   </div>
                   <h3 className="text-3xl font-black uppercase tracking-tighter leading-none">Resiliencia Estructural Institucional</h3>
                   <p className="text-gray-400 text-sm font-medium max-w-3xl">
                     Nuestra arquitectura financiera está blindada mediante protocolos de diversificación multi-capa y auditoría en tiempo real, garantizando la integridad del capital bajo cualquier escenario de mercado.
                   </p>
                </div>
             </div>
        </div>

        {/* Operations Ledger */}
        <div className="space-y-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-[#1d1c2d] rounded-2xl text-[#ceff04] shadow-lg"><Database size={24} /></div>
              <div>
                <h2 className="text-[#1d1c2d] text-2xl font-black tracking-tighter uppercase leading-none">Libro de Operaciones</h2>
                <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest mt-1">Verificación Ledger en Tiempo Real</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2 bg-white p-2 rounded-3xl border border-surface-border shadow-sm overflow-x-auto max-w-full hide-scrollbar">
              {markets.map((m) => (
                <button
                  key={m.id}
                  onClick={() => setActiveMarket(m.id)}
                  className={`flex items-center gap-3 px-8 py-3.5 rounded-2xl transition-all whitespace-nowrap ${
                    activeMarket === m.id 
                      ? 'bg-[#ceff04] text-[#1d1c2d] shadow-md font-black scale-105' 
                      : 'text-text-muted hover:bg-gray-50 font-bold'
                  }`}
                >
                  <m.icon size={16} />
                  <span className="text-[11px] uppercase tracking-widest">{m.name}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="bg-white border border-surface-border rounded-[50px] overflow-hidden shadow-premium relative flex flex-col">
            <div className="p-10 border-b border-surface-border flex flex-col lg:flex-row gap-10 justify-between items-center bg-surface-subtle/20">
              <div className="flex bg-white p-1.5 rounded-2xl border border-surface-border w-full md:w-auto shadow-sm">
                <button 
                  onClick={() => setActiveTab('closed')}
                  className={`flex-1 md:flex-none flex items-center justify-center gap-4 px-10 py-4 rounded-xl text-[11px] font-black uppercase transition-all ${activeTab === 'closed' ? 'bg-[#1d1c2d] text-white shadow-lg' : 'text-[#6b7280] hover:text-[#1d1c2d]'}`}
                >
                  <History size={16} /> Histórico Auditoría
                </button>
                <button 
                  onClick={() => setActiveTab('open')}
                  className={`flex-1 md:flex-none flex items-center justify-center gap-4 px-10 py-4 rounded-xl text-[11px] font-black uppercase transition-all ${activeTab === 'open' ? 'bg-[#ceff04] text-[#1d1c2d] shadow-md' : 'text-[#6b7280] hover:text-[#1d1c2d]'}`}
                >
                  <TrendingUp size={16} /> Operaciones en Curso
                </button>
              </div>

              <div className="flex flex-col md:flex-row gap-4 w-full md:w-auto flex-1 max-w-2xl">
                <div className="relative flex-1">
                  <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-[#9ca3af]" size={18} />
                  <input 
                    type="text"
                    placeholder="Filtrar por Símbolo..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-14 pr-6 py-4 bg-white border border-surface-border rounded-2xl text-[12px] font-black text-[#1d1c2d] focus:ring-[#ceff04] focus:border-[#ceff04] transition-all"
                  />
                </div>
                <button 
                  onClick={() => syncExecData(activeMarket)}
                  disabled={isLoading}
                  className="flex items-center justify-center gap-4 px-10 py-4 bg-[#1d1c2d] text-white rounded-2xl hover:bg-black transition-all disabled:opacity-50 active:scale-95"
                >
                  <RefreshCw size={18} className={isLoading ? 'animate-spin' : ''} />
                  <span className="text-[11px] font-black uppercase tracking-widest">Sync</span>
                </button>
              </div>
            </div>

            <div className="min-h-[500px] relative overflow-x-auto">
              {isLoading && (
                <div className="absolute inset-0 bg-white/60 backdrop-blur-md z-50 flex flex-col items-center justify-center gap-4">
                  <div className="p-6 bg-[#1d1c2d] rounded-3xl shadow-2xl animate-bounce">
                    <RefreshCw size={40} className="text-[#ceff04] animate-spin" />
                  </div>
                  <p className="text-[12px] font-black text-[#1d1c2d] uppercase tracking-[0.3em]">Validando Ledger...</p>
                </div>
              )}

              <table className="w-full text-left border-collapse min-w-[1200px]">
                <thead>
                  <tr className="bg-[#f8f9fa] text-[10px] font-black text-[#9ca3af] uppercase tracking-[0.25em] border-b border-surface-border">
                    <th className="px-10 py-8">Ticket Auditoría</th>
                    <th className="px-6 py-8">Símbolo</th>
                    <th className="px-6 py-8">Acción</th>
                    <th className="px-6 py-8">Apertura</th>
                    {activeTab === 'closed' && <th className="px-6 py-8">Cierre</th>}
                    <th className="px-6 py-8 text-right">Precio In</th>
                    <th className="px-6 py-8 text-right">Neto USD</th>
                    <th className="px-6 py-8 text-right">Ganancia %</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {paginatedData.map((ex, idx) => (
                    <tr key={ex.ticket || idx} className="hover:bg-[#fcfcfc] transition-colors group">
                      <td className="px-10 py-8 text-[11px] font-black text-[#9ca3af]">#{ex.ticket}</td>
                      <td className="px-6 py-8 text-[14px] font-black text-[#1d1c2d]">{ex.symbol}</td>
                      <td className="px-6 py-8">
                        <span className={`text-[10px] font-black uppercase px-3.5 py-1.5 rounded-xl border ${ex.side.toLowerCase().includes('buy') ? 'bg-blue-50 text-blue-700 border-blue-100' : 'bg-red-50 text-red-700 border-red-100'}`}>
                          {ex.side}
                        </span>
                      </td>
                      <td className="px-6 py-8 text-[12px] font-bold text-[#6b7280]">{ex.open_time}</td>
                      {activeTab === 'closed' && <td className="px-6 py-8 text-[12px] font-bold text-[#6b7280]">{ex.close_time}</td>}
                      <td className="px-6 py-8 text-[14px] font-black text-[#1d1c2d] text-right">{ex.open_price}</td>
                      <td className={`px-6 py-8 text-[14px] font-black text-right ${ex.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {ex.profit.toLocaleString('es-ES', { minimumFractionDigits: 2 })} USD
                      </td>
                      <td className={`px-6 py-8 text-[14px] font-black text-right ${ex.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {ex.gain}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {filteredExecData.length === 0 && !isLoading && (
                <div className="py-40 text-center text-text-muted flex flex-col items-center justify-center space-y-4">
                  <FileSpreadsheet size={64} className="opacity-10" />
                  <p className="font-black uppercase tracking-[0.3em] text-[11px]">Sin operaciones registradas</p>
                </div>
              )}
            </div>

            {/* Pagination Controls */}
            {filteredExecData.length > 0 && (
              <div className="p-8 border-t border-surface-border bg-white flex flex-col sm:flex-row items-center justify-between gap-6">
                <div className="text-[11px] font-black text-[#9ca3af] uppercase tracking-[0.2em]">
                  Mostrando <span className="text-[#1d1c2d]">{paginatedData.length}</span> de <span className="text-[#1d1c2d]">{filteredExecData.length}</span> registros
                </div>
                <div className="flex items-center gap-3">
                  <button 
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className="p-3 rounded-xl border border-surface-border text-[#1d1c2d] hover:bg-surface-subtle disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                  >
                    <ChevronLeft size={18} />
                  </button>
                  <div className="flex items-center gap-2">
                    {[...Array(totalPages)].map((_, i) => {
                      const page = i + 1;
                      if (totalPages > 5 && (page > 1 && page < totalPages && Math.abs(page - currentPage) > 1)) {
                        if (page === currentPage - 2 || page === currentPage + 2) return <span key={page} className="text-gray-300 px-1">...</span>;
                        return null;
                      }
                      return (
                        <button
                          key={page}
                          onClick={() => setCurrentPage(page)}
                          className={`size-10 rounded-xl text-[11px] font-black transition-all ${currentPage === page ? 'bg-[#1d1c2d] text-white shadow-lg' : 'text-[#6b7280] hover:bg-surface-subtle'}`}
                        >
                          {page}
                        </button>
                      );
                    })}
                  </div>
                  <button 
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                    className="p-3 rounded-xl border border-surface-border text-[#1d1c2d] hover:bg-surface-subtle disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                  >
                    <ChevronRight size={18} />
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
          <div className="relative w-full max-w-5xl max-h-[95vh] bg-white rounded-[60px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 flex flex-col border border-white/20">
            <header className="p-10 border-b border-surface-border flex justify-between items-center bg-white shrink-0">
              <div className="flex items-center gap-6">
                <div className="p-4 bg-[#1d1c2d] rounded-[24px] text-[#ceff04] shadow-xl"><ShieldCheck size={32} /></div>
                <div>
                  <h2 className="text-2xl font-black text-[#1d1c2d] tracking-tighter uppercase leading-none">Análisis Operativo</h2>
                  <p className="text-[11px] font-black text-[#9ca3af] uppercase tracking-[0.2em] mt-1">Institutional Ledger Verification v4.2</p>
                </div>
              </div>
              <button onClick={() => setShowModal(false)} className="p-4 hover:bg-[#f8f9fa] rounded-full transition-all text-[#9ca3af] hover:text-[#1d1c2d]">
                <X size={28} />
              </button>
            </header>
            <div className="flex-1 overflow-y-auto p-12 lg:p-16 scroll-smooth hide-scrollbar bg-white">
              <DetailedOperationalReport />
            </div>
            <footer className="p-10 border-t border-surface-border bg-white flex justify-end shrink-0">
              <button 
                onClick={() => setShowModal(false)}
                className="bg-[#1d1c2d] text-[#ceff04] font-black px-16 py-5 rounded-[24px] hover:bg-black transition-all uppercase text-[11px] tracking-[0.3em] shadow-2xl active:scale-95"
              >
                Cerrar Auditoría
              </button>
            </footer>
          </div>
        </div>
      )}
    </div>
  );
};

export default Portfolio;
