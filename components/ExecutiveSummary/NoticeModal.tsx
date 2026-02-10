
import React from 'react';
import { X, Calendar, Info, AlertTriangle, CheckCircle2, ImageIcon } from 'lucide-react';
import { CorporateNotice } from '../../types';

interface NoticeModalProps {
  notice: CorporateNotice;
  onClose: () => void;
}

const NoticeModal: React.FC<NoticeModalProps> = ({ notice, onClose }) => {
  // Prevenir scroll en el fondo
  React.useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  const getIcon = () => {
    switch (notice.type) {
      case 'Urgent': return <AlertTriangle className="text-red-600" size={24} />;
      case 'Success': return <CheckCircle2 className="text-green-600" size={24} />;
      default: return <Info className="text-blue-600" size={24} />;
    }
  };

  const getTheme = () => {
    switch (notice.type) {
      case 'Urgent': return 'bg-red-50 border-red-100';
      case 'Success': return 'bg-green-50 border-green-100';
      default: return 'bg-blue-50 border-blue-100';
    }
  };

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
      {/* Overlay con desenfoque profundo */}
      <div className="absolute inset-0 bg-accent/60 backdrop-blur-md animate-in fade-in duration-300" onClick={onClose} />
      
      <div className="relative w-full max-w-lg bg-white rounded-[40px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 border border-white/20 flex flex-col max-h-[90vh]">
        <header className={`p-8 ${getTheme()} border-b flex justify-between items-start shrink-0`}>
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white rounded-2xl shadow-sm border border-black/5">
              {getIcon()}
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-text-muted mb-1 opacity-70">Aviso Institucional</p>
              <h3 className="text-xl font-black text-accent tracking-tighter uppercase leading-tight">{notice.title}</h3>
            </div>
          </div>
          <button onClick={onClose} className="p-2.5 hover:bg-white/80 rounded-full transition-all text-text-muted hover:text-accent">
            <X size={20} />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto p-10 space-y-8 hide-scrollbar">
          {/* Imagen si existe */}
          {notice.imageUrl ? (
            <div className="rounded-[32px] overflow-hidden border border-surface-border shadow-md">
              <img src={notice.imageUrl} alt={notice.title} className="w-full h-auto max-h-64 object-cover" />
            </div>
          ) : (
            <div className="flex items-center gap-2 text-text-muted font-bold text-[10px] uppercase tracking-widest bg-surface-subtle w-fit px-4 py-1.5 rounded-full border border-surface-border">
              <Calendar size={12} className="text-accent" />
              <span>Emitido el {notice.date}</span>
            </div>
          )}

          <div className="space-y-4">
            <p className="text-accent font-black text-lg leading-snug tracking-tight uppercase">
              {notice.description}
            </p>
            <div className="h-1.5 w-12 bg-primary rounded-full"></div>
            <p className="text-text-secondary text-sm leading-relaxed whitespace-pre-wrap font-medium">
              {notice.fullContent || notice.description}
            </p>
          </div>
        </div>

        <footer className="p-8 border-t border-surface-border bg-surface-subtle/30 shrink-0">
          <button 
            onClick={onClose}
            className="w-full bg-accent text-white font-black py-5 rounded-2xl hover:bg-black transition-all uppercase text-[11px] tracking-[0.2em] shadow-xl active:scale-95 flex items-center justify-center gap-3"
          >
            <CheckCircle2 size={18} className="text-primary" />
            <span>Entendido, Cerrar Aviso</span>
          </button>
        </footer>
      </div>
    </div>
  );
};

export default NoticeModal;
