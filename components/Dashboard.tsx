
import React, { useState, useMemo } from 'react';
import { Wallet, PiggyBank, ShieldCheck, Activity, Target, ArrowUpRight, Bitcoin, TrendingUp, Calendar, Repeat, BarChart3, Globe, Coins } from 'lucide-react';
import StatCard from './StatCard';
import PerformanceChart from './Charts/PerformanceChart';
import AllocationPieChart from './Charts/AllocationPieChart';
import { FINANCE_CONFIG, FINANCIAL_HISTORY, getStoredYield } from '../constants';

const Dashboard: React.FC = () => {
  const [selectedPeriod, setSelectedPeriod] = useState<'General' | number>('General');

  const currentDate = new Intl.DateTimeFormat('es-ES', { 
    day: 'numeric', 
    month: 'long', 
    year: 'numeric' 
  }).format(new Date());

  const metrics = useMemo(() => {
    const years = [2022, 2023, 2024, 2025, 2026];
    let currentBalance = FINANCE_CONFIG.BASE_VALUE_PER_SHARE * FINANCE_CONFIG.TOTAL_SHARES;
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
    let displayAUM = FINANCE_CONFIG.GLOBAL_AUM;

    if (selectedPeriod === 'General') {
      displayAUM = FINANCE_CONFIG.GLOBAL_AUM;
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
  }, [selectedPeriod]);

  const reserveValue = useMemo(() => {
    if (selectedPeriod === 2022) return 94.25;
    return FINANCE_CONFIG.RESERVE_GOAL_PCT;
  }, [selectedPeriod]);

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
        <div>
          <h1 className="text-accent text-2xl md:text-4xl font-black tracking-tighter uppercase leading-tight mb-1">Panel de Control</h1>
          <p className="text-text-secondary text-[11px] md:text-base font-medium">Estado consolidado al {currentDate}.</p>
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
          changeLabel={selectedPeriod === 2022 ? "Soporte de Pérdidas Activo" : "Cobertura Total Garantizada"}
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pb-10">
        <div className="bg-white rounded-[24px] border border-surface-border shadow-sm overflow-hidden flex flex-col">
          <div className="p-5 flex justify-between items-center border-b border-gray-50 bg-surface-subtle/30">
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 bg-white rounded-lg shadow-sm"><BarChart3 size={14} className="text-accent" /></div>
              <h3 className="text-accent text-xs font-black tracking-tight uppercase">Transacciones</h3>
            </div>
          </div>
          <div className="flex-1 divide-y divide-gray-50 overflow-x-auto hide-scrollbar">
            {transactions.map((tx) => {
              const style = getTxStyles(tx.type);
              return (
                <div key={tx.id} className="px-5 py-4 flex items-center justify-between hover:bg-gray-50/50 transition-colors group min-w-[280px]">
                  <div className="flex items-center gap-3 overflow-hidden">
                    <div className={`p-2 rounded-xl ${style.bg} ${style.text} shrink-0 shadow-sm`}>
                      {style.icon}
                    </div>
                    <div className="truncate">
                      <p className="text-[10px] font-black text-accent truncate uppercase">{tx.desc}</p>
                      <p className="text-[8px] font-bold text-text-muted flex items-center gap-1">
                        <Calendar size={10} /> {tx.date}
                      </p>
                    </div>
                  </div>
                  <div className="text-right shrink-0 ml-4">
                    <p className={`text-xs font-black ${tx.amount > 0 ? 'text-accent' : 'text-text-muted'}`}>
                      {tx.amount > 0 ? `$${tx.amount.toLocaleString('en-US')}` : '--'}
                    </p>
                    <p className="text-[8px] font-black text-text-muted uppercase tracking-tighter">USD</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-white rounded-[24px] border border-surface-border shadow-sm p-5 flex flex-col">
          <div className="flex justify-between items-center mb-5">
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 bg-accent rounded-lg shadow-sm text-primary"><Globe size={14} /></div>
              <h3 className="text-accent text-xs font-black tracking-tight uppercase">Mercado</h3>
            </div>
          </div>
          <div className="space-y-2">
            {marketWatch.map((item) => (
              <div key={item.id} className="p-3 rounded-xl border border-gray-100 flex items-center justify-between transition-all group cursor-default">
                <div className="flex items-center gap-3">
                  <div className="size-8 rounded-lg flex items-center justify-center text-white shadow-sm shrink-0" style={{ backgroundColor: item.color }}>
                    {item.symbol === 'BTC' ? <Bitcoin size={16} /> : item.symbol === 'SPX' ? <TrendingUp size={16} /> : <Coins size={16} />}
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-accent leading-none">{item.name}</p>
                    <p className="text-[8px] font-bold text-text-muted uppercase mt-1">{item.symbol}</p>
                  </div>
                </div>
                <div className="text-right min-w-[70px]">
                  <p className="text-[10px] font-black text-accent leading-none">{item.price}</p>
                  <span className={`text-[8px] font-black px-1 py-0.5 rounded-md mt-1 inline-block ${item.pos ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-500'}`}>
                    {item.change}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
