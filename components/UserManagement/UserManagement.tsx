
import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Filter, 
  ChevronDown, 
  ShieldCheck, 
  Mail, 
  Lock, 
  X, 
  AlertCircle,
  PlusCircle,
  EyeOff,
  Shield
} from 'lucide-react';
import ShareholderProfile from './ShareholderProfile';

// MOCK_USERS con PIN único reasignado por seguridad
const MOCK_USERS = [
  { id: 'admin-01', uid: '#ADM-001', name: 'Caishen Capital Group', email: 'corporativo@caishencapital.com', role: 'Super Admin', status: 'Activo', initials: 'CCG', color: 'bg-accent text-primary', shares: 300, pin: '8888' },
  { id: 'usr-220', uid: '#USR-220', name: 'Isabella Beron Garcia', email: 'i.beron@inversion.com', role: 'Accionista Preferente', status: 'Activo', initials: 'IB', color: 'bg-pink-100 text-pink-700', shares: 100, pin: '4927' },
  { id: 'usr-008', uid: '#USR-008', name: 'Juan Andres Suarez Zuluaga', email: 'j.suarez@caishencapital.com', role: 'Accionista', status: 'Activo', initials: 'JS', color: 'bg-blue-100 text-blue-700', shares: 20, pin: '3159' },
  { id: 'usr-202', uid: '#USR-202', name: 'María Fernanda Ríos', email: 'm.rios@finanzas.net', role: 'Accionista', status: 'Activo', initials: 'MR', color: 'bg-purple-100 text-purple-700', shares: 5, pin: '6284' },
  { id: 'usr-203', uid: '#USR-203', name: 'Santiago Herrera', email: 's.herrera@partners.com', role: 'Accionista', status: 'Activo', initials: 'SH', color: 'bg-green-100 text-green-700', shares: 5, pin: '1735' },
  { id: 'usr-204', uid: '#USR-204', name: 'Valentina Pardo', email: 'v.pardo@capital.io', role: 'Accionista', status: 'Activo', initials: 'VP', color: 'bg-orange-100 text-orange-700', shares: 5, pin: '5942' },
  { id: 'usr-205', uid: '#USR-205', name: 'Camilo Ortega', email: 'c.ortega@wealth.com', role: 'Accionista', status: 'Activo', initials: 'CO', color: 'bg-pink-100 text-pink-700', shares: 5, pin: '8316' },
  { id: 'usr-206', uid: '#USR-206', name: 'Daniela Cárdenas', email: 'd.cardenas@growth.com', role: 'Accionista', status: 'Activo', initials: 'DC', color: 'bg-teal-100 text-teal-700', shares: 5, pin: '2691' },
  { id: 'usr-207', uid: '#USR-207', name: 'Nicolás Vega', email: 'n.vega@invest.net', role: 'Accionista', status: 'Activo', initials: 'NV', color: 'bg-yellow-100 text-yellow-700', shares: 5, pin: '4073' },
  { id: 'usr-208', uid: '#USR-208', name: 'Laura Sofía Medina', email: 'l.medina@portfolio.com', role: 'Accionista', status: 'Activo', initials: 'LM', color: 'bg-indigo-100 text-indigo-700', shares: 5, pin: '9514' },
  { id: 'usr-209', uid: '#USR-209', name: 'Andrés Felipe Salazar', email: 'a.salazar@equity.com', role: 'Accionista', status: 'Activo', initials: 'AS', color: 'bg-rose-100 text-rose-700', shares: 5, pin: '3826' },
  { id: 'usr-210', uid: '#USR-210', name: 'Catalina Gómez', email: 'c.gomez@legacy.com', role: 'Accionista', status: 'Activo', initials: 'CG', color: 'bg-slate-100 text-slate-700', shares: 5, pin: '7149' },
  { id: 'usr-211', uid: '#USR-211', name: 'Felipe Restrepo', email: 'f.restrepo@global.com', role: 'Accionista', status: 'Activo', initials: 'FR', color: 'bg-cyan-100 text-cyan-700', shares: 5, pin: '5382' },
  { id: 'usr-212', uid: '#USR-212', name: 'Paula Andrea Torres', email: 'p.torres@asset.com', role: 'Accionista', status: 'Activo', initials: 'PT', color: 'bg-lime-100 text-lime-700', shares: 4, pin: '1964' },
  { id: 'usr-213', uid: '#USR-213', name: 'Sebastián Quintero', email: 's.quintero@capital.io', role: 'Accionista', status: 'Activo', initials: 'SQ', color: 'bg-emerald-100 text-emerald-700', shares: 4, pin: '4271' },
  { id: 'usr-214', uid: '#USR-214', name: 'Juliana Castro', email: 'j.castro@inversion.net', role: 'Accionista', status: 'Activo', initials: 'JC', color: 'bg-violet-100 text-violet-700', shares: 4, pin: '6835' },
  { id: 'usr-215', uid: '#USR-215', name: 'Mateo Arboleda', email: 'm.arboleda@funds.com', role: 'Accionista', status: 'Activo', initials: 'MA', color: 'bg-fuchsia-100 text-fuchsia-700', shares: 4, pin: '9157' },
  { id: 'usr-216', uid: '#USR-216', name: 'Manuela Jiménez', email: 'm.jimenez@wealth.net', role: 'Accionista', status: 'Activo', initials: 'MJ', color: 'bg-sky-100 text-sky-700', shares: 4, pin: '2408' },
  { id: 'usr-217', uid: '#USR-217', name: 'Tomás Aguirre', email: 't.aguirre@invest.io', role: 'Accionista', status: 'Activo', initials: 'TA', color: 'bg-amber-100 text-amber-700', shares: 4, pin: '5723' },
  { id: 'usr-218', uid: '#USR-218', name: 'Carolina Muñoz', email: 'c.munoz@partner.com', role: 'Accionista', status: 'Activo', initials: 'CM', color: 'bg-red-100 text-red-700', shares: 3, pin: '8041' },
  { id: 'usr-219', uid: '#USR-219', name: 'Esteban Ramírez', email: 'e.ramirez@growth.io', role: 'Accionista', status: 'Activo', initials: 'ER', color: 'bg-gray-200 text-gray-700', shares: 3, pin: '3596' },
];

