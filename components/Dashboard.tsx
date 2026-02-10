
import React, { useState, useMemo, useEffect } from 'react';
import { Wallet, PiggyBank, ShieldCheck, Activity, Target, RefreshCw } from 'lucide-react';
import StatCard from './StatCard';
import PerformanceChart from './Charts/PerformanceChart';
import AllocationPieChart from './Charts/AllocationPieChart';
import { fetchTableData, findValue, parseSheetNumber, fetchPortfolioStructure, PortfolioCategory } from '../lib/googleSheets';

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
  const [portfolioData, setPortfolioData] = useState<PortfolioCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasLoadedInitial, setHasLoadedInitial] = useState(false);

  const loadConfigs = async (isBackground = false) => {
    if (!isBackground) setIsLoading(true);
    try {
      const [configData, sociosData, performanceData, pData] = await Promise.all([
        fetchTableData('CONFIG_MAESTRA'),
        fetchTableData('LIBRO_ACCIONISTAS'),
        fetchTableData('HISTORIAL_RENDIMIENTOS'),
        fetchPortfolioStructure()
      ]);
      
      setFullConfig(configData || []);
      setHistoryData(performanceData || []);
      setPortfolioData(pData || []);
      
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
    } catch (e) {
      console.error("Error cargando configuraciones:", e);
    } finally {
      setHasLoadedInitial(true);
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadConfigs();
    const interval = setInterval(() => loadConfigs(true), 120000);
    return () => clearInterval(interval);
  }, []);

  const activeConfig = useMemo(() => {
    if (!fullConfig || fullConfig.length === 0) return null;
    if (selectedPeriod === 'General') return fullConfig[0];
    return fullConfig.find(row => parseInt(findValue(row, ['ANIO', 'year', 'periodo'])) === selectedPeriod) || fullConfig[0];
  }, [selectedPeriod, fullConfig]);

  const metrics = useMemo(() => {
    if (!fullConfig || fullConfig.length === 0 || !historyData) {
      return { aum: 0, profit: 0, growth: 0 };
    }

    const liveAUM = parseSheetNumber(findValue(activeConfig, ['AUM_TOTAL_FONDO', 'aum', 'total_aum', 'capital_total']));
    
    let growthValue = 0;
    if (selectedPeriod === 'General') {
      const annualYieldRaw = parseSheetNumber(findValue(activeConfig, ['RENDIMIENTO_ANUAL_PCT', 'rendimiento_anual', 'annual_yield']));
      growthValue = (Math.abs(annualYieldRaw) < 1 && annualYieldRaw !== 0) ? annualYieldRaw * 100 : annualYieldRaw;
    } else {
      const yearlyRows = historyData.filter(h => parseInt(findValue(h, ['ANIO', 'year'])) === selectedPeriod);
      const sumYield = yearlyRows.reduce((acc, row) => {
        const val = parseSheetNumber(findValue(row, ['RENDIMIENTO_FONDO', 'rendimiento', 'yield']));
        const normalizedVal = (Math.abs(val) < 1 && val !== 0) ? val * 100 : val;
        return acc + normalizedVal;
      }, 0);
      growthValue = sumYield;
    }

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
      {/* HEADER OPTIMIZADO */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
        <div className="flex flex-col gap-2 flex-1 min-w-0">
          <h1 className="text-accent text-3xl md:text-5xl font-black tracking-tighter uppercase leading-[0.9] mb-1">
            Estado de Gestión Corporativa
          </h1>
          <p className="text-text-secondary text-[11px] md:text-base font-medium">
            Cifras consolidadas de la gestión institucional al {currentDate}.
          </p>
        </div>

        <div className="flex flex-col items-center md:items-end gap-4 w-full md:w-auto shrink-0 self-center md:self-auto">
          {/* BOTÓN NUBE ANCHO COMPLETO EN MÓVIL */}
          <button 
            onClick={() => loadConfigs()}
            disabled={isLoading}
            className="w-full md:w-auto flex items-center justify-center gap-4 px-8 py-3.5 bg-white border border-surface-border rounded-full hover:shadow-premium transition-all active:scale-95 text-accent group cursor-pointer"
          >
            <div className="relative flex size-3">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75 ${isLoading ? 'duration-300' : 'duration-1000'}`}></span>
              <span className="relative inline-flex rounded-full size-3 bg-primary shadow-[0_0_12px_rgba(206,255,4,0.8)]"></span>
            </div>
            <span className="text-[11px] font-black uppercase tracking-[0.25em] leading-none">
              {isLoading ? 'Sincronizando...' : 'Nube Institucional'}
            </span>
          </button>

          {/* SELECTOR DE PERIODO CORREGIDO */}
          <div className="w-full md:w-auto flex items-center gap-2 bg-white p-1.5 rounded-2xl border border-surface-border shadow-sm overflow-x-auto hide-scrollbar">
            <span className="shrink-0 pl-3 text-[9px] font-black text-text-muted uppercase tracking-widest">Periodo:</span>
            <div className="flex gap-1 shrink-0">
              {['General', 2022, 2023, 2024, 2025, 2026].map((p) => (
                <button
                  key={p}
                  onClick={() => setSelectedPeriod(p as any)}
                  className={`px-4 py-2 rounded-xl text-[10px] font-black transition-all uppercase tracking-tight whitespace-nowrap ${
                    selectedPeriod === p ? 'bg-accent text-primary shadow-md' : 'text-text-muted hover:bg-gray-50'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        <StatCard 
          title={selectedPeriod === 'General' ? "CAPITAL BAJO GESTIÓN (AUM)" : `AUM CIERRE ${selectedPeriod}`} 
          value={metrics.aum ? `$${metrics.aum.toLocaleString('en-US', { minimumFractionDigits: 2 })}` : '---'} 
          change={metrics.growth >= 0 ? `+${metrics.growth.toFixed(2)}%` : `${metrics.growth.toFixed(2)}%`} 
          changeLabel={selectedPeriod === 'General' ? "Rendimiento Institucional" : `Crecimiento Anual ${selectedPeriod}`} 
          icon={Wallet} variant="light" isNegative={metrics.growth < 0}
        />
        <StatCard 
          title={selectedPeriod === 'General' ? "RENDIMIENTO NETO INSTITUCIONAL" : `BENEFICIO NETO ${selectedPeriod}`} 
          value={metrics.profit ? `$${metrics.profit.toLocaleString('en-US', { minimumFractionDigits: 2 })}` : '---'} 
          change={selectedPeriod === 'General' ? "Histórica" : `${selectedPeriod}`} 
          changeLabel={selectedPeriod === 'General' ? "Beneficio neto consolidado" : `Generado en el periodo`} 
          icon={PiggyBank} variant="light" isNegative={metrics.profit < 0}
        />
        <StatCard 
          title="COBERTURA DE RESERVA" value={`${reserveValue}%`} progress={reserveValue} icon={ShieldCheck} variant="light"
          changeLabel={reserveValue < 100 ? "Liquidez Corporativa Activa" : "Patrimonio 100% Protegido"}
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 bg-white rounded-[40px] p-5 md:p-8 border border-surface-border shadow-sm overflow-hidden">
          <div className="flex items-center gap-3 mb-6 md:mb-8">
            <div className="p-2.5 bg-surface-subtle rounded-xl">
              <Activity className="size-4 text-accent" />
            </div>
            <div>
              <h3 className="text-accent text-base md:text-xl font-extrabold tracking-tight">Evolución Institucional</h3>
              <p className="text-text-muted text-[8px] font-medium uppercase tracking-widest">Desempeño operativo del capital</p>
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
            <h3 className="text-accent text-base font-extrabold tracking-tight uppercase">Activos Corporativos</h3>
          </div>
          <AllocationPieChart data={portfolioData} totalAum={metrics.aum} />
          <div className="mt-6 grid grid-cols-2 gap-x-4 gap-y-2 w-full px-2">
            {portfolioData.map((item) => (
              <div key={item.name} className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <div className="size-1.5 rounded-full" style={{ backgroundColor: item.color }}></div>
                  <span className="text-[9px] font-bold text-text-secondary">{item.name}</span>
                </div>
                <span className="text-[9px] font-black text-accent">{item.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
