
import React, { useState } from 'react';
import { X, Calendar, Check, Download, FileText, Loader2 } from 'lucide-react';
import { Report } from '../../types';
import { generateReportPDF } from '../../lib/pdfService';

interface ReportModalProps {
  report: Report;
  onClose: () => void;
}

const getContrastColor = (hex: string) => {
  if (!hex || !hex.startsWith('#')) return '#1d1c2d';
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
  return (yiq >= 128) ? '#1d1c2d' : '#ffffff';
};

const DEFAULT_MAP: Record<string, { bg: string, text: string }> = {
  'Resumen Ejecutivo': { bg: '#D9ECFF', text: '#1d1c2d' },
  'Mensual': { bg: '#D9ECFF', text: '#1d1c2d' },
  'Riesgos y Mitigación': { bg: '#D32F2F', text: '#ffffff' },
  'Estrategia': { bg: '#1F7A4D', text: '#ffffff' },
  'Auditoría': { bg: '#FFE8A3', text: '#78350f' },
  'Normativa': { bg: '#E8D9FF', text: '#581c87' }
};

const ReportModal: React.FC<ReportModalProps> = ({ report, onClose }) => {
  const [isExporting, setIsExporting] = useState(false);

  React.useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  const handleDownload = async () => {
    setIsExporting(true);
    try {
      await generateReportPDF(report);
    } finally {
      setIsExporting(false);
    }
  };

  const resolveColors = () => {
    if (report.color && report.color.startsWith('#')) {
      return { bg: report.color, text: getContrastColor(report.color) };
    }
    return DEFAULT_MAP[report.category] || { bg: '#f3f4f6', text: '#1d1c2d' };
  };

  const colors = resolveColors();
  const accentColor = report.color && report.color.startsWith('#') ? report.color : '#ceff04';

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
      <div 
        className="absolute inset-0 bg-accent/40 backdrop-blur-sm animate-in fade-in duration-300"
        onClick={onClose}
      />
      
      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-in zoom-in-95 fade-in duration-300">
        
        <div className="px-8 pt-8 pb-4 flex justify-between items-start border-b border-gray-50 bg-white sticky top-0 z-10">
          <div className="space-y-3 text-left">
            <span 
              className={`px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-widest border border-black/5`}
              style={{ backgroundColor: colors.bg, color: colors.text }}
            >
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
            <div 
              className="pl-4 border-l-4 py-1 text-left"
              style={{ borderLeftColor: accentColor }}
            >
              <p className="text-accent font-bold leading-relaxed">
                {report.highlight}
              </p>
            </div>
          )}

          <div className="space-y-10">
            {report.sections && report.sections.length > 0 ? (
              report.sections.map((section, idx) => (
                <section key={idx} className="space-y-4 text-left">
                  {section.titulo && (
                    <h4 className="text-lg font-black text-accent tracking-tight">
                      <span className="mr-2" style={{ color: accentColor }}>{idx + 1}.</span>
                      {section.titulo}
                    </h4>
                  )}
                  
                  {section.parrafos && section.parrafos.length > 0 && (
                    <div className="space-y-3">
                      {section.parrafos.map((p, pIdx) => (
                        <p key={pIdx} className="text-text-secondary text-sm leading-relaxed whitespace-pre-wrap">
                          {p}
                        </p>
                      ))}
                    </div>
                  )}

                  {section.items && section.items.length > 0 && (
                    <ul className="space-y-3 pl-2 mt-4">
                      {section.items.map((item, i) => (
                        <li key={i} className="flex items-start gap-3">
                          <div 
                            className="size-5 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
                            style={{ backgroundColor: `${accentColor}20` }}
                          >
                            <Check size={12} style={{ color: accentColor }} />
                          </div>
                          <span className="text-text-secondary text-sm leading-relaxed font-medium">{item}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </section>
              ))
            ) : (
              <div className="text-center py-10 opacity-50">
                <p className="text-xs font-black uppercase tracking-widest">Documento cargado correctamente.</p>
              </div>
            )}
          </div>

          {report.notaImportante && (
            <div className="bg-blue-50/50 border-l-4 border-blue-500 p-5 rounded-r-2xl text-left">
              <p className="text-[11px] leading-relaxed">
                <strong className="text-blue-900">Nota Importante:</strong> <span className="text-blue-800/80 font-medium">
                  {report.notaImportante}
                </span>
              </p>
            </div>
          )}
        </div>

        <div className="px-8 py-6 bg-gray-50/50 flex items-center justify-between gap-3 border-t border-gray-100 bg-white sticky bottom-0">
          <button 
            onClick={handleDownload}
            disabled={isExporting}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-black text-accent bg-primary hover:bg-primary-hover transition-all shadow-md disabled:opacity-50"
          >
            {isExporting ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
            <span>Exportar PDF</span>
          </button>
          
          <div className="flex gap-2">
            <button 
              onClick={onClose}
              className="px-6 py-2.5 rounded-xl text-xs font-black text-accent bg-white border border-surface-border hover:bg-white/50 transition-all"
            >
              Cerrar
            </button>
            <button 
              onClick={onClose}
              className="px-6 py-2.5 rounded-xl text-xs font-black text-white bg-accent hover:bg-accent/90 flex items-center gap-2 transition-all shadow-lg"
            >
              <Check size={14} style={{ color: accentColor }} />
              <span>Entendido</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportModal;
