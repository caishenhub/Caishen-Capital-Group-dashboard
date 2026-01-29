
import React, { useState, useEffect, useCallback } from 'react';
import { Lock, ShieldCheck, AlertCircle, X, ChevronRight, UserPlus } from 'lucide-react';

const MOCK_USERS = [
  { id: 'admin-01', uid: '#ADM-001', name: 'Caishen Capital Group', email: 'corporativo@caishencapital.com', pin: '8888' },
  { id: 'usr-220', uid: '#USR-220', name: 'Isabella Beron Garcia', email: 'i.beron@inversion.com', pin: '4927' },
  { id: 'usr-008', uid: '#USR-008', name: 'Juan Andres Suarez Zuluaga', email: 'j.suarez@caishencapital.com', pin: '3159' },
  { id: 'usr-202', uid: '#USR-202', name: 'María Fernanda Ríos', email: 'm.rios@finanzas.net', pin: '6284' },
  { id: 'usr-203', uid: '#USR-203', name: 'Santiago Herrera', email: 's.herrera@partners.com', pin: '1735' },
  { id: 'usr-204', uid: '#USR-204', name: 'Valentina Pardo', email: 'v.pardo@capital.io', pin: '5942' },
  { id: 'usr-205', uid: '#USR-205', name: 'Camilo Ortega', email: 'c.ortega@wealth.com', pin: '8316' },
  { id: 'usr-206', uid: '#USR-206', name: 'Daniela Cárdenas', email: 'd.cardenas@growth.com', pin: '2691' },
  { id: 'usr-207', uid: '#USR-207', name: 'Nicolás Vega', email: 'n.vega@invest.net', pin: '4073' },
  { id: 'usr-208', uid: '#USR-208', name: 'Laura Sofía Medina', email: 'l.medina@portfolio.com', pin: '9514' },
  { id: 'usr-209', uid: '#USR-209', name: 'Andrés Felipe Salazar', email: 'a.salazar@equity.com', pin: '3826' },
  { id: 'usr-210', uid: '#USR-210', name: 'Catalina Gómez', email: 'c.gomez@legacy.com', pin: '7149' },
  { id: 'usr-211', uid: '#USR-211', name: 'Felipe Restrepo', email: 'f.restrepo@global.com', pin: '5382' },
  { id: 'usr-212', uid: '#USR-212', name: 'Paula Andrea Torres', email: 'p.torres@asset.com', pin: '1964' },
  { id: 'usr-213', uid: '#USR-213', name: 'Sebastián Quintero', email: 's.quintero@capital.io', pin: '4271' },
  { id: 'usr-214', uid: '#USR-214', name: 'Juliana Castro', email: 'j.castro@inversion.net', pin: '6835' },
  { id: 'usr-215', uid: '#USR-215', name: 'Mateo Arboleda', email: 'm.arboleda@funds.com', pin: '9157' },
  { id: 'usr-216', uid: '#USR-216', name: 'Manuela Jiménez', email: 'm.jimenez@wealth.net', pin: '2408' },
  { id: 'usr-217', uid: '#USR-217', name: 'Tomás Aguirre', email: 't.aguirre@invest.io', pin: '5723' },
  { id: 'usr-218', uid: '#USR-218', name: 'Carolina Muñoz', email: 'c.munoz@partner.com', pin: '8041' },
  { id: 'usr-219', uid: '#USR-219', name: 'Esteban Ramírez', email: 'e.ramirez@growth.io', pin: '3596' },
];

