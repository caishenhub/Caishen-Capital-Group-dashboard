
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  PieChart, 
  TrendingUp, 
  Users,
  Headset
} from 'lucide-react';

const MobileNav: React.FC = () => {
  const location = useLocation();
  const isActive = (path: string) => location.pathname === path;

  // Reordenamiento solicitado: Portafolio a la izquierda, Inicio al centro
  const navItems = [
    { name: 'Portafolio', path: '/portfolio', icon: PieChart },
    { name: 'Socios', path: '/users', icon: Users },
    { name: 'Inicio', path: '/', icon: LayoutDashboard, central: true },
    { name: 'Resumen', path: '/summary', icon: TrendingUp },
    { name: 'Ayuda', path: '/support', icon: Headset },
  ];

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-[100] bg-white/90 backdrop-blur-lg border-t border-surface-border pb-safe-area-inset-bottom">
      <div className="flex items-center justify-around h-16 px-2">
        {navItems.map((item) => {
          const active = isActive(item.path);
          const Icon = item.icon;

          if (item.central) {
            return (
              <Link
                key={item.path}
                to={item.path}
                className="relative -top-5 flex flex-col items-center"
              >
                <div className={`size-14 rounded-full flex items-center justify-center shadow-premium transition-all duration-300 ${
                  active ? 'bg-primary text-accent scale-110' : 'bg-accent text-primary'
                }`}>
                  <Icon size={24} strokeWidth={active ? 3 : 2} />
                </div>
                <span className={`text-[9px] font-black uppercase tracking-tighter mt-1 ${active ? 'text-accent' : 'text-text-muted'}`}>
                  {item.name}
                </span>
              </Link>
            );
          }

          return (
            <Link
              key={item.path}
              to={item.path}
              className="flex flex-col items-center justify-center flex-1 h-full gap-1 group relative"
            >
              <div className={`p-1 transition-all duration-300 ${active ? 'text-primary' : 'text-text-muted group-active:scale-90'}`}>
                <Icon size={20} strokeWidth={active ? 3 : 2} className={active ? 'drop-shadow-[0_0_8px_rgba(206,255,4,0.5)]' : ''} />
              </div>
              <span className={`text-[8px] font-black uppercase tracking-tight transition-colors ${active ? 'text-accent' : 'text-text-muted'}`}>
                {item.name}
              </span>
              {active && (
                <div className="absolute bottom-1 size-1 bg-primary rounded-full" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

export default MobileNav;
