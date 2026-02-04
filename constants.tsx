
import { Asset, Transaction, Report, User, CorporateNotice, AdminNotification } from './types';
import { supabase } from './lib/supabase';

// --- CONFIGURACIÓN GOOGLE INTEGRATION ---
export const GOOGLE_CONFIG = {
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
  { id: 'tx1', type: 'Dividendo', amount: 2800.00, date: 'Hoy, 10:45 AM', status: 'Pendiente', description: 'Distribución en Proceso Enero' },
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
        content: 'Como parte del proceso continuo de fortalecimiento del modelo operativo, optimización del capital colectivo y consolidación de la gestión de riesgo, el Comité Técnico, en conjunto con el Área Administrativa, ha aprobado una actualización estratégica en la estructura del portafolio.\n\nEsta decisión surge del análisis integral del desempeño histórico, los niveles de exposición por activo, la eficiencia en la asignación de recursos y las proyecciones del segundo semestre del año, con el objetivo de robustecer la estabilidad del ecosistema de inversión y mejorar las condiciones estructurales para todos los accionistas.'
      },
      {
        title: '2. Cambio principal de condiciones operativas',
        content: 'A partir del mes de julio (inicio del segundo semestre del año), todos los inversionistas pasarán a estar vinculados de forma integral al portafolio consolidado.\n\nEsto implica que:\n- Ya no existirán participaciones segmentadas por sub-portafolios o estrategias individuales.\n- Todos los accionistas participarán proporcionalmente en la totalidad de las operaciones, activos y resultados del portafolio global.\n- La gestión se realizará bajo un esquema unificado de capital, riesgo y rendimiento.\n\nEste ajuste corresponde a una reorganización estructural del modelo, diseñada para elevar el nivel de eficiencia, control y estabilidad del portafolio en su conjunto.'
      },
      {
        title: '3. Justificación estratégica del cambio',
        content: 'La unificación del portafolio permite implementar un modelo de gestión más robusto, con beneficios técnicos claros:',
        items: [
          'Mayor diversificación real del riesgo.',
          'Optimización del capital colectivo bajo una sola matriz operativa.',
          'Mejor distribución de utilidades y exposición entre todos los accionistas.',
          'Reducción de concentraciones por activo o estrategia.',
          'Fortalecimiento del fondo de reserva y de los buffers técnicos.',
          'Mayor estabilidad frente a escenarios de volatilidad.',
          'Gestión centralizada del drawdown.',
          'Estandarización de métricas, reportes y controles.'
        ]
      },
      {
        title: '4. Beneficios directos para los accionistas',
        content: 'Con esta actualización estratégica, los accionistas obtendrán:',
        items: [
          'Participación uniforme en todas las oportunidades del portafolio.',
          'Acceso automático a nuevas estrategias sin procesos adicionales.',
          'Mayor protección del capital mediante diversificación estructural.',
          'Simplificación operativa y contable.',
          'Transparencia consolidada en los reportes financieros.',
          'Mejora en la eficiencia del modelo de distribución de resultados.'
        ]
      },
      {
        title: '5. Fecha de entrada en vigor',
        content: 'Esta actualización estratégica regirá oficialmente a partir del mes de julio y se aplicará de forma automática a todos los accionistas activos. No se requiere ninguna acción adicional por parte de los inversionistas para su implementación.'
      },
      {
        title: '6. Mensaje institucional de cierre',
        content: 'Esta medida busca fortalecer el ecosistema de inversión, priorizando la protección del capital colectivo sobre resultados aislados, y consolidando un modelo corporativo orientado al largo plazo.\n\nReafirmamos nuestro compromiso con una gestión profesional, estructurada y transparente, sustentada en criterios técnicos y decisiones estratégicas responsables. No es mejor gestor quien persigue el mayor rendimiento puntual, sino quien protege el capital colectivo mediante decisiones sostenibles y disciplinadas.'
      }
    ]
  },
  { 
    id: 'rep-risk-jan26-detailed', 
    title: 'Reporte de Riesgo y Mitigación – Enero 2026', 
    date: '22 Ene, 2026', 
    category: 'Riesgos y Mitigación', 
    summary: 'Actualización institucional sobre exposición en activos refugio, evaluación de riesgo y medidas de mitigación aplicadas.',
    highlight: 'Riesgo de mercado materializado, gestionado mediante mecanismos internos de mitigación.',
    sections: [
      {
        title: '1. Resumen Ejecutivo',
        content: 'En cumplimiento de sus funciones de supervisión y control, el Área Administrativa de Gestión de Riesgo, en conjunto con el Comité Técnico, informa que durante el periodo evaluado se materializó un escenario de riesgo de mercado asociado a la alta volatilidad del activo XAUUSD (oro), derivado del entorno geopolítico internacional y la elevada incertidumbre macroeconómica.\n\nEste escenario obligó a la ejecución de cierres de posiciones en pérdida como medida preventiva de control. No obstante, mediante la aplicación oportuna de los mecanismos internos de mitigación, fue posible equilibrar el portafolio y cerrar el periodo con resultado positivo.'
      },
      {
        title: '2. Riesgo de Mercado – Exposición en Oro (XAUUSD)',
        content: 'El portafolio mantenía una exposición relevante al activo XAUUSD, previamente evaluada y aprobada dentro de los parámetros de riesgo establecidos. Sin embargo, los acontecimientos geopolíticos internacionales intensificaron la volatilidad del mercado, superando los escenarios base considerados.\n\nAnte este contexto, el Comité Técnico determinó el cierre de posiciones en pérdida con el objetivo de proteger el capital y evitar una ampliación del drawdown en un entorno de alta incertidumbre.'
      },
      {
        title: '3. Medidas de Mitigación Aplicadas',
        content: '',
        items: [
          'Cierre controlado de posiciones en pérdida en XAUUSD.',
          'Activación del fondo de reserva conforme a los lineamientos internos aprobados.',
          'Compensación del impacto generado por el evento adverso.',
          'Reequilibrio del portafolio y ajuste táctico de exposición.'
        ]
      },
      {
        title: '4. Resultado del Periodo',
        content: 'Gracias a la aplicación de las medidas de mitigación, el portafolio logró absorber el impacto del riesgo materializado, preservar la estabilidad operativa y cerrar el periodo en utilidades.'
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
