
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
  AlertOctagon,
  Download,
  Loader2,
  ChevronRight,
  CreditCard as CardIcon,
  Info,
  TriangleAlert,
  Fingerprint,
  Calendar
} from 'lucide-react';
import { fetchTableData, findValue, norm, parseSheetNumber, saveShareholderAccount, fetchShareholderAccount, logAccountChangeRequest } from '../../lib/googleSheets';
import { generateShareholderStatementPDF } from '../../lib/pdfService';

interface ShareholderProfileProps {
  user: any;
  onBack: () => void;
}

const ShareholderProfile: React.FC<ShareholderProfileProps> = ({ user, onBack }) => {
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [dividends, setDividends] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [config, setConfig] = useState<any>(null);
  
  const [activeTab, setActiveTab] = useState<'debit' | 'bank' | 'crypto'>('crypto');
  const [registeredAccount, setRegisteredAccount] = useState<any | null>(null);
  const [isSavingAccount, setIsSavingAccount] = useState(false);
  const [isRequestingSupport, setIsRequestingSupport] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showRequestSuccess, setShowRequestSuccess] = useState(false);

  const [formData, setFormData] = useState({
    holderName: user.name || '',
    docType: 'CC',
    docNumber: '',
    country: 'Colombia',
    bankName: '',
    accountType: 'Ahorros',
    accountNumber: '',
    swiftCode: 'N/A',
    cryptoCurrency: 'USDT (Tether)',
    cryptoNetwork: 'TRC20 (Tron)',
    exchange: '',
    walletAddress: ''
  });

  const formatDate = (dateVal: any) => {
    if (!dateVal) return 'Fecha no registrada';
    const date = new Date(dateVal);
    if (isNaN(date.getTime())) return String(dateVal);
    return date.toLocaleDateString('es-ES', { 
      day: 'numeric', 
      month: 'long', 
      year: 'numeric' 
    });
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
      
      if (accountData) {
        setFormData(prev => ({
          ...prev,
          bankName: accountData.institution || '',
          accountNumber: accountData.account || '',
          walletAddress: accountData.account || '',
          cryptoCurrency: accountData.institution || 'USDT (Tether)',
          cryptoNetwork: accountData.network || 'TRC20 (Tron)',
          exchange: accountData.platform || '',
          docNumber: accountData.docNumber || ''
        }));
      }
    } catch (e) {
      console.error("Error cargando perfil:", e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    syncProfileData();
  }, [user.uid]);

  const stats = useMemo(() => {
    const regDate = user.registrationDate ? new Date(user.registrationDate) : null;
    const regYear = regDate ? regDate.getFullYear() : 0;
    const regMonth = regDate ? regDate.getMonth() + 1 : 1;

    const yearDividends = dividends.filter(d => {
      const rowYear = parseInt(String(findValue(d, ['ANIO', 'anio', 'year']) || 0));
      const rowMonth = parseInt(String(findValue(d, ['MES', 'mes', 'month']) || 0));
      const isPostRegistration = (rowYear > regYear) || (rowYear === regYear && rowMonth >= regMonth);
      return isPostRegistration && rowYear === selectedYear;
    });
    
    const totalProfit = yearDividends.reduce((acc, d) => acc + parseSheetNumber(findValue(d, ['UTILIDAD_NETA_USD', 'utilidad'])), 0);
    const totalYield = yearDividends.reduce((acc, d) => acc + parseSheetNumber(findValue(d, ['RENTABILIDAD_MES_PCT', 'rentabilidad'])), 0);
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
  }, [dividends, selectedYear, config, user.shares, user.registrationDate]);

  const handleDownloadStatement = async () => {
    setIsExporting(true);
    try {
      await generateShareholderStatementPDF(user, stats, selectedYear);
    } finally {
      setIsExporting(false);
    }
  };

  const isStatusActive = useMemo(() => {
    if (!registeredAccount) return false;
    const s = registeredAccount.status.toUpperCase();
    return s === 'ACTIVO' || s === 'VERIFICADO' || s === 'COMPLETADO' || s === 'OK';
  }, [registeredAccount]);

  const handleSaveAccount = async () => {
    // Si es crypto, no enviamos datos de documento personal
    let payload: any = {
      type: activeTab === 'crypto' ? 'CRYPTO' : activeTab === 'bank' ? 'BANK' : 'DEBIT',
      holderName: activeTab === 'crypto' ? 'BLOCKCHAIN VERIFIED' : formData.holderName,
      docType: activeTab === 'crypto' ? 'N/A' : formData.docType,
      docNumber: activeTab === 'crypto' ? 'BLOCKCHAIN_AUTH' : formData.docNumber,
      institution: activeTab === 'crypto' ? formData.cryptoCurrency : formData.bankName,
      identifier: activeTab === 'crypto' ? formData.walletAddress : formData.accountNumber,
      network: activeTab === 'crypto' ? formData.cryptoNetwork : formData.accountType,
      platform: activeTab === 'crypto' ? (formData.exchange || 'Wallet Privada') : formData.country,
      swiftCode: activeTab === 'bank' ? (formData.swiftCode || 'N/A') : 'N/A'
    };

    const isMissingRequired = activeTab === 'crypto' 
      ? !formData.walletAddress 
      : (!formData.docNumber || !formData.accountNumber);

    if (isMissingRequired) return;
    
    setIsSavingAccount(true);
    try {
      const res = await saveShareholderAccount(user.uid, payload);
      if (res.success) {
        setShowConfirm(false);
        setTimeout(syncProfileData, 1500);
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
        setTimeout(syncProfileData, 2000);
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
        
        {/* Navegación Superior */}
        <div className="flex justify-between items-center">
          <button onClick={onBack} className="flex items-center gap-2 text-text-muted hover:text-accent font-black text-[10px] uppercase tracking-widest transition-all w-fit group">
            <div className="p-2 bg-white rounded-xl border border-surface-border group-hover:border-primary transition-all">
              <ArrowLeft size={16} />
            </div>
            <span>Volver al Padrón</span>
          </button>
          
          <div className="flex gap-3">
             <button 
               onClick={handleDownloadStatement}
               disabled={isExporting}
               className="flex items-center gap-3 px-6 py-3 bg-accent text-primary rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg hover:bg-black transition-all disabled:opacity-50"
             >
               {isExporting ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
               Descargar Extracto {selectedYear}
             </button>
             <button onClick={syncProfileData} className="p-3 bg-white border border-surface-border rounded-xl text-accent hover:bg-surface-subtle transition-all active:rotate-180">
               <RefreshCw size={18} className={isLoading ? 'animate-spin' : ''} />
             </button>
          </div>
        </div>

        {/* Banner de Identidad */}
        <header className="bg-white rounded-[40px] shadow-sm border border-surface-border p-6 md:p-10 relative overflow-hidden">
          <div className="flex flex-col md:flex-row gap-8 md:items-center justify-between relative z-10">
            <div className="flex items-center gap-6">
              <div className="size-20 lg:size-24 rounded-[32px] bg-accent flex items-center justify-center font-black text-2xl text-primary shadow-2xl uppercase shrink-0">
                {user.initials || 'S'}
              </div>
              <div className="space-y-3">
                <h1 className="text-3xl lg:text-4xl font-black text-accent tracking-tighter uppercase leading-none">{user.name}</h1>
                <div className="flex items-center gap-4">
                  <div className="px-3 py-1.5 bg-[#faffd1] text-accent text-[10px] font-black rounded-lg uppercase tracking-widest border border-[#e5ebbc]">
                    {user.uid}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black text-text-muted uppercase tracking-[0.1em]">
                      Vinculado el: <span className="text-accent">{formatDate(user.registrationDate)}</span>
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white border border-surface-border rounded-[32px] p-8 md:min-w-[400px] flex flex-col justify-center relative shadow-sm hover:shadow-premium transition-all">
              <div className="absolute top-6 right-8 text-[9px] font-black text-text-muted uppercase tracking-[0.2em]">
                Capital Nominal Asignado
              </div>
              <div className="flex items-baseline justify-center gap-3 mt-4">
                <span className="text-4xl lg:text-6xl font-black text-accent tracking-tighter">
                  ${stats.balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </span>
                <span className="text-sm font-black text-text-muted">USD</span>
              </div>
              <div className="absolute bottom-0 right-0 p-4 opacity-[0.03] pointer-events-none translate-x-1/4 translate-y-1/4">
                 <Target size={120} />
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
            {/* Stats Rápidos */}
            <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { label: 'Acciones', value: user.shares.toString(), sub: 'Registro Central', icon: Target },
                { label: 'Participación', value: stats.participation + '%', sub: 'Fondo Institucional', icon: PieIcon },
                { label: `Rendimiento ${selectedYear}`, value: (stats.totalYield * 100).toFixed(2) + '%', sub: 'Retorno Acumulado', icon: stats.totalYield >= 0 ? TrendingUp : TrendingDown },
                { label: 'Utilidad Neta', value: `$${stats.totalProfit.toLocaleString('en-US', { minimumFractionDigits: 2 })}`, sub: 'Liquidado en Nube', icon: DollarSign },
              ].map((stat, i) => (
                <div key={i} className="bg-white rounded-[32px] shadow-sm border border-surface-border p-7 flex flex-col justify-between hover:shadow-premium transition-all">
                  <div className="p-3 w-fit bg-surface-subtle rounded-2xl mb-4 text-accent"><stat.icon size={20} /></div>
                  <h3 className="text-[10px] font-black text-text-muted uppercase tracking-widest mb-1">{stat.label}</h3>
                  <div className="text-3xl font-black tracking-tighter text-accent">{stat.value}</div>
                  <p className="text-[10px] font-bold text-text-secondary mt-1 uppercase tracking-tight">{stat.sub}</p>
                </div>
              ))}
            </section>

            {/* Historial de Dividendos */}
            <section className="bg-white rounded-[40px] shadow-premium border border-surface-border p-8 md:p-12">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-primary/10 rounded-2xl text-accent shadow-sm border border-primary/10"><FileSpreadsheet size={24} /></div>
                  <div>
                    <h2 className="text-2xl font-black text-accent tracking-tighter uppercase leading-none">Historial de Dividendos</h2>
                    <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest mt-1">Liquidaciones operativas activas desde su vinculación</p>
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
                        <td className="px-8 py-5"><span className="text-sm font-black text-accent uppercase">{monthNames[findValue(d, ['MES']) - 1]}</span></td>
                        <td className="px-8 py-5">
                          <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${findValue(d, ['ESTATUS_PAGO']) === 'PAGADO' ? 'bg-green-50 text-green-700 border-green-100' : 'bg-orange-50 text-orange-700 border-orange-100'}`}>
                            {findValue(d, ['ESTATUS_PAGO']) || 'PENDIENTE'}
                          </span>
                        </td>
                        <td className="px-8 py-5 text-right font-bold text-text-secondary">{(parseSheetNumber(findValue(d, ['RENTABILIDAD_MES_PCT'])) * 100).toFixed(2)}%</td>
                        <td className="px-8 py-5 text-right font-black text-accent text-lg">${parseSheetNumber(findValue(d, ['UTILIDAD_NETA_USD'])).toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                      </tr>
                    )) : (
                      <tr><td colSpan={4} className="py-20 text-center text-text-muted"><p className="text-xs font-black uppercase tracking-widest">Sin registros operativos habilitados para {selectedYear}</p></td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>

            {/* Método Registrado de Dispersión */}
            <section className="bg-white rounded-[40px] shadow-premium border border-surface-border p-8 md:p-12 relative overflow-hidden group">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 mb-8">
                <div className="flex items-center gap-4">
                  <div className="flex items-center justify-center size-12 rounded-2xl bg-primary/10 text-accent shadow-sm border border-primary/20"><Wallet size={24} className="text-accent" /></div>
                  <h2 className="text-xl font-black text-accent tracking-tight">Método Registrado de Dispersión de Utilidades</h2>
                </div>
              </div>

              {registeredAccount ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center animate-in fade-in duration-700">
                  <div className={`relative w-full aspect-[1.586/1] rounded-[32px] overflow-hidden p-10 text-white shadow-2xl flex flex-col justify-between group transition-all duration-700 bg-gradient-to-br from-accent to-[#43415f]`}>
                    <div className="absolute -right-4 -top-4 opacity-[0.05] text-white"><Shield size={220} /></div>
                    <div className="flex justify-between items-start relative z-10">
                      <div className="flex items-center gap-4">
                        <div className="size-14 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20">
                          {registeredAccount.type === 'CRYPTO' ? <Bitcoin size={28} className="text-primary"/> : registeredAccount.type === 'BANK' ? <Landmark size={28}/> : <CardIcon size={28}/>}
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[10px] uppercase tracking-widest text-white/70">CANAL OFICIAL AUDITADO</span>
                          <span className="font-black text-2xl tracking-tight uppercase leading-none mt-1">{registeredAccount.institution}</span>
                        </div>
                      </div>
                      <ShieldCheck size={24} className={isStatusActive ? 'text-primary shadow-neon' : 'text-white/40'} />
                    </div>
                    <div className="relative z-10 space-y-4">
                      <div>
                        <span className="text-[10px] uppercase tracking-widest text-white/60 mb-1 block font-black">IDENTIFICADOR DE TRANSACCIÓN</span>
                        <div className="bg-black/20 backdrop-blur-sm rounded-2xl px-6 py-5 font-mono text-xl border border-white/10 flex items-center justify-between shadow-inner">
                           <span className="tracking-widest">**** **** **** {registeredAccount.account.slice(-4)}</span>
                           <EyeOff size={18} className="text-white/30" />
                        </div>
                      </div>
                      <div className="flex justify-between items-end border-t border-white/10 pt-4">
                         <div className="flex flex-col">
                           <span className="text-[9px] uppercase tracking-widest text-white/50 mb-1">Estatus Operativo</span>
                           <span className="text-[11px] font-black uppercase tracking-widest flex items-center gap-2">
                             {isStatusActive && <div className="size-1.5 bg-primary rounded-full animate-pulse shadow-neon"></div>}
                             {registeredAccount.status}
                           </span>
                         </div>
                         <div className="flex flex-col items-end">
                            <span className="text-[9px] uppercase tracking-widest text-white/50 mb-1">Titular</span>
                            <span className="text-[10px] font-bold text-white/80 uppercase">{registeredAccount.holderInfo}</span>
                         </div>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-6">
                    <div className="bg-surface-subtle border border-surface-border rounded-3xl p-8 space-y-4">
                      <div className="flex items-center gap-3">
                         <ShieldCheck className="text-accent" size={20} />
                         <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-accent">Garantía de Dispersión</h4>
                      </div>
                      <p className="text-[11px] text-text-secondary leading-relaxed font-medium">La compañía solo ejecutará transferencias de dividendos al método verificado en esta sección. Cualquier cambio requiere validación técnica ante el Comité de Cumplimiento.</p>
                    </div>
                    {!registeredAccount.requestPending ? (
                      <button onClick={handleSupportRequest} disabled={isRequestingSupport} className="w-full flex items-center justify-between px-8 py-5 bg-white border-2 border-surface-border rounded-2xl hover:border-primary transition-all group active:scale-95">
                        <div className="flex items-center gap-4">
                          <MessageSquare className="text-text-muted group-hover:text-accent" size={20} />
                          <div className="text-left">
                            <span className="block text-[11px] font-black uppercase text-accent leading-none">Solicitar Actualización de Canal</span>
                            <span className="text-[9px] font-bold text-text-muted uppercase tracking-widest">Requiere revisión técnica (24h)</span>
                          </div>
                        </div>
                        <ChevronRight className="text-text-muted" size={16} />
                      </button>
                    ) : (
                      <div className="w-full flex items-center gap-4 px-8 py-5 bg-blue-50 border border-blue-100 rounded-2xl">
                        <Clock className="text-blue-600 animate-pulse" size={20} />
                        <div>
                          <span className="block text-[11px] font-black uppercase text-blue-900 leading-none">Petición de Cambio Activa</span>
                          <span className="text-[9px] font-bold text-blue-700 uppercase tracking-widest">En proceso de verificación interna</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
                   <div className="bg-orange-50 border border-orange-100 rounded-2xl p-6 flex gap-4">
                      <TriangleAlert className="text-orange-600 shrink-0" size={24} />
                      <div className="space-y-1.5">
                        <h4 className="text-[11px] font-black text-orange-900 uppercase tracking-widest">PROTOCOLO DE SEGURIDAD FINANCIERA</h4>
                        <p className="text-[11px] text-orange-800 font-medium leading-relaxed">
                          Es obligatorio registrar un método receptor para la <span className="font-black">dispersión de rendimientos mensuales</span>. Los datos de identificación deben corresponder exactamente a los del socio titular.
                        </p>
                      </div>
                   </div>

                   <div className="flex bg-surface-subtle p-1.5 rounded-2xl border border-surface-border w-fit shadow-sm">
                      <button onClick={() => setActiveTab('debit')} className={`flex items-center gap-3 px-6 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all ${activeTab === 'debit' ? 'bg-white text-accent shadow-md border border-gray-100' : 'text-text-muted hover:text-accent'}`}><CardIcon size={14} /> Tarjeta Débito</button>
                      <button onClick={() => setActiveTab('bank')} className={`flex items-center gap-3 px-6 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all ${activeTab === 'bank' ? 'bg-white text-accent shadow-md border border-gray-100' : 'text-text-muted hover:text-accent'}`}><Landmark size={14} /> Cuenta Bancaria</button>
                      <button onClick={() => setActiveTab('crypto')} className={`flex items-center gap-3 px-6 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all ${activeTab === 'crypto' ? 'bg-white text-accent shadow-md border border-gray-100' : 'text-text-muted hover:text-accent'}`}><Bitcoin size={14} /> Billetera Crypto</button>
                   </div>

                   <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                      <div className="lg:col-span-5">
                         <div className={`relative w-full aspect-[1.586/1] rounded-[32px] overflow-hidden p-8 text-white shadow-2xl flex flex-col justify-between group transition-all duration-500 ${activeTab === 'crypto' ? 'bg-gradient-to-br from-[#2c2419] to-[#0a0a0a]' : 'bg-gradient-to-br from-[#1d1c2d] to-[#43415f]'}`}>
                            <div className="absolute right-0 top-0 p-4 opacity-10 pointer-events-none">{activeTab === 'crypto' ? <Bitcoin size={180} /> : <Landmark size={180} />}</div>
                            <div className="flex justify-between items-start relative z-10">
                               <div className="flex items-center gap-4">
                                  <div className="size-12 rounded-xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20">{activeTab === 'crypto' ? <Bitcoin size={24} className="text-primary"/> : <Landmark size={24}/>}</div>
                                  <div className="flex flex-col">
                                     <span className="text-[8px] uppercase tracking-widest text-white/60">INSTITUCIÓN RECEPTORA</span>
                                     <span className="font-black text-lg tracking-tight uppercase leading-none mt-1 truncate max-w-[150px]">{activeTab === 'crypto' ? (formData.cryptoCurrency || 'USDT') : (formData.bankName || 'ENTIDAD BANCARIA')}</span>
                                  </div>
                               </div>
                               <div className="bg-white/10 border border-white/20 rounded-lg px-3 py-1 text-[9px] font-black tracking-widest uppercase">REGISTRO</div>
                            </div>
                            <div className="relative z-10 space-y-4">
                               <div>
                                  <span className="text-[8px] uppercase tracking-widest text-white/50 mb-1 block font-black">CÓDIGO DE CUENTA / WALLET</span>
                                  <div className="bg-black/20 backdrop-blur-sm rounded-xl px-5 py-3 font-mono text-sm border border-white/10 overflow-hidden truncate">{activeTab === 'crypto' ? (formData.walletAddress || 'T9yD14Nj9sW...') : (formData.accountNumber || 'NUMERO DE CUENTA')}</div>
                                </div>
                                <div className="flex justify-between items-end border-t border-white/10 pt-4">
                                   <div className="flex flex-col">
                                      <span className="text-[8px] uppercase tracking-widest text-white/40 mb-0.5">ID TITULAR</span>
                                      <span className="text-xs font-black uppercase tracking-widest">
                                        {activeTab === 'crypto' ? 'BLOCKCHAIN AUTH' : `${formData.docType} ${formData.docNumber || '---'}`}
                                      </span>
                                   </div>
                                   <div className="flex flex-col items-end">
                                      <span className="text-[8px] uppercase tracking-widest text-white/40 mb-0.5">RED / PAÍS</span>
                                      <span className="text-xs font-black uppercase tracking-widest">{activeTab === 'crypto' ? formData.cryptoNetwork : formData.country}</span>
                                   </div>
                                </div>
                            </div>
                         </div>
                      </div>

                      <div className="lg:col-span-7 space-y-6">
                         {/* Solo mostrar Identificación para métodos bancarios */}
                         {activeTab !== 'crypto' && (
                           <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in slide-in-from-top-2 duration-300">
                              <div className="space-y-1.5">
                                 <label className="text-[10px] font-bold text-accent uppercase ml-1">Tipo de Documento</label>
                                 <select value={formData.docType} onChange={(e) => setFormData({...formData, docType: e.target.value})} className="w-full bg-white border border-surface-border rounded-xl px-4 py-3 text-sm font-medium text-accent">
                                    <option value="CC">Cédula de Ciudadanía</option>
                                    <option value="CE">Cédula de Extranjería</option>
                                    <option value="PP">Pasaporte</option>
                                    <option value="NIT">NIT / Registro Fiscal</option>
                                 </select>
                              </div>
                              <div className="space-y-1.5">
                                 <label className="text-[10px] font-bold text-accent uppercase ml-1">Número de Identificación</label>
                                 <div className="relative">
                                    <Fingerprint className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" size={18} />
                                    <input type="text" value={formData.docNumber} onChange={(e) => setFormData({...formData, docNumber: e.target.value})} placeholder="Ingrese número" className="w-full bg-white border border-surface-border rounded-xl pl-12 pr-4 py-3 text-sm font-medium text-accent" />
                                 </div>
                              </div>
                           </div>
                         )}

                         {activeTab === 'crypto' ? (
                           <div className="space-y-6 animate-in fade-in duration-500">
                             <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                   <label className="text-[10px] font-bold text-accent uppercase ml-1">Criptomoneda</label>
                                   <select value={formData.cryptoCurrency} onChange={(e) => setFormData({...formData, cryptoCurrency: e.target.value})} className="w-full bg-white border border-surface-border rounded-xl px-4 py-3 text-sm font-medium text-accent">
                                      <option>USDT (Tether)</option><option>USDC (USD Coin)</option><option>BTC (Bitcoin)</option><option>ETH (Ethereum)</option>
                                   </select>
                                </div>
                                <div className="space-y-1.5">
                                   <label className="text-[10px] font-bold text-accent uppercase ml-1">Red / Network</label>
                                   <select value={formData.cryptoNetwork} onChange={(e) => setFormData({...formData, cryptoNetwork: e.target.value})} className="w-full bg-white border border-surface-border rounded-xl px-4 py-3 text-sm font-medium text-accent">
                                      <option>TRC20 (Tron)</option><option>ERC20 (Ethereum)</option><option>BEP20 (Binance)</option><option>Polygon</option>
                                   </select>
                                </div>
                             </div>
                             <div className="space-y-1.5">
                                <label className="text-[10px] font-bold text-accent uppercase ml-1">Dirección de Billetera (Wallet Address)</label>
                                <div className="relative">
                                   <QrCode className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" size={18} />
                                   <input type="text" value={formData.walletAddress} onChange={(e) => setFormData({...formData, walletAddress: e.target.value})} placeholder="T9yD14Nj9sW..." className="w-full bg-white border border-surface-border rounded-xl pl-12 pr-4 py-3 text-sm font-medium text-accent font-mono" />
                                </div>
                             </div>
                             <div className="space-y-1.5">
                                <label className="text-[10px] font-bold text-accent uppercase ml-1">Nombre del Exchange / Wallet</label>
                                <div className="relative">
                                   <ShieldCheck className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" size={18} />
                                   <input type="text" value={formData.exchange} onChange={(e) => setFormData({...formData, exchange: e.target.value})} placeholder="Ej. Binance, MetaMask, Ledger" className="w-full bg-white border border-surface-border rounded-xl pl-12 pr-4 py-3 text-sm font-medium text-accent" />
                                </div>
                             </div>
                             <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex gap-3">
                                <Info className="text-blue-600 shrink-0 mt-0.5" size={18} />
                                <p className="text-[11px] text-blue-800 font-medium leading-relaxed">
                                   <span className="font-black">Privacidad Cripto:</span> Para este método no se requieren documentos de identidad adicionales, ya que la vinculación se realiza mediante la autenticidad de la dirección pública suministrada.
                                </p>
                             </div>
                           </div>
                         ) : (
                           <div className="space-y-6 animate-in fade-in duration-500">
                             <div className="space-y-1.5">
                                <label className="text-[10px] font-bold text-accent uppercase ml-1">Nombre del Titular (Debe ser el mismo del socio)</label>
                                <input type="text" value={formData.holderName} readOnly className="w-full bg-surface-subtle border border-surface-border rounded-xl px-4 py-3 text-sm font-bold text-text-muted" />
                             </div>
                             <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                   <label className="text-[10px] font-bold text-accent uppercase ml-1">Entidad Bancaria</label>
                                   <input type="text" value={formData.bankName} onChange={(e) => setFormData({...formData, bankName: e.target.value})} placeholder="Ej. Bancolombia, Chase" className="w-full bg-white border border-surface-border rounded-xl px-4 py-3 text-sm font-medium text-accent" />
                                </div>
                                <div className="space-y-1.5">
                                   <label className="text-[10px] font-bold text-accent uppercase ml-1">Tipo de Cuenta</label>
                                   <select value={formData.accountType} onChange={(e) => setFormData({...formData, accountType: e.target.value})} className="w-full bg-white border border-surface-border rounded-xl px-4 py-3 text-sm font-medium text-accent">
                                      <option>Ahorros</option><option>Corriente</option><option>Digital / Nequi</option><option>Internacional</option>
                                   </select>
                                </div>
                             </div>
                             <div className="space-y-1.5">
                                <label className="text-[10px] font-bold text-accent uppercase ml-1">Número de Cuenta</label>
                                <input type="text" value={formData.accountNumber} onChange={(e) => setFormData({...formData, accountNumber: e.target.value})} placeholder="000-000-000" className="w-full bg-white border border-surface-border rounded-xl px-4 py-3 text-sm font-medium text-accent" />
                             </div>
                           </div>
                         )}
                         <div className="flex justify-end pt-4">
                            <button 
                              onClick={() => setShowConfirm(true)} 
                              disabled={activeTab === 'crypto' ? !formData.walletAddress : (!formData.docNumber || !formData.accountNumber)} 
                              className="bg-accent text-white font-black px-10 py-4 rounded-xl flex items-center justify-center gap-3 uppercase text-[10px] tracking-widest shadow-xl hover:bg-black transition-all disabled:opacity-30 active:scale-95"
                            >
                              <Save size={18} /> Registrar y Sincronizar Ledger
                            </button>
                         </div>
                      </div>
                   </div>
                </div>
              )}
            </section>
          </>
        )}
      </main>

      {showConfirm && (
        <div className="fixed inset-0 z-[1100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-accent/80 backdrop-blur-md animate-in fade-in" onClick={() => setShowConfirm(false)} />
          <div className="relative w-full max-w-sm bg-white rounded-[40px] p-10 flex flex-col items-center text-center animate-in zoom-in-95">
            <div className="size-20 bg-primary/10 rounded-3xl flex items-center justify-center text-accent shadow-sm border border-primary/20 mb-6"><ShieldCheck size={40} /></div>
            <h3 className="text-xl font-black text-accent uppercase tracking-tighter mb-2">Confirmar Registro Maestro</h3>
            <p className="text-text-secondary text-xs font-medium leading-relaxed mb-8">Este canal será vinculado de forma permanente a su perfil para la dispersión de utilidades de Caishen Capital Group. ¿Desea proceder?</p>
            <div className="grid grid-cols-2 gap-4 w-full">
               <button onClick={() => setShowConfirm(false)} className="py-4 bg-surface-subtle text-text-muted font-black text-[10px] uppercase tracking-widest rounded-2xl">Cancelar</button>
               <button onClick={handleSaveAccount} disabled={isSavingAccount} className="py-4 bg-accent text-primary font-black text-[10px] uppercase tracking-widest rounded-2xl flex items-center justify-center gap-2">{isSavingAccount ? <RefreshCw className="animate-spin" size={14} /> : 'Confirmar'}</button>
            </div>
          </div>
        </div>
      )}

      {showRequestSuccess && (
        <div className="fixed inset-0 z-[1100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-accent/80 backdrop-blur-md animate-in fade-in" onClick={() => setShowRequestSuccess(false)} />
          <div className="relative w-full max-w-sm bg-white rounded-[40px] p-10 flex flex-col items-center text-center animate-in zoom-in-95">
            <div className="size-20 bg-green-500 rounded-3xl flex items-center justify-center text-white shadow-xl mb-6"><CheckCircle2 size={40} /></div>
            <h3 className="text-xl font-black text-accent uppercase tracking-tighter mb-2">Solicitud de Actualización Enviada</h3>
            <p className="text-text-secondary text-xs font-medium leading-relaxed mb-8">Su petición ha sido registrada. El Comité de Cumplimiento validará la información y se contactará con usted en un plazo no mayor a 24 horas hábiles.</p>
            <button onClick={() => setShowRequestSuccess(false)} className="w-full py-4 bg-accent text-white font-black text-[10px] uppercase tracking-widest rounded-2xl">Finalizar Gestión</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ShareholderProfile;
