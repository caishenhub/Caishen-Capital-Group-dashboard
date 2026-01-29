
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

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const isActive = (path: string) => location.pathname === path;

  const handleExit = () => {
    // 1. Limpiamos la sesión del almacenamiento local
    localStorage.removeItem('ccg_session');
    
    // 2. Cerramos el menú lateral si está abierto (en móviles)
    if (onClose) onClose();
    
    // 3. Redirigimos a la raíz y forzamos recarga para que AuthGate tome el control
    window.location.href = window.location.origin + window.location.pathname;
  };

  const menuItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Gestión de Accionistas', path: '/users', icon: Users },
    { name: 'Portafolio', path: '/portfolio', icon: PieChart },
    { name: 'Resumen Ejecutivo', path: '/summary', icon: TrendingUp },
    { name: 'Reportes', path: '/reports', icon: FileText },
  ];

  return (
    <aside className={`
      fixed inset-y-0 left-0 z-50 w-[80%] sm:w-72 bg-white border-r border-surface-border flex flex-col transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0
      ${isOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'}
    `}>
      <div className="p-6 md:p-8 flex justify-between items-center overflow-visible">
        <div className="flex items-center pr-2">
          <h1 className="text-accent text-sm md:text-base font-black tracking-tighter uppercase leading-tight">
            Caishen Capital Group
          </h1>
        </div>
        <button 
          onClick={onClose} 
          className="lg:hidden p-2 text-text-muted hover:text-accent rounded-full hover:bg-gray-100 flex items-center justify-center shrink-0"
          style={{ minWidth: '40px', minHeight: '40px' }}
        >
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
              className={`flex items-center justify-between group px-4 py-4 md:py-3.5 rounded-xl md:rounded-2xl transition-all duration-300 ${
                active 
                  ? 'bg-primary text-accent shadow-premium' 
                  : 'text-text-secondary hover:bg-gray-50 hover:text-accent'
              }`}
            >
              <div className="flex items-center gap-4">
                <ActiveIcon className={`size-5 md:size-5 ${active ? 'text-accent' : 'text-text-secondary group-hover:text-accent'} transition-colors`} />
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
          onClick={onClose}
          className="w-full flex items-center gap-3 px-4 py-4 rounded-2xl md:rounded-3xl bg-primary border border-primary shadow-lg hover:shadow-xl transition-all group cursor-pointer"
        >
          <div className="bg-white/80 p-2 rounded-full text-accent shadow-sm group-hover:bg-white transition-colors shrink-0">
            <Headset size={18} />
          </div>
          <div className="flex flex-col">
            <span className="text-accent text-[11px] md:text-sm font-black leading-tight uppercase tracking-tighter">¿Necesitas ayuda?</span>
            <span className="text-accent/70 text-[9px] md:text-xs font-bold uppercase">Soporte técnico</span>
          </div>
        </Link>

        <button 
          onClick={handleExit}
          className="w-full flex items-center gap-4 px-4 py-4 rounded-xl md:rounded-2xl text-text-secondary hover:bg-red-50 hover:text-red-600 transition-all duration-300 group outline-none"
        >
          <LogOut className="size-5 shrink-0" />
          <span className="text-[13px] md:text-sm font-bold tracking-tight">Cerrar sesión</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
