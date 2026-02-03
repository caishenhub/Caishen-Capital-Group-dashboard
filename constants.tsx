
import { Asset, Transaction, Report, User, CorporateNotice, AdminNotification } from './types';
import { supabase } from './lib/supabase';

// --- CONFIGURACIÓN GOOGLE INTEGRATION ---
export const GOOGLE_CONFIG = {
  // URL del Web App de Google Apps Script proporcionada por el usuario
  SCRIPT_API_URL: 'https://script.google.com/macros/s/AKfycbyJwdqsA0fTS7HB4BAMWTO7_gogMAq1SzdvDJOAUg8tWA5G3dqpm7m4LBTwRdzDHVAY/exec',
  TAB_NAME: 'Hoja1'
};

// --- SISTEMA DE PERSISTENCIA SEGMENTADA ---
export const getStoredYield = (year: number, month: number) => {
  const saved = localStorage.getItem(`YIELD_${year}_${month}`);
  if (saved) return parseFloat(saved);
  const history = FINANCIAL_HISTORY[year];
  return history ? history[month] / 100 : 0;
};

export const getPayoutStatus = (year: number, month: number): 'PENDING' | 'PAID' => {
  const status = localStorage.getItem(`PAYOUT_STATUS_${year}_${month}`);
  if (status) return status as 'PENDING' | 'PAID';
  if (year < 2026) return 'PAID';
  return 'PENDING';
};

export const adminSetYield = async (year: number, month: number, yieldValue: number) => {
  localStorage.setItem(`YIELD_${year}_${month}`, yieldValue.toString());
  window.dispatchEvent(new Event('finance_update'));
};

export const adminUpdateGlobalPayoutStatus = (year: number, month: number, status: 'PENDING' | 'PAID') => {
  localStorage.setItem(`PAYOUT_STATUS_${year}_${month}`, status);
  window.dispatchEvent(new Event('finance_update'));
};

