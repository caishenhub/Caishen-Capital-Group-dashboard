
import React from 'react';

interface HeaderProps {
  title: string;
  onOpenMenu?: () => void;
}

const Header: React.FC<HeaderProps> = ({ title }) => {
  return (
    <header className="h-16 md:h-20 flex-shrink-0 border-b border-surface-border bg-white/80 backdrop-blur-md sticky top-0 z-[40] flex items-center justify-between px-6 md:px-8 w-full">
      <div className="flex items-center gap-3">
        <div className="flex flex-col leading-tight">
          <span className="text-[10px] md:text-[11px] font-black text-accent tracking-tight uppercase">Portal Accionistas</span>
          <span className="block text-[8px] md:text-[8.5px] font-bold text-text-secondary uppercase tracking-[0.15em]">CCG Gestión</span>
        </div>
      </div>

      <div className="flex items-center">
        <div className="h-8 md:h-12 flex items-center">
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
