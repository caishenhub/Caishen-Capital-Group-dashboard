
import React, { useState, useMemo, useEffect } from 'react';
import { Wallet, PiggyBank, ShieldCheck, Activity, Target, RefreshCw } from 'lucide-react';
import StatCard from './StatCard';
import PerformanceChart from './Charts/PerformanceChart';
import AllocationPieChart from './Charts/AllocationPieChart';
import { FINANCE_CONFIG } from '../constants';
import { fetchTableData, findValue, parseSheetNumber } from '../lib/googleSheets';

const DashboardSkeleton: React.FC = () => {
  return (
    <div className="p-4 md:p-8 space-y-8 animate-pulse">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-3">
          <div className="h-10 w-64 bg-gray-200 rounded-2xl"></div>
          <div className="h-4 w-48 bg-gray-100 rounded-lg"></div>
        </div>
        <div className="h-12 w-48 bg-gray-100 rounded-2xl"></div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-48 bg-gray-50 rounded-[32px] border border-gray-100 p-8 space-y-4">
            <div className="h-3 w-24 bg-gray-200 rounded"></div>
            <div className="h-10 w-40 bg-gray-200 rounded-xl"></div>
            <div className="h-6 w-20 bg-gray-100 rounded-lg mt-auto"></div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 h-[450px] bg-gray-50 rounded-[40px] border border-gray-100"></div>
        <div className="h-[450px] bg-gray-50 rounded-[40px] border border-gray-100"></div>
      </div>
    </div>
  );
};