// --- FUENTE DE VERDAD HISTÓRICA ---
export const FINANCIAL_HISTORY: Record<number, number[]> = {
  2022: [-4.80, -3.60, 2.40, -9.60, -1.20, -7.90, 6.40, -3.90, -8.20, 5.60, 3.20, -6.10],
  2023: [3.40, 2.85, -2.10, 4.25, 3.90, 2.75, -1.65, 5.60, -2.95, 4.80, 2.10, 1.85],
  2024: [3.10, 2.45, -1.80, 4.60, 5.20, 3.85, -2.30, 6.40, 2.90, 4.15, 1.75, 1.95],
  2025: [3.50, 2.10, 3.80, 2.45, 3.15, 2.90, 2.75, 3.20, 2.85, 3.10, 2.95, 2.68],
  2026: [1.46, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
};

const calculateScaleFactor = () => {
  const years = [2022, 2023, 2024, 2025, 2026];
  let totalFactor = 1;
  years.forEach(y => {
    const history = FINANCIAL_HISTORY[y] || [];
    history.forEach((_, idx) => {
      totalFactor *= (1 + getStoredYield(y, idx));
    });
  });
  return totalFactor;
};

const TARGET_PRICE_PER_SHARE = 248.85; 
const TOTAL_ACCUMULATED_FACTOR = calculateScaleFactor();
const BASE_VALUE_PER_SHARE = TARGET_PRICE_PER_SHARE / TOTAL_ACCUMULATED_FACTOR;

const TOTAL_SHARES = 500;
const GLOBAL_AUM = TOTAL_SHARES * TARGET_PRICE_PER_SHARE;

export const FINANCE_CONFIG = {
  BASE_VALUE_PER_SHARE,
  TOTAL_SHARES,
  GLOBAL_AUM,
  NOMINAL_VALUE_PER_SHARE: TARGET_PRICE_PER_SHARE,
  RESERVE_GOAL_PCT: 100
};

export const calculateUserFinance = (shares: number, year: number = 2025, joinMonth: number = 0) => {
  const participation = shares / FINANCE_CONFIG.TOTAL_SHARES;
  const yearsList = [2022, 2023, 2024, 2025, 2026];
  
  let currentFactor = 1;
  for (const y of yearsList) {
    const history = FINANCIAL_HISTORY[y] || [];
    history.forEach((_, idx) => {
      currentFactor *= (1 + getStoredYield(y, idx));
    });
    if (y === year) break;
  }
  const balance = shares * (BASE_VALUE_PER_SHARE * currentFactor);

  const history = FINANCIAL_HISTORY[year] || [];
  let individualAnnualFactor = 1;
  
  history.forEach((_, idx) => {
    if (idx >= joinMonth) {
      individualAnnualFactor *= (1 + getStoredYield(year, idx));
    }
  });

  const annualYieldPct = (individualAnnualFactor - 1);

  return {
    participation: (participation * 100).toFixed(2) + '%',
    balance: balance,
    annualProfit: balance * annualYieldPct,
    annualYieldPct: annualYieldPct * 100, 
    monthlyProfit: balance * (history[11] / 100 || 0)
  };
};

export const MOCK_USER: User = {
  id: "admin-caishen",
  name: "Administrador CCG",
  role: "Super Admin",
  memberSince: "Enero 2024",
  avatarUrl: "https://picsum.photos/seed/admin/200/200"
};

export const MOCK_NOTICES: CorporateNotice[] = [
  {
    id: 'n1',
    title: 'Cierre de Periodo Diciembre',
    date: 'Actual',
    description: 'Se han dispersado exitosamente los dividendos del periodo final de 2025.',
    type: 'Success',
    fullContent: 'La distribución ha sido completada y pagada proporcionalmente a todas las cuentas activas basada en el AUM.'
  }
];

export const MOCK_ADMIN_NOTIFICATIONS: AdminNotification[] = [
  { id: 'an-1', event: 'Transacción', description: 'Dispersión de dividendos Dic 2025: COMPLETADA', origin: 'Administrador', impact: 'Crítico', timestamp: 'Hoy, 10:45 AM', status: 'Confirmada' },
];

export const MOCK_ASSETS: Asset[] = [
  { id: '1', name: 'Divisas (Forex)', category: 'Forex', quantity: '30.9%', currentValue: FINANCE_CONFIG.GLOBAL_AUM * 0.309, return: 12.5, status: 'Abierta' },
  { id: '2', name: 'Renta Variable (Acciones)', category: 'Acciones', quantity: '10.3%', currentValue: FINANCE_CONFIG.GLOBAL_AUM * 0.103, return: 15.8, status: 'Abierta' },
  { id: '3', name: 'Real estate Portfolio', category: 'Inmobiliario', quantity: '25.8%', currentValue: FINANCE_CONFIG.GLOBAL_AUM * 0.258, return: 8.2, status: 'Abierta' },
  { id: '4', name: 'Materias Primas (Commodities)', category: 'Derivados', quantity: '12.4%', currentValue: FINANCE_CONFIG.GLOBAL_AUM * 0.124, return: 14.1, status: 'Abierta' },
  { id: '5', name: 'Estrategia Cripto/Algo', category: 'Cripto', quantity: '20.6%', currentValue: FINANCE_CONFIG.GLOBAL_AUM * 0.206, return: 22.4, status: 'Abierta' },
];

export const MOCK_TRANSACTIONS: Transaction[] = [
  { id: 'tx1', type: 'Dividendo', amount: 2800.00, date: 'Hoy, 10:45 AM', status: 'Completado', description: 'Distribución Pagada Diciembre' },
];

export const MOCK_REPORTS: Report[] = [
  { 
    id: 'rep-risk-jan26', 
    title: 'Reporte de Riesgo y Mitigación – Enero 2026', 
    date: '22 Ene, 2026', 
    category: 'Riesgos y Mitigación', 
    summary: 'Actualización institucional sobre exposición en activos refugio, evaluación de riesgo y medidas de mitigación aplicadas.',
    highlight: 'Estado general de riesgos: Controlado, bajo vigilancia activa del Comité Técnico.',
    sections: [
      {
        title: '1. Resumen Ejecutivo',
        content: 'En cumplimiento de sus funciones de supervisión y control, el Área Administrativa de Gestión de Riesgo, en conjunto con el Comité Técnico, informa que el portafolio mantiene un perfil de riesgo controlado.'
      }
    ]
  }
];

// Publish a notification to local storage for global access
export const adminPublishNotification = (notification: AdminNotification) => {
  const published = JSON.parse(localStorage.getItem('PUBLISHED_NOTIFICATIONS') || '[]');
  if (!published.find((n: any) => n.id === notification.id)) {
    localStorage.setItem('PUBLISHED_NOTIFICATIONS', JSON.stringify([...published, notification]));
    window.dispatchEvent(new Event('notifications_update'));
  }
};

// Retrieve all published notifications from local storage
export const getPublishedNotifications = (): AdminNotification[] => {
  try {
    const saved = localStorage.getItem('PUBLISHED_NOTIFICATIONS');
    return saved ? JSON.parse(saved) : [];
  } catch (error) {
    console.error('Error reading published notifications:', error);
    return [];
  }
};
