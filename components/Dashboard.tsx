
import React, { useState, useMemo, useEffect } from 'react';
import { Wallet, PiggyBank, ShieldCheck, Activity, Target, ArrowUpRight, Bitcoin, TrendingUp, Calendar, Repeat, BarChart3, Globe, Coins, RefreshCw } from 'lucide-react';
import StatCard from './StatCard';
import PerformanceChart from './Charts/PerformanceChart';
import AllocationPieChart from './Charts/AllocationPieChart';
import { FINANCE_CONFIG, FINANCIAL_HISTORY, getStoredYield } from '../constants';
import { fetchTableData, findValue } from '../lib/googleSheets';

const Dashboard: React.FC = () => {
  const [selectedPeriod, setSelectedPeriod] = useState<'General' | number>('General');
  const [fullConfig, setFullConfig] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadConfigs = async () => {
    setIsLoading(true);
    try {
      // Cargamos toda la tabla, no solo la primera fila
      const data = await fetchTableData('CONFIG_MAESTRA');
      setFullConfig(data || []);
    } catch (e) {
      console.error("Error cargando configuraciones:", e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadConfigs();
  }, []);

  // Identificar la fila de configuración activa basada en el periodo seleccionado
  const activeConfig = useMemo(() => {
    if (!fullConfig.length) return null;
    
    if (selectedPeriod === 'General') {
      return fullConfig[0]; // Por defecto la primera fila es la general
    }

    // Buscar una fila que coincida con el año seleccionado
    const yearRow = fullConfig.find(row => {
      const rowYear = parseInt(findValue(row, ['ANIO', 'year', 'periodo']));
      return rowYear === selectedPeriod;
    });

    return yearRow || fullConfig[0];
  }, [selectedPeriod, fullConfig]);

  const currentDate = new Intl.DateTimeFormat('es-ES', { 
    day: 'numeric', 
    month: 'long', 
    year: 'numeric' 
  }).format(new Date());

  // Extracción robusta de valores usando la fila activa (del año o general)
  const liveAUM = parseFloat(String(findValue(activeConfig, ['AUM_TOTAL_FONDO', 'aum', 'total_aum']) || FINANCE_CONFIG.GLOBAL_AUM).replace(',', '.'));
  const liveShareValue = parseFloat(String(findValue(activeConfig, ['VALOR_NOMINAL_ACCION', 'nominal_value', 'precio_accion']) || FINANCE_CONFIG.NOMINAL_VALUE_PER_SHARE).replace(',', '.'));
  const liveTotalShares = parseInt(findValue(activeConfig, ['TOTAL_ACCIONES_FONDO', 'total_shares', 'acciones']) || FINANCE_CONFIG.TOTAL_SHARES);

  const metrics = useMemo(() => {
    const years = [2022, 2023, 2024, 2025, 2026];
    let currentBalance = liveShareValue * liveTotalShares;
    const yearlyBalances: Record<number, number> = {};
    const yearlyCompoundYields: Record<number, number> = {};

    years.forEach(year => {
      const history = FINANCIAL_HISTORY[year] || [];
      let annualFactor = 1;
      history.forEach((_, idx) => {
        const mYield = getStoredYield(year, idx);
        annualFactor *= (1 + mYield);
      });
      currentBalance = currentBalance * annualFactor;
      yearlyBalances[year] = currentBalance;
      yearlyCompoundYields[year] = (annualFactor - 1);
    });

    let periodProfit = 0;
    let periodGrowth = 0;
    let displayAUM = liveAUM;

    if (selectedPeriod === 'General') {
      displayAUM = liveAUM;
      const totalFactor = Object.keys(yearlyCompoundYields).reduce((acc, year) => {
        const history = FINANCIAL_HISTORY[parseInt(year)] || [];
        let factor = 1;
        history.forEach((_, idx) => factor *= (1 + getStoredYield(parseInt(year), idx)));
        return acc * factor;
      }, 1);
      periodGrowth = (totalFactor - 1) * 100;
      periodProfit = displayAUM * (periodGrowth / 100);
    } else {
      const year = selectedPeriod as number;
      displayAUM = yearlyBalances[year];
      periodGrowth = yearlyCompoundYields[year] * 100;
      periodProfit = displayAUM * (periodGrowth / 100);
    }

    return { aum: displayAUM, profit: periodProfit, growth: periodGrowth };
  }, [selectedPeriod, liveAUM, liveShareValue, liveTotalShares]);

  /**
   * LÓGICA DE FONDO DE RESERVA FINAL
   * Prioridad 1: Valor en la fila del año seleccionado (Columna META_FONDO_RESERVA_PCT)
   * Prioridad 2: Valor en la fila general (Columna META_FONDO_RESERVA_PCT)
   * Prioridad 3: Valor por defecto del sistema (100)
   */
  const reserveValue = useMemo(() => {
    const rawVal = findValue(activeConfig, ['META_FONDO_RESERVA_PCT', 'fondo_reserva', 'reserva_pct']);
    const sheetValue = parseFloat(String(rawVal).replace(',', '.'));
    
    // Si el valor es un número válido en el Sheet, se muestra tal cual (sin importar el año)
    if (!isNaN(sheetValue)) return sheetValue;

    // Fallback de seguridad si el Excel está vacío
    return FINANCE_CONFIG.RESERVE_GOAL_PCT;
  }, [activeConfig]);

  const transactions = [
    { id: 'tx1', type: 'dividend', amount: 31450.20, date: '05 Ene, 2026', desc: 'DISPERSIÓN DIVIDENDOS (41.77%)', status: 'Finalizado' },
    { id: 'tx2', type: 'rebalance', amount: 12400.00, date: '10 Dic, 2025', desc: 'Ajuste Derivados T4', status: 'Completado' },
    { id: 'tx3', type: 'audit', amount: 0, date: '05 Dic, 2025', desc: 'Certificación Activos', status: 'Verificado' },
  ];

  const marketWatch = [
    { id: 'w1', name: 'S&P 500 Index', symbol: 'SPX', price: '5,982.10', change: '+1.45%', color: '#1d1c2d', pos: true },
    { id: 'w2', name: 'Gold (Spot)', symbol: 'XAU/USD', price: '2,645.40', change: '+0.82%', color: '#D4AF37', pos: true },
    { id: 'w3', name: 'Bitcoin', symbol: 'BTC', price: '96,240.00', change: '-2.15%', color: '#f7931a', pos: false },
  ];

  const getTxStyles = (type: string) => {
    switch(type) {
      case 'dividend': return { bg: 'bg-green-50', text: 'text-green-600', icon: <PiggyBank className="size-4" /> };
      case 'rebalance': return { bg: 'bg-blue-50', text: 'text-blue-600', icon: <Repeat className="size-4" /> };
      case 'audit': return { bg: 'bg-amber-50', text: 'text-amber-600', icon: <ShieldCheck className="size-4" /> };
      default: return { bg: 'bg-gray-50', text: 'text-accent', icon: <ArrowUpRight className="size-4" /> };
    }
  };

  return (
    <div className="p-4 md:p-8 space-y-6 md:space-y-8 animate-in fade-in duration-700 max-w-full overflow-x-hidden">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="flex items-center gap-4">
          <div>
            <h1 className="text-accent text-2xl md:text-4xl font-black tracking-tighter uppercase leading-tight mb-1">Panel de Control</h1>
            <p className="text-text-secondary text-[11px] md:text-base font-medium">Estado consolidado al {currentDate}.</p>
          </div>
          <button 
            onClick={loadConfigs}
            className={`p-2 bg-white border border-surface-border rounded-xl text-accent hover:bg-surface-subtle transition-all ${isLoading ? 'opacity-50' : ''}`}
            title="Sincronizar con Google Sheets"
          >
            <RefreshCw size={18} className={isLoading ? 'animate-spin' : ''} />
          </button>
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
          title={selectedPeriod === 'General' ? "BALANCE ACTUAL (AUM)" : `AUM CIERRE ${selectedPeriod}`} 
          value={`$${metrics.aum.toLocaleString('en-US', { minimumFractionDigits: 2 })}`} 
          change={metrics.growth >= 0 ? `+${metrics.growth.toFixed(2)}%` : `${metrics.growth.toFixed(2)}%`} 
          changeLabel={selectedPeriod === 'General' ? "Crecimiento Acumulado" : `Rendimiento Anual`} 
          icon={Wallet} variant="light" isNegative={metrics.growth < 0}
        />
        <StatCard 
          title={selectedPeriod === 'General' ? "GANANCIA HISTÓRICA" : `UTILIDAD ${selectedPeriod}`} 
          value={`$${metrics.profit.toLocaleString('en-US', { minimumFractionDigits: 2 })}`} 
          change={selectedPeriod === 'General' ? `+${metrics.growth.toFixed(1)}%` : (metrics.growth >= 0 ? `+${metrics.growth.toFixed(1)}%` : `${metrics.growth.toFixed(1)}%`)} 
          changeLabel={selectedPeriod === 'General' ? "Consolidado histórico" : `Resultado del año`} 
          icon={PiggyBank} variant="light" isNegative={metrics.profit < 0}
        />
        <StatCard 
          title="FONDO DE RESERVA" value={`${reserveValue}%`} progress={reserveValue} icon={ShieldCheck} variant="light"
          changeLabel={reserveValue < 100 ? "Soporte de Pérdidas Activo" : "Cobertura Total Garantizada"}
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 bg-white rounded-3xl p-5 md:p-8 border border-surface-border shadow-sm overflow-hidden">
          <div className="flex items-center gap-3 mb-6 md:mb-8">
            <div className="p-2.5 bg-surface-subtle rounded-xl">
              <Activity className="size-4 text-accent" />
            </div>
            <div>
              <h3 className="text-accent text-base md:text-xl font-extrabold tracking-tight">Evolución del Portafolio</h3>
              <p className="text-text-muted text-[8px] font-medium uppercase tracking-widest">Desempeño consolidado</p>
            </div>
          </div>
          <div className="h-[240px] md:h-[350px] w-full">
            <PerformanceChart initialYear={selectedPeriod} />
          </div>
        </div>

        <div className="bg-white rounded-3xl p-6 md:p-8 border border-surface-border shadow-sm flex flex-col items-center justify-center">
          <div className="flex items-center gap-3 mb-6 w-full">
            <div className="p-2.5 bg-primary/10 rounded-xl">
              <Target className="size-4 text-accent" />
            </div>
            <h3 className="text-accent text-base font-extrabold tracking-tight uppercase">Composición</h3>
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
