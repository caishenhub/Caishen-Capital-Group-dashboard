
import React, { useMemo, useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  TrendingUp, 
  TrendingDown,
  PieChart as PieIcon, 
  DollarSign, 
  Target,
  CheckCircle2,
  RefreshCw,
  FileSpreadsheet,
  AlertCircle,
  Clock,
  Lock,
  CreditCard,
  ShieldCheck,
  Save,
  Shield,
  Zap,
  X,
  MessageSquare,
  Landmark,
  Coins,
  QrCode,
  Wallet,
  Globe,
  UserCheck,
  FileText,
  Bitcoin,
  EyeOff,
  AlertOctagon
} from 'lucide-react';
import { fetchTableData, findValue, norm, parseSheetNumber, saveShareholderAccount, fetchShareholderAccount, logAccountChangeRequest } from '../../lib/googleSheets';

interface ShareholderProfileProps {
  user: any;
  onBack: () => void;
}

const ShareholderProfile: React.FC<ShareholderProfileProps> = ({ user, onBack }) => {
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [dividends, setDividends] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [config, setConfig] = useState<any>(null);
  
  const [activeTab, setActiveTab] = useState<'bank' | 'card' | 'crypto'>('bank');
  const [registeredAccount, setRegisteredAccount] = useState<any | null>(null);
  const [isSavingAccount, setIsSavingAccount] = useState(false);
  const [isRequestingSupport, setIsRequestingSupport] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showRequestSuccess, setShowRequestSuccess] = useState(false);

  const [formData, setFormData] = useState({
    holderName: '',
    docType: 'CC',
    docNumber: '',
    country: '',
    bankName: '',
    accountType: 'Ahorros',
    accountNumber: '',
    swiftCode: '',
    cryptoCurrency: 'USDT (Tether)',
    cryptoNetwork: 'TRC20 (Tron)',
    exchange: '',
    walletAddress: ''
  });

  // Funciones de Enmascaramiento de Seguridad
  const maskString = (str: string, visibleCount: number = 4) => {
    if (!str) return '****';
    const clean = str.replace(/\s/g, '');
    if (clean.length <= visibleCount) return clean;
    return `**** **** **** ${clean.slice(-visibleCount)}`;
  };

  const maskName = (name: string) => {
    if (!name || name === 'N/A (BLOCKCHAIN)') return 'IDENTIFICADOR BLOCKCHAIN';
    const parts = name.split(' ');
    if (parts.length === 1) return parts[0].charAt(0) + '***';
    return `${parts[0].charAt(0)}. ${parts[parts.length - 1]}`;
  };

  const syncProfileData = async () => {
    setIsLoading(true);
    try {
      const [allDividends, masterConfig, accountData] = await Promise.all([
        fetchTableData('DIVIDENDOS_SOCIOS'),
        fetchTableData('CONFIG_MAESTRA'),
        fetchShareholderAccount(user.uid)
      ]);
      
      const targetUidNorm = norm(user.uid);
      const userDividends = allDividends.filter(d => {
        const rowUid = findValue(d, ['UID_SOCIO', 'uid', 'id_socio']);
        return norm(rowUid) === targetUidNorm;
      });
      
      setDividends(userDividends);
      setConfig(masterConfig[0] || {});
      setRegisteredAccount(accountData);
    } catch (e) {
      console.error("Error cargando perfil:", e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    syncProfileData();
  }, [user.uid]);

  const isStatusActive = useMemo(() => {
    if (!registeredAccount) return false;
    const s = registeredAccount.status.toUpperCase();
    return s === 'ACTIVO' || s === 'VERIFICADO' || s === 'COMPLETADO' || s === 'OK';
  }, [registeredAccount]);

  const stats = useMemo(() => {
    const yearDividends = dividends.filter(d => {
      const rowYear = parseInt(String(findValue(d, ['ANIO', 'anio', 'year']) || 0));
      return rowYear === selectedYear;
    });
    
    const totalProfit = yearDividends.reduce((acc, d) => {
      return acc + parseSheetNumber(findValue(d, ['UTILIDAD_NETA_USD', 'utilidad']));
    }, 0);

    const totalYield = yearDividends.reduce((acc, d) => {
      return acc + parseSheetNumber(findValue(d, ['RENTABILIDAD_MES_PCT', 'rentabilidad']));
    }, 0);
    
    const nominalValue = parseSheetNumber(findValue(config, ['VALOR_NOMINAL_ACCION'])) || 248.85;
    const balance = user.shares * nominalValue;
    const totalSharesFund = parseSheetNumber(findValue(config, ['TOTAL_ACCIONES_FONDO'])) || 500;

    return {
      balance,
      totalProfit,
      totalYield,
      participation: ((user.shares / (totalSharesFund || 1)) * 100).toFixed(2),
      yearData: yearDividends
    };
  }, [dividends, selectedYear, config, user.shares]);

  const handleSaveAccount = async () => {
    let payload: any = {
      type: activeTab.toUpperCase(),
      holderName: activeTab === 'crypto' ? 'N/A (BLOCKCHAIN)' : formData.holderName,
      docType: activeTab === 'crypto' ? 'N/A' : formData.docType,
      docNumber: activeTab === 'crypto' ? 'N/A' : formData.docNumber,
      institution: '',
      identifier: '',
      network: '',
      platform: '',
      swiftCode: ''
    };

    if (activeTab === 'crypto') {
      payload.institution = formData.cryptoCurrency;
      payload.identifier = formData.walletAddress;
      payload.network = formData.cryptoNetwork;
      payload.platform = formData.exchange || 'Wallet Privada';
    } else if (activeTab === 'bank') {
      payload.institution = formData.bankName;
      payload.identifier = formData.accountNumber;
      payload.network = formData.accountType;
      payload.platform = formData.country;
      payload.swiftCode = formData.swiftCode;
    } else {
      payload.institution = formData.bankName;
      payload.identifier = formData.accountNumber;
      payload.network = 'DEBIT';
      payload.platform = formData.country;
    }

    if (!payload.identifier) return;
    
    setIsSavingAccount(true);
    try {
      const res = await saveShareholderAccount(user.uid, payload);
      if (res.success) {
        setShowConfirm(false);
        setTimeout(syncProfileData, 2000);
      }
    } catch (e) {
      console.error("Error guardando cuenta:", e);
    } finally {
      setIsSavingAccount(false);
    }
  };

  const handleSupportRequest = async () => {
    if (!registeredAccount || registeredAccount.requestPending) return;
    setIsRequestingSupport(true);
    try {
      const res = await logAccountChangeRequest(user.uid, registeredAccount.account);
      if (res.success) {
        setShowRequestSuccess(true);
      }
    } catch (e) {
      console.error("Error soporte:", e);
    } finally {
      setIsRequestingSupport(false);
    }
  };

  const monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

  return (
    <div className="bg-[#fcfcfc] animate-in fade-in slide-in-from-right-4 duration-500 pb-40 min-h-screen">
      <main className="flex-1 flex flex-col p-4 md:p-8 lg:p-10 max-w-[1600px] mx-auto w-full gap-8">
        
        <div className="flex justify-between items-center">
          <button onClick={onBack} className="flex items-center gap-2 text-text-muted hover:text-accent font-black text-[10px] uppercase tracking-widest transition-all w-fit group">
            <div className="p-2 bg-white rounded-xl border border-surface-border group-hover:border-primary transition-all">
              <ArrowLeft size={16} />
            </div>
            <span>Volver al Padrón</span>
          </button>
          <button onClick={syncProfileData} className="p-3 bg-white border border-surface-border rounded-xl text-accent hover:bg-surface-subtle transition-all active:rotate-180">
            <RefreshCw size={18} className={isLoading ? 'animate-spin' : ''} />
          </button>
        </div>

        <header className="bg-white rounded-[32px] shadow-premium border border-surface-border p-8 lg:p-10 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-10 opacity-5 pointer-events-none">
            <Target size={150} className="text-accent" />
          </div>
          <div className="flex flex-col md:flex-row gap-8 md:items-center justify-between relative z-10">
            <div className="flex items-center gap-6">
              <div className={`size-20 lg:size-24 rounded-[28px] ${user.color || 'bg-accent text-primary'} flex items-center justify-center font-black text-2xl shadow-xl uppercase`}>
                {user.initials || 'S'}
              </div>
              <div>
                <h1 className="text-3xl lg:text-4xl font-black text-accent tracking-tighter uppercase leading-none">{user.name}</h1>
                <div className="flex items-center gap-2 mt-3">
                  <span className="px-3 py-1 bg-primary/10 text-accent text-[10px] font-black rounded-lg uppercase tracking-widest border border-primary/20">
                    {user.uid}
                  </span>
                  <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest">
                    Padrón de Accionistas Activo
                  </span>
                </div>
              </div>
            </div>
            <div className="text-left md:text-right bg-surface-subtle/50 p-6 rounded-[24px] border border-surface-border md:min-w-[320px]">
              <span className="text-[10px] font-black text-text-muted uppercase tracking-widest">Capital Nominal Asignado</span>
              <div className="flex items-baseline gap-2 mt-1 justify-start md:justify-end">
                <span className="text-3xl lg:text-5xl font-black text-accent tracking-tighter">
                  ${stats.balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </span>
                <span className="text-xs font-black text-text-muted">USD</span>
              </div>
            </div>
          </div>
        </header>

        {isLoading ? (
          <div className="py-32 flex flex-col items-center justify-center gap-6">
            <div className="size-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
            <p className="text-[10px] font-black text-accent uppercase tracking-widest">Sincronizando Protocolos...</p>
          </div>
        ) : (
          <>
            <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { label: 'Acciones', value: user.shares.toString(), sub: 'Registro Central', icon: Target },
                { label: 'Participación', value: stats.participation + '%', sub: 'Fondo Institucional', icon: PieIcon },
                { label: `Rendimiento ${selectedYear}`, value: (stats.totalYield * 100).toFixed(2) + '%', sub: 'Retorno Acumulado', icon: stats.totalYield >= 0 ? TrendingUp : TrendingDown },
                { label: 'Utilidad Neta', value: `$${stats.totalProfit.toLocaleString('en-US', { minimumFractionDigits: 2 })}`, sub: 'Liquidado en Nube', icon: DollarSign },
              ].map((stat, i) => (
                <div key={i} className="bg-white rounded-[32px] shadow-sm border border-surface-border p-7 flex flex-col justify-between hover:shadow-premium transition-all">
                  <div className="p-3 w-fit bg-surface-subtle rounded-2xl mb-4 text-accent">
                    <stat.icon size={20} />
                  </div>
                  <h3 className="text-[10px] font-black text-text-muted uppercase tracking-widest mb-1">{stat.label}</h3>
                  <div className="text-3xl font-black tracking-tighter text-accent">{stat.value}</div>
                  <p className="text-[10px] font-bold text-text-secondary mt-1 uppercase tracking-tight">{stat.sub}</p>
                </div>
              ))}
            </section>

            {/* HISTORIAL DE RENDIMIENTOS */}
            <section className="bg-white rounded-[40px] shadow-premium border border-surface-border p-8 md:p-12">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-primary/10 rounded-2xl text-accent shadow-sm border border-primary/10"><FileSpreadsheet size={24} /></div>
                  <div>
                    <h2 className="text-2xl font-black text-accent tracking-tighter uppercase leading-none">Historial de Dividendos</h2>
                    <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest mt-1">Liquidaciones operativas por periodo</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 bg-surface-subtle p-1.5 rounded-2xl border border-surface-border">
                  {[2024, 2025, 2026].map(year => (
                    <button key={year} onClick={() => setSelectedYear(year)} className={`px-5 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${selectedYear === year ? 'bg-accent text-white shadow-md' : 'text-text-muted hover:text-accent'}`}>{year}</button>
                  ))}
                </div>
              </div>

              <div className="overflow-x-auto rounded-[24px] border border-surface-border">
                <table className="w-full text-left border-collapse min-w-[600px]">
                  <thead>
                    <tr className="bg-surface-subtle text-[10px] font-black text-text-muted uppercase tracking-widest border-b border-surface-border">
                      <th className="px-8 py-5">Mes Operativo</th>
                      <th className="px-8 py-5">Estatus</th>
                      <th className="px-8 py-5 text-right">Rentabilidad</th>
                      <th className="px-8 py-5 text-right font-black text-accent">Utilidad USD</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {stats.yearData.length > 0 ? stats.yearData.sort((a,b) => findValue(a, ['MES']) - findValue(b, ['MES'])).map((d, i) => (
                      <tr key={i} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-8 py-5">
                          <span className="text-sm font-black text-accent uppercase">{monthNames[findValue(d, ['MES']) - 1]}</span>
                        </td>
                        <td className="px-8 py-5">
                          <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${findValue(d, ['ESTATUS_PAGO']) === 'PAGADO' ? 'bg-green-50 text-green-700 border-green-100' : 'bg-orange-50 text-orange-700 border-orange-100'}`}>
                            {findValue(d, ['ESTATUS_PAGO']) || 'PENDIENTE'}
                          </span>
                        </td>
                        <td className="px-8 py-5 text-right font-bold text-text-secondary">{(parseSheetNumber(findValue(d, ['RENTABILIDAD_MES_PCT'])) * 100).toFixed(2)}%</td>
                        <td className="px-8 py-5 text-right font-black text-accent text-lg">${parseSheetNumber(findValue(d, ['UTILIDAD_NETA_USD'])).toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                      </tr>
                    )) : (
                      <tr><td colSpan={4} className="py-20 text-center text-text-muted"><p className="text-xs font-black uppercase tracking-widest">Sin registros operativos para {selectedYear}</p></td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>

            {/* PROTOCOLO DE DISPERSIÓN */}
            <section className="bg-white rounded-[40px] shadow-premium border border-surface-border p-8 md:p-12 relative overflow-hidden group">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 mb-8">
                <div className="flex items-center gap-4">
                  <div className="flex items-center justify-center size-14 rounded-2xl bg-primary/20 text-accent shadow-sm border border-primary/20">
                    <Zap size={28} className="text-accent animate-pulse" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-black text-accent tracking-tighter uppercase leading-none">Protocolo de Dispersión de Dividendos</h2>
                    <p className="text-[10px] font-black text-text-muted uppercase tracking-widest mt-1">Vinculación Maestra de Canal Receptor</p>
                  </div>
                </div>
                {registeredAccount && (
                  <div className={`px-5 py-2 rounded-xl border text-[9px] font-black tracking-widest uppercase flex items-center gap-2 shadow-sm ${isStatusActive ? 'bg-accent text-primary border-accent/10 shadow-neon' : 'bg-orange-50 text-orange-700 border-orange-100'}`}>
                    <ShieldCheck size={14} /> {isStatusActive ? 'CANAL VERIFICADO' : 'VALIDACIÓN DE DISPERSIÓN'}
                  </div>
                )}
              </div>

              <div className="rounded-[24px] bg-[#1d1c2d] p-7 mb-10 border border-white/5 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-6 opacity-5"><Shield size={100} className="text-white" /></div>
                <div className="flex gap-5 relative z-10">
                  <div className="text-primary shrink-0 mt-1 bg-white/10 p-2 rounded-xl"><Lock size={20} /></div>
                  <div className="flex flex-col gap-2">
                    <h3 className="text-xs font-black text-primary uppercase tracking-widest">Seguridad de Dispersión Corporativa</h3>
                    <p className="text-sm text-gray-300 leading-relaxed font-medium">Sus datos están protegidos bajo protocolos de cifrado. Caishen Capital Group <span className="text-white font-black underline decoration-primary underline-offset-4">nunca solicitará PIN o claves dinámicas</span> para realizar la dispersión de utilidades.</p>
                  </div>
                </div>
              </div>

              {registeredAccount ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
                  {/* CARD CORPORATIVA EN AZUL OSCURO */}
                  <div className={`relative w-full aspect-[1.586/1] rounded-[32px] overflow-hidden p-10 text-white shadow-2xl flex flex-col justify-between group transition-all duration-700 bg-gradient-to-br from-accent to-[#43415f]`}>
                    <div className="absolute -right-4 -top-4 opacity-[0.05] text-white"><Shield size={220} /></div>
                    <div className="flex justify-between items-start relative z-10">
                      <div className="flex items-center gap-4">
                        <div className="size-14 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20">
                          {registeredAccount.type === 'CRYPTO' ? <Bitcoin size={28} className="text-primary"/> : registeredAccount.type === 'BANK' ? <Landmark size={28}/> : <CreditCard size={28}/>}
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[10px] uppercase tracking-widest text-white/70">Identificador Protegido</span>
                          <span className="font-black text-2xl tracking-tight uppercase leading-none mt-1">{registeredAccount.institution}</span>
                        </div>
                      </div>
                      <ShieldCheck size={24} className={isStatusActive ? 'text-primary shadow-neon' : 'text-white/40'} />
                    </div>
                    
                    <div className="relative z-10 space-y-4">
                      <div>
                        <span className="text-[10px] uppercase tracking-widest text-white/60 mb-1 block font-black">Canal de Dispersión</span>
                        <div className="bg-black/20 backdrop-blur-sm rounded-2xl px-6 py-5 font-mono text-xl border border-white/10 flex items-center justify-between shadow-inner">
                           <span className="tracking-widest">{maskString(registeredAccount.account)}</span>
                           <EyeOff size={18} className="text-white/30" />
                        </div>
                      </div>
                      <div className="flex justify-between items-end border-t border-white/10 pt-4">
                         <div className="flex flex-col">
                           <span className="text-[9px] uppercase tracking-widest text-white/50 mb-1">Titular Certificado</span>
                           <span className="text-[11px] font-black uppercase tracking-widest">{maskName(registeredAccount.holderInfo.split(' (')[0])}</span>
                         </div>
                         <div className="flex flex-col text-right">
                           <span className="text-[9px] uppercase tracking-widest text-white/50 mb-1">Estatus</span>
                           <span className="text-[11px] font-black uppercase tracking-widest flex items-center gap-2">
                             {isStatusActive && <div className="size-1.5 bg-primary rounded-full animate-pulse shadow-neon"></div>}
                             {registeredAccount.status}
                           </span>
                         </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="bg-surface-subtle p-8 rounded-[40px] border border-surface-border space-y-6">
                       <h4 className="text-sm font-black text-accent uppercase tracking-[0.2em] flex items-center gap-3"><ShieldCheck size={18} className="text-accent" /> Vinculación Oficial</h4>
                       <p className="text-sm text-text-secondary font-medium leading-relaxed">Este canal ha sido vinculado para la recepción de dividendos. {isStatusActive ? 'Canal verificado y activo para dispersiones automáticas. Puede reportar cualquier inconveniente con su cuenta aquí.' : 'Para modificar los datos, se requiere una validación del oficial de cumplimiento.'}</p>
                       <button onClick={handleSupportRequest} disabled={registeredAccount.requestPending || isRequestingSupport} className={`w-full flex items-center justify-center gap-3 px-8 py-5 rounded-[24px] font-black text-[11px] uppercase tracking-[0.2em] shadow-xl transition-all disabled:opacity-50 group ${isStatusActive ? 'bg-white border-2 border-accent text-accent hover:bg-surface-subtle' : 'bg-accent text-white hover:bg-black'}`}>
                        {isRequestingSupport ? <RefreshCw size={16} className="animate-spin" /> : (registeredAccount.requestPending ? <Clock size={16} /> : (isStatusActive ? <ShieldCheck size={16} /> : <MessageSquare size={16} />))}
                        {registeredAccount.requestPending ? 'Validación en Curso' : (isStatusActive ? 'VERIFICADO - REPORTAR INCIDENCIA' : 'Solicitar Cambio de Canal')}
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  <div className="bg-gray-100 p-1.5 rounded-2xl inline-flex w-full md:w-auto mb-10 border border-gray-200 shadow-inner">
                    <button onClick={() => setActiveTab('bank')} className={`flex-1 md:flex-none px-10 py-3.5 rounded-xl text-[10px] font-black uppercase transition-all flex items-center justify-center gap-2 ${activeTab === 'bank' ? 'bg-white text-accent shadow-sm' : 'text-text-muted hover:text-accent'}`}><Landmark size={14} /> Bancaria</button>
                    <button onClick={() => setActiveTab('card')} className={`flex-1 md:flex-none px-10 py-3.5 rounded-xl text-[10px] font-black uppercase transition-all flex items-center justify-center gap-2 ${activeTab === 'card' ? 'bg-white text-accent shadow-sm' : 'text-text-muted hover:text-accent'}`}><CreditCard size={14} /> Tarjeta Débito</button>
                    <button onClick={() => setActiveTab('crypto')} className={`flex-1 md:flex-none px-10 py-3.5 rounded-xl text-[10px] font-black uppercase transition-all flex items-center justify-center gap-2 ${activeTab === 'crypto' ? 'bg-white text-accent shadow-sm' : 'text-text-muted hover:text-accent'}`}><Coins size={14} /> Blockchain</button>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16">
                    <div className="space-y-8 animate-in slide-in-from-left-4 duration-500">
                      
                      {activeTab !== 'crypto' ? (
                        <div className="space-y-8 animate-in fade-in duration-300">
                          <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-accent uppercase tracking-widest flex items-center gap-2"><UserCheck size={14} className="text-accent" /> Nombre del Titular</label>
                            <input type="text" value={formData.holderName} onChange={(e) => setFormData({...formData, holderName: e.target.value})} placeholder="Nombre completo" className="w-full bg-surface-subtle border-2 border-surface-border rounded-2xl px-5 py-4 text-sm font-bold text-accent uppercase focus:border-accent/40 focus:ring-0" />
                          </div>
                          <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-1.5"><label className="text-[10px] font-black text-accent uppercase tracking-widest">Tipo Doc</label><select value={formData.docType} onChange={(e) => setFormData({...formData, docType: e.target.value})} className="w-full bg-surface-subtle border-2 border-surface-border rounded-2xl px-5 py-4 text-sm font-bold text-accent"><option>CC</option><option>NIT</option><option>Pasaporte</option></select></div>
                            <div className="space-y-1.5"><label className="text-[10px] font-black text-accent uppercase tracking-widest">Nº Documento</label><input type="text" value={formData.docNumber} onChange={(e) => setFormData({...formData, docNumber: e.target.value})} placeholder="Identificación" className="w-full bg-surface-subtle border-2 border-surface-border rounded-2xl px-5 py-4 text-sm font-bold text-accent" /></div>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-7 animate-in fade-in duration-500">
                          <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-2">
                              <label className="text-[10px] font-black text-accent uppercase tracking-widest">Criptomoneda</label>
                              <select value={formData.cryptoCurrency} onChange={(e) => setFormData({...formData, cryptoCurrency: e.target.value})} className="w-full bg-surface-subtle border-2 border-surface-border rounded-2xl px-5 py-4 text-sm font-bold text-accent appearance-none cursor-pointer focus:border-accent"><option>USDT (Tether)</option><option>BTC (Bitcoin)</option><option>ETH (Ethereum)</option><option>USDC (USD Coin)</option></select>
                            </div>
                            <div className="space-y-2">
                              <label className="text-[10px] font-black text-accent uppercase tracking-widest">Red / Network</label>
                              <select value={formData.cryptoNetwork} onChange={(e) => setFormData({...formData, cryptoNetwork: e.target.value})} className="w-full bg-surface-subtle border-2 border-surface-border rounded-2xl px-5 py-4 text-sm font-bold text-accent appearance-none cursor-pointer focus:border-accent"><option>TRC20 (Tron)</option><option>ERC20 (Ethereum)</option><option>BEP20 (BSC)</option><option>Polygon (MATIC)</option><option>BTC Network</option></select>
                            </div>
                          </div>
                          <div className="space-y-2">
                            <label className="text-[10px] font-black text-accent uppercase tracking-widest flex items-center gap-2"><QrCode size={14} className="text-accent" /> Dirección de Billetera (Wallet Address)</label>
                            <input type="text" value={formData.walletAddress} onChange={(e) => setFormData({...formData, walletAddress: e.target.value})} placeholder="T9yD14Nj9sW..." className="w-full bg-surface-subtle border-2 border-surface-border rounded-2xl px-5 py-4 text-sm font-bold text-accent font-mono focus:border-accent transition-all" />
                          </div>
                          <div className="space-y-2">
                            <label className="text-[10px] font-black text-accent uppercase tracking-widest">Nombre del Exchange / Wallet</label>
                            <input type="text" value={formData.exchange} onChange={(e) => setFormData({...formData, exchange: e.target.value})} placeholder="Ej. Binance, Ledger, MetaMask" className="w-full bg-surface-subtle border-2 border-surface-border rounded-2xl px-5 py-4 text-sm font-bold text-accent focus:border-accent" />
                          </div>
                        </div>
                      )}

                      {activeTab === 'bank' && (
                        <div className="space-y-6 animate-in fade-in">
                          <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-1.5"><label className="text-[10px] font-black text-accent uppercase tracking-widest">Banco</label><input type="text" value={formData.bankName} onChange={(e) => setFormData({...formData, bankName: e.target.value})} className="w-full bg-surface-subtle border-2 border-surface-border rounded-2xl px-5 py-4 text-sm font-bold text-accent" /></div>
                            <div className="space-y-1.5"><label className="text-[10px] font-black text-accent uppercase tracking-widest">Tipo</label><select value={formData.accountType} onChange={(e) => setFormData({...formData, accountType: e.target.value})} className="w-full bg-surface-subtle border-2 border-surface-border rounded-2xl px-5 py-4 text-sm font-bold text-accent"><option>Ahorros</option><option>Corriente</option></select></div>
                          </div>
                          <div className="space-y-1.5"><label className="text-[10px] font-black text-accent uppercase tracking-widest">Nº Cuenta / IBAN</label><input type="text" value={formData.accountNumber} onChange={(e) => setFormData({...formData, accountNumber: e.target.value})} className="w-full bg-surface-subtle border-2 border-surface-border rounded-2xl px-5 py-4 text-sm font-bold text-accent font-mono" /></div>
                        </div>
                      )}

                      {activeTab === 'card' && (
                        <div className="space-y-6 animate-in fade-in">
                          <div className="space-y-1.5"><label className="text-[10px] font-black text-accent uppercase tracking-widest">Banco Emisor</label><input type="text" value={formData.bankName} onChange={(e) => setFormData({...formData, bankName: e.target.value})} className="w-full bg-surface-subtle border-2 border-surface-border rounded-2xl px-5 py-4 text-sm font-bold text-accent" /></div>
                          <div className="space-y-1.5"><label className="text-[10px] font-black text-accent uppercase tracking-widest">Nº Tarjeta (16 dígitos)</label><input type="text" maxLength={16} value={formData.accountNumber} onChange={(e) => setFormData({...formData, accountNumber: e.target.value.replace(/\D/g, '')})} placeholder="0000 0000 0000 0000" className="w-full bg-surface-subtle border-2 border-surface-border rounded-2xl px-5 py-4 text-sm font-bold text-accent tracking-widest" /></div>
                        </div>
                      )}

                      <button onClick={() => setShowConfirm(true)} disabled={(!formData.holderName && activeTab !== 'crypto') || (!formData.walletAddress && activeTab === 'crypto') || isSavingAccount} className="w-full bg-accent text-primary font-black py-5 rounded-[24px] flex items-center justify-center gap-3 hover:bg-black transition-all shadow-2xl uppercase text-[11px] tracking-[0.2em] disabled:opacity-30 active:scale-95 group">
                        {isSavingAccount ? <RefreshCw size={18} className="animate-spin" /> : <ShieldCheck size={18} className="group-hover:scale-110 transition-transform" />}
                        Certificar Canal de Dispersión
                      </button>
                    </div>

                    {/* CARD PREVIEW AZUL OSCURO */}
                    <div className="hidden lg:flex flex-col gap-8 animate-in slide-in-from-right-4 duration-700">
                      <div className={`relative w-full aspect-[1.586/1] rounded-[40px] overflow-hidden p-10 text-white shadow-2xl flex flex-col justify-between group bg-[#1d1c2d]`}>
                        <div className="absolute right-[-20px] top-[40px] text-[180px] leading-none opacity-5 font-serif font-black select-none pointer-events-none uppercase">{activeTab === 'crypto' ? '₿' : 'CCG'}</div>
                        <div className="flex justify-between items-start relative z-10">
                          <div className="flex items-center gap-4">
                            <div className="size-14 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20 shadow-inner">
                              {activeTab === 'crypto' ? <Bitcoin size={28} className="text-primary"/> : activeTab === 'bank' ? <Landmark size={28}/> : <CreditCard size={28}/>}
                            </div>
                            <div className="flex flex-col">
                              <span className="text-[10px] uppercase tracking-widest text-white/70">{activeTab === 'crypto' ? 'Identificador Protegido' : 'Protocolo Unificado'}</span>
                              <span className="font-black text-xl tracking-tight uppercase leading-none mt-1">
                                {activeTab === 'crypto' ? formData.cryptoCurrency : (formData.bankName || 'INSTITUCIÓN')}
                              </span>
                            </div>
                          </div>
                          <div className="px-4 py-1.5 rounded-xl border border-white/20 text-[9px] font-black uppercase bg-white/10 shadow-inner">VISTA PREVIA</div>
                        </div>
                        <div className="flex flex-col gap-6 relative z-10">
                          <div>
                            <span className="text-[10px] uppercase tracking-widest text-white/60 mb-1 block font-black">Canal de Dispersión</span>
                            <div className="bg-black/20 backdrop-blur-sm rounded-2xl px-5 py-4 font-mono text-sm border border-white/10 overflow-hidden text-ellipsis shadow-inner">
                              {activeTab === 'crypto' ? (formData.walletAddress || '•••• •••• •••• ••••') : (activeTab === 'card' ? `**** **** **** ${formData.accountNumber.slice(-4) || '0000'}` : (formData.accountNumber || '•••• •••• •••• ••••'))}
                            </div>
                          </div>
                          <div className="flex justify-between items-end border-t border-white/10 pt-4">
                            <div>
                                <span className="text-[9px] uppercase tracking-widest text-white/50 mb-1 block">{activeTab === 'crypto' ? 'Plataforma / Exchange' : 'Titular Certificado'}</span>
                                <span className="text-xs font-black tracking-widest uppercase truncate max-w-[200px] block">{activeTab === 'crypto' ? (formData.exchange || 'N/A') : (formData.holderName || 'PENDIENTE')}</span>
                            </div>
                            <div className="text-right">
                                <span className="text-[9px] uppercase tracking-widest text-white/50 mb-1 block">Red / Tipo</span>
                                <span className="text-xs font-black uppercase tracking-tight">{activeTab === 'crypto' ? formData.cryptoNetwork.split(' ')[0] : formData.accountType}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="bg-surface-subtle border border-surface-border rounded-[32px] p-8 space-y-4 shadow-sm">
                         <div className="flex items-center gap-3 text-accent"><Globe size={18} className="text-accent" /><h4 className="text-xs font-black uppercase tracking-widest">Protocolo Internacional</h4></div>
                         <p className="text-[11px] text-text-secondary font-bold leading-relaxed">Los dividendos se dispersan bajo estándares de cumplimiento global. En el método Blockchain, verifique cuidadosamente la red receptora para evitar pérdida irreversible de fondos.</p>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </section>
          </>
        )}
      </main>

      {/* MODALES */}
      {showRequestSuccess && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-accent/80 backdrop-blur-md animate-in fade-in" />
          <div className="relative w-full max-w-lg bg-white rounded-[40px] shadow-2xl p-10 text-center space-y-8 animate-in zoom-in-95 border border-white/20 flex flex-col items-center">
            <div className="size-24 bg-accent rounded-full flex items-center justify-center shadow-xl ring-8 ring-accent/10"><CheckCircle2 size={48} className="text-primary" /></div>
            <div className="space-y-2"><h3 className="text-2xl font-black text-accent tracking-tighter uppercase">Protocolo Iniciado</h3><p className="text-text-secondary text-sm font-medium leading-relaxed">Su solicitud ha sido registrada en el libro maestro. El oficial de cumplimiento verificará los datos de dispersión antes de autorizar el cambio.</p></div>
            <button onClick={() => setShowRequestSuccess(false)} className="w-full bg-accent text-primary font-black py-5 rounded-[24px] uppercase text-[11px] tracking-[0.2em] shadow-xl">Entendido</button>
          </div>
        </div>
      )}

      {showConfirm && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-accent/80 backdrop-blur-md animate-in fade-in" onClick={() => setShowConfirm(false)} />
          <div className="relative w-full max-w-lg bg-white rounded-[40px] shadow-2xl p-10 text-center space-y-8 animate-in zoom-in-95 border border-white/20 flex flex-col items-center">
            <div className="size-24 bg-surface-subtle text-accent rounded-[32px] flex items-center justify-center shadow-xl border border-surface-border"><AlertCircle size={48} /></div>
            <div className="space-y-2"><h4 className="text-2xl font-black text-accent tracking-tight uppercase">¿Certificar Datos?</h4><p className="text-sm text-text-secondary font-medium leading-relaxed">Al confirmar, usted declara ser titular del canal registrado. Por seguridad de dispersión, este será bloqueado para edición automática tras la verificación.</p></div>
            <div className="flex gap-4 w-full">
              <button onClick={() => setShowConfirm(false)} className="flex-1 px-8 py-5 border-2 border-surface-border rounded-[24px] text-[11px] font-black uppercase text-text-muted hover:bg-gray-50 transition-all">Revisar</button>
              <button onClick={handleSaveAccount} className="flex-1 px-8 py-5 bg-accent text-primary rounded-[24px] text-[11px] font-black uppercase shadow-2xl hover:bg-black transition-all flex items-center justify-center gap-3">
                {isSavingAccount ? <RefreshCw size={18} className="animate-spin" /> : <ShieldCheck size={18} />} Certificar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ShareholderProfile;
