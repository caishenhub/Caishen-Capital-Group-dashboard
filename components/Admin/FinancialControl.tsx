
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
  DollarSign,
  CloudLightning,
  RefreshCw,
  AlertTriangle,
  ShieldCheck
} from 'lucide-react';
import { adminSetYield, adminUpdateGlobalPayoutStatus, getStoredYield, getPayoutStatus } from '../../constants';
import { updateTableData } from '../../lib/googleSheets';

const FinancialControl: React.FC = () => {
  const [selectedYear, setSelectedYear] = useState(2025);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [yieldValue, setYieldValue] = useState('');
  const [payoutStatus, setPayoutStatus] = useState<'PENDING' | 'PAID'>('PENDING');
  const [isSaving, setIsSaving] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);

  const months = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

  useEffect(() => {
    const currentYield = getStoredYield(selectedYear, selectedMonth);
    setYieldValue((currentYield * 100).toString());
    setPayoutStatus(getPayoutStatus(selectedYear, selectedMonth));
  }, [selectedYear, selectedMonth]);

  const handleSaveToCloud = async () => {
    setIsSaving(true);
    setSyncError(null);
    
    const numericYield = parseFloat(yieldValue) / 100;
    
    try {
      adminSetYield(selectedYear, selectedMonth, numericYield);
      
      const cloudData = {
        ANIO: selectedYear,
        MES: selectedMonth + 1,
        RENDIMIENTO_FONDO: numericYield,
        ESTATUS_PAGO: payoutStatus,
        TIMESTAMP_UPDATE: new Date().toISOString()
      };

      const result = await updateTableData('HISTORIAL_RENDIMIENTOS', cloudData);
      
      if (result.success) {
        setIsSuccess(true);
        setTimeout(() => setIsSuccess(false), 3000);
      } else {
        setSyncError("Guardado localmente, pero falló la sincronización con la nube.");
      }
    } catch (e) {
      setSyncError("Error crítico de red al intentar sincronizar.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleMarkAsPaidGlobal = async () => {
    setIsSaving(true);
    try {
      adminUpdateGlobalPayoutStatus(selectedYear, selectedMonth, 'PAID');
      setPayoutStatus('PAID');
      
      const cloudData = {
        ANIO: selectedYear,
        MES: selectedMonth + 1,
        ESTATUS_PAGO: 'PAGADO',
        ACTION: 'UPDATE_PAYOUT'
      };

      await updateTableData('DIVIDENDOS_SOCIOS', cloudData);
      
      setIsSuccess(true);
      setTimeout(() => setIsSuccess(false), 3000);
    } catch (e) {
      setSyncError("Error al actualizar estatus global en la nube.");
    } finally {
      setIsSaving(false);
    }
  };

  const isYieldSuministrado = parseFloat(yieldValue) !== 0 || localStorage.getItem(`YIELD_${selectedYear}_${selectedMonth}`) !== null;

  return (
    <div className="space-y-8 animate-in fade-in duration-700 w-full mt-10 pb-20">
      <div className="h-px bg-surface-border w-full mb-10"></div>
      
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-accent rounded-2xl text-primary shadow-xl ring-4 ring-primary/10">
            <Settings size={24} />
          </div>
          <div>
            <h2 className="text-accent text-2xl md:text-3xl font-black tracking-tighter uppercase leading-none">Consola Administrativa</h2>
            <div className="flex items-center gap-2 mt-2">
               <div className="size-2 bg-green-500 rounded-full animate-pulse"></div>
               <span className="text-[10px] font-black text-text-muted uppercase tracking-widest">Enlace Maestro Activo</span>
            </div>
          </div>
        </div>
        
        <div className="flex gap-2 bg-white p-1.5 rounded-2xl border border-surface-border shadow-sm">
          <select 
            value={selectedYear} 
            onChange={(e) => setSelectedYear(parseInt(e.target.value))}
            className="bg-transparent border-none text-xs font-black uppercase focus:ring-0 cursor-pointer px-4 appearance-none bg-none"
          >
            {[2022, 2023, 2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
          </select>
          <div className="w-px h-6 bg-gray-100 self-center"></div>
          <select 
            value={selectedMonth} 
            onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
            className="bg-transparent border-none text-xs font-black uppercase focus:ring-0 cursor-pointer px-4 appearance-none bg-none"
          >
            {months.map((m, i) => <option key={i} value={i}>{m}</option>)}
          </select>
        </div>
      </header>

      <div className="bg-accent rounded-[40px] p-8 lg:p-12 text-white shadow-2xl relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none group-hover:scale-110 transition-transform duration-1000">
          <CloudLightning size={240} />
        </div>
        
        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-8">
            <div className="flex items-center gap-4">
              <div className="p-4 bg-white/10 rounded-2xl backdrop-blur-md border border-white/10">
                <Calendar className="text-primary" size={28} />
              </div>
              <div>
                <h3 className="text-2xl font-black tracking-tight uppercase leading-none">{months[selectedMonth]} {selectedYear}</h3>
                <p className="text-primary/70 text-[10px] font-black uppercase tracking-widest mt-2">Ventana de Auditoría Abierta</p>
              </div>
            </div>

            <div className="space-y-4">
              <label className="text-[10px] font-black text-primary uppercase tracking-[0.3em] ml-1">Rentabilidad Mensual (%)</label>
              <div className="relative max-w-xs">
                <input 
                  type="number"
                  step="0.01"
                  value={yieldValue}
                  onChange={(e) => setYieldValue(e.target.value)}
                  placeholder="0.00"
                  className="w-full bg-white/5 border-2 border-white/20 rounded-[28px] px-8 py-6 text-4xl font-black text-white focus:border-primary focus:ring-0 transition-all placeholder:text-white/10"
                />
                <span className="absolute right-8 top-1/2 -translate-y-1/2 text-4xl font-black text-primary">%</span>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className={`p-8 rounded-[32px] border transition-all duration-500 ${
              payoutStatus === 'PAID' ? 'bg-primary/10 border-primary/30' : 'bg-white/5 border-white/10'
            }`}>
              <div className="flex justify-between items-start mb-6">
                <div>
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">Estado de Dispersión</span>
                  <div className="flex items-center gap-2">
                    <span className={`text-xl font-black uppercase tracking-tight ${payoutStatus === 'PAID' ? 'text-primary' : 'text-orange-400'}`}>
                      {payoutStatus === 'PAID' ? 'Liquidación Pagada' : 'Pago Pendiente'}
                    </span>
                    {payoutStatus === 'PAID' && <CheckCircle2 size={20} className="text-primary animate-in zoom-in" />}
                  </div>
                </div>
              </div>

              {isYieldSuministrado ? (
                <button 
                  onClick={payoutStatus === 'PENDING' ? handleMarkAsPaidGlobal : () => setPayoutStatus('PENDING')}
                  className={`w-full py-4 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-3 transition-all active:scale-95 ${
                    payoutStatus === 'PENDING' 
                    ? 'bg-primary text-accent hover:shadow-[0_0_20px_rgba(206,255,4,0.4)]' 
                    : 'bg-white/10 text-white hover:bg-white/20'
                  }`}
                >
                  <DollarSign size={18} />
                  {payoutStatus === 'PENDING' ? 'Confirmar Pago Global' : 'Revertir a Pendiente'}
                </button>
              ) : (
                <div className="text-center py-4 text-[10px] font-black text-white/30 uppercase tracking-widest border border-dashed border-white/10 rounded-2xl">
                  Asigne rentabilidad para habilitar pagos
                </div>
              )}
            </div>

            <button 
              onClick={handleSaveToCloud}
              disabled={isSaving || !yieldValue}
              className="w-full bg-white text-accent hover:bg-primary transition-all disabled:opacity-30 font-black py-6 rounded-[28px] flex items-center justify-center gap-4 uppercase text-xs tracking-[0.2em] shadow-2xl group/save"
            >
              {isSaving ? (
                <RefreshCw size={20} className="animate-spin" />
              ) : (
                <Save size={20} className="group-hover/save:scale-110 transition-transform" />
              )}
              {isSaving ? "Sincronizando Nube..." : "Guardar y Publicar Rendimiento"}
            </button>
          </div>
        </div>
      </div>

      {syncError && (
        <div className="bg-red-50 border-2 border-red-100 rounded-[28px] p-6 flex items-start gap-4 animate-in slide-in-from-top-2">
          <AlertTriangle className="text-red-600 shrink-0 mt-1" size={24} />
          <div>
             <h4 className="text-red-900 font-black text-sm uppercase tracking-tight">Error de Sincronización</h4>
             <p className="text-red-700 text-xs font-medium mt-1 leading-relaxed">{syncError}</p>
             <button onClick={handleSaveToCloud} className="text-red-900 text-[10px] font-black uppercase mt-3 underline underline-offset-4 decoration-2">Reintentar conexión ahora</button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-blue-50/50 border border-blue-100 rounded-[32px] p-8 flex items-start gap-5">
          <div className="p-3 bg-blue-100 rounded-2xl text-blue-600">
            <Info size={24} />
          </div>
          <div className="space-y-2">
            <h4 className="text-blue-900 font-black text-sm uppercase tracking-tight">Protocolo de Escritura</h4>
            <p className="text-[11px] text-blue-800/80 font-medium leading-relaxed">
              Al guardar, el sistema envía una señal cifrada a su Google Apps Script. 
              Esto actualiza las tablas maestras y refleja los datos en el portal de todos los socios.
            </p>
          </div>
        </div>

        <div className="bg-green-50/50 border border-green-100 rounded-[32px] p-8 flex items-start gap-5">
          <div className="p-3 bg-green-100 rounded-2xl text-green-600">
            <ShieldCheck size={24} />
          </div>
          <div className="space-y-2">
            <h4 className="text-green-900 font-black text-sm uppercase tracking-tight">Seguridad Administrativa</h4>
            <p className="text-[11px] text-green-800/80 font-medium leading-relaxed">
              Las operaciones de escritura requieren que el Apps Script tenga permisos de "Cualquier persona, incluso anónimo" para procesar peticiones web.
            </p>
          </div>
        </div>
      </div>

      {isSuccess && (
        <div className="fixed bottom-24 right-10 bg-green-600 text-white px-10 py-5 rounded-[24px] shadow-[0_20px_50px_rgba(22,163,74,0.3)] flex items-center gap-4 animate-in slide-in-from-right-10 font-black uppercase text-xs tracking-widest z-[1000]">
          <div className="bg-white/20 p-2 rounded-full">
            <CheckCircle2 size={24} />
          </div>
          <div>
            <p>Sincronización Exitosa</p>
            <p className="text-[10px] opacity-60 font-bold">Datos reflejados en la nube</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default FinancialControl;