const UserManagement: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('Todos los Estados');
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [pendingUser, setPendingUser] = useState<any | null>(null);
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);

  const filteredUsers = useMemo(() => {
    const basicFiltered = MOCK_USERS.filter(user => {
      const matchesSearch = 
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.uid.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = 
        statusFilter === 'Todos los Estados' || 
        (statusFilter === 'Activos' && user.status === 'Activo') ||
        (statusFilter === 'Inactivos' && user.status === 'Inactivo') ||
        (statusFilter === 'Pendientes' && user.status === 'Pendiente');

      return matchesSearch && matchesStatus;
    });

    return basicFiltered.sort((a, b) => {
      if (a.id === 'admin-01') return -1;
      if (b.id === 'admin-01') return 1;
      return a.name.localeCompare(b.name);
    });
  }, [searchTerm, statusFilter]);

  const handleRequestAccess = (user: any) => {
    setPendingUser(user);
    setIsVerifying(true);
    setPin('');
    setError(false);
  };

  const handleVerifyPin = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
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

  const handleRequestShares = () => {
    window.open('https://caishencapital.co/producto/acciones-minoritarias/', '_blank');
  };

  const maskEmail = (email: string) => {
    const [user, domain] = email.split('@');
    return `${user.charAt(0)}••••@••••${domain.substring(domain.lastIndexOf('.'))}`;
  };

  const maskUID = (uid: string) => {
    return uid.substring(0, 5) + '•••';
  };

  if (selectedUser) {
    return <ShareholderProfile user={selectedUser} onBack={() => setSelectedUser(null)} />;
  }

  return (
    <div className="p-8 lg:p-10 space-y-8 animate-in fade-in duration-700">
      <header className="flex flex-col md:flex-row md:items-start justify-between gap-6 border-b border-surface-border pb-8">
        <div className="space-y-1">
          <h2 className="text-3xl md:text-4xl font-black text-accent tracking-tighter uppercase leading-none">Gestión de Accionistas</h2>
          <p className="text-text-secondary text-sm md:text-base font-medium">Panel de control administrativo y supervisión de perfiles institucionales.</p>
        </div>

        <div className="flex flex-col items-center md:items-end gap-3 self-center md:self-start">
          <button 
            onClick={handleRequestShares}
            className="group flex items-center gap-3 bg-primary hover:bg-primary-hover text-accent font-black px-10 py-4 rounded-2xl transition-all shadow-premium hover:-translate-y-1 active:scale-95 uppercase text-xs tracking-widest"
          >
            <PlusCircle size={20} className="transition-transform group-hover:rotate-90" />
            SOLICITAR ACCIONES
          </button>
          <div className="flex items-center gap-2 px-4 py-1.5 bg-surface-subtle border border-surface-border rounded-xl">
             <Shield size={12} className="text-accent" />
             <span className="text-[10px] text-text-muted font-black uppercase tracking-widest">Protección de Datos Activa</span>
          </div>
        </div>
      </header>

      <div className="bg-white border border-surface-border rounded-2xl p-5 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
          <div className="md:col-span-8 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted size-5" />
            <input 
              className="w-full pl-10 pr-4 py-3 rounded-xl border-surface-border text-sm focus:border-accent focus:ring-accent text-accent placeholder:text-text-muted bg-surface-subtle/50 font-medium transition-all" 
              placeholder="Buscar Socio por criterios de identidad..." 
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="md:col-span-4 relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted size-4" />
            <select 
              className="w-full pl-10 pr-8 py-3 rounded-xl border-surface-border text-sm focus:border-accent focus:ring-accent text-accent bg-surface-subtle/50 appearance-none cursor-pointer font-bold transition-all"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option>Todos los Estados</option>
              <option>Activos</option>
              <option>Inactivos</option>
              <option>Pendientes</option>
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
                <th className="px-8 py-5 w-24">ID Privado</th>
                <th className="px-8 py-5">Identidad / Perfil</th>
                <th className="px-8 py-5 text-center">Estatus Operativo</th>
                <th className="px-8 py-5 text-center">Seguridad / Acceso</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-border">
              {filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-surface-subtle/20 transition-colors group">
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-text-muted/60">{maskUID(user.uid)}</span>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <button 
                      onClick={() => handleRequestAccess(user)}
                      className="flex items-center gap-4 text-left hover:opacity-80 group/name"
                    >
                      <div className={`size-12 rounded-2xl ${user.color} flex items-center justify-center font-black text-sm shadow-sm group-hover/name:ring-4 group-hover/name:ring-primary/20 transition-all`}>
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
                    <span className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-[9px] font-black border shadow-sm uppercase tracking-widest ${
                      user.status === 'Activo' ? 'bg-green-50 text-green-700 border-green-100' :
                      user.status === 'Inactivo' ? 'bg-red-50 text-red-700 border-red-100' :
                      'bg-yellow-50 text-yellow-700 border-yellow-100'
                    }`}>
                      <span className={`size-1.5 rounded-full ${user.status === 'Activo' ? 'bg-green-500 animate-pulse' : 'bg-current'}`}></span>
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
          <div className={`relative w-full max-w-sm bg-white rounded-[40px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 border border-white/20 ${error ? 'animate-bounce' : ''}`}>
            <div className="p-10 text-center space-y-8">
              <div className="mx-auto size-20 bg-accent rounded-[24px] flex items-center justify-center text-primary shadow-2xl border border-primary/20">
                <ShieldCheck size={40} />
              </div>
              <div className="space-y-3">
                <h3 className="text-2xl font-black text-accent tracking-tighter uppercase">Verificación de Identidad</h3>
                <p className="text-xs text-text-secondary font-medium px-4 leading-relaxed">
                  Confirma la credencial única de acceso asignada a <span className="font-bold text-accent">{pendingUser?.name}</span>.
                </p>
              </div>
              <form onSubmit={handleVerifyPin} className="space-y-6">
                <div className="relative group">
                  <input 
                    autoFocus
                    type="password"
                    maxLength={4}
                    value={pin}
                    onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                    className={`w-full bg-surface-subtle border-2 text-center text-4xl font-black tracking-[0.8em] py-5 rounded-[24px] focus:ring-0 transition-all ${
                      error ? 'border-red-500 text-red-600' : 'border-surface-border focus:border-primary text-accent'
                    }`}
                    placeholder="••••"
                  />
                  {error && (
                    <div className="absolute -bottom-8 left-0 right-0 flex items-center justify-center gap-1.5 text-[11px] font-black text-red-600 uppercase tracking-widest animate-in slide-in-from-top-1">
                      <AlertCircle size={14} />
                      <span>PIN Incorrecto para este Usuario</span>
                    </div>
                  )}
                </div>
                <div className="pt-6 grid grid-cols-2 gap-4">
                  <button type="button" onClick={() => setIsVerifying(false)} className="px-6 py-4 rounded-2xl text-xs font-black text-text-muted hover:bg-gray-100 transition-all uppercase tracking-widest">Cancelar</button>
                  <button type="submit" className="px-6 py-4 rounded-2xl bg-accent text-primary font-black text-xs uppercase tracking-widest shadow-xl hover:shadow-primary/20 hover:-translate-y-1 transition-all active:scale-95">Autorizar</button>
                </div>
              </form>
            </div>
            <button onClick={() => setIsVerifying(false)} className="absolute top-6 right-6 p-2 text-text-muted hover:text-accent transition-colors"><X size={24} /></button>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;
