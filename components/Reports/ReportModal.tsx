
import React from 'react';
import { X, Calendar, Check } from 'lucide-react';
import { Report } from '../../types';

interface ReportModalProps {
  report: Report;
  onClose: () => void;
}

const ReportModal: React.FC<ReportModalProps> = ({ report, onClose }) => {
  React.useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'Mensual': return 'bg-blue-50 text-blue-700 border-blue-100';
      case 'Auditoría': return 'bg-orange-50 text-orange-700 border-orange-100';
      case 'Estrategia': return 'bg-green-50 text-green-700 border-green-100';
      case 'Riesgos y Mitigación': return 'bg-red-50 text-red-700 border-red-100';
      default: return 'bg-gray-50 text-gray-700 border-gray-100';
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
      <div 
        className="absolute inset-0 bg-accent/40 backdrop-blur-sm animate-in fade-in duration-300"
        onClick={onClose}
      />
      
      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-in zoom-in-95 fade-in duration-300">
        
        <div className="px-8 pt-8 pb-4 flex justify-between items-start border-b border-gray-50">
          <div className="space-y-3">
            <span className={`px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-widest border ${getCategoryColor(report.category)}`}>
              {report.category === 'Riesgos y Mitigación' ? 'RIESGOS' : report.category}
            </span>
            <h2 className="text-2xl font-black text-accent tracking-tighter leading-tight">
              {report.title}
            </h2>
            <div className="flex items-center gap-2 text-text-muted text-[10px] font-bold">
              <Calendar size={12} />
              <span>{report.date}</span>
              <span className="mx-1">•</span>
              <span>{report.category}</span>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors text-text-muted"
          >
            <X size={24} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-8 space-y-8 hide-scrollbar">
          {report.highlight && (
            <div className="pl-4 border-l-4 border-primary py-1">
              <p className="text-accent font-bold leading-relaxed">
                {report.highlight}
              </p>
            </div>
          )}

          <div className="space-y-8">
            {report.sections?.map((section, idx) => (
              <section key={idx} className="space-y-3">
                <h4 className="text-lg font-black text-accent tracking-tight">{section.title}</h4>
                <p className="text-text-secondary text-sm leading-relaxed whitespace-pre-wrap">
                  {section.content}
                </p>
                {section.items && (
                  <ul className="space-y-2 pl-2">
                    {section.items.map((item, i) => (
                      <li key={i} className="flex items-start gap-3">
                        <div className="size-1.5 rounded-full bg-text-muted mt-2 shrink-0" />
                        <span className="text-text-secondary text-sm leading-relaxed">{item}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            ))}
          </div>

          <div className="bg-blue-50/50 border-l-4 border-blue-500 p-5 rounded-r-2xl">
            <p className="text-[11px] leading-relaxed">
              <strong className="text-blue-900">Nota Importante:</strong> <span className="text-blue-800/80 font-medium">Este documento es confidencial y para uso exclusivo de los miembros autorizados de Caishen Capital Group.</span>
            </p>
          </div>
        </div>

        <div className="px-8 py-6 bg-gray-50/50 flex items-center justify-end gap-3 border-t border-gray-100">
          <button 
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl text-xs font-black text-accent bg-white border border-surface-border hover:bg-white/50 transition-colors"
          >
            Cerrar
          </button>
          <button 
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl text-xs font-black text-white bg-accent hover:bg-accent/90 flex items-center gap-2 transition-all"
          >
            <Check size={14} className="text-primary" />
            <span>Entendido</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReportModal;
