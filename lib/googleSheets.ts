
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
 * Normaliza un string para comparaciones robustas: sin tildes, minúsculas y sin caracteres especiales.
 * Asegura que el acceso desde la nube sea infalible.
 */
export const norm = (str: any): string => 
  String(str || '')
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") 
    .replace(/[^a-z0-9]/g, '');

/**
 * Busca un valor en un objeto basándose en una lista de llaves posibles.
 * Implementa descubrimiento elástico de columnas del registro central.
 */
export function findValue(obj: any, keys: string[]): any {
  if (!obj || typeof obj !== 'object') return null;
  const normalizedKeys = keys.map(norm);
  const actualKey = Object.keys(obj).find(k => normalizedKeys.includes(norm(k)));
  return actualKey ? obj[actualKey] : null;
}

/**
 * Convierte valores de la nube a números válidos manejando diferentes formatos regionales.
 */
export function parseSheetNumber(val: any): number {
  if (val === undefined || val === null || val === '') return 0;
  if (typeof val === 'number') return val;
  const cleanStr = String(val).replace(/\s/g, '').replace(',', '.');
  const num = parseFloat(cleanStr);
  return isNaN(num) ? 0 : num;
}

/**
 * Obtiene datos desde el repositorio central en la nube.
 */
export async function fetchTableData(tabName: string): Promise<any[]> {
  try {
    const url = `${GOOGLE_CONFIG.SCRIPT_API_URL}?tab=${tabName}&t=${Date.now()}`;
    const response = await fetch(url, {
      method: 'GET',
      headers: { 'Accept': 'application/json' }
    });
    
    if (!response.ok) {
      console.error(`Error de conexión con el registro central: ${response.status}`);
      return [];
    }
    
    const json = await response.json();
    const rows = Array.isArray(json) ? json : (json.rows || []);
    
    return rows.map((row: any) => {
      const cleanRow: any = {};
      Object.keys(row).forEach(key => {
        cleanRow[key.trim()] = row[key];
      });
      return cleanRow;
    });
  } catch (e) {
    console.error(`Fallo crítico en sincronización de nube (${tabName}):`, e);
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
    return { success: true, message: "Datos sincronizados con la nube." };
  } catch (e) {
    return { success: false, message: "Error de conexión con el servidor central." };
  }
}

export async function fetchPerformanceHistory(): Promise<any[]> {
  const raw = await fetchTableData('HISTORIAL_RENDIMIENTOS');
  if (!raw || raw.length === 0) return [];

  const monthNames = ['ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN', 'JUL', 'AGO', 'SEP', 'OCT', 'NOV', 'DIC'];
  const sorted = raw.sort((a, b) => {
    const yearA = parseInt(String(findValue(a, ['ANIO', 'year']) || 0));
    const yearB = parseInt(String(findValue(b, ['ANIO', 'year']) || 0));
    if (yearA !== yearB) return yearA - yearB;
    return parseInt(String(findValue(a, ['MES', 'month']) || 0)) - parseInt(String(findValue(b, ['MES', 'month']) || 0));
  });

  let currentPortfolio = 1000;
  let currentBenchmark = 1000;

  return sorted.map(item => {
    const pYield = parseSheetNumber(findValue(item, ['RENDIMIENTO_FONDO', 'pYield', 'rendimiento']));
    const bYield = parseSheetNumber(findValue(item, ['RENDIMIENTO_SP500', 'bYield', 'sp500']));
    currentPortfolio *= (1 + pYield);
    currentBenchmark *= (1 + bYield);
    const mes = parseInt(String(findValue(item, ['MES', 'month']) || 1));

    return {
      name: monthNames[mes - 1],
      year: String(findValue(item, ['ANIO', 'year']) || ''),
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
      const rows = Array.isArray(j) ? j : (j.rows || []);
      return rows;
    };

    const [rawOpen, rawClosed] = await Promise.all([fetchFunc(openTab), fetchFunc(closedTab)]);

    const mapRecord = (item: any, isTradeOpen: boolean): Execution => {
      const fmtNum = (v: any) => {
        const n = parseSheetNumber(v);
        return n.toLocaleString('es-ES', { minimumFractionDigits: 2 });
      };

      return {
        ticket: String(findValue(item, ['ticket', 'id', 'orden', 'posicion', 'ticket_id']) || '0'),
        symbol: String(findValue(item, ['symbol', 'simbolo', 'asset', 'instrument', 'par']) || '---'),
        side: String(findValue(item, ['accion', 'side', 'type', 'tipo', 'operacion']) || '---'),
        lots: fmtNum(findValue(item, ['lotes', 'lots', 'volume', 'size', 'lotaje'])),
        open_time: String(findValue(item, ['fechadeapertura', 'open_date', 'opentime', 'fecha_apertura']) || ''),
        close_time: isTradeOpen ? 'PENDIENTE' : String(findValue(item, ['fechadecierre', 'close_date', 'closetime', 'fecha_cierre']) || ''),
        open_price: fmtNum(findValue(item, ['preciodeapertura', 'open_price', 'priceopen', 'precio_in'])),
        close_price: isTradeOpen ? '---' : fmtNum(findValue(item, ['preciodecierre', 'close_price', 'priceclose', 'precio_out'])),
        sl: fmtNum(findValue(item, ['slprecio', 'stoploss', 'sl', 'stop_loss'])),
        tp: fmtNum(findValue(item, ['tpprecio', 'takeprofit', 'tp', 'take_profit'])),
        profit: parseSheetNumber(findValue(item, ['beneficioneto', 'profit', 'resultado', 'ganancia_neta'])),
        gain: fmtNum(findValue(item, ['ganancia', 'gain', 'pct', 'porcentaje'])),
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
