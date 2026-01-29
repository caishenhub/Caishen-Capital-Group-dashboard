
import React, { useState, useMemo, useEffect } from 'react';
import { 
  Bell, 
  ShieldCheck, 
  Activity, 
  Filter, 
  Archive, 
  CheckCircle2, 
  Search,
  Info,
  Clock,
  Zap,
  MoreHorizontal,
  Send,
  Eye,
  Trash2
} from 'lucide-react';
import { MOCK_ADMIN_NOTIFICATIONS, adminPublishNotification, getPublishedNotifications } from '../../constants';
import { AdminNotification } from '../../types';

const NotificationControl: React.FC = () => {
  const [notifications, setNotifications] = useState<AdminNotification[]>(MOCK_ADMIN_NOTIFICATIONS);
  const [publishedIds, setPublishedIds] = useState<Set<string>>(new Set());
  const [filterType, setFilterType] = useState('Todos');
  const [filterImpact, setFilterImpact] = useState('Todos');

  useEffect(() => {
    const published = getPublishedNotifications();
    setPublishedIds(new Set(published.map(p => p.id)));
  }, []);

  const stats = useMemo(() => {
    return {
      total: notifications.length,
      critical: notifications.filter(n => n.impact === 'Crítico').length,
      latest: notifications[0]?.timestamp || '--',
      status: 'Normal'
    };
  }, [notifications]);

  const filteredData = useMemo(() => {
    return notifications.filter(n => {
      const matchesType = filterType === 'Todos' || n.event === filterType;
      const matchesImpact = filterImpact === 'Todos' || n.impact === filterImpact;
      return matchesType && matchesImpact;
    });
  }, [notifications, filterType, filterImpact]);

  const getImpactStyle = (impact: string) => {
    switch (impact) {
      case 'Crítico': return 'bg-red-50 text-red-700 border-red-100';
      case 'Relevante': return 'bg-orange-50 text-orange-700 border-orange-100';
      default: return 'bg-blue-50 text-blue-700 border-blue-100';
    }
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'Confirmada': return 'text-green-600';
      case 'Archivada': return 'text-text-muted opacity-50';
      default: return 'text-accent';
    }
  };

  const handleArchive = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, status: 'Archivada' } : n));
  };

  const handleConfirm = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, status: 'Confirmada' } : n));
  };

  const handleDelete = (id: string) => {
    if (window.confirm("¿Está seguro de borrar esta notificación? Esta acción la eliminará de la vista administrativa.")) {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }
  };

  const handlePublish = (notif: AdminNotification) => {
    adminPublishNotification(notif);
    setPublishedIds(prev => new Set(prev).add(notif.id));
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700 w-full">
      <header className="space-y-2">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-xl text-accent border border-primary/20">
            <Bell size={20} />
          </div>
          <h2 className="text-accent text-2xl font-black tracking-tighter uppercase">Consola de Control de Notificaciones</h2>
        </div>
        <p className="text-text-secondary font-medium text-sm">Supervisión y trazabilidad de eventos operativos del fondo.</p>
      </header>

      {/* Summary Indicators */}
      <div className="flex flex-wrap gap-4">
        <div className="bg-white border border-surface-border px-6 py-4 rounded-2xl flex items-center gap-4 shadow-sm min-w-[200px]">
          <div className="size-10 bg-surface-subtle rounded-xl flex items-center justify-center text-accent">
            <Zap size={18} />
          </div>
          <div>
            <p className="text-[9px] font-black text-text-muted uppercase tracking-widest">Eventos Activos</p>
            <p className="text-lg font-black text-accent">{stats.total}</p>
          </div>
        </div>
        <div className="bg-white border border-surface-border px-6 py-4 rounded-2xl flex items-center gap-4 shadow-sm min-w-[200px]">
          <div className="size-10 bg-red-50 rounded-xl flex items-center justify-center text-red-600">
            <Info size={18} />
          </div>
          <div>
            <p className="text-[9px] font-black text-text-muted uppercase tracking-widest">Alertas Críticas</p>
            <p className="text-lg font-black text-red-600">{stats.critical}</p>
          </div>
        </div>
        <div className="bg-white border border-surface-border px-6 py-4 rounded-2xl flex items-center gap-4 shadow-sm min-w-[240px]">
          <div className="size-10 bg-surface-subtle rounded-xl flex items-center justify-center text-accent">
            <Clock size={18} />
          </div>
          <div>
            <p className="text-[9px] font-black text-text-muted uppercase tracking-widest">Última Emisión</p>
            <p className="text-lg font-black text-accent">{stats.latest}</p>
          </div>
        </div>
        <div className="bg-white border border-surface-border px-6 py-4 rounded-2xl flex items-center gap-4 shadow-sm min-w-[200px]">
          <div className="size-10 bg-green-50 rounded-xl flex items-center justify-center text-green-600">
            <ShieldCheck size={18} />
          </div>
          <div>
            <p className="text-[9px] font-black text-text-muted uppercase tracking-widest">Estado Sistema</p>
            <p className="text-lg font-black text-green-600">{stats.status}</p>
          </div>
        </div>
      </div>

      {/* Main Table Container */}
      <div className="bg-white border border-surface-border rounded-[32px] overflow-hidden shadow-premium">
        {/* Table Filters */}
        <div className="p-6 border-b border-gray-100 bg-surface-subtle/30 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-4 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={16} />
              <input 
                type="text" 
                placeholder="Filtrar por descripción..."
                className="w-full pl-10 pr-4 py-2 bg-white border border-surface-border rounded-xl text-xs font-bold text-accent placeholder:text-text-muted focus:ring-0 focus:border-primary transition-all"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter size={14} className="text-text-muted" />
              <select 
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="bg-white border border-surface-border rounded-xl px-3 py-2 text-[10px] font-black uppercase tracking-widest text-accent cursor-pointer focus:ring-0"
              >
                <option>Todos</option>
                <option>Transacción</option>
                <option>Rentabilidad</option>
                <option>Mercado</option>
                <option>Sistema</option>
                <option>Auditoría</option>
              </select>
            </div>
          </div>
          <div className="flex items-center gap-3">
             <span className="text-[10px] font-black text-text-muted uppercase tracking-widest">Impacto:</span>
             <div className="flex bg-white p-1 rounded-xl border border-surface-border gap-1">
                {['Todos', 'Informativo', 'Relevante', 'Crítico'].map(imp => (
                  <button 
                    key={imp}
                    onClick={() => setFilterImpact(imp)}
                    className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-tighter transition-all ${
                      filterImpact === imp ? 'bg-accent text-white' : 'text-text-muted hover:text-accent'
                    }`}
                  >
                    {imp}
                  </button>
                ))}
             </div>
          </div>
        </div>

        {/* The Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-subtle/50 text-[10px] font-black text-text-muted uppercase tracking-[0.2em] border-b border-gray-100">
                <th className="px-8 py-5">Tipo de Evento</th>
                <th className="px-8 py-5">Descripción</th>
                <th className="px-8 py-5 text-center">Origen</th>
                <th className="px-8 py-5 text-center">Impacto</th>
                <th className="px-8 py-5">Fecha y Hora</th>
                <th className="px-8 py-5 text-center">Estado</th>
                <th className="px-8 py-5 text-right">Auditoría / Dashboard</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredData.map((notif) => (
                <tr key={notif.id} className="hover:bg-surface-subtle/20 transition-colors group">
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-3">
                      <div className="size-8 rounded-lg bg-surface-subtle flex items-center justify-center text-accent group-hover:bg-white group-hover:shadow-sm transition-all">
                        {notif.event === 'Auditoría' ? <ShieldCheck size={14} /> : <Activity size={14} />}
                      </div>
                      <span className="text-xs font-black text-accent">{notif.event}</span>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <p className="text-xs font-bold text-text-secondary max-w-xs leading-relaxed">
                      {notif.description}
                    </p>
                  </td>
                  <td className="px-8 py-6 text-center">
                    <span className="px-2 py-1 bg-gray-100 rounded text-[9px] font-black text-text-muted uppercase tracking-widest border border-gray-200">
                      {notif.origin}
                    </span>
                  </td>
                  <td className="px-8 py-6 text-center">
                    <span className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-tighter border shadow-sm ${getImpactStyle(notif.impact)}`}>
                      {notif.impact}
                    </span>
                  </td>
                  <td className="px-8 py-6">
                    <span className="text-[10px] font-bold text-text-muted">{notif.timestamp}</span>
                  </td>
                  <td className="px-8 py-6 text-center">
                    <div className={`flex items-center justify-center gap-1.5 text-[10px] font-black uppercase tracking-widest ${getStatusStyle(notif.status)}`}>
                      {notif.status === 'Confirmada' && <CheckCircle2 size={12} />}
                      {notif.status}
                    </div>
                  </td>
                  <td className="px-8 py-6 text-right">
                    <div className="flex items-center justify-end gap-2">
                       {/* BOTÓN PUBLICAR AL DASHBOARD GLOBAL */}
                       {!publishedIds.has(notif.id) ? (
                         <button 
                           onClick={() => handlePublish(notif)}
                           className="p-2 bg-primary/10 text-accent hover:bg-primary rounded-lg transition-all border border-primary/20 flex items-center gap-2 group/publish"
                           title="Publicar en Dashboard Global"
                         >
                           <Send size={14} className="group-hover/publish:translate-x-0.5 group-hover/publish:-translate-y-0.5 transition-transform" />
                           <span className="text-[9px] font-black uppercase hidden lg:inline">Publicar</span>
                         </button>
                       ) : (
                         <div className="p-2 bg-accent/5 text-accent rounded-lg border border-accent/10 flex items-center gap-2 cursor-default">
                           <Eye size={14} className="text-primary" />
                           <span className="text-[9px] font-black uppercase hidden lg:inline">En Vivo</span>
                         </div>
                       )}

                       <div className="h-4 w-px bg-gray-200 mx-1"></div>

                       {notif.status === 'Emitida' && (
                         <button 
                           onClick={() => handleConfirm(notif.id)}
                           className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-all"
                           title="Confirmar Auditoría"
                         >
                           <CheckCircle2 size={16} />
                         </button>
                       )}
                       
                       <button 
                          onClick={() => handleArchive(notif.id)}
                          className={`p-2 rounded-lg transition-all ${notif.status === 'Archivada' ? 'text-accent bg-gray-100' : 'text-text-muted hover:text-accent hover:bg-gray-100'}`}
                          title="Archivar"
                       >
                         <Archive size={16} />
                       </button>

                       {/* BOTÓN BORRAR */}
                       <button 
                          onClick={() => handleDelete(notif.id)}
                          className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                          title="Borrar Notificación"
                       >
                         <Trash2 size={16} />
                       </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Auditoría footer */}
        <div className="p-6 bg-surface-subtle/30 border-t border-gray-50">
          <div className="flex items-center gap-3 text-text-muted">
            <Info size={16} className="text-accent" />
            <p className="text-[10px] font-bold leading-relaxed max-w-lg">
              Al publicar una notificación, esta aparecerá inmediatamente en el panel global de todos los accionistas. Las eliminaciones en este panel son visuales para la gestión administrativa.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotificationControl;
