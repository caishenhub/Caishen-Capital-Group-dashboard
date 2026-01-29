
import React from 'react';
import { TrendingUp, TrendingDown, LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string;
  change?: string;
  changeLabel?: string;
  icon: LucideIcon;
  variant?: 'light' | 'dark' | 'neon';
  progress?: number;
  isNegative?: boolean;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, change, changeLabel, icon: Icon, variant = 'light', progress, isNegative }) => {
  const containerClasses = {
    light: 'bg-white border-surface-border text-accent',
    dark: 'bg-accent border-accent text-white',
    neon: 'bg-primary border-primary text-accent shadow-neon'
  };

  const iconClasses = {
    light: 'text-primary opacity-10',
    dark: 'text-white opacity-5',
    neon: 'text-accent opacity-10'
  };

  const badgeClasses = isNegative 
    ? 'bg-red-100 text-red-600' 
    : (variant === 'neon' ? 'bg-accent text-primary' : 'bg-primary text-accent');

  return (
    <div className={`rounded-3xl p-5 md:p-7 border relative overflow-hidden group shadow-sm transition-all duration-300 hover:shadow-premium md:hover:-translate-y-1 ${containerClasses[variant]}`}>
      {/* Oculto en móviles para maximizar el espacio para los datos clave */}
      <div className={`absolute -right-6 -top-6 p-4 transition-opacity duration-500 group-hover:opacity-20 hidden md:block ${iconClasses[variant]}`}>
        {Icon && <Icon size={120} />}
      </div>
      
      <div className="relative z-10 flex flex-col h-full justify-between">
        <div>
          <p className={`text-[9px] md:text-[10px] font-black uppercase tracking-[0.15em] mb-2 ${variant === 'dark' ? 'text-gray-400' : 'text-text-muted'}`}>
            {title}
          </p>
          <h3 className="text-xl md:text-3xl lg:text-4xl font-black tracking-tighter truncate leading-tight">
            {value}
          </h3>
        </div>
        
        <div className="mt-4 md:mt-6">
          {progress !== undefined ? (
            <div className="space-y-2 md:space-y-3">
              <div className="w-full bg-gray-100 rounded-full h-2.5 md:h-3 overflow-hidden border border-gray-50">
                <div 
                  className="bg-primary h-full rounded-full shadow-neon transition-all duration-1000 ease-out" 
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
              {changeLabel && <p className="text-[8px] md:text-[9px] font-black text-text-muted uppercase tracking-widest">{changeLabel}</p>}
            </div>
          ) : (
            <div className="flex flex-wrap items-center gap-2">
              {change && (
                <span className={`flex items-center gap-1 px-2 py-0.5 md:px-2.5 md:py-1 rounded-lg text-[9px] md:text-[10px] font-extrabold shadow-sm ${badgeClasses}`}>
                  {isNegative ? <TrendingDown size={10} /> : <TrendingUp size={10} />}
                  {change}
                </span>
              )}
              {changeLabel && (
                <span className="text-[9px] md:text-[10px] font-bold text-text-muted tracking-tight">
                  {changeLabel}
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StatCard;
