
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
import { supabase } from './lib/supabase';
import { Cloud, CloudOff } from 'lucide-react';

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
      try {
        if (supabase) {
          setIsCloudConnected(true);
        } else {
          const { error } = await supabase.from('financial_config').select('id').limit(1);
          setIsCloudConnected(!error);
        }
      } catch (e) {
        setIsCloudConnected(false);
      }
    };
    testConnection();

    return () => window.removeEventListener('finance_update', handleUpdate);
  }, []);

  return (
    <div key={key} className="flex h-screen bg-[#fcfcfc] overflow-hidden w-full">
      {/* Cloud Status Indicator */}
      <div className="fixed bottom-20 md:bottom-6 right-6 z-[60] pointer-events-none hidden xs:block">
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border bg-white shadow-premium transition-all duration-500 ${
          isCloudConnected ? 'border-green-100 text-green-600' : 'border-orange-100 text-orange-400'
        }`}>
          {isCloudConnected ? <Cloud size={14} className="animate-pulse" /> : <CloudOff size={14} />}
          <span className="text-[9px] font-black uppercase tracking-widest">
            {isCloudConnected ? 'Cloud Sync' : 'Offline'}
          </span>
        </div>
      </div>

      {/* Sidebar - Solo visible en Escritorio */}
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      
      <div className="flex-1 flex flex-col min-w-0 h-full relative">
        <Header title={title} onOpenMenu={() => setIsSidebarOpen(true)} />
        
        <main 
          ref={mainContentRef}
          className="flex-1 overflow-y-auto scroll-smooth relative z-10"
        >
          {/* Ajuste de padding inferior para la MobileNav */}
          <div className="max-w-[1600px] mx-auto pb-24 md:pb-12">
            {children}
          </div>
        </main>

        {/* Navegación inferior para móviles */}
        <MobileNav />
      </div>
    </div>
  );
};

const App: React.FC = () => {
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
