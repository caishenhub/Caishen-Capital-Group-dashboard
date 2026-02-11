
import { Asset, Transaction, Report, User, CorporateNotice, AdminNotification } from './types';

// --- CONFIGURACIÓN GOOGLE INTEGRATION ---
export const GOOGLE_CONFIG = {
  // URL MAESTRA (Stocks, Libro de Accionistas, KPIs, Reportes)
  SCRIPT_API_URL: 'https://script.google.com/macros/s/AKfycbw52eRJHauh8nuu-rMiWzpPhjtoAJSO8zok4wb7gbVQrMfCp5Trw9jYGuYuQ_V4XAepwg/exec',
  // URL FOREX (Libro de Ejecuciones Forex)
  FOREX_API_URL: 'https://script.google.com/macros/s/AKfycbyJwdqsA0fTS7HB4BAMWTO7_gogMAq1SzdvDJOAUg8tWA5G3dqpm7m4LBTwRdzDHVAY/exec',
  // URL COMMODITIES (Libro de Ejecuciones Commodities)
  COMMODITIES_API_URL: 'https://script.google.com/macros/s/AKfycbyIKYItxgt7yRPTdP84d1QGxsQejGF2dQj5M9VFSSZBiDsSwsMsNRIGUjY5wXFgJDOjMQ/exec',
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

// Valores base iniciales
export const FINANCE_CONFIG = {
  TOTAL_SHARES: 500,
  GLOBAL_AUM: 124425,
  NOMINAL_VALUE_PER_SHARE: 248.85,
  RESERVE_GOAL_PCT: 100
};

export const calculateUserFinance = (shares: number, year: number = 2026, joinMonth: number = 0) => {
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
    participation: ((shares / FINANCE_CONFIG.TOTAL_SHARES) * 100).toFixed(2) + '%',
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
    fullContent: 'El Área Administrativa informa que el proceso de dispersión de utilidades para el periodo de Enero 2026 ha iniciado satisfactoriamente.'
  }
];

export const MOCK_REPORTS: Report[] = [];
