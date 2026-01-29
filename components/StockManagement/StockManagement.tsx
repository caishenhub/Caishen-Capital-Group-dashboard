
import React from 'react';
import { Search, Filter, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { Shareholder } from '../../types';

const MOCK_SHAREHOLDERS: Shareholder[] = [
  { id: '1', userId: '#USR-88219', name: 'Juan Martínez', email: 'juan.martinez@email.com', status: 'Accionista Minoritario', shares: 150, shareClass: 'Clase B', initials: 'JM', color: 'bg-blue-100 text-blue-700' },
  { id: '2', userId: '#USR-88220', name: 'Ana López', email: 'ana.lopez@email.com', status: 'Accionista Minoritario', shares: 85, shareClass: 'Clase B', initials: 'AL', color: 'bg-purple-100 text-purple-700' },
  { id: '3', userId: '#USR-88225', name: 'Carlos Ruiz', email: 'carlos.ruiz@email.com', status: 'Accionista Minoritario', shares: 210, shareClass: 'Clase B', initials: 'CR', color: 'bg-green-100 text-green-700' },
  { id: '4', userId: '#USR-88233', name: 'María Pérez', email: 'maria.perez@email.com', status: 'Accionista Minoritario', shares: 500, shareClass: 'Clase B', initials: 'MP', color: 'bg-orange-100 text-orange-700' },
  { id: '5', userId: '#USR-88241', name: 'Sofía Fernández', email: 'sofia.fernandez@email.com', status: 'Accionista Minoritario', shares: 120, shareClass: 'Clase B', initials: 'SF', color: 'bg-pink-100 text-pink-700' },
  { id: '6', userId: '#USR-88256', name: 'Luis Gómez', email: 'luis.gomez@email.com', status: 'Accionista Minoritario', shares: 300, shareClass: 'Clase B', initials: 'LG', color: 'bg-teal-100 text-teal-700' },
  { id: '7', userId: '#USR-88264', name: 'Roberto Díaz', email: 'roberto.diaz@email.com', status: 'Accionista Minoritario', shares: 100, shareClass: 'Clase B', initials: 'RD', color: 'bg-yellow-100 text-yellow-700' },
];

const StockManagement: React.FC = () => {
  return (
    <div className="p-8 lg:p-10 space-y-8 animate-in fade-in duration-700">
      <header>
        <h2 className="text-3xl font-black text-accent tracking-tighter">Gestión de Acciones</h2>
        <p className="text-text-secondary mt-1 text-sm font-medium">Consulta y gestiona la información detallada de los accionistas y sus participaciones.</p>
      </header>

      {/* Filters Bar */}
      <div className="bg-white border border-surface-border rounded-2xl p-5 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
          <div className="md:col-span-8 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted size-5" />
            <input 
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border-surface-border text-sm focus:border-accent focus:ring-accent text-accent placeholder-text-muted bg-surface-subtle/50 font-medium transition-all" 
              placeholder="Buscar por Nombre, ID de Socio..." 
              type="text"
            />
          </div>
          <div className="md:col-span-4 relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted size-4" />
            <select className="w-full pl-10 pr-8 py-2.5 rounded-xl border-surface-border text-sm focus:border-accent focus:ring-accent text-accent bg-surface-subtle/50 appearance-none cursor-pointer font-bold transition-all">
              <option>Filtrar por Estatus: Todos</option>
              <option>Accionista Minoritario</option>
              <option>Accionista Mayoritario</option>
              <option>En Proceso</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-text-muted size-4" />
          </div>
        </div>
      </div>

      {/* Shareholders Table */}
      <div className="bg-white border border-surface-border rounded-2xl overflow-hidden shadow-sm flex flex-col">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="bg-surface-subtle text-text-muted text-[10px] uppercase tracking-widest font-black border-b border-surface-border">
                <th className="px-6 py-4 w-12 text-center">ID</th>
                <th className="px-6 py-4">Nombre del Socio</th>
                <th className="px-6 py-4 text-center">Estatus</th>
                <th className="px-6 py-4 text-right">Número de Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-border">
              {MOCK_SHAREHOLDERS.map((shareholder) => (
                <tr key={shareholder.id} className="hover:bg-surface-subtle/30 transition-colors group">
                  <td className="px-6 py-5 text-xs font-mono font-bold text-text-muted text-center">
                    {shareholder.userId}
                  </td>
                  <td className="px-6 py-5">
                    <button 
                      className="flex items-center gap-3 text-left hover:opacity-80 transition-all group/name"
                      title="Ver perfil completo"
                    >
                      <div className={`size-10 rounded-full ${shareholder.color} flex items-center justify-center shrink-0 font-black text-xs shadow-sm group-hover/name:ring-2 group-hover/name:ring-primary transition-all`}>
                        {shareholder.initials}
                      </div>
                      <div>
                        <div className="text-sm font-black text-accent group-hover/name:text-primary transition-colors">{shareholder.name}</div>
                        <div className="text-[10px] text-text-muted font-bold tracking-tight">{shareholder.email}</div>
                      </div>
                    </button>
                  </td>
                  <td className="px-6 py-5 text-center">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black bg-white text-accent border border-surface-border shadow-sm uppercase tracking-tight">
                      <span className="size-1.5 rounded-full bg-primary"></span> 
                      {shareholder.status}
                    </span>
                  </td>
                  <td className="px-6 py-5 text-right">
                    <div className="text-sm font-black text-accent">{shareholder.shares}</div>
                    <div className="text-[10px] font-bold text-text-muted uppercase tracking-tighter">{shareholder.shareClass}</div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="px-6 py-5 bg-surface-subtle border-t border-surface-border flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-[11px] font-bold text-text-muted uppercase tracking-widest">
            Total Socios: <span className="font-black text-accent">{MOCK_SHAREHOLDERS.length}</span> de <span className="font-black text-accent">42</span> registrados
          </div>
          <div className="flex items-center gap-2">
            <button className="p-2 rounded-xl border border-surface-border bg-white text-text-muted hover:bg-white hover:text-accent disabled:opacity-50 transition-all shadow-sm">
              <ChevronLeft size={16} />
            </button>
            <button className="w-9 h-9 flex items-center justify-center rounded-xl bg-accent text-primary font-black text-xs shadow-md">1</button>
            <button className="w-9 h-9 flex items-center justify-center rounded-xl border border-surface-border bg-white text-text-muted hover:text-accent text-xs font-black transition-all shadow-sm">2</button>
            <span className="text-text-muted px-1 font-black">...</span>
            <button className="p-2 rounded-xl border border-surface-border bg-white text-text-muted hover:bg-white hover:text-accent transition-all shadow-sm">
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StockManagement;
