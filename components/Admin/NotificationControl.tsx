
import React, { useState, useEffect } from 'react';
import { 
  Bell, 
  Send,
  AlertTriangle, 
  CheckCircle2, 
  Info,
  RefreshCw,
  Clock,
  LayoutGrid
} from 'lucide-react';
import { publishNotice, fetchCorporateNotices } from '../../lib/googleSheets';
import { CorporateNotice } from '../../types';

const NotificationControl: React.FC = () => {
  const [notices, setNotices] = useState<CorporateNotice[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [form, setForm] = useState({
    title: '',
    description: '',
    type: 'Info' as CorporateNotice['type'],
    fullContent: ''
  });

  const loadNotices = async () => {
    setIsLoading(true);
    const data = await fetchCorporateNotices(true);
    setNotices(data);
    setIsLoading(false);
  };

  useEffect(() => {
    loadNotices();
  }, []);

  const handlePublish = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.description) return;
    
    setIsSending(true);
    const res = await publishNotice(form);
    
    if (res.success) {
      setForm({ title: '', description: '', type: 'Info', fullContent: '' });
      loadNotices();
    }
    setIsSending(false);
  };

  return (
    <div className="space-y-10 animate-in fade-in duration-700 w-full pb-20">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-accent rounded-2xl text-primary shadow-xl">
              <Bell size={24} />
            </div>
            <h2 className="text-accent text-3xl font-black tracking-tighter uppercase">Consola de Comunicados</h2>
          </div>
          <p className="text-text-secondary font-medium text-sm">Emisión de avisos corporativos y alertas de seguridad para el Dashboard.</p>
        </div>
        <button 
          onClick={loadNotices}
          className="flex items-center gap-2 px-6 py-3 bg-white border border-surface-border rounded-full hover:shadow-premium transition-all active:scale-95"
        >
          <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
          <span className="text-[10px] font-black uppercase tracking-widest">Refrescar Historial</span>
        </button>
      </header>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-10">
        {/* Formulario de Emisión */}
        <div className="bg-[#1d1c2d] rounded-[40px] p-8 lg:p-12 text-white shadow-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none group-hover:scale-110 transition-transform duration-1000">
            <Bell size={240} />
          </div>
          
          <form onSubmit={handlePublish} className="relative z-10 space-y-8">
            <div className="flex items-center gap-4">
              <div className="p-4 bg-white/10 rounded-2xl backdrop-blur-md border border-white/10">
                <Send className="text-primary" size={28} />
              </div>
              <h3 className="text-2xl font-black tracking-tight uppercase leading-none">Nueva Notificación</h3>
            </div>

            <div className="grid grid-cols-1 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-primary uppercase tracking-widest ml-1">Título del Comunicado</label>
                <input 
                  type="text" 
                  value={form.title}
                  onChange={(e) => setForm({...form, title: e.target.value})}
                  placeholder="Ej: Cierre de Periodo Enero 2026"
                  className="w-full bg-white/5 border-2 border-white/10 rounded-2xl px-6 py-4 text-white font-bold focus:border-primary focus:ring-0 transition-all placeholder:text-white/20"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-primary uppercase tracking-widest ml-1">Descripción Corta (Vista Previa)</label>
                <textarea 
                  value={form.description}
                  onChange={(e) => setForm({...form, description: e.target.value})}
                  placeholder="Se están dispersando los dividendos..."
                  className="w-full bg-white/5 border-2 border-white/10 rounded-2xl px-6 py-4 text-white font-bold focus:border-primary focus:ring-0 transition-all placeholder:text-white/20 h-24 resize-none"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-primary uppercase tracking-widest ml-1">Tipo de Alerta</label>
                  <select 
                    value={form.type}
                    onChange={(e) => setForm({...form, type: e.target.value as any})}
                    className="w-full bg-white/5 border-2 border-white/10 rounded-2xl px-6 py-4 text-white font-bold focus:border-primary focus:ring-0 transition-all cursor-pointer"
                  >
                    <option value="Info">Informativa (Azul)</option>
                    <option value="Urgent">Urgente (Roja)</option>
                    <option value="Success">Éxito (Verde)</option>
                  </select>
                </div>
                <div className="flex items-end">
                  <button 
                    type="submit"
                    disabled={isSending || !form.title || !form.description}
                    className="w-full bg-primary text-accent font-black py-4 rounded-2xl shadow-xl hover:-translate-y-1 active:scale-95 transition-all flex items-center justify-center gap-3 uppercase text-xs tracking-widest disabled:opacity-30"
                  >
                    {isSending ? <RefreshCw className="animate-spin" /> : <Send size={18} />}
                    {isSending ? 'Emitiendo...' : 'Publicar Ahora'}
                  </button>
                </div>
              </div>
            </div>
          </form>
        </div>

        {/* Historial en Nube */}
        <div className="bg-white rounded-[40px] border border-surface-border shadow-premium flex flex-col h-full min-h-[500px]">
          <header className="p-8 border-b border-surface-border flex justify-between items-center bg-surface-subtle/30">
            <div className="flex items-center gap-3">
              <Clock size={18} className="text-accent" />
              <h3 className="text-sm font-black uppercase tracking-widest text-accent">Historial en Nube</h3>
            </div>
            <span className="text-[10px] font-black text-text-muted uppercase tracking-widest">{notices.length} Registros</span>
          </header>

          <div className="flex-1 overflow-y-auto p-6 space-y-4 max-h-[600px] hide-scrollbar">
            {isLoading ? (
              <div className="h-full flex flex-col items-center justify-center gap-4 opacity-50">
                <RefreshCw size={32} className="animate-spin" />
                <p className="text-[10px] font-black uppercase tracking-widest">Sincronizando...</p>
              </div>
            ) : (
              notices.map((n) => (
                <div key={n.id} className="p-5 border border-surface-border rounded-3xl hover:border-primary/50 transition-all group bg-surface-subtle/20">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-3">
                       <span className={`size-3 rounded-full ${n.type === 'Urgent' ? 'bg-red-500' : n.type === 'Success' ? 'bg-green-500' : 'bg-blue-500'}`}></span>
                       <h4 className="text-xs font-black text-accent uppercase">{n.title}</h4>
                    </div>
                    <span className="text-[10px] font-bold text-text-muted">{n.date}</span>
                  </div>
                  <p className="text-[11px] text-text-secondary font-medium leading-relaxed">{n.description}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotificationControl;