const Dashboard: React.FC = () => {
  const [selectedPeriod, setSelectedPeriod] = useState<'General' | number>('General');
  const [fullConfig, setFullConfig] = useState<any[]>([]);
  const [historyData, setHistoryData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasLoadedInitial, setHasLoadedInitial] = useState(false);

  const loadConfigs = async (isBackground = false) => {
    if (!isBackground) setIsLoading(true);
    try {
      const [configData, sociosData, performanceData] = await Promise.all([
        fetchTableData('CONFIG_MAESTRA'),
        fetchTableData('PADRON_SOCIOS'),
        fetchTableData('HISTORIAL_RENDIMIENTOS')
      ]);
      
      setFullConfig(configData || []);
      setHistoryData(performanceData || []);
      
      const sessionStr = localStorage.getItem('ccg_session');
      if (sessionStr && sociosData) {
        const session = JSON.parse(sessionStr);
        const updatedUser = sociosData.find(u => 
          String(findValue(u, ['UID_SOCIO', 'uid', 'id_socio']) || '').toLowerCase() === String(session.uid).toLowerCase()
        );
        
        if (updatedUser) {
          const newShares = parseInt(findValue(updatedUser, ['ACCIONES_POSEIDAS', 'shares', 'acciones']) || '0');
          if (newShares !== session.shares) {
            localStorage.setItem('ccg_session', JSON.stringify({
              ...session,
              shares: newShares
            }));
            window.dispatchEvent(new window.Event('finance_update'));
          }
        }
      }
      setHasLoadedInitial(true);
    } catch (e) {
      console.error("Error cargando configuraciones:", e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadConfigs();
    const interval = setInterval(() => loadConfigs(true), 120000);
    return () => clearInterval(interval);
  }, []);

  const activeConfig = useMemo(() => {
    if (!fullConfig.length) return null;
    if (selectedPeriod === 'General') return fullConfig[0];
    return fullConfig.find(row => parseInt(findValue(row, ['ANIO', 'year', 'periodo'])) === selectedPeriod) || fullConfig[0];
  }, [selectedPeriod, fullConfig]);

  const metrics = useMemo(() => {
    if (fullConfig.length === 0 || historyData.length === 0) {
      return { aum: 0, profit: 0, growth: 0 };
    }

    // 1. AUM del periodo seleccionado
    const liveAUM = parseSheetNumber(findValue(activeConfig, ['AUM_TOTAL_FONDO', 'aum', 'total_aum', 'capital_total']));
    
    // 2. RENDIMIENTO (Diferenciado por vista)
    let growthValue = 0;
    if (selectedPeriod === 'General') {
      // Para la vista General, seguimos usando el valor maestro consolidado (C2)
      const annualYieldRaw = parseSheetNumber(findValue(activeConfig, ['RENDIMIENTO_ANUAL_PCT', 'rendimiento_anual', 'annual_yield']));
      growthValue = (Math.abs(annualYieldRaw) < 1 && annualYieldRaw !== 0) ? annualYieldRaw * 100 : annualYieldRaw;
    } else {
      // Para un año específico (ej. 2026), hacemos la SUMATORIA dinámica del historial de ese año
      const yearlyRows = historyData.filter(h => parseInt(findValue(h, ['ANIO', 'year'])) === selectedPeriod);
      const sumYield = yearlyRows.reduce((acc, row) => {
        const val = parseSheetNumber(findValue(row, ['RENDIMIENTO_FONDO', 'rendimiento', 'yield']));
        // Normalizamos cada mes: si viene como 0.021 lo sumamos como 2.1
        const normalizedVal = (Math.abs(val) < 1 && val !== 0) ? val * 100 : val;
        return acc + normalizedVal;
      }, 0);
      growthValue = sumYield;
    }

    // 3. Cálculo de Utilidad USD (Sumatoria basada en historial filtrada por periodo)
    let calculatedProfitUSD = 0;
    const dataToProcess = selectedPeriod === 'General' 
      ? [...historyData] 
      : historyData.filter(h => parseInt(findValue(h, ['ANIO', 'year'])) === selectedPeriod);

    dataToProcess.forEach(row => {
      const rowYear = parseInt(findValue(row, ['ANIO', 'year']));
      const rawMonthlyYield = parseSheetNumber(findValue(row, ['RENDIMIENTO_FONDO', 'rendimiento', 'yield']));
      const yieldForCalc = (Math.abs(rawMonthlyYield) > 1) ? rawMonthlyYield / 100 : rawMonthlyYield;

      const yearConf = fullConfig.find(c => parseInt(findValue(c, ['ANIO', 'year'])) === rowYear) || activeConfig;
      const baseAUM = parseSheetNumber(findValue(yearConf, ['AUM_TOTAL_FONDO', 'total_aum']));
      
      calculatedProfitUSD += (baseAUM * yieldForCalc);
    });

    return {
      aum: liveAUM || 0,
      profit: calculatedProfitUSD || 0,
      growth: growthValue
    };
  }, [selectedPeriod, activeConfig, fullConfig, historyData]);

  const reserveValue = useMemo(() => {
    const rawVal = findValue(activeConfig, ['META_FONDO_RESERVA_PCT', 'fondo_reserva', 'reserva_pct']);
    return parseSheetNumber(rawVal) || 100;
  }, [activeConfig]);

  const currentDate = new Intl.DateTimeFormat('es-ES', { 
    day: 'numeric', 
    month: 'long', 
    year: 'numeric' 
  }).format(new Date());

  if (!hasLoadedInitial && isLoading) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="p-4 md:p-8 space-y-6 md:space-y-8 animate-in fade-in duration-1000 max-w-full overflow-x-hidden">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-3">
            <h1 className="text-accent text-2xl md:text-4xl font-black tracking-tighter uppercase leading-tight mb-1">Estado del Fondo Global</h1>
            
            <button 
              onClick={() => loadConfigs()}
              disabled={isLoading}
              className="flex items-center gap-2 px-3 py-1.5 bg-white border border-surface-border rounded-full hover:shadow-premium transition-all active:scale-95 group cursor-pointer"
            >
              <div className="relative flex size-2">
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75 ${!isLoading ? 'duration-1000' : 'duration-300'}`}></span>
                <span className="relative inline-flex rounded-full size-2 bg-primary"></span>
              </div>
              <span className="text-[9px] font-black text-accent uppercase tracking-widest">
                {isLoading ? 'Sincronizando...' : 'Live Ledger'}
              </span>
            </button>
          </div>
          <p className="text-text-secondary text-[11px] md:text-base font-medium">Cifras consolidadas de la institución al {currentDate}.</p>
        </div>

        <div className="flex items-center gap-2 bg-white p-1.5 rounded-2xl border border-surface-border shadow-sm overflow-x-auto hide-scrollbar max-w-full">
          <span className="shrink-0 pl-2 text-[9px] font-black text-text-muted uppercase tracking-widest">Periodo:</span>
          <div className="flex gap-1 shrink-0">
            {['General', 2022, 2023, 2024, 2025, 2026].map((p) => (
              <button
                key={p}
                onClick={() => setSelectedPeriod(p as any)}
                className={`px-3 py-1.5 md:px-4 md:py-2 rounded-xl text-[10px] font-black transition-all uppercase tracking-tight whitespace-nowrap ${
                  selectedPeriod === p ? 'bg-accent text-primary shadow-md' : 'text-text-muted hover:bg-gray-50'
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        <StatCard 
          title={selectedPeriod === 'General' ? "AUM TOTAL DEL FONDO" : `AUM CIERRE ${selectedPeriod}`} 
          value={metrics.aum ? `$${metrics.aum.toLocaleString('en-US', { minimumFractionDigits: 2 })}` : '---'} 
          change={metrics.growth >= 0 ? `+${metrics.growth.toFixed(2)}%` : `${metrics.growth.toFixed(2)}%`} 
          changeLabel={selectedPeriod === 'General' ? "Rendimiento Acumulado" : `Rendimiento Anual ${selectedPeriod}`} 
          icon={Wallet} variant="light" isNegative={metrics.growth < 0}
        />
        <StatCard 
          title={selectedPeriod === 'General' ? "UTILIDAD ACUMULADA FONDO" : `UTILIDAD FONDO ${selectedPeriod}`} 
          value={metrics.profit ? `$${metrics.profit.toLocaleString('en-US', { minimumFractionDigits: 2 })}` : '---'} 
          change={selectedPeriod === 'General' ? "Histórica" : `${selectedPeriod}`} 
          changeLabel={selectedPeriod === 'General' ? "Total generado por el fondo" : `Generado en el periodo`} 
          icon={PiggyBank} variant="light" isNegative={metrics.profit < 0}
        />
        <StatCard 
          title="COBERTURA DE RESERVA" value={`${reserveValue}%`} progress={reserveValue} icon={ShieldCheck} variant="light"
          changeLabel={reserveValue < 100 ? "Fondo de Garantía Activo" : "Liquidez 100% Protegida"}
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 bg-white rounded-[40px] p-5 md:p-8 border border-surface-border shadow-sm overflow-hidden">
          <div className="flex items-center gap-3 mb-6 md:mb-8">
            <div className="p-2.5 bg-surface-subtle rounded-xl">
              <Activity className="size-4 text-accent" />
            </div>
            <div>
              <h3 className="text-accent text-base md:text-xl font-extrabold tracking-tight">Evolución Global</h3>
              <p className="text-text-muted text-[8px] font-medium uppercase tracking-widest">Desempeño institucional del fondo</p>
            </div>
          </div>
          <div className="h-[240px] md:h-[350px] w-full">
            <PerformanceChart initialYear={selectedPeriod} />
          </div>
        </div>

        <div className="bg-white rounded-[40px] p-6 md:p-8 border border-surface-border shadow-sm flex flex-col items-center justify-center">
          <div className="flex items-center gap-3 mb-6 w-full">
            <div className="p-2.5 bg-primary/10 rounded-xl">
              <Target className="size-4 text-accent" />
            </div>
            <h3 className="text-accent text-base font-extrabold tracking-tight uppercase">Activos Gestionados</h3>
          </div>
          <AllocationPieChart />
          <div className="mt-6 grid grid-cols-2 gap-x-4 gap-y-2 w-full px-2">
            {[
              { label: 'Forex', color: 'bg-accent', val: '20.6%' },
              { label: 'Derivados', color: 'bg-[#D4AF37]', val: '30.9%' },
              { label: 'Acciones', color: 'bg-blue-400', val: '10.3%' },
              { label: 'Real Estate', color: 'bg-primary', val: '25.8%' },
            ].map((item) => (
              <div key={item.label} className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <div className={`size-1.5 rounded-full ${item.color}`}></div>
                  <span className="text-[9px] font-bold text-text-secondary">{item.label}</span>
                </div>
                <span className="text-[9px] font-black text-accent">{item.val}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
