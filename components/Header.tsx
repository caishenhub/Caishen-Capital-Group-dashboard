
import React, { useState, useEffect } from 'react';
import { Bell } from 'lucide-react';
import { fetchCorporateNotices } from '../lib/googleSheets';
import { CorporateNotice } from '../types';
import { useNavigate } from 'react-router-dom';

const Header: React.FC = () => {
  const [notices, setNotices] = useState<CorporateNotice[]>([]);
  const [lastReadId, setLastReadId] = useState(localStorage.getItem('last_read_notice') || '');
  const navigate = useNavigate();

  const loadNotices = async () => {
    try {
      const data = await fetchCorporateNotices(true);
      setNotices(data);
    } catch (e) {
      console.error("Error al cargar notificaciones en el header", e);
    }
  };

  useEffect(() => {
    loadNotices();
    const interval = setInterval(loadNotices, 60000); 
    return () => clearInterval(interval);
  }, []);

  const hasNewNotices = notices.length > 0 && notices[0].id !== lastReadId;

  const handleNavigateToNotices = () => {
    if (notices.length > 0) {
      const latestId = notices[0].id;
      localStorage.setItem('last_read_notice', latestId);
      setLastReadId(latestId);
    }
    
    navigate('/summary');
    
    setTimeout(() => {
      const element = document.getElementById('seccion-avisos');
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 150);
  };

  return (
    <header className="h-16 md:h-20 flex-shrink-0 border-b border-surface-border bg-white/80 backdrop-blur-md sticky top-0 z-[40] flex items-center justify-between px-6 md:px-8 w-full">
      <div className="flex items-center gap-4 md:gap-6">
        <div className="flex flex-col leading-tight">
          <span className="text-[10px] md:text-[11px] font-black text-accent tracking-tight uppercase leading-none">Caishen Capital</span>
          <span className="block text-[8px] md:text-[8.5px] font-bold text-text-secondary uppercase tracking-[0.2em] mt-1">Portal Accionistas</span>
        </div>

        {/* INDICADOR DE NOTIFICACIÓN VERDE INSTITUCIONAL #CEFF04 */}
        <button 
          onClick={handleNavigateToNotices}
          title="Ver avisos corporativos"
          className="relative p-2.5 bg-surface-subtle hover:bg-white border border-transparent hover:border-surface-border rounded-xl transition-all group"
        >
          <Bell 
            size={20} 
            className={`transition-all duration-300 ${
              hasNewNotices ? 'text-accent scale-110' : 'text-text-muted opacity-40'
            }`} 
          />
          
          {hasNewNotices && (
            <span className="absolute top-1 right-1 size-3.5 bg-primary rounded-full border-2 border-white shadow-[0_0_8px_rgba(206,255,4,0.6)] animate-pulse">
            </span>
          )}
        </button>
      </div>

      <div className="flex items-center">
        <div className="h-8 md:h-12 flex items-center cursor-pointer" onClick={() => navigate('/')}>
          <img 
            src="https://i.ibb.co/zT3RhhT9/CAISHEN-NO-FONDO-AZUL-1.png" 
            alt="Caishen Capital" 
            className="h-full w-auto object-contain"
          />
        </div>
      </div>
    </header>
  );
};

export default Header;
