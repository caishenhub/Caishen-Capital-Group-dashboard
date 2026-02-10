
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
        <div className="relative">
          <div className="size-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
          <RefreshCw size={24} className="absolute inset-0 m-auto text-primary animate-pulse" />
        </div>
        <p className="text-xs font-black text-accent uppercase tracking-[0.3em]">Validando Reporte Maestro...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-16 pb-20 animate-in fade-in slide-in-from-bottom-6 duration-700">
      {sections.map((section) => {
        switch (section.tipo) {
          case 'PREVIEW':
            return (
              <section key={section.id} className="pt-8 space-y-6">
                <h2 className="text-accent text-3xl font-black tracking-tighter uppercase leading-tight">
                  {section.seccion_titulo}
                </h2>
                <div className="text-text-secondary text-lg leading-relaxed font-medium whitespace-pre-wrap border-l-4 border-primary pl-6 py-2 text-justify">
                  {section.contenido}
                </div>
              </section>
            );

          case 'SELLO':
            return (
              <div key={section.id} className="flex justify-start">
                <div className="flex items-center gap-2 px-4 py-2 bg-surface-subtle border border-surface-border rounded-xl">
                  <ShieldCheck size={14} className="text-primary" />
                  <span className="text-[10px] font-black text-accent uppercase tracking-[0.2em]">{section.contenido}</span>
                </div>
              </div>
            );

          case 'PORTADA':
            return (
              <header key={section.id} className="text-center space-y-6 pt-12">
                <h1 className="text-4xl lg:text-6xl font-black text-accent tracking-tighter uppercase leading-tight">
                  {section.seccion_titulo}
                </h1>
                <div className="flex flex-col items-center gap-4">
                  <div className="h-1.5 w-24 bg-primary rounded-full shadow-neon"></div>
                  <p className="text-text-muted text-sm font-black uppercase tracking-[0.4em]">
                    {section.contenido}
                  </p>
                </div>
              </header>
            );

          case 'SECCION':
            return (
              <section key={section.id} className="space-y-6">
                <div className="flex items-center gap-4 border-b border-gray-100 pb-4">
                  <span className="text-primary font-black text-3xl tracking-tighter">{section.seccion_id}.</span>
                  <h2 className="text-2xl font-black text-accent tracking-tight uppercase">
                    {section.seccion_titulo}
                  </h2>
                </div>
                <div className="text-text-secondary text-base md:text-lg leading-relaxed font-medium whitespace-pre-wrap text-justify">
                  {section.contenido}
                </div>
              </section>
            );

          case 'CARD':
            return (
              <div key={section.id} className="bg-surface-subtle border border-surface-border rounded-[32px] p-8 hover:bg-white hover:shadow-premium transition-all group">
                <div className="flex gap-6 items-start">
                  <div className="size-12 bg-accent rounded-2xl flex items-center justify-center text-primary shrink-0 shadow-lg group-hover:scale-110 transition-transform">
                    <Target size={24} />
                  </div>
                  <div className="space-y-2">
                    <h4 className="text-sm font-black text-accent uppercase tracking-tight">
                      {section.subseccion_titulo}
                    </h4>
                    <p className="text-xs text-text-secondary font-bold leading-relaxed">
                      {section.contenido}
                    </p>
                  </div>
                </div>
              </div>
            );

          case 'BLOQUE_OSCURO':
            return (
              <section key={section.id} className="bg-accent rounded-[40px] p-10 lg:p-14 text-white space-y-8 shadow-2xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-10 opacity-5 pointer-events-none group-hover:scale-105 transition-transform duration-1000">
                  <ShieldCheck size={200} />
                </div>
                <div className="relative z-10 space-y-6">
                  <h2 className="text-3xl font-black tracking-tighter uppercase">{section.seccion_titulo}</h2>
                  <div className="h-1 w-16 bg-primary rounded-full"></div>
                  <p className="text-gray-300 text-base md:text-lg leading-relaxed font-medium whitespace-pre-wrap text-justify">
                    {section.contenido}
                  </p>
                </div>
              </section>
            );

          case 'LISTA':
            return (
              <div key={section.id} className="flex gap-5 items-start px-4">
                <div className="size-2 rounded-full bg-primary mt-2.5 shadow-neon shrink-0"></div>
                <div className="space-y-1">
                  <h4 className="text-sm font-black text-accent uppercase tracking-tight">{section.subseccion_titulo}</h4>
                  <p className="text-xs text-text-secondary font-bold leading-relaxed">{section.contenido}</p>
                </div>
              </div>
            );

          case 'CONCLUSION':
            return (
              <section key={section.id} className="py-16 text-center border-y border-gray-100 space-y-8">
                <Quote className="mx-auto text-primary opacity-20" size={48} />
                <p className="text-accent font-black text-2xl lg:text-3xl tracking-tighter uppercase italic leading-tight px-4 lg:px-20">
                  "{section.contenido}"
                </p>
                <div className="space-y-2">
                  <div className="h-1 w-12 bg-primary mx-auto rounded-full"></div>
                  <p className="text-[10px] font-black text-text-muted uppercase tracking-[0.4em]">{section.seccion_titulo}</p>
                </div>
              </section>
            );

          case 'FOOTER':
            return (
              <footer key={section.id} className="text-center pt-10">
                <p className="text-[9px] font-black text-text-muted uppercase tracking-[0.3em] leading-relaxed max-w-2xl mx-auto">
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
