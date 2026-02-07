
import { GOOGLE_CONFIG } from '../constants';

export interface Execution {
  ticket: string;
  symbol: string;
  side: string;
  lots: string;
  open_time: string;
  close_time: string;
  open_price: string;
  close_price: string;
  sl: string;
  tp: string;
  profit: number;
  gain: string;
  swap: string;
  commission: string;
  comment: string;
  isOpen: boolean;
}

export interface ExecutionData {
  closed: Execution[];
  open: Execution[];
}

export type MarketCategory = 'forex' | 'stocks' | 'commodities';

const FOREX_API_URL = 'https://script.google.com/macros/s/AKfycbyJwdqsA0fTS7HB4BAMWTO7_gogMAq1SzdvDJOAUg8tWA5G3dqpm7m4LBTwRdzDHVAY/exec'; 
const COMMODITIES_API_URL = 'https://script.google.com/macros/s/AKfycbyIKYItxgt7yRPTdP84d1QGxsQejGF2dQj5M9VFSSZBiDsSwsMsNRIGUjY5wXFgJDOjMQ/exec';
const STOCKS_API_URL = GOOGLE_CONFIG.SCRIPT_API_URL; 

/**
 * Normaliza un string para comparaciones robustas
 */
const norm = (str: any): string => 
  String(str || '')
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") 
    .replace(/[^a-z0-9]/g, '');

/**
 * Busca un valor en un objeto basándose en una lista de llaves posibles,
 * ignorando mayúsculas, espacios y caracteres especiales.
 */
export function findValue(obj: any, keys: string[]): any {
  if (!obj) return null;
  const normalizedKeys = keys.map(norm);
  const actualKey = Object.keys(obj).find(k => normalizedKeys.includes(norm(k)));
  return actualKey ? obj[actualKey] : null;
}

export async function fetchTableData(tabName: string): Promise<any[]> {
  try {
    const url = `${GOOGLE_CONFIG.SCRIPT_API_URL}?tab=${tabName}&t=${Date.now()}`;
    const response = await fetch(url, {
      method: 'GET',
      headers: { 'Accept': 'application/json' }
    });
    
    if (!response.ok) return [];
    
    const json = await response.json();
    return Array.isArray(json) ? json : (json.rows || []);
  } catch (e) {
    console.error(`Error crítico al obtener tabla ${tabName}:`, e);
    return [];
  }
}

