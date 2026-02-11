
import React, { useState, useEffect, useCallback } from 'react';
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
    if (session) {
      setIsAuthenticated(true);
      warmUpCache(); // Carga de fondo para usuarios ya logueados
    }
    setIsLoading(false);

    const loadUserPool = async () => {
      try {
        const data = await fetchTableData('LIBRO_ACCIONISTAS');
        setUserPool(data || []);
      } catch (e) {
        console.error("Error cargando padrón preventivo:", e);
      } finally {
        setIsPoolLoading(false);
      }
    };
    loadUserPool();
  }, []);

  const handleIdentifierSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const input = identifier.toLowerCase().trim();
    if (!input) return;
    
    setError('');
    setIsSyncing(true);

    try {
      const user = userPool.find(u => {
        const uId = String(findValue(u, ['UID_SOCIO', 'uid', 'id_socio']) || '').toLowerCase();
        const uEmail = String(findValue(u, ['EMAIL_SOCIO', 'email', 'correo']) || '').toLowerCase();
        return uId === input || uEmail === input;
      });

      if (user) {
        setFoundUser(user);
        setShowPinModal(true);
        // --- OPTIMIZACIÓN: CARGA ESPECULATIVA INMEDIATA ---
        // Iniciamos la carga del Dashboard mientras el usuario piensa el PIN
        warmUpCache(); 
        setError('');
      } else {
        setError('Socio no encontrado en el padrón oficial.');
      }
    } catch (e) {
      setError('Error de conexión con el servidor.');
    } finally {
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
    if (pin.length === 4) {
      validateAccess();
    }
  }, [pin, validateAccess]);

  useEffect(() => {
    if (!showPinModal) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (/^[0-9]$/.test(e.key)) addDigit(e.key);
      else if (e.key === 'Backspace') removeDigit();
      else if (e.key === 'Escape') setShowPinModal(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showPinModal, pin]);

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
                <span className="text-[8px] font-black text-text-muted uppercase tracking-[0.2em] animate-pulse">Sincronizando base de datos...</span>
              ) : (
                <span className="text-[8px] font-black text-primary uppercase tracking-[0.2em]">Sistema listo para validación</span>
              )}
            </div>
          </div>
        </div>

        <form onSubmit={handleIdentifierSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-text-muted uppercase tracking-widest ml-1">Correo o ID de Socio</label>
            <input 
              type="text" 
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder="ej: #USR-008"
              className="w-full bg-surface-subtle border-2 border-surface-border rounded-2xl px-5 py-4 text-sm font-bold text-accent focus:border-primary focus:ring-0 transition-all"
            />
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
            className="w-full bg-accent text-primary font-black py-5 rounded-2xl flex items-center justify-center gap-2 hover:bg-accent/90 transition-all shadow-xl active:scale-95 uppercase text-xs tracking-[0.2em] disabled:opacity-50"
          >
            {isSyncing ? 'Validando...' : 'Siguiente'}
            <ChevronRight size={18} />
          </button>
        </form>

        <div className="pt-6 border-t border-gray-100">
           <button 
             onClick={() => window.open('https://registro-caishen-capital-group.vercel.app/', '_blank')}
             className="w-full bg-surface-subtle text-accent font-black py-4 rounded-xl flex items-center justify-center gap-2 hover:bg-accent hover:text-white transition-all uppercase text-[10px] tracking-widest border border-surface-border"
           >
             <UserPlus size={16} />
             Registrar Nueva Cuenta
           </button>
        </div>
      </div>

      {showPinModal && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-accent/80 backdrop-blur-md animate-in fade-in" onClick={() => !isSyncing && setShowPinModal(false)} />
          <div className={`relative w-full max-w-sm bg-white rounded-[40px] shadow-2xl p-10 flex flex-col items-center animate-in zoom-in-95 ${error === 'PIN Incorrecto' ? 'animate-shake' : ''}`}>
            <button onClick={() => setShowPinModal(false)} className="absolute top-6 right-6 text-text-muted"><X size={20} /></button>
            <div className="size-20 bg-accent rounded-[24px] flex items-center justify-center text-primary shadow-2xl mb-6"><Lock size={32} /></div>
            <h3 className="text-xl font-black text-accent uppercase tracking-tighter mb-1">Ingrese su PIN</h3>
            <p className="text-[10px] text-text-secondary font-black uppercase tracking-widest mb-8 text-center">Código único para {identifier}</p>
            
            <div className="flex justify-center gap-3 mb-10">
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className={`size-14 rounded-2xl border-2 flex items-center justify-center transition-all ${pin.length > i ? 'border-primary bg-primary/5' : 'border-surface-border'}`}>
                  {pin.length > i && <div className="size-3 bg-accent rounded-full animate-in zoom-in" />}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-3 gap-3 w-full mb-6">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                <button key={num} onClick={() => addDigit(num.toString())} className="h-16 rounded-2xl bg-surface-subtle text-accent font-black text-xl hover:bg-primary transition-all active:scale-95">{num}</button>
              ))}
              <button onClick={removeDigit} className="h-16 rounded-2xl bg-red-50 text-red-600 font-black text-[10px] uppercase tracking-widest">Del</button>
              <button onClick={() => addDigit('0')} className="h-16 rounded-2xl bg-surface-subtle text-accent font-black text-xl hover:bg-primary transition-all active:scale-95">0</button>
              <button onClick={validateAccess} className="h-16 rounded-2xl bg-accent text-primary font-black text-[10px] uppercase tracking-widest">OK</button>
            </div>
            
            {error === 'PIN Incorrecto' && <p className="text-red-600 text-[10px] font-black uppercase tracking-widest">PIN Erróneo</p>}
          </div>
        </div>
      )}
    </div>
  );
};

export default AuthGate;
