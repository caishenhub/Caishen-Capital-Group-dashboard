
import React, { useState, useEffect, useRef } from 'react';
import { HashRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Dashboard from './components/Dashboard';
import Portfolio from './components/Portfolio/Portfolio';
import ExecutiveSummary from './components/ExecutiveSummary/ExecutiveSummary';
import Reports from './components/Reports/Reports';
import Support from './components/Support/Support';
import UserManagement from './components/UserManagement/UserManagement';
import FinancialControl from './components/Admin/FinancialControl';
import AuthGate from './components/Auth/AuthGate'; 
import MobileNav from './components/MobileNav';
import { Cloud, CloudOff, AlertTriangle, ShieldAlert } from 'lucide-react';
import { GOOGLE_CONFIG } from './constants';
import { checkConnection } from './lib/googleSheets';

const MissingUrlAlert = () => (
  <div className="fixed inset-0 z-[10000] bg-accent flex items-center justify-center p-6 text-center">
    <div className="max-w-md w-full bg-white rounded-[40px] p-10 space-y-8 animate-in zoom-in duration-500">
      <div className="mx-auto size-24 bg-red-50 rounded-3xl flex items-center justify-center text-red-600 shadow-xl border border-red-100">
        <ShieldAlert size={48} />
      </div>
      <div className="space-y-3">
        <h1 className="text-2xl font-black text-accent tracking-tighter uppercase">Error de Configuración</h1>
        <p className="text-sm font-medium text-text-secondary leading-relaxed uppercase tracking-widest">
          Falta configurar el motor de datos institucional (APPS_SCRIPT_URL).
        </p>
      </div>
      <div className="bg-surface-subtle p-5 rounded-2xl border border-surface-border text-left">
        <p className="text-[10px] font-black text-text-muted uppercase tracking-widest mb-2">Instrucciones:</p>
        <p className="text-[11px] font-bold text-accent leading-relaxed">
          Por favor, asigne la URL de su macro de Google en el archivo <code className="bg-white px-1.5 py-0.5 rounded border border-gray-200">constants.tsx</code> para activar el portal.
        </p>
      </div>
      <button 
        onClick={() => window.location.reload()}
        className="w-full bg-accent text-primary font-black py-5 rounded-2xl uppercase text-xs tracking-[0.2em] shadow-xl active:scale-95 transition-all"
      >
        Reintentar Conexión
      </button>
    </div>
  </div>
);

const Layout: React.FC<{ children: React.ReactNode, title: string }> = ({ children, title }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [key, setKey] = useState(0);
  const [isCloudConnected, setIsCloudConnected] = useState(false);
  const location = useLocation();
  const mainContentRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (mainContentRef.current) {
      mainContentRef.current.scrollTo(0, 0);
    }
    setIsSidebarOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const handleUpdate = () => setKey(prev => prev + 1);
    window.addEventListener('finance_update', handleUpdate);
    
    const testConnection = async () => {
      const isOk = await checkConnection();
      setIsCloudConnected(isOk);
    };
    testConnection();
    const interval = setInterval(testConnection, 30000); 

    return () => {
      window.removeEventListener('finance_update', handleUpdate);
      clearInterval(interval);
    };
  }, []);

  return (
    <div key={key} className="flex h-screen bg-[#fcfcfc] overflow-hidden w-full">
      <div className="fixed bottom-20 md:bottom-6 right-6 z-[60] pointer-events-none hidden xs:block">
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border bg-white shadow-premium transition-all duration-500 ${
          isCloudConnected ? 'border-green-100 text-green-600' : 'border-orange-100 text-orange-400'
        }`}>
          {isCloudConnected ? <Cloud size={14} className="animate-pulse" /> : <CloudOff size={14} />}
          <span className="text-[9px] font-black uppercase tracking-widest">
            {isCloudConnected ? 'Ledger Sync' : 'Reconnecting...'}
          </span>
        </div>
      </div>

      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      
      <div className="flex-1 flex flex-col min-w-0 h-full relative">
        <Header title={title} onOpenMenu={() => setIsSidebarOpen(true)} />
        
        <main 
          ref={mainContentRef}
          className="flex-1 overflow-y-auto scroll-smooth relative z-10"
        >
          <div className="max-w-[1600px] mx-auto pb-24 md:pb-12">
            {children}
          </div>
        </main>

        <MobileNav />
      </div>
    </div>
  );
};

const App: React.FC = () => {
  const isConfigMissing = !GOOGLE_CONFIG.SCRIPT_API_URL || GOOGLE_CONFIG.SCRIPT_API_URL.length < 20;

  if (isConfigMissing) {
    return <MissingUrlAlert />;
  }

  return (
    <Router>
      <AuthGate>
        <Routes>
          <Route path="/" element={<Layout title="Panel de Control"><Dashboard /></Layout>} />
          <Route path="/users" element={<Layout title="Gestión de Accionistas"><UserManagement /></Layout>} />
          <Route path="/portfolio" element={<Layout title="Mi Portafolio"><Portfolio /></Layout>} />
          <Route path="/summary" element={<Layout title="Resumen Ejecutivo"><ExecutiveSummary /></Layout>} />
          <Route path="/reports" element={<Layout title="Reportes Administrativos"><Reports /></Layout>} />
          <Route path="/support" element={<Layout title="Soporte y Ayuda"><Support /></Layout>} />
          <Route path="/admin/finance" element={<Layout title="Control Financiero"><FinancialControl /></Layout>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthGate>
    </Router>
  );
};

export default App;
