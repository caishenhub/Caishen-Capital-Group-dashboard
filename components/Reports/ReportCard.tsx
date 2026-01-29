
import React from 'react';
import { FileText, ShieldAlert, Zap, Gavel, Calendar, ArrowRight, Shield } from 'lucide-react';
import { Report } from '../../types';

interface ReportCardProps {
  report: Report;
  onView: (report: Report) => void;
}

const ReportCard: React.FC<ReportCardProps> = ({ report, onView }) => {
  const getCategoryStyles = (category: string) => {
    switch (category) {
      case 'Mensual':
        return { 
          badge: 'bg-blue-50 text-blue-700 border-blue-100', 
          icon: <FileText className="size-8" />,
          hoverBg: 'group-hover:bg-blue-50',
          titleHover: 'group-hover:text-blue-900'
        };
      case 'Riesgos y Mitigación':
        return { 
          badge: 'bg-red-50 text-red-700 border-red-100', 
          icon: <Shield className="size-8" />,
          hoverBg: 'group-hover:bg-red-50',
          titleHover: 'group-hover:text-red-900'
        };
      case 'Auditoría':
        return { 
          badge: 'bg-orange-50 text-orange-700 border-orange-100', 
          icon: <ShieldAlert className="size-8" />,
          hoverBg: 'group-hover:bg-orange-50',
          titleHover: 'group-hover:text-orange-900'
        };
      case 'Estrategia':
        return { 
          badge: 'bg-green-50 text-green-700 border-green-100', 
          icon: <Zap className="size-8" />,
          hoverBg: 'group-hover:bg-green-50',
          titleHover: 'group-hover:text-green-900'
        };
      case 'Normativa':
        return { 
          badge: 'bg-purple-50 text-purple-700 border-purple-100', 
          icon: <Gavel className="size-8" />,
          hoverBg: 'group-hover:bg-purple-50',
          titleHover: 'group-hover:text-purple-900'
        };
      default:
        return { 
          badge: 'bg-gray-50 text-gray-700 border-gray-100', 
          icon: <FileText className="size-8" />,
          hoverBg: 'group-hover:bg-gray-100',
          titleHover: 'group-hover:text-accent'
        };
    }
  };

  const styles = getCategoryStyles(report.category);

  return (
    <article className="bg-white rounded-3xl p-8 border border-surface-border hover:shadow-xl hover:border-primary/50 transition-all duration-300 group flex flex-col md:flex-row gap-8 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-1.5 h-full bg-primary opacity-0 group-hover:opacity-100 transition-opacity"></div>
      
      <div className="flex-shrink-0">
        <div className={`w-16 h-16 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-center text-accent group-hover:bg-primary transition-all duration-300 group-hover:scale-105 group-hover:shadow-md`}>
          {styles.icon}
        </div>
      </div>

      <div className="flex-1 flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-4">
            <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border ${styles.badge}`}>
              {report.category === 'Riesgos y Mitigación' ? 'RIESGOS' : report.category}
            </span>
            <div className="flex items-center gap-1.5 text-text-muted text-[10px] font-bold">
              <Calendar size={12} />
              <span>{report.date}</span>
            </div>
          </div>
          <h3 className={`text-2xl font-black text-accent tracking-tighter transition-colors ${styles.titleHover}`}>
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
