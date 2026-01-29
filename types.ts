
export interface Asset {
  id: string;
  name: string;
  category: 'Forex' | 'Acciones' | 'Cripto' | 'Inmobiliario' | 'Algorítmico' | 'Derivados';
  quantity: string;
  currentValue: number;
  return: number;
  status: 'Abierta' | 'Cerrada' | 'Pendiente';
  symbol?: string;
}

export interface Transaction {
  id: string;
  type: 'Inyección' | 'Retiro' | 'Dividendo' | 'Transferencia';
  amount: number;
  date: string;
  status: 'Completado' | 'Pendiente' | 'Fallido';
  description: string;
}

export interface ReportSection {
  title: string;
  content: string;
  items?: string[];
}

export interface Report {
  id: string;
  title: string;
  date: string;
  category: 'Mensual' | 'Trimestral' | 'Auditoría' | 'Estrategia' | 'Normativa' | 'Resumen Ejecutivo' | 'Riesgos y Mitigación';
  summary: string;
  highlight?: string;
  sections?: ReportSection[];
}

export interface CorporateNotice {
  id: string;
  title: string;
  date: string;
  description: string;
  type: 'Urgent' | 'Info' | 'Success';
  fullContent: string;
}

export interface User {
  id: string;
  name: string;
  role: string;
  memberSince: string;
  avatarUrl: string;
}

export interface Shareholder {
  id: string;
  userId: string;
  name: string;
  email: string;
  status: string;
  shares: number;
  shareClass: string;
  initials: string;
  color: string;
}

export interface AdminNotification {
  id: string;
  event: 'Transacción' | 'Rentabilidad' | 'Mercado' | 'Sistema' | 'Auditoría';
  description: string;
  origin: 'Automática' | 'Administrador' | 'Sistema';
  impact: 'Crítico' | 'Relevante' | 'Informativo';
  timestamp: string;
  status: 'Emitida' | 'Confirmada' | 'Archivada';
}
