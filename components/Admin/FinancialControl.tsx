
import React, { useState, useEffect } from 'react';
import { 
  Settings, 
  TrendingUp, 
  Lock, 
  Unlock, 
  CheckCircle2, 
  Calendar,
  Save,
  Info,
  DollarSign
} from 'lucide-react';
import { FINANCE_CONFIG, adminSetYield, adminUpdateGlobalPayoutStatus, getStoredYield, getPayoutStatus } from '../../constants';

const FinancialControl: React.FC = () => {
  const [selectedYear, setSelectedYear] = useState(2025);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [yieldValue, setYieldValue] = useState('');
  const [payoutStatus, setPayoutStatus] = useState<'PENDING' | 'PAID'>('PENDING');
  const [isSaving, setIsSaving] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const months = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

  // Cargar datos cuando cambia el mes o año
  useEffect(() => {
    const currentYield = getStoredYield(selectedYear, selectedMonth);
    setYieldValue((currentYield * 100).toString());
    setPayoutStatus(getPayoutStatus(selectedYear, selectedMonth));
  }, [selectedYear, selectedMonth]);

  const handleSave = () => {
    setIsSaving(true);
    setTimeout(() => {
      adminSetYield(selectedYear, selectedMonth, parseFloat(yieldValue) / 100);
      setIsSaving(false);
      setIsSuccess(true);
      setTimeout(() => setIsSuccess(false), 3000);
    }, 800);
  };

  const handleMarkAsPaidGlobal = () => {
    // Sincronizar estado global para todos los accionistas
    adminUpdateGlobalPayoutStatus(selectedYear, selectedMonth, 'PAID');
    setPayoutStatus('PAID');
    setIsSuccess(true);
    setTimeout(() => setIsSuccess(false), 3000);
  };

  const handleResetToPending = () => {
    adminUpdateGlobalPayoutStatus(selectedYear, selectedMonth, 'PENDING');
    setPayoutStatus('PENDING');
    setIsSuccess(true);
    setTimeout(() => setIsSuccess(false), 3000);
  };

  // Regla: Mes suministrado si el rendimiento es > 0 o existe en storage
  const isYieldSuministrado = parseFloat(yieldValue) > 0 || localStorage.getItem(`YIELD_${selectedYear}_${selectedMonth}`) !== null;

  return (
    <div className="space-y-8 animate-in fade-in duration-700 w-full mt-10">
      <div className="h-px bg-surface-border w-full mb-10"></div>
      
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-accent rounded-xl text-primary"><Settings size={20} /></div>
          <h2 className="text-accent text-2xl font-black tracking-tighter uppercase">Consola de Control Financiero</h2>
        </div>
        
        <div className="flex gap-2">
          <select 
            value={selectedYear} 
            onChange={(e) => setSelectedYear(parseInt(e.target.value))}
            className="bg-white border border-surface-border rounded-xl px-4 py-2 text-xs font-black uppercase"
          >
            {[2023, 2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
          </select>
          <select 
            value={selectedMonth} 
            onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
            className="bg-white border border-surface-border rounded-xl px-4 py-2 text-xs font-black uppercase"
          >
            {months.map((m, i) => <option key={i} value={i}>{m}</option>)}
          </select>
        </div>
      </header>

      <div className="bg-accent rounded-[32px] p-8 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col lg:flex-row gap-8 items-start justify-between">
          <div className="space-y-6 max-w-sm w-full">
            <div className="flex items-center gap-3">
              <Calendar className="text-primary" size={24} />
              <h3 className="text-lg font-black tracking-tight">Periodo: {months[selectedMonth]} {selectedYear}</h3>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-primary uppercase tracking-[0.2em] ml-1">Rentabilidad (%)</label>
              <div className="relative">
                <input 
                  type="number"
                  step="0.01"
                  value={yieldValue}
                  onChange={(e) => setYieldValue(e.target.value)}
                  placeholder="0.00"
                  className="w-full bg-white/5 border-2 border-white/10 rounded-2xl px-5 py-4 text-3xl font-black text-white focus:border-primary focus:ring-0 transition-all"
                />
                <span className="absolute right-5 top-1/2 -translate-y-1/2 text-3xl font-black text-primary">%</span>
              </div>
            </div>
          </div>

          <div className="flex-1 w-full flex flex-col gap-4">
            {/* ESTADO DE PAGO GLOBAL */}
            {isYieldSuministrado ? (
              <div className="p-6 bg-white/5 rounded-2xl border border-white/10 flex flex-col sm:flex-row justify-between items-center gap-4 animate-in fade-in zoom-in-95 duration-500">
                <div>
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">Estatus de Pago Global</span>
                  <span className={`text-sm font-black uppercase ${payoutStatus === 'PAID' ? 'text-primary' : 'text-orange-400'}`}>
                    {payoutStatus === 'PAID' ? 'Sincronizado: PAGADO' : 'Sincronizado: PENDIENTE'}
                  </span>
                </div>
                {payoutStatus === 'PENDING' ? (
                  <button 
                    onClick={handleMarkAsPaidGlobal}
                    className="w-full sm:w-auto bg-primary text-accent px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center gap-2 hover:scale-105 transition-transform shadow-lg shadow-primary/20"
                  >
                    <DollarSign size={14} /> Marcar como Pagado (Todos)
                  </button>
                ) : (
                  <button 
                    onClick={handleResetToPending}
                    className="w-full sm:w-auto bg-white/10 text-white px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center gap-2 hover:bg-white/20 transition-all"
                  >
                    Revertir a Pendiente
                  </button>
                )}
              </div>
            ) : (
              <div className="p-6 bg-white/5 rounded-2xl border border-dashed border-white/10 flex items-center justify-center">
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Suministre rentabilidad para habilitar el flujo de pagos</p>
              </div>
            )}

            <button 
              onClick={handleSave}
              disabled={isSaving || !yieldValue}
              className="w-full bg-white/10 hover:bg-white/20 disabled:opacity-30 text-white font-black py-4 rounded-xl transition-all flex items-center justify-center gap-2 uppercase text-[10px] tracking-widest border border-white/10 mt-auto"
            >
              <Save size={14} />
              {isSaving ? "Guardando..." : "Guardar Rendimiento"}
            </button>
          </div>
        </div>
      </div>

      <div className="bg-blue-50/50 border border-blue-100 rounded-2xl p-5 flex items-start gap-4">
        <Info className="text-blue-600 shrink-0 mt-0.5" size={18} />
        <p className="text-xs text-blue-800/80 font-medium leading-relaxed">
          Al marcar un mes como <strong>PAGADO</strong>, todos los accionistas verán instantáneamente el cambio en sus perfiles individuales. Se recomienda realizar este paso solo tras confirmar la dispersión bancaria.
        </p>
      </div>

      {isSuccess && (
        <div className="fixed bottom-10 right-10 bg-green-600 text-white px-8 py-4 rounded-2xl shadow-2xl flex items-center gap-3 animate-in slide-in-from-bottom-5 font-black uppercase text-xs tracking-widest z-[200]">
          <CheckCircle2 size={20} />
          Actualizado correctamente
        </div>
      )}
    </div>
  );
};

export default FinancialControl;
