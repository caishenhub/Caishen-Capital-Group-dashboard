
import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  PieChart, 
  TrendingUp, 
  FileText, 
  Headset, 
  ChevronRight,
  X,
  Users,
  LogOut
} from 'lucide-react';
import { fetchTableData, warmUpCache } from '../lib/googleSheets';

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const isActive = (path: string) => location.pathname === path;

  // --- OPTIMIZACIÓN: SISTEMA DE PRE-CARGA POR HOVER ---
  const handlePrefetch = (path: string) => {
    switch (path) {
      case '/':
        fetchTableData('CONFIG_MAESTRA');
        fetchTableData('HISTORIAL_RENDIMIENTOS');
        fetchTableData('ESTRUCTURA_PORTAFOLIO');
        break;
      case '/portfolio':
        fetchTableData('KPI_PORTAFOLIO');
        fetchTableData('ESTRUCTURA_PORTAFOLIO');
        fetchTableData('REPORTE_ESTRATEGICO');
        break;
      case '/users':
        fetchTableData('LIBRO_ACCIONISTAS');
        break;
      case '/summary':
        fetchTableData('RESUMEN_KPI');
        fetchTableData('AVISOS_CORPORATIVOS');
        fetchTableData('PROTOCOLO_LIQUIDEZ');
        break;
      case '/reports':
        fetchTableData('REPORTES_ADMIN');
        break;
      default:
        warmUpCache();
    }
  };

  const handleExit = () => {
    localStorage.clear();
    sessionStorage.clear();
    if (onClose) onClose();
    window.location.replace('https://caishencapital.co/');
  };

  const menuItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Portafolio', path: '/portfolio', icon: PieChart },
    { name: 'Libro de Accionistas', path: '/users', icon: Users },
    { name: 'Resumen Ejecutivo', path: '/summary', icon: TrendingUp },
    { name: 'Reportes', path: '/reports', icon: FileText },
  ];

  return (
    <aside className={`
      fixed inset-y-0 left-0 z-50 w-[80%] sm:w-72 bg-white border-r border-surface-border flex flex-col transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0
      ${isOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'}
    `}>
      <div className="p-6 md:p-8 flex justify-between items-center">
        <h1 className="text-accent text-sm md:text-base font-black tracking-tighter uppercase leading-tight">
          Caishen Capital Group
        </h1>
        <button onClick={onClose} className="lg:hidden p-2 text-text-muted rounded-full hover:bg-gray-100">
          <X size={24} />
        </button>
      </div>

      <nav className="flex-1 px-3 md:px-4 space-y-1 overflow-y-auto hide-scrollbar">
        {menuItems.map((item) => {
          const ActiveIcon = item.icon;
          const active = isActive(item.path);
          return (
            <Link
              key={item.path}
              to={item.path}
              onClick={onClose}
              onMouseEnter={() => handlePrefetch(item.path)} // --- TRIGGER DE PRE-CARGA ---
              className={`flex items-center justify-between group px-4 py-4 md:py-3.5 rounded-xl md:rounded-2xl transition-all duration-300 ${
                active 
                  ? 'bg-primary text-accent shadow-premium' 
                  : 'text-text-secondary hover:bg-gray-50 hover:text-accent'
              }`}
            >
              <div className="flex items-center gap-4">
                <ActiveIcon className={`size-5 ${active ? 'text-accent' : 'text-text-secondary group-hover:text-accent'}`} />
                <span className={`text-[13px] md:text-sm font-bold tracking-tight ${active ? 'text-accent' : ''}`}>
                  {item.name}
                </span>
              </div>
              <ChevronRight className={`size-4 opacity-0 transition-all ${active ? 'translate-x-0 opacity-100' : '-translate-x-2 md:group-hover:opacity-100'}`} />
            </Link>
          );
        })}
      </nav>

      <div className="p-4 md:p-6 mt-auto space-y-4">
        <div className="h-px bg-surface-border w-full"></div>
        <Link 
          to="/support"
          onMouseEnter={() => handlePrefetch('/support')}
          className="w-full flex items-center gap-3 px-4 py-4 rounded-2xl bg-primary border border-primary shadow-lg hover:shadow-xl transition-all group"
        >
          <div className="bg-white/80 p-2 rounded-full text-accent shadow-sm group-hover:bg-white transition-colors">
            <Headset size={18} />
          </div>
          <div className="flex flex-col">
            <span className="text-accent text-[11px] font-black leading-tight uppercase tracking-tighter">Soporte Técnico</span>
            <span className="text-accent/70 text-[9px] font-bold uppercase">Ayuda en línea</span>
          </div>
        </Link>

        <button 
          onClick={handleExit}
          className="w-full flex items-center gap-4 px-4 py-4 rounded-xl text-text-secondary hover:bg-red-50 hover:text-red-600 transition-all duration-300"
        >
          <LogOut className="size-5 shrink-0" />
          <span className="text-[13px] md:text-sm font-bold tracking-tight">Cerrar sesión</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
