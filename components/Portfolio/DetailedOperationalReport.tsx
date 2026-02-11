
import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  Target, 
  TrendingUp, 
  Landmark, 
  Globe, 
  Coins, 
  Bitcoin, 
  Building2, 
  RefreshCw, 
  FileText,
  Quote,
  Zap
} from 'lucide-react';
import { fetchStrategicReport, StrategicReportSection } from '../../lib/googleSheets';

const DetailedOperationalReport: React.FC = () => {
  const [sections, setSections] = useState<StrategicReportSection[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadReport = async () => {
      setIsLoading(true);
      try {
        const data = await fetchStrategicReport();
        setSections(data);
      } catch (e) {
        console.error("Error al cargar informe estratégico:", e);
      } finally {
        setIsLoading(false);
      }
    };
    loadReport();
  }, []);

  if (isLoading) {
    return (
      <div className="py-24 flex flex-col items-center justify-center gap-6">
        <div className="size-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
        <p className="text-[10px] font-black text-accent uppercase tracking-widest">Validando Reporte Maestro...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-10 md:space-y-20 pb-10 animate-in fade-in slide-in-from-bottom-6 duration-700">
      {sections.map((section) => {
        switch (section.tipo) {
          case 'PREVIEW':
            return (
              <section key={section.id} className="space-y-4 md:space-y-6">
                <h2 className="text-accent text-2xl md:text-4xl font-black tracking-tighter uppercase leading-tight">
                  {section.seccion_titulo}
                </h2>
                <div className="text-text-secondary text-sm md:text-xl leading-relaxed font-medium border-l-4 border-primary pl-5 md:pl-8 py-1 text-justify">
                  {section.contenido}
                </div>
              </section>
            );

          case 'PORTADA':
            return (
              <header key={section.id} className="text-center space-y-6 md:space-y-10 py-6 md:py-12">
                <h1 className="text-3xl md:text-7xl font-black text-accent tracking-tighter uppercase leading-[0.85]">
                  {section.seccion_titulo}
                </h1>
                <div className="flex flex-col items-center gap-4">
                  <div className="h-1.5 w-20 md:w-32 bg-primary rounded-full shadow-neon"></div>
                  <p className="text-text-muted text-[9px] md:text-sm font-black uppercase tracking-[0.4em]">
                    {section.contenido}
                  </p>
                </div>
              </header>
            );

          case 'SECCION':
            return (
              <section key={section.id} className="space-y-4 md:space-y-8">
                <div className="flex items-center gap-4 md:gap-6 border-b border-gray-100 pb-4 md:pb-6">
                  <span className="text-primary font-black text-2xl md:text-5xl tracking-tighter">{section.seccion_id}.</span>
                  <h2 className="text-xl md:text-3xl font-black text-accent tracking-tight uppercase">
                    {section.seccion_titulo}
                  </h2>
                </div>
                <div className="text-text-secondary text-sm md:text-lg leading-relaxed font-medium whitespace-pre-wrap text-justify">
                  {section.contenido}
                </div>
              </section>
            );

          case 'CARD':
            return (
              <div key={section.id} className="bg-surface-subtle border border-surface-border rounded-[32px] md:rounded-[48px] p-6 md:p-10 hover:bg-white hover:shadow-premium transition-all group">
                <div className="flex gap-5 md:gap-8 items-start">
                  <div className="size-12 md:size-16 bg-accent rounded-2xl md:rounded-3xl flex items-center justify-center text-primary shrink-0 shadow-lg">
                    <Target size={24} md:size={32} />
                  </div>
                  <div className="space-y-2 md:space-y-3">
                    <h4 className="text-sm md:text-lg font-black text-accent uppercase tracking-tight">
                      {section.subseccion_titulo}
                    </h4>
                    <p className="text-xs md:text-base text-text-secondary font-bold leading-relaxed">
                      {section.contenido}
                    </p>
                  </div>
                </div>
              </div>
            );

          case 'BLOQUE_OSCURO':
            return (
              <section key={section.id} className="bg-accent rounded-[32px] md:rounded-[50px] p-8 md:p-16 text-white space-y-6 md:space-y-10 shadow-2xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-10 opacity-5 pointer-events-none group-hover:scale-105 transition-transform duration-1000">
                  <ShieldCheck size={180} md:size={250} />
                </div>
                <div className="relative z-10 space-y-4 md:space-y-6">
                  <h2 className="text-2xl md:text-4xl font-black tracking-tighter uppercase">{section.seccion_titulo}</h2>
                  <div className="h-1.5 w-14 md:w-24 bg-primary rounded-full"></div>
                  <p className="text-gray-300 text-sm md:text-xl leading-relaxed font-medium text-justify">
                    {section.contenido}
                  </p>
                </div>
              </section>
            );

          case 'CONCLUSION':
            return (
              <section key={section.id} className="py-10 md:py-20 text-center border-y border-gray-100 space-y-6 md:space-y-10">
                <Quote className="mx-auto text-primary opacity-20" size={40} md:size={64} />
                <p className="text-accent font-black text-xl md:text-4xl tracking-tighter uppercase italic leading-tight px-4 md:px-20">
                  "{section.contenido}"
                </p>
                <div className="space-y-2">
                  <div className="h-1 w-12 md:w-20 bg-primary mx-auto rounded-full"></div>
                  <p className="text-[8px] md:text-xs font-black text-text-muted uppercase tracking-[0.4em]">{section.seccion_titulo}</p>
                </div>
              </section>
            );

          case 'FOOTER':
            return (
              <footer key={section.id} className="text-center pt-10 md:pt-20">
                <p className="text-[8px] md:text-[11px] font-black text-text-muted uppercase tracking-[0.3em] leading-relaxed max-w-3xl mx-auto">
                  {section.contenido}
                </p>
              </footer>
            );

          default:
            return null;
        }
      })}
    </div>
  );
};

export default DetailedOperationalReport;
