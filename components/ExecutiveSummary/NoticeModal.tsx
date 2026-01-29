
import React from 'react';
import { X, Calendar, Info, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { CorporateNotice } from '../../types';

interface NoticeModalProps {
  notice: CorporateNotice;
  onClose: () => void;
}

const NoticeModal: React.FC<NoticeModalProps> = ({ notice, onClose }) => {
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
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-accent/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
        <div className={`p-8 ${getTheme()} border-b flex justify-between items-start`}>
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white rounded-2xl shadow-sm">
              {getIcon()}
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-text-muted mb-1">Aviso Corporativo</p>
              <h3 className="text-xl font-black text-accent tracking-tight">{notice.title}</h3>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/50 rounded-full transition-colors">
            <X size={20} className="text-text-muted" />
          </button>
        </div>
        <div className="p-8 space-y-6">
          <div className="flex items-center gap-2 text-text-muted font-bold text-xs">
            <Calendar size={14} />
            <span>Publicado el {notice.date}</span>
          </div>
          <p className="text-accent font-bold leading-relaxed">{notice.description}</p>
          <div className="h-px bg-gray-100 w-full" />
          <p className="text-text-secondary text-sm leading-relaxed whitespace-pre-wrap">{notice.fullContent}</p>
          <button 
            onClick={onClose}
            className="w-full bg-accent text-white font-black py-4 rounded-2xl hover:bg-accent/90 transition-all uppercase text-xs tracking-widest shadow-lg"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
};

export default NoticeModal;
