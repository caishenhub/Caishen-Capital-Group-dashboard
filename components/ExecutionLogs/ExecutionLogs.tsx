
import React, { useState, useEffect, useMemo } from 'react';
import { 
  Database, 
  RefreshCw, 
  Search, 
  Filter, 
  TrendingUp, 
  History, 
  Zap, 
  AlertCircle,
  FileSpreadsheet,
  ChevronDown,
  Globe,
  Landmark,
  Coins
} from 'lucide-react';
import { fetchExecutionsFromApi, Execution, ExecutionData, MarketCategory } from '../../lib/googleSheets';

const ExecutionLogs: React.FC = () => {
  const [data, setData] = useState<ExecutionData>({ closed: [], open: [] });
  const [activeTab, setActiveTab] = useState<'closed' | 'open'>('closed');
  const [activeMarket, setActiveMarket] = useState<MarketCategory>('forex');
  const [isLoading, setIsLoading] = useState(false);
  const [errorSync, setErrorSync] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [actionFilter, setActionFilter] = useState('Todas');

  const syncData = async (category: MarketCategory) => {
    setIsLoading(true);
    setErrorSync(false);
    try {
      const result = await fetchExecutionsFromApi(category);
      setData(result);
    } catch (e) {
      console.error(`Fallo al sincronizar mercado ${category}:`, e);
      setErrorSync(true);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    syncData(activeMarket);
    // Auto-sync cada 3 minutos para el libro de ejecuciones
    const interval = setInterval(() => syncData(activeMarket), 180000);
    return () => clearInterval(interval);
  }, [activeMarket]);

  const filteredData = useMemo(() => {
    const list = activeTab === 'closed' ? data.closed : data.open;
    return list.filter(item => {
      const matchesSearch = item.symbol.toLowerCase().includes(searchTerm.toLowerCase()) || 
                           item.ticket.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesAction = actionFilter === 'Todas' || 
                           item.side.toLowerCase().includes(actionFilter.toLowerCase());
      return matchesSearch && matchesAction;
    });
  }, [data, activeTab, searchTerm, actionFilter]);

  const formatCurrency = (val: number) => {
    return (val >= 0 ? '+' : '') + val.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' USD';
  };

  const markets = [
    { id: 'forex' as MarketCategory, name: 'Forex', icon: Globe },
    { id: 'stocks' as MarketCategory, name: 'Acciones', icon: Landmark },
    { id: 'commodities' as MarketCategory, name: 'Commodities', icon: Coins },
  ];

  return (
    <div className="p-4 md:p-8 space-y-8 animate-in fade-in duration-700">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-4 mb-2">
            <div className="p-2 bg-accent rounded-xl text-primary shadow-lg">
              <Database size={24} />
            </div>
            <h1 className="text-accent text-2xl md:text-4xl font-black tracking-tighter uppercase leading-tight">Libro de Ejecuciones</h1>
            
            {/* BADGE LIVE MINIMALISTA */}
            <button 
              onClick={() => syncData(activeMarket)}
              disabled={isLoading}
              className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-white border border-surface-border rounded-full hover:shadow-premium transition-all active:scale-95 group"
            >
              <div className="relative flex size-2">
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75 ${!isLoading ? 'duration-1000' : 'duration-300'}`}></span>
                <span className="relative inline-flex rounded-full size-2 bg-primary"></span>
              </div>
              <span className="text-[9px] font-black text-accent uppercase tracking-widest">
                {isLoading ? 'Sincronizando...' : 'Live Ledger'}
              </span>
            </button>
          </div>
          <p className="text-text-secondary text-xs md:text-sm font-medium">Auditoría detallada de transacciones financieras en tiempo real.</p>
        </div>
      </header>

      {/* Selector de Mercados */}
      <div className="flex items-center gap-2 bg-white p-1.5 rounded-3xl border border-surface-border shadow-sm w-fit overflow-x-auto hide-scrollbar max-w-full">
        {markets.map((m) => (
          <button
            key={m.id}
            onClick={() => setActiveMarket(m.id)}
            className={`flex items-center gap-2 px-6 py-3 rounded-2xl transition-all ${
              activeMarket === m.id 
                ? 'bg-primary text-accent shadow-md scale-105 font-black' 
                : 'text-text-muted hover:bg-gray-50 font-bold'
            }`}
          >
            <m.icon size={16} />
            <span className="text-[10px] uppercase tracking-widest whitespace-nowrap">{m.name}</span>
          </button>
        ))}
      </div>

      {/* Panel de Filtros y Control */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-12 bg-white rounded-3xl border border-surface-border p-6 shadow-sm flex flex-col md:flex-row gap-6 justify-between items-center">
          
          <div className="flex bg-surface-subtle p-1 rounded-2xl border border-surface-border w-full md:w-auto">
            <button 
              onClick={() => setActiveTab('closed')}
              className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-8 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all ${activeTab === 'closed' ? 'bg-accent text-white shadow-lg' : 'text-text-muted hover:text-accent'}`}
            >
              <History size={14} /> Histórico ({data.closed.length})
            </button>
            <button 
              onClick={() => setActiveTab('open')}
              className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-8 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all ${activeTab === 'open' ? 'bg-primary text-accent shadow-md' : 'text-text-muted hover:text-accent'}`}
            >
              <TrendingUp size={14} /> En Curso ({data.open.length})
            </button>
          </div>

          <div className="flex flex-col md:flex-row gap-4 w-full md:w-auto flex-1 max-w-2xl">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" size={16} />
              <input 
                type="text"
                placeholder="Buscar por Símbolo o Ticket..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-surface-subtle border border-surface-border rounded-2xl text-[11px] font-bold text-accent focus:ring-primary focus:border-primary transition-all"
              />
            </div>
            <div className="relative min-w-[150px]">
              <Filter className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" size={14} />
              <select 
                value={actionFilter}
                onChange={(e) => setActionFilter(e.target.value)}
                className="w-full pl-10 pr-10 py-3 bg-surface-subtle border border-surface-border rounded-2xl text-[10px] font-black uppercase appearance-none cursor-pointer focus:ring-primary focus:border-primary"
              >
                <option>Todas</option>
                <option>Buy</option>
                <option>Sell</option>
              </select>
              <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" size={14} />
            </div>
          </div>
        </div>
      </div>

      {/* Vista de Tabla */}
      <div className="bg-white border border-surface-border rounded-[32px] overflow-hidden shadow-premium relative min-h-[500px]">
        {isLoading && (
          <div className="absolute inset-0 bg-white/60 backdrop-blur-md z-50 flex flex-col items-center justify-center gap-4">
            <div className="p-5 bg-accent rounded-3xl shadow-2xl animate-bounce">
              <RefreshCw size={40} className="text-primary animate-spin" />
            </div>
            <p className="text-xs font-black text-accent uppercase tracking-[0.3em]">Cargando libro de {activeMarket}...</p>
          </div>
        )}

        <div className="hidden lg:block overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-subtle text-[9px] font-black text-text-muted uppercase tracking-[0.15em] border-b border-surface-border">
                <th className="px-6 py-5 sticky left-0 bg-surface-subtle z-10">Ticket</th>
                <th className="px-4 py-5">Símbolo</th>
                <th className="px-4 py-5">Acción</th>
                <th className="px-4 py-5">Apertura</th>
                {activeTab === 'closed' && <th className="px-4 py-5">Cierre</th>}
                <th className="px-4 py-5 text-right">Precio In</th>
                {activeTab === 'closed' && <th className="px-4 py-5 text-right">Precio Out</th>}
                <th className="px-4 py-5 text-center">S/L</th>
                <th className="px-4 py-5 text-center">T/P</th>
                <th className="px-4 py-5 text-right">Neto USD</th>
                <th className="px-4 py-5 text-right">Ganancia %</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredData.map((ex, idx) => (
                <tr key={ex.ticket || idx} className="hover:bg-gray-50/80 transition-colors group">
                  <td className="px-6 py-5 sticky left-0 bg-white group-hover:bg-gray-50/80 z-10 text-[10px] font-black text-text-muted border-r border-gray-100">
                    #{ex.ticket}
                  </td>
                  <td className="px-4 py-5 text-[11px] font-black text-accent">{ex.symbol}</td>
                  <td className="px-4 py-5">
                    <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-md ${ex.side.toLowerCase().includes('buy') ? 'bg-blue-50 text-blue-600 border border-blue-100' : 'bg-red-50 text-red-600 border border-red-100'}`}>
                      {ex.side}
                    </span>
                  </td>
                  <td className="px-4 py-5 text-[10px] font-medium text-text-secondary whitespace-nowrap">{ex.open_time}</td>
                  {activeTab === 'closed' && <td className="px-4 py-5 text-[10px] font-medium text-text-secondary whitespace-nowrap">{ex.close_time}</td>}
                  <td className="px-4 py-5 text-[11px] font-black text-accent text-right">{ex.open_price}</td>
                  {activeTab === 'closed' && <td className="px-4 py-5 text-[11px] font-black text-accent text-right">{ex.close_price}</td>}
                  <td className="px-4 py-5 text-[10px] font-bold text-text-muted text-center">{ex.sl}</td>
                  <td className="px-4 py-5 text-[10px] font-bold text-text-muted text-center">{ex.tp}</td>
                  <td className={`px-4 py-5 text-[11px] font-black text-right ${ex.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    <div className="flex items-center justify-end gap-1">
                      {formatCurrency(ex.profit)}
                      {activeTab === 'open' && <Zap size={10} className="animate-pulse" />}
                    </div>
                  </td>
                  <td className={`px-4 py-5 text-[11px] font-black text-right ${ex.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {ex.gain}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Vista Móvil */}
        <div className="lg:hidden p-4 space-y-4">
          {filteredData.map((ex, idx) => (
            <div key={ex.ticket || idx} className="bg-white border-2 border-gray-100 rounded-3xl p-5 shadow-sm space-y-4">
              <div className="flex justify-between items-center border-b border-gray-100 pb-3">
                <div className="flex items-center gap-3">
                   <span className="text-[10px] font-black text-text-muted">#{ex.ticket}</span>
                   <h3 className="text-base font-black text-accent">{ex.symbol}</h3>
                </div>
                <span className={`text-[9px] font-black uppercase px-2.5 py-1 rounded-lg ${ex.side.toLowerCase().includes('buy') ? 'bg-blue-50 text-blue-600' : 'bg-red-50 text-red-600'}`}>
                  {ex.side}
                </span>
              </div>
              
              <div className="grid grid-cols-2 gap-y-4 gap-x-6">
                <div>
                   <p className="text-[9px] font-black text-text-muted uppercase tracking-widest">Apertura</p>
                   <p className="text-[10px] font-bold text-accent mt-0.5">{ex.open_time}</p>
                   <p className="text-xs font-black text-accent mt-1">{ex.open_price}</p>
                </div>
                {activeTab === 'closed' && (
                  <div>
                    <p className="text-[9px] font-black text-text-muted uppercase tracking-widest">Cierre</p>
                    <p className="text-[10px] font-bold text-accent mt-0.5">{ex.close_time}</p>
                    <p className="text-xs font-black text-accent mt-1">{ex.close_price}</p>
                  </div>
                )}
                <div>
                   <p className="text-[9px] font-black text-text-muted uppercase tracking-widest">S.L / T.P</p>
                   <p className="text-xs font-black text-accent mt-0.5">{ex.sl} / {ex.tp}</p>
                </div>
                <div>
                   <p className="text-[9px] font-black text-text-muted uppercase tracking-widest">Resultado</p>
                   <div className="flex items-center gap-2 mt-0.5">
                     <p className={`text-sm font-black ${ex.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>{formatCurrency(ex.profit)}</p>
                     {activeTab === 'open' && <Zap size={12} className="text-primary animate-pulse" />}
                   </div>
                   <p className={`text-[10px] font-bold mt-0.5 ${ex.profit >= 0 ? 'text-green-600/80' : 'text-red-600/80'}`}>Ganancia: {ex.gain}%</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredData.length === 0 && !isLoading && !errorSync && (
          <div className="py-32 text-center text-text-muted">
            <FileSpreadsheet size={48} className="mx-auto mb-4 opacity-10" />
            <p className="font-black uppercase tracking-[0.2em] text-xs">No hay registros en {activeMarket}</p>
            <p className="text-[10px] font-medium mt-2">Prueba cambiando de mercado o sincronizando datos.</p>
          </div>
        )}
      </div>

      <footer className="bg-accent rounded-3xl p-8 text-white flex flex-col md:flex-row justify-between items-center gap-6 shadow-2xl">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-white/10 rounded-2xl backdrop-blur-md">
            <Zap size={20} className="text-primary" />
          </div>
          <div>
            <h4 className="text-sm font-black uppercase tracking-tight">Auditoría Multi-Mercado Activa</h4>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Monitoreo de integridad para Forex, Stocks y Commodities.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default ExecutionLogs;
