
import React from 'react';
import { FileText, ShieldAlert, Zap, Gavel, Calendar, ArrowRight, Shield } from 'lucide-react';
import { Report } from '../../types';
import { norm } from '../../lib/googleSheets';

interface ReportCardProps {
  report: Report;
  onView: (report: Report) => void;
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
  'resumenejecutivo': { bg: '#D9ECFF', text: '#1d1c2d' },
  'mensual': { bg: '#D9ECFF', text: '#1d1c2d' },
  'riesgosymitigacion': { bg: '#D32F2F', text: '#ffffff' },
  'estrategia': { bg: '#1F7A4D', text: '#ffffff' },
  'auditoria': { bg: '#FFE8A3', text: '#78350f' },
  'normativa': { bg: '#E8D9FF', text: '#581c87' }
};

const ReportCard: React.FC<ReportCardProps> = ({ report, onView }) => {
  const getCategoryIcon = (category: string) => {
    const c = norm(category);
    if (c === 'mensual' || c === 'resumenejecutivo') return <FileText className="size-8" />;
    if (c === 'riesgosymitigacion') return <Shield className="size-8" />;
    if (c === 'auditoria') return <ShieldAlert className="size-8" />;
    if (c === 'estrategia') return <Zap className="size-8" />;
    if (c === 'normativa') return <Gavel className="size-8" />;
    return <FileText className="size-8" />;
  };

  const resolveColors = () => {
    if (report.color && report.color.startsWith('#')) {
      return { bg: report.color, text: getContrastColor(report.color) };
    }
    const c = norm(report.category);
    return DEFAULT_MAP[c] || { bg: '#f3f4f6', text: '#1d1c2d' };
  };

  const colors = resolveColors();
  const icon = getCategoryIcon(report.category);

  return (
    <article className="bg-white rounded-3xl p-8 border border-surface-border hover:shadow-xl hover:border-primary/50 transition-all duration-300 group flex flex-col md:flex-row gap-8 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-1.5 h-full bg-primary opacity-0 group-hover:opacity-100 transition-opacity"></div>
      
      <div className="flex-shrink-0">
        <div 
          className={`w-16 h-16 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-center text-accent group-hover:bg-primary transition-all duration-300 group-hover:scale-105 group-hover:shadow-md`}
        >
          {icon}
        </div>
      </div>

      <div className="flex-1 flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-4">
            <span 
              className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border border-black/5`}
              style={{ backgroundColor: colors.bg, color: colors.text }}
            >
              {norm(report.category) === 'riesgosymitigacion' ? 'RIESGOS' : report.category}
            </span>
            <div className="flex items-center gap-1.5 text-text-muted text-[10px] font-bold">
              <Calendar size={12} />
              <span>{report.date}</span>
            </div>
          </div>
          <h3 className={`text-2xl font-black text-accent tracking-tighter transition-colors group-hover:text-primary-hover`}>
            {report.title}
          </h3>
        </div>

        <p className="text-text-secondary text-sm leading-relaxed text-justify font-medium line-clamp-2 md:line-clamp-3">
          {report.summary}
        </p>

        <div className="pt-4 mt-auto">
          <button 
            onClick={() => onView(report)}
            className="inline-flex items-center gap-2 text-xs font-black text-accent uppercase tracking-widest group/btn transition-all"
          >
            <span className="group-hover/btn:underline decoration-2 underline-offset-4 decoration-primary">Leer informe completo</span>
            <ArrowRight size={16} className="text-primary group-hover/btn:translate-x-2 transition-transform" />
          </button>
        </div>
      </div>
    </article>
  );
};

export default ReportCard;
