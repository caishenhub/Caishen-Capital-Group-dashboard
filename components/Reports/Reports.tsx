
import React, { useState } from 'react';
import { ChevronDown, Search } from 'lucide-react';
import { MOCK_REPORTS } from '../../constants';
import ReportCard from './ReportCard';
import ReportModal from './ReportModal';
import { Report } from '../../types';

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

  const filteredReports = MOCK_REPORTS.filter(report => {
    if (activeFilter === 'Todos') return true;
    
    // Mapeo flexible para la UI
    if (activeFilter === 'Resumen Ejecutivo') {
      return report.category === 'Mensual' || report.category === 'Resumen Ejecutivo';
    }
    if (activeFilter === 'Riesgos y Mitigación') {
      return report.category === 'Auditoría' || report.category === 'Riesgos y Mitigación';
    }
    
    return report.category === activeFilter;
  });

  return (
    <div className="p-8 lg:p-12 space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700 max-w-5xl mx-auto">
      <header className="space-y-4">
        <div className="flex flex-col gap-2">
          <h1 className="text-accent text-4xl lg:text-5xl font-black tracking-tighter">Comunicados Administrativos</h1>
          <p className="text-text-secondary text-lg font-medium max-w-2xl leading-relaxed">
            Informes oficiales, análisis de riesgos y actualizaciones estratégicas para los Accionistas de Caishen Capital Group.
          </p>
        </div>
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
        {filteredReports.length > 0 ? (
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
            <p className="text-text-muted font-bold text-lg tracking-tight">No se encontraron reportes en esta categoría.</p>
            <button 
              onClick={() => setActiveFilter('Todos')}
              className="text-primary font-black uppercase text-xs tracking-widest hover:underline"
            >
              Ver todos los reportes
            </button>
          </div>
        )}
      </div>

      {filteredReports.length > 0 && (
        <div className="pt-8 flex justify-center">
          <button className="flex flex-col items-center gap-2 group">
            <span className="text-xs font-black text-text-muted uppercase tracking-widest group-hover:text-accent transition-colors">Cargar más reportes</span>
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
