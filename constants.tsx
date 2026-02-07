
import { Asset, Transaction, Report, User, CorporateNotice, AdminNotification } from './types';
import { supabase } from './lib/supabase';

// --- CONFIGURACIÓN GOOGLE INTEGRATION ---
export const GOOGLE_CONFIG = {
  // URL REAL proporcionada por el usuario para la sincronización maestra
  SCRIPT_API_URL: 'https://script.google.com/macros/s/AKfycby-h02XetymxvLD9RMvO2E2TH7IxE_mMMtLw9eRTptHiUAgMFLh2DMwS0K9pbYp_qXyBw/exec',
  TAB_NAME: 'CONFIG_MAESTRA'
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
  2026: [2.10, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0] 
};

// Valores base iniciales (Serán sobreescritos por la carga dinámica en los componentes)
export const FINANCE_CONFIG = {
  TOTAL_SHARES: 500,
  GLOBAL_AUM: 124425, // 500 * 248.85
  NOMINAL_VALUE_PER_SHARE: 248.85,
  RESERVE_GOAL_PCT: 100
};

export const calculateUserFinance = (shares: number, year: number = 2026, joinMonth: number = 0) => {
  const participation = shares / FINANCE_CONFIG.TOTAL_SHARES;
  const fixedBalance = shares * FINANCE_CONFIG.NOMINAL_VALUE_PER_SHARE;

  const history = FINANCIAL_HISTORY[year] || [];
  let annualYieldSum = 0;
  let annualProfitSum = 0;

  history.forEach((_, idx) => {
    if (idx >= joinMonth) {
      const mYield = getStoredYield(year, idx);
      if (mYield !== 0 || localStorage.getItem(`YIELD_${year}_${idx}`) !== null) {
        annualYieldSum += mYield;
        annualProfitSum += (fixedBalance * mYield);
      }
    }
  });

  return {
    participation: (participation * 100).toFixed(2) + '%',
    balance: fixedBalance,
    annualProfit: annualProfitSum,
    annualYieldPct: annualYieldSum * 100, 
    monthlyProfit: fixedBalance * (getStoredYield(year, new Date().getMonth()))
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
    id: 'n-jan26-payout',
    title: 'Cierre de Periodo Enero 2026',
    date: '22 Ene, 2026',
    description: 'Se están dispersando los dividendos correspondientes al periodo de Enero 2026.',
    type: 'Success',
    fullContent: 'El Área Administrativa informa que el proceso de dispersión de utilidades para el periodo de Enero 2026 ha iniciado satisfactoriamente. Los fondos están siendo procesados y se verán reflejados en los balances individuales conforme a los tiempos operativos bancarios.'
  }
];

export const MOCK_ADMIN_NOTIFICATIONS: AdminNotification[] = [
  { id: 'an-1', event: 'Transacción', description: 'Dispersión de dividendos Ene 2026: INICIADA', origin: 'Administrador', impact: 'Crítico', timestamp: 'Hoy, 10:45 AM', status: 'Emitida' },
];

export const MOCK_ASSETS: Asset[] = [
  { id: '1', name: 'Divisas (Forex)', category: 'Forex', quantity: '30.9%', currentValue: FINANCE_CONFIG.GLOBAL_AUM * 0.309, return: 12.5, status: 'Abierta' },
  { id: '2', name: 'Renta Variable (Acciones)', category: 'Acciones', quantity: '10.3%', currentValue: FINANCE_CONFIG.GLOBAL_AUM * 0.103, return: 15.8, status: 'Abierta' },
  { id: '3', name: 'Real estate Portfolio', category: 'Inmobiliario', quantity: '25.8%', currentValue: FINANCE_CONFIG.GLOBAL_AUM * 0.258, return: 8.2, status: 'Abierta' },
  { id: '4', name: 'Materias Primas (Commodities)', category: 'Derivados', quantity: '12.4%', currentValue: FINANCE_CONFIG.GLOBAL_AUM * 0.124, return: 14.1, status: 'Abierta' },
  { id: '5', name: 'Estrategia Cripto/Algo', category: 'Cripto', quantity: '20.6%', currentValue: FINANCE_CONFIG.GLOBAL_AUM * 0.206, return: 22.4, status: 'Abierta' },
];

export const MOCK_TRANSACTIONS: Transaction[] = [
  { id: 'tx1', type: 'Dividendo', amount: 105.176, date: 'Hoy, 10:45 AM', status: 'Completado', description: 'Distribución Enero 2026' },
];

export const MOCK_REPORTS: Report[] = [
  {
    id: 'rep-strat-feb26',
    title: 'Comunicado Administrativo: Actualización de Estrategia Operativa',
    date: 'Feb 2026',
    category: 'Estrategia',
    summary: 'Actualización institucional sobre la transición hacia un portafolio global unificado para todos los accionistas.',
    highlight: 'Transición a esquema unificado de capital, riesgo y rendimiento a partir de julio de 2026.',
    sections: [
      {
        title: '1. Introducción institucional',
        content: 'Como parte del proceso continuo de fortalecimiento del modelo operativo, optimización del capital colectivo y consolidación de la gestión de riesgo, el Comité Técnico, en conjunto con el Área Administrativa, ha aprobado una actualización estratégica en la estructura del portafolio.'
      },
      {
        title: '2. Cambio principal de condiciones operativas',
        content: 'A partir del mes de julio (inicio del segundo semestre del año), todos los inversionistas pasarán a estar vinculados de forma integral al portafolio consolidado.'
      }
    ]
  },
  { 
    id: 'rep-risk-jan26-detailed', 
    title: 'Reporte de Riesgo y Mitigación – Enero 2026', 
    date: '22 Ene, 2026', 
    category: 'Riesgos y Mitigación', 
    summary: 'Actualización institucional sobre exposición en activos refugio y medidas de mitigación aplicadas.',
    highlight: 'Riesgo de mercado materializado, gestionado mediante mecanismos internos de mitigación.',
    sections: [
      {
        title: '1. Resumen Ejecutivo',
        content: 'Se informa que durante el periodo evaluado se materializó un escenario de riesgo de mercado asociado a la alta volatilidad del activo XAUUSD (oro), gestionado exitosamente mediante el fondo de reserva.'
      }
    ]
  }
];

export const adminPublishNotification = (notification: AdminNotification) => {
  const published = JSON.parse(localStorage.getItem('PUBLISHED_NOTIFICATIONS') || '[]');
  if (!published.find((n: any) => n.id === notification.id)) {
    localStorage.setItem('PUBLISHED_NOTIFICATIONS', JSON.stringify([...published, notification]));
    window.dispatchEvent(new Event('notifications_update'));
  }
};

export const getPublishedNotifications = (): AdminNotification[] => {
  try {
    const saved = localStorage.getItem('PUBLISHED_NOTIFICATIONS');
    return saved ? JSON.parse(saved) : [];
  } catch (error) {
    console.error('Error reading published notifications:', error);
    return [];
  }
};
