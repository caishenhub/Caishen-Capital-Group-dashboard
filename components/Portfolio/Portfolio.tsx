
import React, { useState, useEffect, useMemo } from 'react';
import { 
  Building2, 
  Globe, 
  Activity, 
  Bitcoin, 
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
  Filter,
  History,
  TrendingUp,
  ChevronDown,
  Zap,
  AlertCircle,
  FileSpreadsheet
} from 'lucide-react';
import AssetDonutChart from './AssetDonutChart';
import { FINANCE_CONFIG } from '../../constants';
import DetailedOperationalReport from './DetailedOperationalReport';
import { fetchExecutionsFromApi, Execution, ExecutionData, MarketCategory } from '../../lib/googleSheets';

const Portfolio: React.FC = () => {
  const [showModal, setShowModal] = useState(false);
  
  // Estados para el Libro de Ejecuciones Integrado
  const [execData, setExecData] = useState<ExecutionData>({ closed: [], open: [] });
  const [activeTab, setActiveTab] = useState<'closed' | 'open'>('closed');
  const [activeMarket, setActiveMarket] = useState<MarketCategory>('forex');
  const [isLoading, setIsLoading] = useState(false);
  const [errorSync, setErrorSync] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [actionFilter, setActionFilter] = useState('Todas');

  const syncExecData = async (category: MarketCategory) => {
    setIsLoading(true);
    setErrorSync(false);
    try {
      const result = await fetchExecutionsFromApi(category);
      setExecData(result);
    } catch (e) {
      console.error(`Fallo al sincronizar mercado ${category}:`, e);
      setErrorSync(true);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    syncExecData(activeMarket);
  }, [activeMarket]);

  const filteredExecData = useMemo(() => {
    const list = activeTab === 'closed' ? execData.closed : execData.open;
    return list.filter(item => {
      const matchesSearch = item.symbol.toLowerCase().includes(searchTerm.toLowerCase()) || 
                           item.ticket.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesAction = actionFilter === 'Todas' || 
                           item.side.toLowerCase().includes(actionFilter.toLowerCase());
      return matchesSearch && matchesAction;
    });
  }, [execData, activeTab, searchTerm, actionFilter]);

  const formatCurrency = (val: number) => {
    return (val >= 0 ? '+' : '') + val.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' USD';
  };

  const markets = [
    { id: 'forex' as MarketCategory, name: 'Forex', icon: Globe },
    { id: 'stocks' as MarketCategory, name: 'Acciones', icon: Landmark },
    { id: 'commodities' as MarketCategory, name: 'Commodities', icon: Coins },
  ];

  return (
    <div className="p-4 md:p-10 space-y-6 md:space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <h1 className="text-accent text-2xl md:text-4xl font-black tracking-tighter mb-1 uppercase">Composición del Portafolio</h1>
          <p className="text-text-secondary text-xs md:text-base font-medium">Participación proporcional única diversificada.</p>
        </div>
        
        <button 
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-6 py-3 bg-accent text-white hover:bg-accent/90 rounded-2xl transition-all group/btn shadow-xl"
        >
          <FileText size={16} className="text-primary" />
          <span className="text-[10px] font-black uppercase tracking-widest">Informe Estratégico</span>
        </button>
      </header>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        <div className="xl:col-span-5 bg-white rounded-[32px] border border-surface-border p-5 md:p-8 shadow-premium flex flex-col h-full justify-center">
          <h3 className="text-accent text-lg font-extrabold tracking-tight mb-8 uppercase text-center">Matriz de Distribución</h3>
          <div className="w-full h-[300px] md:h-[400px] flex items-center justify-center">
            <AssetDonutChart />
          </div>
        </div>

        <div className="xl:col-span-7 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4">
            {[
              { label: 'Diversificación', value: '8,4/10', sub: 'Alta Dispersión', icon: Fingerprint, color: 'text-accent' },
              { label: 'Mayor Exposición', value: '30,90%', sub: 'Derivados', icon: BarChart3, color: 'text-accent' },
              { label: 'Riesgo Estructural', value: 'MODERADO', sub: 'Perfil Dinámico', icon: Shield, color: 'text-primary' }
            ].map((stat, i) => (
              <div key={i} className="bg-white border border-surface-border rounded-[24px] p-6 shadow-sm group hover:border-primary transition-all">
                <div className="flex justify-between items-start mb-2">
                  <span className="text-text-muted text-[9px] font-black uppercase tracking-widest block">{stat.label}</span>
                  <stat.icon size={14} className="text-text-muted group-hover:text-primary transition-colors" />
                </div>
                <h4 className={`text-xl md:text-2xl font-black tracking-tighter ${stat.color}`}>{stat.value}</h4>
                <p className="text-[10px] font-bold text-text-secondary mt-1 uppercase tracking-tight">{stat.sub}</p>
              </div>
            ))}
          </div>

          <div className="bg-accent rounded-[32px] p-8 text-white shadow-2xl relative overflow-hidden h-[300px] flex flex-col justify-center">
             <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
               <Shield size={180} />
             </div>
             <div className="relative z-10 space-y-4">
                <h3 className="text-2xl font-black uppercase tracking-tighter leading-none">Resguardo Institucional</h3>
                <p className="text-gray-400 text-sm font-medium leading-relaxed max-w-md">
                  El portafolio mantiene una estructura de capital protegida bajo protocolos de auditoría continua. La diversificación multi-mercado asegura una resiliencia superior ante la volatilidad sistémica.
                </p>
                <div className="flex items-center gap-2 text-primary font-black text-[10px] uppercase tracking-widest">
                   <div className="size-2 bg-primary rounded-full animate-pulse"></div>
                   Monitoreo en Tiempo Real Activo
                </div>
             </div>
          </div>
        </div>
      </div>

      {/* SECCIÓN: LIBRO DE EJECUCIONES INTEGRADO */}
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-accent rounded-xl text-primary shadow-lg">
              <Database size={20} />
            </div>
            <h2 className="text-accent text-xl md:text-2xl font-black tracking-tighter uppercase">Libro de Ejecuciones</h2>
          </div>
          
          <div className="flex items-center gap-2 bg-white p-1 rounded-2xl border border-surface-border shadow-sm">
            {markets.map((m) => (
              <button
                key={m.id}
                onClick={() => setActiveMarket(m.id)}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl transition-all ${
                  activeMarket === m.id 
                    ? 'bg-primary text-accent shadow-md font-black' 
                    : 'text-text-muted hover:bg-gray-50 font-bold'
                }`}
              >
                <m.icon size={14} />
                <span className="text-[9px] uppercase tracking-widest">{m.name}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="bg-white border border-surface-border rounded-[32px] overflow-hidden shadow-premium relative">
          {/* Header del Libro */}
          <div className="p-6 border-b border-surface-border flex flex-col lg:flex-row gap-6 justify-between items-center bg-surface-subtle/20">
            <div className="flex bg-white p-1 rounded-2xl border border-surface-border w-full md:w-auto">
              <button 
                onClick={() => setActiveTab('closed')}
                className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-8 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${activeTab === 'closed' ? 'bg-accent text-white shadow-lg' : 'text-text-muted hover:text-accent'}`}
              >
                <History size={14} /> Histórico ({execData.closed.length})
              </button>
              <button 
                onClick={() => setActiveTab('open')}
                className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-8 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${activeTab === 'open' ? 'bg-primary text-accent shadow-md' : 'text-text-muted hover:text-accent'}`}
              >
                <TrendingUp size={14} /> En Curso ({execData.open.length})
              </button>
            </div>

            <div className="flex flex-col md:flex-row gap-4 w-full md:w-auto flex-1 max-w-2xl">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" size={16} />
                <input 
                  type="text"
                  placeholder="Buscar símbolo o ticket..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-white border border-surface-border rounded-2xl text-[11px] font-bold text-accent focus:ring-primary focus:border-primary transition-all"
                />
              </div>
              <button 
                onClick={() => syncExecData(activeMarket)}
                disabled={isLoading}
                className="flex items-center justify-center gap-2 px-6 py-3 bg-accent text-white rounded-2xl hover:bg-accent/90 transition-all disabled:opacity-50"
              >
                <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
                <span className="text-[10px] font-black uppercase tracking-widest">Sincronizar</span>
              </button>
            </div>
          </div>

          {/* Tabla Financiera */}
          <div className="min-h-[400px] relative">
            {isLoading && (
              <div className="absolute inset-0 bg-white/60 backdrop-blur-md z-50 flex flex-col items-center justify-center gap-4">
                <RefreshCw size={32} className="text-primary animate-spin" />
                <p className="text-[10px] font-black text-accent uppercase tracking-widest">Actualizando auditoría de {activeMarket}...</p>
              </div>
            )}

            <div className="overflow-x-auto">
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
                  {filteredExecData.map((ex, idx) => (
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

            {filteredExecData.length === 0 && !isLoading && !errorSync && (
              <div className="py-24 text-center text-text-muted">
                <FileSpreadsheet size={48} className="mx-auto mb-4 opacity-10" />
                <p className="font-black uppercase tracking-[0.2em] text-xs">No hay ejecuciones registradas en {activeMarket}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-accent/80 backdrop-blur-xl animate-in fade-in duration-300" onClick={() => setShowModal(false)} />
          <div className="relative w-full max-w-4xl max-h-[95vh] bg-white rounded-[40px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 flex flex-col border border-white/20">
            <header className="p-8 border-b border-surface-border bg-white flex justify-between items-center shrink-0">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-primary rounded-2xl text-accent shadow-lg">
                  <Shield size={24} />
                </div>
                <div>
                  <h2 className="text-xl font-black text-accent tracking-tighter uppercase leading-none">Análisis Técnico Operativo</h2>
                  <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest mt-1">Informe de Estructura y Distribución de Activos</p>
                </div>
              </div>

              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-surface-subtle rounded-xl transition-all text-text-muted">
                <X size={24} />
              </button>
            </header>
            
            <div className="flex-1 overflow-y-auto p-8 lg:p-12 scroll-smooth hide-scrollbar bg-[#fcfcfc]">
              <DetailedOperationalReport />
            </div>

            <footer className="p-8 border-t border-surface-border bg-white flex justify-end shrink-0">
              <button 
                onClick={() => setShowModal(false)}
                className="bg-accent text-primary font-black px-12 py-5 rounded-2xl hover:bg-accent/90 transition-all uppercase text-[10px] tracking-[0.2em] shadow-xl border border-primary/20 active:scale-95"
              >
                Cerrar Informe
              </button>
            </footer>
          </div>
        </div>
      )}
    </div>
  );
};

export default Portfolio;
