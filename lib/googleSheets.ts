
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

// Endpoint específico para Commodities proporcionado por el usuario
const COMMODITIES_API_URL = 'https://script.google.com/macros/s/AKfycbyIKYItxgt7yRPTdP84d1QGxsQejGF2dQj5M9VFSSZBiDsSwsMsNRIGUjY5wXFgJDOjMQ/exec';

/**
 * Normalización robusta para llaves de columnas
 */
const norm = (str: any): string => 
  String(str || '')
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Quita tildes
    .replace(/[^a-z0-9]/g, '');    // Quita espacios y caracteres especiales

/**
 * Normalizador de fechas para formato humano: DD/MM/YYYY HH:mm
 */
const formatDateTime = (dateStr: any): string => {
  if (!dateStr || dateStr === '---' || dateStr === 'PENDIENTE') return dateStr;
  
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return String(dateStr);

    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');

    return `${day}/${month}/${year} ${hours}:${minutes}`;
  } catch (e) {
    return String(dateStr);
  }
};

/**
 * Función auxiliar para obtener datos de una pestaña específica con soporte para URL dinámica
 */
async function fetchSheetTab(sheetName: string, overrideUrl?: string): Promise<any[]> {
  try {
    const baseUrl = overrideUrl || GOOGLE_CONFIG.SCRIPT_API_URL;
    const url = `${baseUrl}?sheet=${sheetName}&tab=${sheetName}&t=${Date.now()}`;
    const response = await fetch(url);
    if (!response.ok) return [];
    
    const json = await response.json();
    
    // El script de Commodities puede devolver un array directo o un objeto con .rows
    if (json.rows && Array.isArray(json.rows)) return json.rows;
    if (Array.isArray(json)) return json;

    return [];
  } catch (e) {
    console.warn(`Error al obtener la hoja ${sheetName}:`, e);
    return [];
  }
}

export const fetchExecutionsFromApi = async (category: MarketCategory = 'forex'): Promise<ExecutionData> => {
  try {
    let openTab = 'HISTORY_OPEN';
    let closedTab = 'HISTORY_CLOSED';
    let targetUrl = GOOGLE_CONFIG.SCRIPT_API_URL;

    if (category === 'stocks') {
      openTab = 'STOCKS_OPEN';
      closedTab = 'STOCKS_CLOSED';
    } else if (category === 'commodities') {
      // Para Commodities usamos el endpoint dedicado y las pestañas estándar del historial
      openTab = 'HISTORY_OPEN'; 
      closedTab = 'HISTORY_CLOSED';
      targetUrl = COMMODITIES_API_URL;
    }

    const [rawOpen, rawClosed] = await Promise.all([
      fetchSheetTab(openTab, targetUrl),
      fetchSheetTab(closedTab, targetUrl)
    ]);

    const mapRecord = (item: any, isTradeOpen: boolean): Execution => {
      const get = (keys: string[]) => {
        const normalizedTargetKeys = keys.map(norm);
        const actualKey = Object.keys(item).find(k => normalizedTargetKeys.includes(norm(k)));
        return actualKey ? item[actualKey] : null;
      };

      const fmt = (v: any) => {
        if (v === undefined || v === null || v === '') return '0,00';
        if (typeof v === 'number') return v.toLocaleString('es-ES', { minimumFractionDigits: 2 });
        const clean = String(v).replace(/[^\d,.-]/g, '');
        return clean || '0,00';
      };

      const parseProfit = (v: any): number => {
        if (typeof v === 'number') return v;
        const s = String(v || '0')
          .replace(/[^\d,.+-]/g, '')
          .replace(/\./g, '')
          .replace(',', '.');
        return parseFloat(s) || 0;
      };

      return {
        ticket: String(get(['ticket', 'id', 'orden', 'order', 'ticketid']) || '0'),
        symbol: String(get(['symbol', 'simbolo', 'asset', 'item', 'instrumento', 'instrument']) || '---'),
        side: String(get(['accion', 'action', 'side', 'type', 'tipo', 'direccion']) || '---'),
        lots: fmt(get(['lotes', 'lots', 'volume', 'volumen', 'size'])),
        open_time: formatDateTime(get(['fechadeapertura', 'open_date', 'opentime', 'fecha', 'open_time', 'apertura'])),
        close_time: isTradeOpen ? 'PENDIENTE' : formatDateTime(get(['fechadecierre', 'close_date', 'closetime', 'cierre', 'close_time'])),
        open_price: fmt(get(['preciodeapertura', 'open_price', 'precioapertura', 'open'])),
        close_price: isTradeOpen ? '---' : fmt(get(['preciodecierre', 'close_price', 'preciocierre', 'close'])),
        sl: fmt(get(['slprecio', 'stoploss', 'sl', 's/l', 'stop_loss'])),
        tp: fmt(get(['tpprecio', 'takeprofit', 'tp', 't/p', 'take_profit'])),
        profit: parseProfit(get(['beneficioneto', 'profit', 'beneficio', 'p/l', 'resultado'])),
        gain: fmt(get(['ganancia', 'gain', 'profit_gross', 'resultado_bruto'])),
        swap: fmt(get(['swap', 'interes', 'swaps'])),
        commission: fmt(get(['commission', 'comision', 'comisiones', 'comm'])),
        comment: String(get(['comment', 'comentario', 'nota', 'pips', 'duracion']) || ''),
        isOpen: isTradeOpen
      };
    };

    return {
      closed: rawClosed.map(item => mapRecord(item, false)),
      open: rawOpen.map(item => mapRecord(item, true))
    };

  } catch (error) {
    console.error('Error crítico en sincronización de datos:', error);
    throw error;
  }
};
