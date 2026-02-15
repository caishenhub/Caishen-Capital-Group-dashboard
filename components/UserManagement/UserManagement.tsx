
import React, { useState, useMemo, useEffect } from 'react';
import { 
  Search, 
  Filter, 
  ChevronDown, 
  ShieldCheck, 
  X, 
  AlertCircle,
  PlusCircle,
  EyeOff,
  Shield,
  RefreshCw,
  Lock,
  Database
} from 'lucide-react';
import ShareholderProfile from './ShareholderProfile';
import { fetchTableData, findValue, parseSheetNumber } from '../../lib/googleSheets';

const UserManagement: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('Todos los Estados');
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [pendingUser, setPendingUser] = useState<any | null>(null);
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);
  
  const [users, setUsers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const loadData = async () => {
    setIsLoading(true);
    setFetchError(null);
    try {
      const data = await fetchTableData('LIBRO_ACCIONISTAS');
      
      if (!data || data.length === 0) {
        setFetchError("El registro en la nube está vacío o no es accesible.");
        setUsers([]);
        return;
      }

      const mapped = data.map((u, idx) => {
        // Mapeo basado estrictamente en las cabeceras oficiales proporcionadas
        const uid = String(findValue(u, ['UID_SOCIO']) || '').trim();
        const name = String(findValue(u, ['NOMBRE_COMPLETO']) || 'Socio Institucional');
        const email = String(findValue(u, ['EMAIL_SOCIO']) || '---');
        const status = String(findValue(u, ['ESTATUS_SOCIO']) || 'Activo');
        const shares = parseSheetNumber(findValue(u, ['ACCIONES_POSEIDAS']));
        const pin = String(findValue(u, ['PIN_ACCESO']) || '0000');
        const registrationDate = findValue(u, ['FECHA_INGRESO']) || null;
        
        const initials = name.split(' ').filter(n => n).map(n => n[0]).join('').substring(0, 2).toUpperCase();

        return {
          id: `row-${idx}`,
          uid,
          name,
          email,
          role: 'Accionista', // Valor por defecto ya que no está en la lista de columnas
          status,
          shares,
          pin,
          registrationDate,
          initials: initials || 'S',
          color: idx % 2 === 0 ? 'bg-accent text-primary' : 'bg-primary/10 text-accent',
          raw: u
        };
      }).filter(u => u.uid !== ''); 

      setUsers(mapped);
    } catch (e) {
      console.error("Error sincronizando padrón:", e);
      setFetchError("Fallo de comunicación con la nube institucional.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 120000);
    return () => clearInterval(interval);
  }, []);

  const filteredUsers = useMemo(() => {
    return users.filter(user => {
      const matchesSearch = 
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.uid.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = 
        statusFilter === 'Todos los Estados' || 
        user.status.toLowerCase() === statusFilter.toLowerCase();

      return matchesSearch && matchesStatus;
    }).sort((a, b) => a.name.localeCompare(b.name));
  }, [searchTerm, statusFilter, users]);

  const handleRequestAccess = (user: any) => {
    setPendingUser(user);
    setIsVerifying(true);
    setPin('');
    setError(false);
  };

  const addDigit = (digit: string) => {
    if (pin.length < 4) setPin(prev => prev + digit);
  };

  const removeDigit = () => {
    setPin(prev => prev.slice(0, -1));
  };

  const handleVerifyPin = () => {
    if (pendingUser && pin === pendingUser.pin) {
      setSelectedUser(pendingUser);
      setIsVerifying(false);
      setPendingUser(null);
      setPin('');
    } else {
      setError(true);
      setPin('');
      setTimeout(() => setError(false), 2000);
    }
  };

  useEffect(() => {
    if (!isVerifying) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (/^[0-9]$/.test(e.key)) addDigit(e.key);
      else if (e.key === 'Backspace') removeDigit();
      else if (e.key === 'Enter' && pin.length === 4) handleVerifyPin();
      else if (e.key === 'Escape') setIsVerifying(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isVerifying, pin, pendingUser]);

  const maskEmail = (email: string) => {
    if (!email.includes('@')) return '---';
    const [user, domain] = email.split('@');
    return `${user.charAt(0)}••••@••••${domain.substring(domain.lastIndexOf('.'))}`;
  };

  const maskUid = (uid: string) => {
    if (!uid) return '***';
    if (uid.includes('-')) {
      const parts = uid.split('-');
      return `${parts[0]}-***`;
    }
    return '***';
  };

  if (selectedUser) {
    return <ShareholderProfile user={selectedUser} onBack={() => setSelectedUser(null)} />;
  }

  return (
    <div className="p-8 lg:p-10 space-y-8 animate-in fade-in duration-700">
      <header className="flex flex-col md:flex-row md:items-start justify-between gap-6 border-b border-surface-border pb-8">
        <div className="space-y-1">
          <h2 className="text-3xl md:text-4xl font-black text-accent tracking-tighter uppercase leading-none">Libro de Accionistas</h2>
          <p className="text-text-secondary text-sm md:text-base font-medium">Registro central protegido por protocolos de privacidad corporativa.</p>
        </div>

        <div className="flex flex-col items-center md:items-end gap-3 self-center md:self-start">
          <button 
            onClick={() => window.open('https://caishencapitalgroup.com/producto/acciones-minoritarias/', '_blank')}
            className="group flex items-center gap-3 bg-primary hover:bg-primary-hover text-accent font-black px-10 py-4 rounded-2xl transition-all shadow-premium hover:-translate-y-1 active:scale-95 uppercase text-xs tracking-widest"
          >
            <PlusCircle size={20} className="transition-transform group-hover:rotate-90" />
            SOLICITAR ACCIONES
          </button>
          
          <button 
            onClick={loadData}
            disabled={isLoading}
            className="flex items-center gap-3 px-8 py-3.5 bg-white border border-surface-border rounded-full hover:shadow-premium transition-all active:scale-95 text-accent group cursor-pointer"
          >
            <div className="relative flex size-2.5">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75 ${!isLoading ? 'duration-1000' : 'duration-300'}`}></span>
              <span className="relative inline-flex rounded-full size-2.5 bg-primary shadow-[0_0_8px_rgba(206,255,4,0.6)]"></span>
            </div>
            <span className="text-[10px] font-black text-accent uppercase tracking-widest leading-none">
              {isLoading ? 'Sincronizando...' : 'Nube Institucional'}
            </span>
          </button>
        </div>
      </header>

      {fetchError && (
        <div className="bg-red-50 border-2 border-red-100 p-6 rounded-[32px] flex items-center gap-4 animate-in slide-in-from-top-2">
          <AlertCircle className="text-red-600 size-8" />
          <div className="space-y-1">
            <h4 className="text-red-900 font-black uppercase text-xs tracking-widest">Error de Sincronización</h4>
            <p className="text-red-700 text-sm font-medium">{fetchError}</p>
          </div>
          <button onClick={loadData} className="ml-auto px-4 py-2 bg-red-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest">Reintentar</button>
        </div>
      )}

      <div className="bg-white border border-surface-border rounded-2xl p-5 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
          <div className="md:col-span-8 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted size-5" />
            <input 
              className="w-full pl-10 pr-4 py-3 rounded-xl border-surface-border text-sm focus:border-accent focus:ring-accent text-accent placeholder:text-text-muted bg-surface-subtle/50 font-medium transition-all" 
              placeholder="Buscar Socio por Nombre o ID..." 
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="md:col-span-4 relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted size-4" />
            <select 
              className="w-full pl-10 pr-8 py-3 rounded-xl border-surface-border text-sm focus:border-accent focus:ring-accent text-accent bg-surface-subtle/50 appearance-none bg-none cursor-pointer font-bold transition-all"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option>Todos los Estados</option>
              <option>Activo</option>
              <option>Inactivo</option>
              <option>Pendiente</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-text-muted size-4" />
          </div>
        </div>
      </div>

      <div className="bg-white border border-surface-border rounded-[32px] overflow-hidden shadow-premium">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[700px]">
            <thead>
              <tr className="bg-surface-subtle/50 text-text-muted text-[10px] uppercase tracking-[0.2em] font-black border-b border-surface-border">
                <th className="px-8 py-5 w-24 text-center">ID</th>
                <th className="px-8 py-5">Identidad / Perfil</th>
                <th className="px-8 py-5 text-center">Acciones</th>
                <th className="px-8 py-5 text-center">Estatus</th>
                <th className="px-8 py-5 text-center">Acceso</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-border">
              {isLoading && users.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-24 text-center">
                    <div className="flex flex-col items-center gap-4">
                      <RefreshCw className="animate-spin text-primary" size={40} />
                      <p className="text-xs font-black text-accent uppercase tracking-widest">Consultando Ledger Institucional...</p>
                    </div>
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-20 text-center text-text-muted">
                    <Database size={48} className="mx-auto mb-4 opacity-10" />
                    <p className="text-xs font-black uppercase tracking-widest">Sin registros encontrados</p>
                  </td>
                </tr>
              ) : filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-surface-subtle/20 transition-colors group">
                  <td className="px-8 py-6 text-center">
                    <span className="text-xs font-mono font-bold text-text-muted/60">
                      {maskUid(user.uid)}
                    </span>
                  </td>
                  <td className="px-8 py-6">
                    <button 
                      onClick={() => handleRequestAccess(user)}
                      className="flex items-center gap-4 text-left hover:opacity-80 group/name"
                    >
                      <div className={`size-12 rounded-2xl ${user.color} flex items-center justify-center font-black text-sm shadow-sm group-hover/name:ring-4 group-hover/name:ring-primary/20 transition-all uppercase`}>
                        {user.initials}
                      </div>
                      <div>
                        <div className="text-sm font-black text-accent group-hover/name:text-primary transition-colors">{user.name}</div>
                        <div className="text-[10px] text-text-muted font-bold flex items-center gap-1.5 mt-0.5">
                          <EyeOff size={10} className="text-accent/40" /> {maskEmail(user.email)}
                        </div>
                      </div>
                    </button>
                  </td>
                  <td className="px-8 py-6 text-center">
                    <div className="text-base font-black text-accent tracking-widest">***</div>
                    <div className="text-[9px] font-bold text-text-muted uppercase">Protegidas</div>
                  </td>
                  <td className="px-8 py-6 text-center">
                    <span className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-[9px] font-black border shadow-sm uppercase tracking-widest ${
                      user.status.toLowerCase() === 'activo' ? 'bg-green-50 text-green-700 border-green-100' :
                      user.status.toLowerCase() === 'inactivo' ? 'bg-red-50 text-red-700 border-red-100' :
                      'bg-yellow-50 text-yellow-700 border-yellow-100'
                    }`}>
                      <span className={`size-1.5 rounded-full ${user.status.toLowerCase() === 'activo' ? 'bg-green-500 animate-pulse' : 'bg-current'}`}></span>
                      {user.status}
                    </span>
                  </td>
                  <td className="px-8 py-6 text-center">
                    <button 
                      onClick={() => handleRequestAccess(user)}
                      className="inline-flex items-center gap-2 px-5 py-2.5 bg-accent text-white hover:bg-accent/90 rounded-2xl transition-all shadow-md hover:-translate-y-0.5 group/btn"
                    >
                      <Lock size={14} className="text-primary group-hover/btn:scale-110 transition-transform" />
                      <span className="text-[10px] font-black uppercase tracking-widest">Ver Perfil</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {isVerifying && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-accent/80 backdrop-blur-md animate-in fade-in duration-300" onClick={() => setIsVerifying(false)} />
          <div className={`relative w-full max-w-sm bg-white rounded-[40px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 border border-white/20 ${error ? 'animate-shake' : ''}`}>
            
            <button 
              onClick={() => setIsVerifying(false)}
              className="absolute top-6 right-6 p-2 text-text-muted hover:bg-gray-100 rounded-full transition-all"
            >
              <X size={20} />
            </button>

            <div className="p-10 text-center">
              <div className="mx-auto size-20 bg-accent rounded-[24px] flex items-center justify-center text-primary shadow-2xl border border-primary/20 mb-6">
                <ShieldCheck size={40} />
              </div>
              <div className="space-y-2 mb-8">
                <h3 className="text-2xl font-black text-accent tracking-tighter uppercase">Verificación Privada</h3>
                <p className="text-[10px] text-text-secondary font-black uppercase tracking-widest">
                  Código de acceso para <span className="text-accent">{pendingUser?.name}</span>
                </p>
              </div>

              <div className="flex justify-center gap-3 mb-10">
                {[0, 1, 2, 3].map((i) => (
                  <div 
                    key={i} 
                    className={`size-14 rounded-2xl border-2 flex items-center justify-center transition-all ${
                      pin.length > i ? 'border-primary bg-primary/5 shadow-sm' : 'border-surface-border'
                    } ${error ? 'border-red-500 bg-red-50' : ''}`}
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
                  onClick={handleVerifyPin}
                  disabled={pin.length !== 4}
                  className={`h-16 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all active:scale-95 shadow-sm flex items-center justify-center ${
                    pin.length === 4 
                    ? 'bg-accent text-primary' 
                    : 'bg-surface-subtle text-text-muted opacity-50'
                  }`}
                >
                  OK
                </button>
              </div>

              {error && (
                <div className="flex items-center justify-center gap-1.5 text-[11px] font-black text-red-600 uppercase tracking-widest animate-in slide-in-from-top-1">
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

export default UserManagement;
