
import React, { useState, useEffect } from 'react';
import { Bell, Menu } from 'lucide-react';
import { fetchNotifications } from '../lib/googleSheets';
import { CorporateNotification } from '../types';
import { useNavigate } from 'react-router-dom';

interface HeaderProps {
  title?: string;
  onOpenMenu?: () => void;
}

const Header: React.FC<HeaderProps> = ({ title, onOpenMenu }) => {
  const [notifications, setNotifications] = useState<CorporateNotification[]>([]);
  const [lastReadId, setLastReadId] = useState(localStorage.getItem('last_read_notice') || '');
  const navigate = useNavigate();

  const loadNotifications = async () => {
    try {
      const data = await fetchNotifications(true);
      setNotifications(data);
    } catch (e) {
      console.error("Error al cargar notificaciones en el header", e);
    }
  };

  useEffect(() => {
    loadNotifications();
    const interval = setInterval(loadNotifications, 60000); 
    return () => clearInterval(interval);
  }, []);

  const hasNewNotifications = notifications.length > 0 && notifications[0].id !== lastReadId;

  const handleNavigateToNotifications = () => {
    if (notifications.length > 0) {
      const latestId = notifications[0].id;
      localStorage.setItem('last_read_notice', latestId);
      setLastReadId(latestId);
    }
    
    navigate('/summary');
    
    setTimeout(() => {
      const element = document.getElementById('seccion-notificaciones');
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 150);
  };

  return (
    <header className="flex-shrink-0 border-b border-surface-border bg-white/80 backdrop-blur-md sticky top-0 z-[40] flex items-center justify-between px-6 md:px-8 w-full pt-safe">
      <div className="h-14 md:h-20 flex items-center justify-between w-full">
        <div className="flex items-center gap-3 md:gap-6">
          <button 
            onClick={onOpenMenu}
            className="lg:hidden p-3 -ml-3 text-text-muted hover:bg-gray-100 rounded-xl transition-colors"
            title="Abrir menú"
          >
            <Menu size={24} />
          </button>

          <div className="flex flex-col leading-tight">
            <span className="text-[10px] md:text-[13px] font-black text-accent tracking-tighter uppercase leading-none">
              {title || "Portal de Accionistas"}
            </span>
          </div>

          <button 
            onClick={handleNavigateToNotifications}
            title="Ver notificaciones corporativas"
            className="relative p-2 md:p-2.5 bg-surface-subtle hover:bg-white border border-transparent hover:border-surface-border rounded-xl transition-all group"
          >
            <Bell 
              size={18} 
              className={`transition-all duration-300 ${
                hasNewNotifications ? 'text-accent scale-110' : 'text-text-muted opacity-40'
              }`} 
            />
            
            {hasNewNotifications && (
              <span className="absolute top-0.5 right-0.5 size-2.5 md:size-3.5 bg-primary rounded-full border-2 border-white shadow-[0_0_8px_rgba(206,255,4,0.6)] animate-pulse">
              </span>
            )}
          </button>
        </div>

        <div className="flex items-center">
          <div className="h-7 md:h-12 flex items-center cursor-pointer" onClick={() => navigate('/')}>
            <img 
              src="https://i.ibb.co/zT3RhhT9/CAISHEN-NO-FONDO-AZUL-1.png" 
              alt="Caishen Capital" 
              className="h-full w-auto object-contain"
            />
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
