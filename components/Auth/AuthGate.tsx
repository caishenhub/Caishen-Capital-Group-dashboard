
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Lock, ShieldCheck, AlertCircle, X, ChevronRight, UserPlus, RefreshCw, CheckCircle2 } from 'lucide-react';
import { fetchTableData, findValue, warmUpCache } from '../../lib/googleSheets';

const AuthGate: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [identifier, setIdentifier] = useState('');
  const [showPinModal, setShowPinModal] = useState(false);
  const [foundUser, setFoundUser] = useState<any>(null);
  const [userPool, setUserPool] = useState<any[]>([]);
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isPoolLoading, setIsPoolLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    const session = localStorage.getItem('ccg_session');
    if (session) setIsAuthenticated(true);
    setIsLoading(false);

    const loadUserPool = async () => {
      try {
        // Uso de la nueva hoja institucional LIBRO_ACCIONISTAS
        const data = await fetchTableData('LIBRO_ACCIONISTAS');
        setUserPool(data || []);
      } catch (e) {
        console.error("Error cargando padrón preventivo:", e);
      } finally {
        setIsPoolLoading(false);
      }
    };
    loadUserPool();
    
    if (session) warmUpCache();
  }, []);

  const handleIdentifierSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const input = identifier.toLowerCase().trim();
    if (!input) return;
    
    setError('');

    let currentPool = userPool;
    if (isPoolLoading) {
      setIsSyncing(true);
      try {
        currentPool = await fetchTableData('LIBRO_ACCIONISTAS');
        setUserPool(currentPool);
        setIsPoolLoading(false);
      } catch (e) {
        setError('Error de conexión con el servidor.');
        setIsSyncing(false);
        return;
      }
    }

    const user = currentPool.find(u => {
      const uId = String(findValue(u, ['UID_SOCIO', 'uid', 'id_socio']) || '').toLowerCase();
      const uEmail = String(findValue(u, ['EMAIL_SOCIO', 'email', 'correo']) || '').toLowerCase();
      return uId === input || uEmail === input;
    });

    if (user) {
      setFoundUser(user);
      setShowPinModal(true);
      setIsSyncing(false);
      warmUpCache();
    } else {
      setError('Socio no encontrado en el padrón oficial.');
      setIsSyncing(false);
    }
  };

  const validateAccess = useCallback(async () => {
    if (!foundUser || pin.length !== 4) return;
    
    setIsSyncing(true);
    const userPin = String(findValue(foundUser, ['PIN_ACCESO', 'pin', 'clave']) || '');

    if (userPin === pin) {
      localStorage.setItem('ccg_session', JSON.stringify({ 
        uid: findValue(foundUser, ['UID_SOCIO', 'uid']), 
        name: findValue(foundUser, ['NOMBRE_COMPLETO', 'name', 'nombre']), 
        email: findValue(foundUser, ['EMAIL_SOCIO', 'email']),
        shares: parseInt(findValue(foundUser, ['ACCIONES_POSEIDAS', 'shares', 'acciones']) || '0'),
        ts: Date.now() 
      }));
      setIsAuthenticated(true);
      setShowPinModal(false);
      window.location.hash = '/';
    } else {
      setError('PIN Incorrecto');
      setPin('');
      setIsSyncing(false);
    }
  }, [foundUser, pin]);

  const addDigit = (digit: string) => {
    if (pin.length < 4) setPin(prev => prev + digit);
  };

  const removeDigit = () => {
    setPin(prev => prev.slice(0, -1));
  };

  useEffect(() => {
    if (!showPinModal) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (/^[0-9]$/.test(e.key)) addDigit(e.key);
      else if (e.key === 'Backspace') removeDigit();
      else if (e.key === 'Enter' && pin.length === 4) validateAccess();
      else if (e.key === 'Escape') setShowPinModal(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showPinModal, pin, validateAccess]);

  if (isLoading) return null;
  if (isAuthenticated) return <>{children}</>;

  return (
    <div 
      className="fixed inset-0 z-[9999] flex items-center justify-center p-6 overflow-hidden bg-cover bg-center"
      style={{ backgroundImage: "url('https://i.ibb.co/HL7RGf9F/Chat-GPT-Image-8-ene-2026-10-46-40-p-m.png')" }}
    >
      <div className="absolute inset-0 bg-accent/40 backdrop-blur-sm" />
      <div className="relative w-full max-w-md bg-white rounded-[40px] shadow-premium border border-white/20 p-8 md:p-10 space-y-8 animate-in fade-in zoom-in-95 duration-700">
        <div className="flex flex-col items-center text-center space-y-6">
          <img src="https://i.ibb.co/zT3RhhT9/CAISHEN-NO-FONDO-AZUL-1.png" alt="Caishen Capital" className="h-16 w-auto object-contain" />
          <div className="space-y-2">
            <h1 className="text-2xl font-black text-accent tracking-tighter uppercase">Portal Accionistas</h1>
            
            <div className="flex items-center justify-center gap-1.5 pt-1">
              {isPoolLoading ? (
                <>
                  <RefreshCw size={10} className="animate-spin text-primary" />
                  <span className="text-[8px] font-black text-text-muted uppercase tracking-[0.2em]">Sincronizando base de datos...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 size={10} className="text-primary" />
                  <span className="text-[8px] font-black text-primary uppercase tracking-[0.2em]">Sistema listo para validación</span>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-8">
          <form onSubmit={handleIdentifierSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-text-muted uppercase tracking-widest ml-1">Correo o ID de Socio</label>
              <div className="relative">
                <input 
                  type="text" 
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="ej: #USR-008"
                  className="w-full bg-surface-subtle border-2 border-surface-border rounded-2xl px-5 py-4 text-sm font-bold text-accent focus:border-primary focus:ring-0 transition-all"
                />
              </div>
            </div>
            {error && !showPinModal && (
              <div className="flex items-center gap-2 text-red-600 text-[10px] font-black uppercase bg-red-50 p-3 rounded-xl">
                <AlertCircle size={14} />
                {error}
              </div>
            )}
            <button 
              type="submit"
              disabled={isSyncing}
              className="w-full bg-accent text-primary font-black py-5 rounded-2xl flex items-center justify-center gap-2 hover:bg-accent/90 transition-all shadow-xl hover:-translate-y-1 active:scale-95 uppercase text-xs tracking-[0.2em] disabled:opacity-50"
            >
              {isSyncing ? 'Procesando...' : 'Siguiente'}
              <ChevronRight size={18} />
            </button>
          </form>

          <div className="pt-6 border-t border-gray-100">
             <div className="bg-surface-subtle border border-surface-border rounded-3xl p-6 text-center space-y-4 transition-all hover:border-primary/50 group">
                <div className="flex justify-center">
                   <div className="p-3 bg-white rounded-2xl text-accent shadow-sm group-hover:scale-110 transition-transform">
                      <UserPlus size={24} className="text-primary" />
                   </div>
                </div>
                <div className="space-y-1">
                  <h3 className="text-xs font-black text-accent uppercase tracking-tight">¿Nuevo Accionista?</h3>
                  <p className="text-[10px] text-text-muted font-bold leading-relaxed uppercase tracking-widest">Inicie su proceso de vinculación oficial</p>
                </div>
                <button 
                  onClick={() => window.open('https://registro-caishen-capital-group.vercel.app/', '_blank')}
                  className="w-full bg-white border-2 border-surface-border text-accent font-black py-4 rounded-xl flex items-center justify-center gap-2 hover:bg-accent hover:text-white transition-all uppercase text-[10px] tracking-widest"
                >
                  Registrar Nueva Cuenta
                </button>
             </div>
          </div>
        </div>
      </div>

      {showPinModal && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-accent/60 backdrop-blur-md animate-in fade-in duration-300" onClick={() => !isSyncing && setShowPinModal(false)} />
          <div className="relative w-full max-w-sm bg-white rounded-[40px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
            
            <button 
              onClick={() => setShowPinModal(false)}
              className="absolute top-6 right-6 p-2 text-text-muted hover:bg-gray-100 rounded-full transition-all"
            >
              <X size={20} />
            </button>

            <div className="px-8 py-10 flex flex-col items-center">
              
              <div className="size-20 bg-accent rounded-[24px] flex items-center justify-center text-primary shadow-2xl mb-6">
                <Lock size={32} />
              </div>

              <div className="text-center space-y-1 mb-8">
                <h3 className="text-xl font-black text-accent tracking-tighter uppercase">Ingrese su PIN</h3>
                <p className="text-[10px] text-text-secondary font-black uppercase tracking-widest">
                  Código único para <span className="text-accent">{findValue(foundUser, ['UID_SOCIO', 'uid', 'id_socio'])}</span>
                </p>
                <div className="flex items-center justify-center gap-1.5 mt-2">
                   <div className="size-1.5 bg-primary rounded-full animate-pulse"></div>
                   <span className="text-[8px] font-black text-primary uppercase tracking-widest">Pre-cargando Dashboard...</span>
                </div>
              </div>

              <div className="flex justify-center gap-3 mb-10">
                {[0, 1, 2, 3].map((i) => (
                  <div 
                    key={i} 
                    className={`size-14 rounded-2xl border-2 flex items-center justify-center transition-all ${
                      pin.length > i ? 'border-primary bg-primary/5' : 'border-surface-border'
                    } ${error === 'PIN Incorrecto' && 'border-red-500 bg-red-50 animate-shake'}`}
                  >
                    {pin.length > i && (
                      <div className="size-3 bg-accent rounded-full animate-in zoom-in" />
                    )}
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-3 gap-3 w-full mb-8">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                  <button
                    key={num}
                    onClick={() => addDigit(num.toString())}
                    className="h-16 rounded-2xl bg-surface-subtle text-accent font-black text-xl hover:bg-primary transition-all active:scale-95 shadow-sm"
                  >
                    {num}
                  </button>
                ))}
                <button
                  onClick={removeDigit}
                  className="h-16 rounded-2xl bg-red-50 text-red-600 font-black text-[10px] uppercase tracking-widest hover:bg-red-100 transition-all active:scale-95 shadow-sm"
                >
                  Borrar
                </button>
                <button
                  onClick={() => addDigit('0')}
                  className="h-16 rounded-2xl bg-surface-subtle text-accent font-black text-xl hover:bg-primary transition-all active:scale-95 shadow-sm"
                >
                  0
                </button>
                <button
                  onClick={validateAccess}
                  disabled={pin.length !== 4 || isSyncing}
                  className={`h-16 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all active:scale-95 shadow-sm flex items-center justify-center ${
                    pin.length === 4 
                    ? 'bg-accent text-primary' 
                    : 'bg-surface-subtle text-text-muted opacity-50'
                  }`}
                >
                  {isSyncing ? <RefreshCw size={16} className="animate-spin" /> : 'OK'}
                </button>
              </div>

              <button 
                onClick={() => setShowPinModal(false)}
                className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] hover:text-accent transition-colors"
              >
                Volver
              </button>

              {error === 'PIN Incorrecto' && (
                <div className="mt-6 flex items-center gap-1.5 text-[10px] font-black text-red-600 uppercase tracking-widest animate-in slide-in-from-top-2">
                  <AlertCircle size={14} />
                  <span>PIN Incorrecto</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AuthGate;