const AuthGate: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [identifier, setIdentifier] = useState('');
  const [showPinModal, setShowPinModal] = useState(false);
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const session = localStorage.getItem('ccg_session');
    if (session) setIsAuthenticated(true);
    setIsLoading(false);
  }, []);

  const validateAccess = useCallback(() => {
    const user = MOCK_USERS.find(u => 
      u.email.toLowerCase() === identifier.toLowerCase() || 
      u.uid.toLowerCase() === identifier.toLowerCase()
    );

    if (user && user.pin === pin) {
      localStorage.setItem('ccg_session', JSON.stringify({ 
        uid: user.uid, 
        name: user.name, 
        ts: Date.now() 
      }));
      setIsAuthenticated(true);
      setShowPinModal(false);
      window.location.hash = '/';
    } else {
      setError('Credenciales de acceso inválidas');
      setPin('');
      setTimeout(() => setError(''), 3000);
    }
  }, [identifier, pin]);

  // Manejador de teclado físico para el PIN
  useEffect(() => {
    if (!showPinModal) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Números 0-9
      if (/^[0-9]$/.test(e.key)) {
        if (pin.length < 4) {
          setPin(prev => prev + e.key);
        }
      }
      // Borrar
      else if (e.key === 'Backspace') {
        setPin(prev => prev.slice(0, -1));
      }
      // Enter para validar
      else if (e.key === 'Enter') {
        if (pin.length === 4) {
          validateAccess();
        }
      }
      // Escape para cerrar
      else if (e.key === 'Escape') {
        setShowPinModal(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showPinModal, pin, validateAccess]);

  const handleContinue = (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim()) return;
    setShowPinModal(true);
  };

  const handleRegisterRedirect = () => {
    window.open('https://registro-caishen-capital-group.vercel.app/', '_blank');
  };

  if (isLoading) return null;

  if (isAuthenticated) return <>{children}</>;

  return (
    <div 
      className="fixed inset-0 z-[9999] flex items-center justify-center p-6 overflow-hidden bg-no-repeat bg-cover bg-center"
      style={{ backgroundImage: "url('https://i.ibb.co/HL7RGf9F/Chat-GPT-Image-8-ene-2026-10-46-40-p-m.png')" }}
    >
      <div className="absolute inset-0 bg-accent/40" />
      <div className="relative w-full max-w-md bg-white rounded-[40px] shadow-premium border border-white/20 p-8 md:p-10 space-y-8 md:space-y-10 animate-in fade-in zoom-in-95 duration-700">
        <div className="flex flex-col items-center text-center space-y-6">
          <img 
            src="https://i.ibb.co/zT3RhhT9/CAISHEN-NO-FONDO-AZUL-1.png" 
            alt="Caishen Capital" 
            className="h-16 w-auto object-contain drop-shadow-sm"
          />
          <div className="space-y-2">
            <h1 className="text-2xl font-black text-accent tracking-tighter uppercase">Acceso Restringido</h1>
            <p className="text-text-secondary text-sm font-medium">Portal Institucional para Accionistas</p>
          </div>
        </div>

        <form onSubmit={handleContinue} className="space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-text-muted uppercase tracking-widest ml-1">Correo o ID de Socio</label>
            <div className="relative">
              <input 
                type="text" 
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="ej: usuario@caishencapital.com o #USR-000"
                className="w-full bg-surface-subtle border-2 border-surface-border rounded-2xl px-5 py-4 text-sm font-bold text-accent focus:border-primary focus:ring-0 transition-all placeholder:text-text-muted"
              />
            </div>
          </div>
          <button 
            type="submit"
            className="w-full bg-accent text-primary font-black py-5 rounded-2xl flex items-center justify-center gap-2 hover:bg-accent/90 transition-all shadow-xl hover:-translate-y-1 active:scale-95 uppercase text-xs tracking-[0.2em]"
          >
            Siguiente
            <ChevronRight size={18} />
          </button>
        </form>

        <div className="pt-2 border-t border-surface-border">
          <div className="flex flex-col items-center text-center space-y-4">
            <p className="text-[11px] font-bold text-text-muted uppercase tracking-tight">¿Aún no eres parte de Caishen Capital?</p>
            <button 
              onClick={handleRegisterRedirect}
              className="group flex items-center gap-2 px-6 py-3 rounded-2xl bg-primary/10 border border-primary/20 hover:bg-primary transition-all duration-300"
            >
              <UserPlus size={16} className="text-accent group-hover:scale-110 transition-transform" />
              <span className="text-[10px] font-black text-accent uppercase tracking-widest">Solicitar Registro</span>
            </button>
          </div>
        </div>

        <div className="flex items-center justify-center gap-2 text-[10px] font-bold text-text-muted uppercase tracking-widest">
          <ShieldCheck size={14} className="text-primary" />
          Conexión Encriptada de 256-bits
        </div>
      </div>

      {showPinModal && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-accent/60 animate-in fade-in duration-300" onClick={() => setShowPinModal(false)} />
          <div className={`relative w-full max-w-sm bg-white rounded-[40px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 border border-white/20 ${error ? 'animate-bounce' : ''}`}>
            <div className="p-10 text-center space-y-8">
              <div className="mx-auto size-20 bg-accent rounded-[24px] flex items-center justify-center text-primary shadow-2xl border border-primary/20">
                <Lock size={32} />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-black text-accent tracking-tighter uppercase">Ingrese su PIN</h3>
                <p className="text-xs text-text-secondary font-medium px-4">Código único para <span className="text-accent font-bold">{identifier}</span></p>
                <p className="text-[9px] text-text-muted font-bold uppercase tracking-widest">Soporta teclado numérico físico</p>
              </div>
              <div className="flex justify-center gap-3">
                {[0, 1, 2, 3].map((i) => (
                  <div key={i} className={`size-12 rounded-xl border-2 flex items-center justify-center transition-all ${
                    pin.length > i ? 'border-primary bg-primary/10' : 'border-surface-border bg-surface-subtle'
                  }`}>
                    {pin.length > i && <div className="size-2.5 bg-accent rounded-full animate-in zoom-in-50 duration-200" />}
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-3 gap-3">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                  <button 
                    key={num}
                    onClick={() => pin.length < 4 && setPin(prev => prev + num)}
                    className="h-14 bg-surface-subtle hover:bg-gray-100 rounded-xl text-lg font-black text-accent transition-all active:scale-90"
                  >
                    {num}
                  </button>
                ))}
                <button 
                  onClick={() => setPin('')}
                  className="h-14 bg-red-50 text-red-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-red-100 transition-all"
                >
                  Borrar
                </button>
                <button 
                  onClick={() => pin.length < 4 && setPin(prev => prev + '0')}
                  className="h-14 bg-surface-subtle hover:bg-gray-100 rounded-xl text-lg font-black text-accent transition-all active:scale-90"
                >
                  0
                </button>
                <button 
                  onClick={validateAccess}
                  className={`h-14 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                    pin.length === 4 ? 'bg-primary text-accent shadow-lg scale-105' : 'bg-gray-50 text-text-muted opacity-50'
                  }`}
                  disabled={pin.length !== 4}
                >
                  OK
                </button>
              </div>
              {error && (
                <div className="flex items-center justify-center gap-1.5 text-[11px] font-black text-red-600 uppercase tracking-widest">
                  <AlertCircle size={14} />
                  <span>{error}</span>
                </div>
              )}
              <button 
                onClick={() => setShowPinModal(false)}
                className="text-[10px] font-black text-text-muted hover:text-accent uppercase tracking-widest transition-colors"
              >
                Volver
              </button>
            </div>
            <button 
              onClick={() => setShowPinModal(false)} 
              className="absolute top-6 right-6 p-2 text-text-muted hover:text-accent transition-colors"
            >
              <X size={24} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AuthGate;
