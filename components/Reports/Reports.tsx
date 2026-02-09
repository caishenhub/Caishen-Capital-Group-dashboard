
import React, { useState, useEffect } from 'react';
import { ChevronDown, Search, RefreshCw, FileText } from 'lucide-react';
import ReportCard from './ReportCard';
import ReportModal from './ReportModal';
import { Report } from '../../types';
import { fetchReportsAdmin, norm } from '../../lib/googleSheets';

const FILTERS = [
  'Todos',
  'Resumen Ejecutivo',
  'Riesgos y Mitigación',
  'Estrategia',
  'Auditoría',
  'Normativa'
];

const Reports: React.FC = () => {
  const [activeFilter, setActiveFilter] = useState('Todos');
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [allReports, setAllReports] = useState<Report[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadReports = async (ignoreCache = false) => {
    setIsLoading(true);
    try {
      const data = await fetchReportsAdmin(ignoreCache);
      setAllReports(data);
    } catch (e) {
      console.error("Error al cargar reportes:", e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadReports(false);
  }, []);

  const filteredReports = allReports.filter(report => {
    const cat = norm(report.category);
    
    if (activeFilter === 'Todos') {
      return report.visibleEnTodos === true;
    }
    
    if (norm(activeFilter) === norm('Resumen Ejecutivo')) {
      return cat === norm('Mensual') || cat === norm('Resumen Ejecutivo');
    }
    
    if (norm(activeFilter) === norm('Riesgos y Mitigación')) {
      return cat === norm('Auditoria') || cat === norm('Riesgos y Mitigación') || cat === norm('Riesgos y Mitigacion');
    }

    if (norm(activeFilter) === norm('Auditoría')) {
      return cat === norm('Auditoria') || cat === norm('Auditoría');
    }
    
    return cat === norm(activeFilter);
  });

  return (
    <div className="p-8 lg:p-12 space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700 max-w-5xl mx-auto">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div className="space-y-4 text-left">
          <h1 className="text-accent text-4xl lg:text-5xl font-black tracking-tighter uppercase leading-none">Comunicados Administrativos</h1>
          <p className="text-text-secondary text-lg font-medium max-w-2xl leading-relaxed">
            Informes oficiales, análisis de riesgos y actualizaciones estratégicas para los Accionistas de Caishen Capital Group.
          </p>
        </div>
        
        {/* Nuevo botón estilo Live Ledger */}
        <button 
          onClick={() => loadReports(true)} 
          disabled={isLoading}
          className="flex items-center gap-2 px-6 py-3 bg-white border border-surface-border rounded-full hover:shadow-premium transition-all active:scale-95 text-accent group cursor-pointer shrink-0"
        >
          <div className="relative flex size-2">
            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75 ${isLoading ? 'duration-300' : 'duration-1000'}`}></span>
            <span className="relative inline-flex rounded-full size-2 bg-primary"></span>
          </div>
          <span className="text-[10px] font-black uppercase tracking-[0.2em]">
            {isLoading ? 'Sincronizando...' : 'Live Ledger'}
          </span>
        </button>
      </header>

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide w-full sm:w-auto">
          {FILTERS.map((filter) => (
            <button
              key={filter}
              onClick={() => setActiveFilter(filter)}
              className={`px-6 py-2.5 rounded-full text-xs font-black transition-all whitespace-nowrap border-2 ${
                activeFilter === filter 
                  ? 'bg-accent text-white border-accent shadow-premium scale-105' 
                  : 'bg-white text-text-muted border-surface-border hover:border-primary hover:text-accent'
              }`}
            >
              {filter}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {isLoading ? (
          <div className="py-24 flex flex-col items-center justify-center gap-6 bg-white rounded-3xl border border-surface-border">
            <RefreshCw className="animate-spin text-primary" size={40} />
            <p className="text-xs font-black text-accent uppercase tracking-widest">Descargando Archivos de la Nube...</p>
          </div>
        ) : filteredReports.length > 0 ? (
          filteredReports.map((report) => (
            <ReportCard 
              key={report.id} 
              report={report} 
              onView={(r) => setSelectedReport(r)} 
            />
          ))
        ) : (
          <div className="py-20 text-center space-y-4 bg-white rounded-3xl border-2 border-dashed border-surface-border">
            <div className="size-16 bg-surface-subtle rounded-full flex items-center justify-center mx-auto text-text-muted">
              <Search size={32} />
            </div>
            <p className="text-text-muted font-bold text-lg tracking-tight text-center">No se encontraron reportes en esta categoría.</p>
            <button 
              onClick={() => setActiveFilter('Todos')}
              className="text-primary font-black uppercase text-xs tracking-widest hover:underline"
            >
              Ver todos los reportes
            </button>
          </div>
        )}
      </div>

      {!isLoading && filteredReports.length > 0 && (
        <div className="pt-8 flex justify-center">
          <button className="flex flex-col items-center gap-2 group">
            <span className="text-xs font-black text-text-muted uppercase tracking-widest group-hover:text-accent transition-colors">Repositorio Completo</span>
            <div className="p-2 bg-white border border-surface-border rounded-full shadow-sm group-hover:border-primary transition-all">
              <ChevronDown size={16} className="text-text-muted group-hover:text-accent group-hover:translate-y-1 transition-all" />
            </div>
          </button>
        </div>
      )}

      {selectedReport && (
        <ReportModal 
          report={selectedReport} 
          onClose={() => setSelectedReport(null)} 
        />
      )}
    </div>
  );
};

export default Reports;
