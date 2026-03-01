
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
  ChevronDown,
  ChevronRight,
  CreditCard as CardIcon,
  Info,
  TriangleAlert,
  Fingerprint,
  Calendar,
  KeyRound,
  Phone,
  User,
  Mail,
  MapPin,
  Users as UsersIcon,
  Camera,
  AlertTriangle,
  Info as InfoIcon
} from 'lucide-react';
import { 
  fetchTableData, 
  findValue, 
  norm, 
  parseSheetNumber, 
  saveShareholderAccount, 
  fetchShareholderAccount, 
  logAccountChangeRequest
} from '../../lib/googleSheets';
import { ccgUpdatePin, ccgUpdateProfile, ProfileUpdateData } from '../../lib/ccgSecurityProfileClient';
import { generateShareholderStatementPDF } from '../../lib/pdfService';

interface ShareholderProfileProps {
  user: any;
  onBack: () => void;
}

const ShareholderProfile: React.FC<ShareholderProfileProps> = ({ user, onBack }) => {
  const [activeView, setActiveView] = useState<'finance' | 'account'>('finance');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [dividends, setDividends] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [config, setConfig] = useState<any>(null);
  
  const [activeWithdrawalTab, setActiveWithdrawalTab] = useState<'debit' | 'bank' | 'crypto'>('crypto');
  const [registeredAccount, setRegisteredAccount] = useState<any | null>(null);
  const [isSavingAccount, setIsSavingAccount] = useState(false);
  const [isRequestingSupport, setIsRequestingSupport] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showRequestSuccess, setShowRequestSuccess] = useState(false);

  // Estados para cambio de PIN
  const [showPinChange, setShowPinChange] = useState(false);
  const [pinStep, setPinStep] = useState<'verify' | 'new' | 'confirm'>('verify');
  const [pinBuffer, setPinBuffer] = useState('');
  const [newPin, setNewPin] = useState('');
  const [isUpdatingPin, setIsUpdatingPin] = useState(false);
  const [pinError, setPinError] = useState('');
  const [successPinChange, setSuccessPinChange] = useState(false);

  // Estado para actualización de Perfil Personal (v2.2 Completo)
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState(false);

  const [formData, setFormData] = useState({
    holderName: user.name || '',
    email: user.email || '',
    docType: 'CC',
    docNumber: user.raw?.NUM_DOCUMENTO || '',
    phone: user.raw?.TELEFONO || '',
    birthDate: user.raw?.FECHA_NACIMIENTO || '',
    gender: user.raw?.GENERO || 'No Definido',
    address: user.raw?.DIRECCION_RESIDENCIA || '',
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
      const [allDividends, masterConfig, accountData, sociosData] = await Promise.all([
        fetchTableData('DIVIDENDOS_SOCIOS'),
        fetchTableData('CONFIG_MAESTRA'),
        fetchShareholderAccount(user.uid),
        fetchTableData('LIBRO_ACCIONISTAS', true)
      ]);
      
      const targetUidNorm = norm(user.uid);
      const userDividends = allDividends.filter(d => {
        const rowUid = findValue(d, ['UID_SOCIO', 'uid', 'id_socio', 'columna 1', 'columna1']);
        return norm(rowUid) === targetUidNorm;
      });

      const freshUser = sociosData.find(u => norm(findValue(u, ['UID_SOCIO'])) === targetUidNorm);
      
      setDividends(userDividends);
      
      // Auto-select the most recent year with dividends
      if (userDividends.length > 0) {
        const maxYear = Math.max(...userDividends.map(d => parseInt(String(findValue(d, ['ANIO', 'anio', 'year']) || 0))));
        if (maxYear > 0) setSelectedYear(maxYear);
      }

      setConfig(masterConfig[0] || {});
      setRegisteredAccount(accountData);
      
      if (freshUser) {
        setFormData(prev => ({
          ...prev,
          docNumber: String(findValue(freshUser, ['NUM_DOCUMENTO']) || prev.docNumber),
          phone: String(findValue(freshUser, ['TELEFONO']) || prev.phone),
          birthDate: String(findValue(freshUser, ['FECHA_NACIMIENTO']) || prev.birthDate),
          gender: String(findValue(freshUser, ['GENERO']) || prev.gender),
          address: String(findValue(freshUser, ['DIRECCION_RESIDENCIA']) || prev.address),
          bankName: accountData?.institution || prev.bankName,
          accountNumber: accountData?.account || prev.accountNumber,
          walletAddress: accountData?.account || prev.walletAddress,
          exchange: accountData?.platform || prev.exchange,
          cryptoCurrency: accountData?.type === 'CRYPTO' ? accountData.institution : prev.cryptoCurrency,
          cryptoNetwork: accountData?.type === 'CRYPTO' ? accountData.network : prev.cryptoNetwork
        }));

        if (accountData) {
          if (accountData.type === 'CRYPTO') setActiveWithdrawalTab('crypto');
          else if (accountData.type === 'BANK') setActiveWithdrawalTab('bank');
          else if (accountData.type === 'DEBIT') setActiveWithdrawalTab('debit');
        }
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
    const isValidDate = regDate && !isNaN(regDate.getTime());
    const regYear = isValidDate ? regDate.getFullYear() : 0;
    const regMonth = isValidDate ? regDate.getMonth() + 1 : 1;

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
    let payload: any = {
      type: activeWithdrawalTab === 'crypto' ? 'CRYPTO' : activeWithdrawalTab === 'bank' ? 'BANK' : 'DEBIT',
      holderName: user.name, 
      docType: activeWithdrawalTab === 'crypto' ? 'N/A' : formData.docType,
      docNumber: activeWithdrawalTab === 'crypto' ? 'N/A' : formData.docNumber,
      institution: activeWithdrawalTab === 'crypto' ? formData.cryptoCurrency : formData.bankName,
      identifier: activeWithdrawalTab === 'crypto' ? formData.walletAddress : formData.accountNumber,
      network: activeWithdrawalTab === 'crypto' ? formData.cryptoNetwork : formData.accountType,
      platform: activeWithdrawalTab === 'crypto' ? (formData.exchange || 'Wallet Privada') : formData.country,
      swiftCode: activeWithdrawalTab === 'bank' ? (formData.swiftCode || 'N/A') : 'N/A'
    };

    if (activeWithdrawalTab === 'crypto' ? !formData.walletAddress : (!formData.docNumber || !formData.accountNumber)) return;
    
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

  const handleUpdatePersonalInfo = async () => {
    setIsUpdatingProfile(true);
    setProfileSuccess(false);
    try {
      const updatePayload: ProfileUpdateData = {
        TELEFONO: formData.phone,
        NUM_DOCUMENTO: formData.docNumber,
        FECHA_NACIMIENTO: formData.birthDate,
        GENERO: formData.gender,
        DIRECCION_RESIDENCIA: formData.address
      };
      
      const res = await ccgUpdateProfile(user.uid, updatePayload);
      if (res.success) {
        setProfileSuccess(true);
        setTimeout(() => {
          setProfileSuccess(false);
          syncProfileData();
        }, 3000);
      }
    } catch (e) {
      console.error("Error personal info:", e);
    } finally {
      setIsUpdatingProfile(false);
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

  const handlePinDigit = (digit: string) => {
    if (pinBuffer.length < 4) {
      const newBuffer = pinBuffer + digit;
      setPinBuffer(newBuffer);
      setPinError('');
      if (newBuffer.length === 4 && pinStep === 'verify') {
        if (newBuffer === String(user.pin)) {
          setPinStep('new');
          setPinBuffer('');
        } else {
          setPinError('PIN Actual Incorrecto');
          setPinBuffer('');
        }
      }
    }
  };

  const confirmPinUpdate = async () => {
    if (pinStep === 'new') {
      if (pinBuffer.length !== 4) {
        setPinError('El PIN debe tener 4 dígitos');
        return;
      }
      setNewPin(pinBuffer);
      setPinStep('confirm');
      setPinBuffer('');
      return;
    }
    if (pinStep === 'confirm') {
      if (pinBuffer !== newPin) {
        setPinError('Los PIN no coinciden');
        setPinBuffer('');
        setPinStep('new');
        return;
      }
      setIsUpdatingPin(true);
      try {
        const res = await ccgUpdatePin(user.uid, pinBuffer);
        if (res.success) {
          setSuccessPinChange(true);
          user.pin = pinBuffer; 
          setTimeout(() => {
            setPinStep('verify');
            setShowPinChange(false);
            setPinBuffer('');
            setSuccessPinChange(false);
          }, 2000);
        } else {
          setPinError(res.error || 'Fallo en validación');
        }
      } catch (e) {
        setPinError('Error de servidor');
      } finally {
        setIsUpdatingPin(false);
      }
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
        <header className="bg-white rounded-[40px] shadow-sm border border-surface-border p-5 md:p-10 relative overflow-hidden">
          <div className="flex flex-col md:flex-row gap-8 md:items-center justify-between relative z-10">
            <div className="flex items-center gap-4 md:gap-6">
              <div 
                onClick={() => setActiveView('account')}
                className="size-16 md:size-20 lg:size-24 rounded-[24px] md:rounded-[32px] bg-accent flex items-center justify-center font-black text-xl md:text-2xl text-primary shadow-2xl uppercase shrink-0 relative group cursor-pointer overflow-hidden"
              >
                <span>{user.initials || 'S'}</span>
              </div>
              <div className="space-y-2 md:space-y-3">
                <h1 
                  onClick={() => setActiveView('account')}
                  className="text-2xl md:text-3xl lg:text-4xl font-black text-accent tracking-tighter uppercase leading-none cursor-pointer hover:text-primary transition-colors"
                >
                  {user.name}
                </h1>
                <div className="flex flex-wrap items-center gap-3 md:gap-4">
                  <div className="px-3 py-1.5 bg-[#faffd1] text-accent text-[9px] md:text-[10px] font-black rounded-lg uppercase tracking-widest border border-[#e5ebbc]">
                    {user.uid}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] md:text-[10px] font-black text-text-muted uppercase tracking-[0.1em]">
                      Vinculado el: <span className="text-accent">{formatDate(user.registrationDate)}</span>
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Pestañas de Navegación de Perfil */}
            <div className="flex bg-surface-subtle p-1 rounded-[20px] md:rounded-[24px] border border-surface-border shadow-sm w-full md:w-auto">
              <button 
                onClick={() => setActiveView('finance')}
                className={`flex-1 md:flex-none flex items-center justify-center gap-2 md:gap-3 px-4 md:px-8 py-3 rounded-xl md:rounded-2xl text-[10px] md:text-[11px] font-black uppercase transition-all ${activeView === 'finance' ? 'bg-white text-accent shadow-premium' : 'text-text-muted hover:text-accent'}`}
              >
                <PieIcon size={16} /> <span className="whitespace-nowrap">Estado de Cuenta</span>
              </button>
              <button 
                onClick={() => setActiveView('account')}
                className={`flex-1 md:flex-none flex items-center justify-center gap-2 md:gap-3 px-4 md:px-8 py-3 rounded-xl md:rounded-2xl text-[10px] md:text-[11px] font-black uppercase transition-all ${activeView === 'account' ? 'bg-white text-accent shadow-premium' : 'text-text-muted hover:text-accent'}`}
              >
                <UserCheck size={16} /> <span className="whitespace-nowrap">Perfil & Seguridad</span>
              </button>
            </div>
          </div>
        </header>

        {isLoading ? (
          <div className="py-32 flex flex-col items-center justify-center gap-6">
            <div className="size-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
            <p className="text-[10px] font-black text-accent uppercase tracking-widest">Sincronizando Ledger...</p>
          </div>
        ) : activeView === 'finance' ? (
          /* VISTA FINANCIERA */
          <>
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

            <section className="bg-white rounded-[40px] shadow-premium border border-surface-border p-8 md:p-12">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-primary/10 rounded-2xl text-accent shadow-sm border border-primary/10"><FileSpreadsheet size={24} /></div>
                  <h2 className="text-2xl font-black text-accent tracking-tighter uppercase leading-none">Historial de Dividendos</h2>
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
                    {stats.yearData.length > 0 ? stats.yearData.sort((a,b) => findValue(a, ['MES']) - findValue(b, ['MES'])).map((d, i) => {
                      const rentabilidad = parseSheetNumber(findValue(d, ['RENTABILIDAD_MES_PCT']));
                      const utilidad = parseSheetNumber(findValue(d, ['UTILIDAD_NETA_USD']));
                      
                      return (
                        <tr key={i} className="hover:bg-gray-50/50 transition-colors">
                          <td className="px-8 py-5"><span className="text-sm font-black text-accent uppercase">{monthNames[findValue(d, ['MES']) - 1]}</span></td>
                          <td className="px-8 py-5">
                            <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${findValue(d, ['ESTATUS_PAGO']) === 'PAGADO' ? 'bg-green-50 text-green-700 border-green-100' : 'bg-orange-50 text-orange-700 border-orange-100'}`}>
                              {findValue(d, ['ESTATUS_PAGO']) || 'PENDIENTE'}
                            </span>
                          </td>
                          <td className={`px-8 py-5 text-right font-bold ${rentabilidad < 0 ? 'text-red-500' : 'text-text-secondary'}`}>
                            {(rentabilidad * 100).toFixed(2)}%
                          </td>
                          <td className={`px-8 py-5 text-right font-black text-lg ${utilidad < 0 ? 'text-red-500' : 'text-accent'}`}>
                            ${utilidad.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                          </td>
                        </tr>
                      );
                    }) : (
                      <tr><td colSpan={4} className="py-20 text-center text-text-muted font-black uppercase text-xs tracking-widest">Sin registros habilitados</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          </>
        ) : (
          /* VISTA DE CUENTA - REDISEÑO ANCHO COMPLETO */
          <div className="flex flex-col gap-8">
            {/* Información Personal */}
            <div className="bg-white rounded-[40px] shadow-premium border border-surface-border p-8 md:p-12 relative overflow-hidden">
              <div className="flex items-center gap-4 mb-12">
                 <div className="p-3 bg-[#faffd1] rounded-2xl text-accent border border-[#e5ebbc] shadow-sm"><User size={24} /></div>
                 <h2 className="text-2xl font-black text-accent tracking-tighter uppercase leading-none">Información Personal</h2>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                 {/* Formulario Completo */}
                 <div className="lg:col-span-12 grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-1.5">
                       <label className="text-[10px] font-black text-text-muted uppercase tracking-widest ml-1">Nombre Completo</label>
                       <div className="relative">
                          <User className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted/50" size={16} />
                          <input type="text" value={formData.holderName} readOnly className="w-full bg-surface-subtle border border-surface-border rounded-2xl pl-12 pr-4 py-4 text-sm font-bold text-text-muted cursor-not-allowed" />
                       </div>
                    </div>

                    <div className="space-y-1.5">
                       <label className="text-[10px] font-black text-text-muted uppercase tracking-widest ml-1">Correo Electrónico</label>
                       <div className="relative">
                          <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted/50" size={16} />
                          <input type="text" value={formData.email} readOnly className="w-full bg-surface-subtle border border-surface-border rounded-2xl pl-12 pr-4 py-4 text-sm font-bold text-text-muted cursor-not-allowed" />
                       </div>
                    </div>

                    <div className="space-y-1.5">
                       <label className="text-[10px] font-black text-accent uppercase tracking-widest ml-1">Teléfono</label>
                       <div className="relative">
                          <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" size={16} />
                          <input type="text" value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} className="w-full bg-white border border-surface-border rounded-2xl pl-12 pr-4 py-4 text-sm font-bold text-accent focus:border-primary transition-all" placeholder="+57 300 000 0000" />
                       </div>
                    </div>

                    <div className="space-y-1.5">
                       <label className="text-[10px] font-black text-accent uppercase tracking-widest ml-1">Fecha de Nacimiento</label>
                       <div className="relative">
                          <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" size={16} />
                          <input type="date" value={formData.birthDate} onChange={(e) => setFormData({...formData, birthDate: e.target.value})} className="w-full bg-white border border-surface-border rounded-2xl pl-12 pr-4 py-4 text-sm font-bold text-accent focus:border-primary transition-all uppercase" />
                       </div>
                    </div>

                    <div className="space-y-1.5">
                       <label className="text-[10px] font-black text-accent uppercase tracking-widest ml-1">Género</label>
                       <div className="relative">
                          <UsersIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" size={16} />
                          <select value={formData.gender} onChange={(e) => setFormData({...formData, gender: e.target.value})} className="w-full bg-white border border-surface-border rounded-2xl pl-12 pr-10 py-4 text-sm font-bold text-accent appearance-none bg-none focus:border-primary transition-all">
                             <option>Masculino</option><option>Femenino</option><option>Otro</option><option>Prefiero no decir</option>
                          </select>
                          <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" size={16} />
                       </div>
                    </div>

                    <div className="space-y-1.5">
                       <label className="text-[10px] font-black text-accent uppercase tracking-widest ml-1">ID / Documento</label>
                       <div className="relative">
                          <Fingerprint className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" size={16} />
                          <input type="text" value={formData.docNumber} onChange={(e) => setFormData({...formData, docNumber: e.target.value})} className="w-full bg-white border border-surface-border rounded-2xl pl-12 pr-4 py-4 text-sm font-bold text-accent focus:border-primary transition-all" placeholder="ID-000000" />
                       </div>
                    </div>

                    <div className="space-y-1.5 md:col-span-3">
                       <label className="text-[10px] font-black text-accent uppercase tracking-widest ml-1">Dirección de Residencia</label>
                       <div className="relative">
                          <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" size={16} />
                          <input type="text" value={formData.address} onChange={(e) => setFormData({...formData, address: e.target.value})} className="w-full bg-white border border-surface-border rounded-2xl pl-12 pr-4 py-4 text-sm font-bold text-accent focus:border-primary transition-all" placeholder="Av. Principal #123, Distrito Financiero" />
                       </div>
                    </div>
                 </div>
              </div>

              <div className="mt-10 pt-8 border-t border-gray-100 flex flex-col md:flex-row items-center justify-between gap-6">
                 <p className="text-[10px] font-bold text-text-muted uppercase max-w-lg leading-relaxed text-center md:text-left">Gestione su perfil institucional. Estos datos son utilizados para fines de contacto y cumplimiento normativo.</p>
                 <button 
                   onClick={handleUpdatePersonalInfo}
                   disabled={isUpdatingProfile}
                   className={`flex items-center gap-3 px-10 py-4 rounded-2xl font-black text-[11px] uppercase tracking-widest transition-all shadow-xl active:scale-95 ${profileSuccess ? 'bg-green-600 text-white' : 'bg-accent text-primary hover:bg-black'}`}
                 >
                   {isUpdatingProfile ? <RefreshCw size={18} className="animate-spin" /> : profileSuccess ? <CheckCircle2 size={18} /> : <Save size={18} />}
                   {profileSuccess ? 'Guardado con éxito' : 'Guardar Perfil'}
                 </button>
              </div>
            </div>

            {/* Seguridad Maestra (Compacto) */}
            <div className="bg-white rounded-[40px] shadow-premium border border-surface-border p-6 md:p-10 relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-8">
              <div className="flex items-center gap-4 md:gap-6">
                <div className="p-3 md:p-4 bg-accent rounded-2xl text-primary shadow-lg"><Lock className="size-6 md:size-7" /></div>
                <div className="space-y-1">
                  <h3 className="text-lg md:text-xl font-black text-accent tracking-tight uppercase leading-none">Seguridad Maestra</h3>
                  <p className="text-[9px] md:text-[10px] font-black text-text-muted uppercase tracking-widest">Protocolo de Acceso Certificado mediante PIN de 4 Dígitos</p>
                </div>
              </div>
              <button 
                onClick={() => { setPinStep('verify'); setPinBuffer(''); setShowPinChange(true); }}
                className="w-full md:w-auto bg-accent text-white font-black px-8 md:px-10 py-4 rounded-xl flex items-center justify-center gap-3 hover:bg-black transition-all uppercase text-[10px] tracking-widest shadow-md shrink-0"
              >
                <Fingerprint size={18} className="text-primary" />
                Actualizar PIN Maestro
              </button>
            </div>

            {/* REGISTRO DE CANAL PARA DISPERSIÓN DE UTILIDADES - ANCHO COMPLETO */}
            <div className="bg-white rounded-[40px] shadow-premium border border-surface-border p-5 md:p-12 relative overflow-hidden space-y-10">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-[#faffd1] rounded-2xl text-accent border border-[#e5ebbc] shadow-sm"><Wallet size={24} /></div>
                <h2 className="text-xl md:text-2xl font-black text-accent tracking-tighter uppercase leading-none">Registro de Canal para Dispersión de Utilidades</h2>
              </div>

              {/* BANNER DE ADVERTENCIA */}
              <div className="bg-[#fff9f1] border border-[#ffead1] rounded-[24px] p-6 flex items-start gap-5">
                <AlertTriangle className="text-[#f59e0b] shrink-0 mt-0.5" size={28} />
                <div className="space-y-1">
                  <h4 className="text-[11px] font-black text-[#92400e] uppercase tracking-widest">REGISTRO OBLIGATORIO DE MÉTODO DE PAGO</h4>
                  <p className="text-[11px] text-[#b45309] leading-relaxed font-bold">
                    Caishen Capital Group <span className="font-black">solo realizará depósitos a la cuenta internacional, cuenta bancaria o billetera registrada</span> en esta sección oficial. Los datos registrados deben coincidir plenamente con la titularidad legal del socio.
                  </p>
                  <p className="text-[11px] text-[#b45309] font-black underline mt-1">Sin un método validado por el Comité, las solicitudes de liquidación NO PODRÁN SER PROCESADAS.</p>
                </div>
              </div>

              {/* TABS DE MÉTODOS */}
              <div className="grid grid-cols-1 sm:grid-cols-3 md:flex bg-surface-subtle p-1.5 rounded-2xl border border-surface-border w-full md:w-fit gap-1">
                <button 
                  onClick={() => setActiveWithdrawalTab('debit')}
                  className={`flex items-center justify-center gap-2 md:gap-3 px-4 md:px-8 py-3 rounded-xl text-[10px] md:text-[11px] font-black uppercase transition-all ${activeWithdrawalTab === 'debit' ? 'bg-white text-accent shadow-md' : 'text-text-muted hover:text-accent'}`}
                >
                  <Globe size={16} /> <span className="whitespace-nowrap">Cuenta Internacional</span>
                </button>
                <button 
                  onClick={() => setActiveWithdrawalTab('bank')}
                  className={`flex items-center justify-center gap-2 md:gap-3 px-4 md:px-8 py-3 rounded-xl text-[10px] md:text-[11px] font-black uppercase transition-all ${activeWithdrawalTab === 'bank' ? 'bg-white text-accent shadow-md' : 'text-text-muted hover:text-accent'}`}
                >
                  <Landmark size={16} /> <span className="whitespace-nowrap">Cuenta Bancaria</span>
                </button>
                <button 
                  onClick={() => setActiveWithdrawalTab('crypto')}
                  className={`flex items-center justify-center gap-2 md:gap-3 px-4 md:px-8 py-3 rounded-xl text-[10px] md:text-[11px] font-black uppercase transition-all ${activeWithdrawalTab === 'crypto' ? 'bg-white text-accent shadow-md' : 'text-text-muted hover:text-accent'}`}
                >
                  <Bitcoin size={16} /> <span className="whitespace-nowrap">Billetera Crypto</span>
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
                {/* CARD PREVIEW - LATERAL EXPANDIDO */}
                <div className="lg:col-span-5 space-y-6">
                  <div className="relative aspect-[1.6/1] w-full rounded-[24px] md:rounded-[36px] overflow-hidden shadow-2xl group border border-white/5">
                    <div className={`absolute inset-0 transition-all duration-700 ${
                      activeWithdrawalTab === 'crypto' ? 'bg-gradient-to-br from-[#4d3d2c] to-[#1d1c2d]' :
                      activeWithdrawalTab === 'bank' ? 'bg-gradient-to-br from-[#1d1c2d] to-[#43415f]' :
                      'bg-gradient-to-br from-[#2d2c3e] to-[#111827]'
                    }`}></div>
                    
                    {activeWithdrawalTab === 'crypto' && <Bitcoin size={200} className="absolute -right-12 -bottom-12 opacity-[0.04] text-white" />}
                    {activeWithdrawalTab === 'bank' && <Landmark size={200} className="absolute -right-12 -bottom-12 opacity-[0.04] text-white" />}
                    {activeWithdrawalTab === 'debit' && <Globe size={200} className="absolute -right-12 -bottom-12 opacity-[0.04] text-white" />}

                    <div className="relative z-10 p-6 md:p-10 h-full flex flex-col justify-between text-white">
                      <div className="flex justify-between items-start">
                        <div className="flex items-center gap-4">
                          <div className="size-12 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20">
                            {activeWithdrawalTab === 'crypto' ? <Bitcoin size={24} className="text-primary" /> : 
                             activeWithdrawalTab === 'bank' ? <Landmark size={24} className="text-primary" /> : 
                             <Globe size={24} className="text-primary" />}
                          </div>
                          <div>
                             <p className="text-[10px] font-black uppercase tracking-widest text-white/50 leading-none mb-1">{
                               activeWithdrawalTab === 'crypto' ? 'BILLETERA CRYPTO' : 
                               activeWithdrawalTab === 'bank' ? 'CUENTA BANCARIA' : 
                               'CUENTA INTERNACIONAL'
                             }</p>
                             <h3 className="font-black text-xl tracking-tight uppercase leading-none">
                               {activeWithdrawalTab === 'crypto' ? formData.cryptoCurrency : 
                                activeWithdrawalTab === 'bank' ? formData.bankName : 
                                'TRANSFERENCIA SWIFT/IBAN'}
                             </h3>
                          </div>
                        </div>
                        {isStatusActive && (
                          <div className="px-4 py-1.5 bg-primary/20 backdrop-blur-md border border-primary/30 rounded-xl flex items-center gap-2">
                             <ShieldCheck size={14} className="text-primary" />
                             <span className="text-[10px] font-black uppercase tracking-widest text-primary">AUDITADA</span>
                          </div>
                        )}
                      </div>

                      <div className="space-y-5">
                        <div className="space-y-1.5">
                           <span className="text-[9px] uppercase tracking-[0.25em] text-white/30 block ml-1 font-bold">DIRECCIÓN DE DEPÓSITO</span>
                           <div className="bg-black/30 backdrop-blur-sm px-5 py-4 rounded-2xl border border-white/5 flex items-center gap-4 group/box transition-all hover:bg-black/40">
                              <QrCode size={18} className="text-primary/40 group-hover/box:text-primary transition-colors" />
                              <p className="font-mono text-sm tracking-[0.1em] truncate flex-1">
                                {activeWithdrawalTab === 'crypto' ? (formData.walletAddress || 'T9yD14NJ9sW...') : 
                                 (formData.accountNumber || '**** **** **** ****')}
                              </p>
                           </div>
                        </div>
                        <div className="flex justify-between items-end border-t border-white/5 pt-5">
                           <div className="space-y-1">
                              <span className="text-[9px] uppercase tracking-[0.2em] text-white/30 block font-bold">RED / TIPO</span>
                              <p className="font-black text-[12px] uppercase tracking-widest">{activeWithdrawalTab === 'crypto' ? formData.cryptoNetwork : formData.accountType}</p>
                           </div>
                           <div className="text-right space-y-1">
                              <span className="text-[9px] uppercase tracking-[0.2em] text-white/30 block font-bold">PROCEDENCIA</span>
                              <p className="font-black text-[12px] uppercase tracking-widest text-primary">{activeWithdrawalTab === 'crypto' ? (formData.exchange || 'BINANCE') : formData.country}</p>
                           </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* FORMULARIO DE REGISTRO - LATERAL EXPANDIDO */}
                <div className="lg:col-span-7 space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2 md:col-span-2">
                       <label className="text-[10px] font-black text-accent uppercase tracking-widest ml-1">Nombre del Titular</label>
                       <div className="relative">
                          <User className="absolute left-5 top-1/2 -translate-y-1/2 text-text-muted/40" size={18} />
                          <input type="text" value={user.name} readOnly disabled className="w-full bg-surface-subtle border border-surface-border rounded-2xl pl-14 pr-5 py-4 text-sm font-bold text-text-muted cursor-not-allowed shadow-sm opacity-70" />
                       </div>
                    </div>

                    {activeWithdrawalTab !== 'crypto' && (
                      <>
                        <div className="space-y-2">
                           <label className="text-[10px] font-black text-accent uppercase tracking-widest ml-1">Tipo de Identificación</label>
                           <div className="relative">
                             <select value={formData.docType} onChange={(e) => setFormData({...formData, docType: e.target.value})} className="w-full bg-white border border-surface-border rounded-2xl px-5 py-4 text-sm font-bold text-accent appearance-none bg-none focus:border-primary transition-all shadow-sm pr-12">
                               <option>CC</option><option>CE</option><option>Pasaporte</option><option>NIT</option>
                             </select>
                             <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" size={18} />
                           </div>
                        </div>
                        <div className="space-y-2">
                           <label className="text-[10px] font-black text-accent uppercase tracking-widest ml-1">Número de Identificación</label>
                           <input type="text" value={formData.docNumber} onChange={(e) => setFormData({...formData, docNumber: e.target.value})} className="w-full bg-white border border-surface-border rounded-2xl px-5 py-4 text-sm font-bold text-accent focus:border-primary transition-all shadow-sm" placeholder="000.000.000" />
                        </div>
                      </>
                    )}

                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-accent uppercase tracking-widest ml-1">{activeWithdrawalTab === 'crypto' ? 'Criptomoneda' : 'Banco Emisor'}</label>
                       {activeWithdrawalTab === 'crypto' ? (
                         <div className="relative">
                           <select value={formData.cryptoCurrency} onChange={(e) => setFormData({...formData, cryptoCurrency: e.target.value})} className="w-full bg-white border border-surface-border rounded-2xl px-5 py-4 text-sm font-bold text-accent appearance-none bg-none focus:border-primary transition-all shadow-sm pr-12">
                             <option>USDT (Tether)</option><option>USDC (USD Coin)</option><option>BTC (Bitcoin)</option>
                           </select>
                           <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" size={18} />
                         </div>
                       ) : (
                         <input type="text" value={formData.bankName} onChange={(e) => setFormData({...formData, bankName: e.target.value})} className="w-full bg-white border border-surface-border rounded-2xl px-5 py-4 text-sm font-bold text-accent focus:border-primary transition-all shadow-sm" placeholder="Ej. Bancolombia" />
                       )}
                    </div>

                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-accent uppercase tracking-widest ml-1">{activeWithdrawalTab === 'crypto' ? 'Red de Protocolo' : 'Tipo de Cuenta'}</label>
                       {activeWithdrawalTab === 'crypto' ? (
                         <div className="relative">
                           <select value={formData.cryptoNetwork} onChange={(e) => setFormData({...formData, cryptoNetwork: e.target.value})} className="w-full bg-white border border-surface-border rounded-2xl px-5 py-4 text-sm font-bold text-accent appearance-none bg-none focus:border-primary transition-all shadow-sm pr-12">
                             <option>TRC20 (Tron)</option><option>ERC20 (Ethereum)</option><option>BEP20 (BSC)</option><option>POLYGON</option>
                           </select>
                           <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" size={18} />
                         </div>
                       ) : (
                         <input type="text" value={formData.accountType} onChange={(e) => setFormData({...formData, accountType: e.target.value})} className="w-full bg-white border border-surface-border rounded-2xl px-5 py-4 text-sm font-bold text-accent focus:border-primary transition-all shadow-sm" placeholder="Ej. Ahorros" />
                       )}
                    </div>
                  </div>

                  <div className="space-y-2">
                     <label className="text-[10px] font-black text-accent uppercase tracking-widest ml-1">{activeWithdrawalTab === 'crypto' ? 'Identificador de Billetera (Wallet Address)' : 'Número de Cuenta / IBAN / SWIFT'}</label>
                     <div className="relative">
                        <QrCode className="absolute left-5 top-1/2 -translate-y-1/2 text-text-muted/40" size={18} />
                        <input 
                          type="text" 
                          value={activeWithdrawalTab === 'crypto' ? formData.walletAddress : formData.accountNumber} 
                          onChange={(e) => setFormData({...formData, [activeWithdrawalTab === 'crypto' ? 'walletAddress' : 'accountNumber']: e.target.value})} 
                          className="w-full bg-white border border-surface-border rounded-2xl pl-14 pr-5 py-4 text-sm font-bold text-accent focus:border-primary transition-all shadow-sm" 
                          placeholder={activeWithdrawalTab === 'crypto' ? "Péguela aquí desde su Exchange..." : "Ingrese el número de producto..."} 
                        />
                     </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-accent uppercase tracking-widest ml-1">{activeWithdrawalTab === 'crypto' ? 'Proveedor de Custodia (Exchange)' : 'País de Residencia'}</label>
                       <div className="relative">
                          <Globe className="absolute left-5 top-1/2 -translate-y-1/2 text-text-muted/40" size={18} />
                          <input 
                            type="text" 
                            value={activeWithdrawalTab === 'crypto' ? formData.exchange : formData.country} 
                            onChange={(e) => setFormData({...formData, [activeWithdrawalTab === 'crypto' ? 'exchange' : 'country']: e.target.value})} 
                            className="w-full bg-white border border-surface-border rounded-2xl pl-14 pr-5 py-4 text-sm font-bold text-accent focus:border-primary transition-all shadow-sm" 
                            placeholder={activeWithdrawalTab === 'crypto' ? "Ej. Binance, Ledger" : "Ej. Colombia"} 
                          />
                       </div>
                    </div>
                    {activeWithdrawalTab !== 'crypto' && (
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-accent uppercase tracking-widest ml-1">Código SWIFT / BIC (Opcional)</label>
                        <input type="text" value={formData.swiftCode} onChange={(e) => setFormData({...formData, swiftCode: e.target.value})} className="w-full bg-white border border-surface-border rounded-2xl px-5 py-4 text-sm font-bold text-accent focus:border-primary transition-all shadow-sm" placeholder="Opcional" />
                      </div>
                    )}
                  </div>

                  <div className="bg-[#f1f8ff] border border-[#d1e9ff] rounded-[24px] p-6 flex items-start gap-5">
                    <InfoIcon className="text-[#3b82f6] shrink-0 mt-0.5" size={24} />
                    <p className="text-[11px] text-[#1e40af] font-bold leading-relaxed">
                      <span className="font-black">Verificación de Protocolo:</span> Asegúrese de seleccionar la red correspondiente al activo enviado. La selección errónea de red en dispersiones crypto resultará en la <span className="text-red-600">pérdida irreversible de fondos</span>.
                    </p>
                  </div>
                  
                  <div className="flex justify-end pt-4">
                     <button 
                       onClick={() => setShowConfirm(true)}
                       disabled={isSavingAccount || (activeWithdrawalTab === 'crypto' ? !formData.walletAddress : !formData.accountNumber)}
                       className="flex items-center gap-4 px-12 py-5 bg-accent text-primary rounded-2xl font-black text-[12px] uppercase tracking-[0.2em] shadow-2xl hover:bg-black transition-all disabled:opacity-30 active:scale-95 group"
                     >
                       {isSavingAccount ? <RefreshCw size={20} className="animate-spin" /> : <Save size={20} className="group-hover:scale-110 transition-transform" />}
                       Registrar Canal Oficial
                     </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* MODALES */}
      {showPinChange && (
        <div className="fixed inset-0 z-[1100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-accent/80 backdrop-blur-md animate-in fade-in duration-300" onClick={() => !isUpdatingPin && setShowPinChange(false)} />
          <div className={`relative w-full max-w-sm bg-white rounded-[40px] shadow-2xl p-10 flex flex-col items-center animate-in zoom-in-95 ${pinError ? 'animate-shake' : ''}`}>
            {!isUpdatingPin && !successPinChange && <button onClick={() => setShowPinChange(false)} className="absolute top-6 right-6 text-text-muted hover:bg-gray-100 rounded-full p-2"><X size={20} /></button>}
            <div className={`size-20 ${successPinChange ? 'bg-green-500' : 'bg-accent'} rounded-[24px] flex items-center justify-center text-primary shadow-2xl mb-6`}>
              {successPinChange ? <CheckCircle2 size={32} className="text-white" /> : <KeyRound size={32} />}
            </div>
            {successPinChange ? (
              <div className="text-center">
                <h3 className="text-xl font-black text-accent uppercase tracking-tighter mb-1">PIN Actualizado</h3>
                <p className="text-[10px] text-green-600 font-black uppercase tracking-widest">Sincronización con Ledger Exitosa</p>
              </div>
            ) : (
              <>
                <h3 className="text-xl font-black text-accent uppercase tracking-tighter mb-1">
                  {pinStep === 'verify' ? 'PIN Actual' : pinStep === 'new' ? 'Nuevo PIN' : 'Confirmar PIN'}
                </h3>
                <p className="text-[10px] text-text-secondary font-black uppercase tracking-widest mb-8 text-center px-4 leading-relaxed">
                  {pinStep === 'verify' ? 'Valide su identidad' : pinStep === 'new' ? 'Defina sus 4 dígitos' : 'Repita su nuevo PIN'}
                </p>
                <div className="flex justify-center gap-3 mb-10 min-h-[56px]">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className={`size-14 rounded-2xl border-2 flex items-center justify-center transition-all ${pinBuffer.length > i ? 'border-primary bg-primary/5' : 'border-surface-border'}`}>
                      {pinBuffer.length > i && <div className="size-3 bg-accent rounded-full animate-in zoom-in" />}
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-3 gap-3 w-full mb-6">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                    <button key={num} onClick={() => handlePinDigit(num.toString())} className="h-16 rounded-2xl bg-surface-subtle text-accent font-black text-xl hover:bg-primary transition-all active:scale-95 disabled:opacity-50" disabled={isUpdatingPin}>{num}</button>
                  ))}
                  <button onClick={() => setPinBuffer(prev => prev.slice(0, -1))} className="h-16 rounded-2xl bg-red-50 text-red-600 font-black text-[10px] uppercase tracking-widest" disabled={isUpdatingPin}>Del</button>
                  <button onClick={() => handlePinDigit('0')} className="h-16 rounded-2xl bg-surface-subtle text-accent font-black text-xl hover:bg-primary transition-all active:scale-95" disabled={isUpdatingPin}>0</button>
                  <button 
                    onClick={confirmPinUpdate} 
                    disabled={isUpdatingPin || pinBuffer.length < 4} 
                    className="h-16 rounded-2xl bg-accent text-primary font-black text-[10px] uppercase tracking-widest active:scale-95 disabled:opacity-30"
                  >
                    {isUpdatingPin ? <RefreshCw className="animate-spin" size={20} /> : 'OK'}
                  </button>
                </div>
                {pinError && <p className="text-red-600 text-[10px] font-black uppercase tracking-widest">{pinError}</p>}
              </>
            )}
          </div>
        </div>
      )}

      {showConfirm && (
        <div className="fixed inset-0 z-[1100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-accent/80 backdrop-blur-md animate-in fade-in duration-300" onClick={() => setShowConfirm(false)} />
          <div className="relative w-full max-w-sm bg-white rounded-[40px] p-10 flex flex-col items-center text-center animate-in zoom-in-95">
            <div className="size-20 bg-primary/10 rounded-3xl flex items-center justify-center text-accent shadow-sm border border-primary/20 mb-6"><ShieldCheck size={40} /></div>
            <h3 className="text-xl font-black text-accent uppercase tracking-tighter mb-2">Confirmar Registro Maestro</h3>
            <p className="text-text-secondary text-xs font-medium leading-relaxed mb-8">Este canal será vinculado de forma permanente para la dispersión de utilidades. ¿Desea proceder?</p>
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
            <h3 className="text-xl font-black text-accent uppercase tracking-tighter mb-2">Solicitud Enviada</h3>
            <p className="text-text-secondary text-xs font-medium leading-relaxed mb-8">Su petición ha sido registrada para validación técnica por el Comité de Cumplimiento.</p>
            <button onClick={() => setShowRequestSuccess(false)} className="w-full py-4 bg-accent text-white font-black text-[10px] uppercase tracking-widest rounded-2xl">Finalizar Gestión</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ShareholderProfile;