export async function updateTableData(tabName: string, data: any): Promise<{success: boolean, message: string}> {
  try {
    const url = `${GOOGLE_CONFIG.SCRIPT_API_URL}?tab=${tabName}&action=update`;
    await fetch(url, {
      method: 'POST',
      mode: 'no-cors',
      cache: 'no-cache',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return { success: true, message: "Datos enviados a la cola de sincronización." };
  } catch (e) {
    return { success: false, message: "Error de conexión." };
  }
}

export async function fetchPerformanceHistory(): Promise<any[]> {
  const raw = await fetchTableData('HISTORIAL_RENDIMIENTOS');
  if (!raw || raw.length === 0) return [];

  const monthNames = ['ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN', 'JUL', 'AGO', 'SEP', 'OCT', 'NOV', 'DIC'];
  const sorted = raw.sort((a, b) => {
    const yearA = parseInt(findValue(a, ['ANIO', 'year']));
    const yearB = parseInt(findValue(b, ['ANIO', 'year']));
    if (yearA !== yearB) return yearA - yearB;
    return parseInt(findValue(a, ['MES', 'month'])) - parseInt(findValue(b, ['MES', 'month']));
  });

  let currentPortfolio = 1000;
  let currentBenchmark = 1000;

  return sorted.map(item => {
    const pYield = parseFloat(String(findValue(item, ['RENDIMIENTO_FONDO', 'pYield']) || 0).replace(',', '.'));
    const bYield = parseFloat(String(findValue(item, ['RENDIMIENTO_SP500', 'bYield']) || 0).replace(',', '.'));
    currentPortfolio *= (1 + pYield);
    currentBenchmark *= (1 + bYield);
    const mes = parseInt(findValue(item, ['MES', 'month']));

    return {
      name: monthNames[mes - 1],
      year: String(findValue(item, ['ANIO', 'year'])),
      pYield: (pYield * 100).toFixed(2),
      bYield: (bYield * 100).toFixed(2),
      portfolio: parseFloat(currentPortfolio.toFixed(2)),
      benchmark: parseFloat(currentBenchmark.toFixed(2))
    };
  });
}

export const fetchExecutionsFromApi = async (category: MarketCategory = 'forex'): Promise<ExecutionData> => {
  try {
    let openTab = 'HISTORY_OPEN';
    let closedTab = 'HISTORY_CLOSED';
    let targetUrl = FOREX_API_URL;

    if (category === 'commodities') targetUrl = COMMODITIES_API_URL;
    else if (category === 'stocks') {
      targetUrl = STOCKS_API_URL;
      openTab = 'STOCKS_OPEN';
      closedTab = 'STOCKS_CLOSED';
    }

    const fetchFunc = async (tab: string) => {
      const url = `${targetUrl}?tab=${tab}&t=${Date.now()}`;
      const res = await fetch(url);
      if (!res.ok) return [];
      const j = await res.json();
      return Array.isArray(j) ? j : (j.rows || []);
    };

    const [rawOpen, rawClosed] = await Promise.all([fetchFunc(openTab), fetchFunc(closedTab)]);

    const mapRecord = (item: any, isTradeOpen: boolean): Execution => {
      const fmtNum = (v: any) => {
        if (v === undefined || v === null || v === '') return '0,00';
        if (typeof v === 'number') return v.toLocaleString('es-ES', { minimumFractionDigits: 2 });
        const n = parseFloat(String(v).replace(',', '.').replace(/[^0-9.-]/g, ''));
        return isNaN(n) ? String(v) : n.toLocaleString('es-ES', { minimumFractionDigits: 2 });
      };

      return {
        ticket: String(findValue(item, ['ticket', 'id', 'orden', 'posicion']) || '0'),
        symbol: String(findValue(item, ['symbol', 'simbolo', 'asset', 'instrument']) || '---'),
        side: String(findValue(item, ['accion', 'side', 'type', 'tipo']) || '---'),
        lots: fmtNum(findValue(item, ['lotes', 'lots', 'volume', 'size'])),
        open_time: String(findValue(item, ['fechadeapertura', 'open_date', 'opentime']) || ''),
        close_time: isTradeOpen ? 'PENDIENTE' : String(findValue(item, ['fechadecierre', 'close_date', 'closetime']) || ''),
        open_price: fmtNum(findValue(item, ['preciodeapertura', 'open_price', 'priceopen'])),
        close_price: isTradeOpen ? '---' : fmtNum(findValue(item, ['preciodecierre', 'close_price', 'priceclose'])),
        sl: fmtNum(findValue(item, ['slprecio', 'stoploss', 'sl'])),
        tp: fmtNum(findValue(item, ['tpprecio', 'takeprofit', 'tp'])),
        profit: parseFloat(String(findValue(item, ['beneficioneto', 'profit', 'resultado']) || 0).replace(',', '.')) || 0,
        gain: fmtNum(findValue(item, ['ganancia', 'gain', 'pct'])),
        swap: fmtNum(findValue(item, ['swap', 'interes'])),
        commission: fmtNum(findValue(item, ['commission', 'comision', 'fee'])),
        comment: String(findValue(item, ['comment', 'comentario']) || ''),
        isOpen: isTradeOpen
      };
    };

    return {
      closed: rawClosed.map(item => mapRecord(item, false)),
      open: rawOpen.map(item => mapRecord(item, true))
    };
  } catch (error) {
    return { closed: [], open: [] };
  }
};
