
import { GOOGLE_CONFIG, MOCK_REPORTS } from '../constants';
import { Report, ReportSection, CorporateNotice } from '../types';

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

export interface PortfolioCategory {
  name: string;
  value: number;
  color: string;
}

export interface LiquidityItem {
  name: string;
  value: number;
  color: string;
  subtext: string;
}

export interface PortfolioKpi {
  label: string;
  value: string;
  sub: string;
  type: 'diversificacion' | 'exposicion' | 'riesgo' | 'ajuste' | 'estabilidad' | 'balance' | 'utilidad';
}

export interface ExecutiveKpi {
  id: string;
  titulo: string;
  valor: string;
  subtexto: string;
  progreso: number;
  tipo: 'moneda' | 'porcentaje' | 'texto';
}

export interface StrategicReportSection {
  id: string;
  seccion_id: string;
  seccion_titulo: string;
  subseccion_titulo: string;
  contenido: string;
  tipo: 'PREVIEW' | 'SELLO' | 'PORTADA' | 'SECCION' | 'CARD' | 'BLOQUE_OSCURO' | 'LISTA' | 'CONCLUSION' | 'FOOTER';
  order: number;
  visible: boolean;
}

export type MarketCategory = 'forex' | 'stocks' | 'commodities';

const PROFILE_API_URL = GOOGLE_CONFIG.SCRIPT_API_URL;

const prefetchCache: Record<string, { data: any[], timestamp: number }> = {};
const inFlightRequests: Record<string, Promise<any[]>> = {};
const CACHE_DURATION = 1000 * 60 * 10;

export const norm = (str: any): string => 
  String(str || '')
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") 
    .replace(/[^a-z0-9]/g, '');

export function findValue(obj: any, keys: string[]): any {
  if (!obj || typeof obj !== 'object') return null;
  const normalizedKeys = keys.map(norm);
  const actualKey = Object.keys(obj).find(k => normalizedKeys.includes(norm(k)));
  return actualKey ? obj[actualKey] : null;
}

export function parseSheetNumber(val: any): number {
  if (val === undefined || val === null || val === '') return 0;
  if (typeof val === 'number') return val;
  const cleanStr = String(val).replace(/\s/g, '').replace(',', '.').replace('%', '');
  const num = parseFloat(cleanStr);
  return isNaN(num) ? 0 : num;
}

function formatSheetDate(dateVal: any): string {
  if (!dateVal) return '';
  const date = new Date(dateVal);
  if (isNaN(date.getTime())) return String(dateVal).replace(/\./g, '');
  return date.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' }).replace(/\./g, '');
}

export async function checkConnection(): Promise<boolean> {
  if (!PROFILE_API_URL || PROFILE_API_URL.length < 20) return false;
  try {
    const res = await fetch(`${PROFILE_API_URL}?tab=PING`, { mode: 'cors' });
    return res.ok;
  } catch (e) {
    return false;
  }
}

/**
 * FUNCIÓN CENTRAL DE LECTURA (GET)
 * Optimizada para evitar bloqueos de CORS y seguir redirecciones de Google.
 */
export async function fetchTableData(tabName: string, ignoreCache = false): Promise<any[]> {
  if (!PROFILE_API_URL) return [];

  if (!ignoreCache && prefetchCache[tabName]) {
    const cached = prefetchCache[tabName];
    if (Date.now() - cached.timestamp < CACHE_DURATION) return cached.data;
  }

  if (inFlightRequests[tabName]) return inFlightRequests[tabName];

  const fetchPromise = (async () => {
    try {
      const url = `${PROFILE_API_URL}?tab=${tabName}&t=${Date.now()}`;
      const response = await fetch(url, { 
        method: 'GET', 
        mode: 'cors', 
        redirect: 'follow',
        cache: 'no-store'
      });
      
      if (!response.ok) throw new Error(`HTTP Error: ${response.status}`);
      
      const json = await response.json();
      
      if (json.error) {
        console.warn(`API Error in ${tabName}:`, json.error);
        return [];
      }

      const rows = Array.isArray(json) ? json : (json.rows || []);
      const processedData = rows.map((row: any) => {
        const cleanRow: any = {};
        Object.keys(row).forEach(key => { 
          if(key) cleanRow[key.toString().trim()] = row[key]; 
        });
        return cleanRow;
      });

      prefetchCache[tabName] = { data: processedData, timestamp: Date.now() };
      return processedData;
    } catch (err) {
      console.error(`Fetch error for ${tabName}:`, err);
      return prefetchCache[tabName]?.data || [];
    } finally {
      delete inFlightRequests[tabName];
    }
  })();

  inFlightRequests[tabName] = fetchPromise;
  return fetchPromise;
}

/**
 * FUNCIÓN CENTRAL DE ESCRITURA (POST)
 */
async function sendToScript(payload: any) {
  try {
    const response = await fetch(PROFILE_API_URL, {
      method: 'POST',
      mode: 'cors',
      redirect: 'follow',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(payload)
    });
    
    if (!response.ok) throw new Error(`POST Error: ${response.status}`);
    
    const text = await response.text();
    try {
      return JSON.parse(text);
    } catch (e) {
      return { success: text.includes('success') || response.ok };
    }
  } catch (err) {
    console.error("Communication error (POST):", err);
    return { success: false, error: err.toString() };
  }
}

export async function fetchStrategicReport(ignoreCache = false): Promise<StrategicReportSection[]> {
  const data = await fetchTableData('REPORTE_ESTRATEGICO', ignoreCache);
  return data
    .map((row, idx) => ({
      id: String(findValue(row, ['ID', 'id']) || idx),
      seccion_id: String(findValue(row, ['SECCION_ID', 'seccion_id']) || ''),
      seccion_titulo: String(findValue(row, ['SECCION_TITULO', 'seccion_titulo']) || ''),
      subseccion_titulo: String(findValue(row, ['SUBSECCION_TITULO', 'subseccion_titulo']) || ''),
      contenido: String(findValue(row, ['CONTENIDO', 'content', 'contenido']) || ''),
      tipo: (findValue(row, ['TIPO', 'type', 'tipo']) || 'SECCION').toUpperCase() as any,
      order: parseSheetNumber(findValue(row, ['ORDEN', 'order', 'orden'])),
      visible: String(findValue(row, ['VISIBLE', 'visible'])).toLowerCase() === 'true'
    }))
    .filter(s => s.visible)
    .sort((a, b) => a.order - b.order);
}

export async function fetchExecutiveKpis(ignoreCache = false): Promise<Record<string, ExecutiveKpi>> {
  const data = await fetchTableData('RESUMEN_KPI', ignoreCache);
  const kpis: Record<string, ExecutiveKpi> = {};
  data.forEach(row => {
    const id = norm(findValue(row, ['ID', 'id']));
    if (id) {
      kpis[id] = {
        id,
        titulo: String(findValue(row, ['TITULO', 'titulo', 'label']) || ''),
        valor: String(findValue(row, ['VALOR', 'valor', 'value']) || ''),
        subtexto: String(findValue(row, ['SUBTEXTO', 'subtexto', 'sub']) || ''),
        progreso: parseSheetNumber(findValue(row, ['PROGRESO', 'progreso', 'progress'])),
        tipo: (findValue(row, ['TIPO', 'tipo', 'type']) || 'texto').toLowerCase() as any
      };
    }
  });
  return kpis;
}

export async function fetchLiquidityProtocol(ignoreCache = false): Promise<LiquidityItem[]> {
  const data = await fetchTableData('PROTOCOLO_LIQUIDEZ', ignoreCache);
  return data
    .map(row => ({
      name: String(findValue(row, ['CATEGORIA', 'name', 'categoria']) || 'Sin Nombre'),
      value: parseSheetNumber(findValue(row, ['PORCENTAJE', 'value', 'porcentaje'])),
      color: String(findValue(row, ['COLOR', 'color', 'hex']) || '#9CA3AF'),
      subtext: String(findValue(row, ['SUBTEXTO', 'subtexto', 'subtext']) || ''),
      order: parseSheetNumber(findValue(row, ['ORDEN', 'order', 'orden']))
    }))
    .sort((a, b) => a.order - b.order);
}

export async function fetchCorporateNotices(ignoreCache = false): Promise<CorporateNotice[]> {
  const data = await fetchTableData('AVISOS_CORPORATIVOS', ignoreCache);
  return data.map((row, idx) => {
    const rawDate = findValue(row, ['FECHA', 'date', 'fecha']);
    return {
      id: String(findValue(row, ['ID', 'id']) || `notice-${idx}`),
      title: String(findValue(row, ['TITULO', 'title', 'titulo']) || 'Aviso Corporativo'),
      date: formatSheetDate(rawDate), 
      description: String(findValue(row, ['DESCRIPCION', 'description', 'descripcion']) || ''),
      type: (findValue(row, ['TIPO', 'type', 'tipo']) || 'Info') as any,
      fullContent: String(findValue(row, ['CONTENIDO', 'content', 'contenido']) || ''),
      imageUrl: String(findValue(row, ['IMAGEN', 'image', 'imagen', 'image_url']) || '')
    };
  }).reverse();
}

export async function publishNotice(notice: Partial<CorporateNotice>): Promise<{success: boolean}> {
  const res = await sendToScript({
    action: 'append',
    tab: 'AVISOS_CORPORATIVOS',
    data: {
      ID: `N-${Date.now()}`,
      FECHA: new Date().toISOString(),
      TITULO: notice.title,
      DESCRIPCION: notice.description,
      TIPO: notice.type || 'Info',
      CONTENIDO: notice.fullContent || notice.description,
      IMAGEN: notice.imageUrl || ''
    }
  });
  return { success: res.success === true };
}

export async function updateShareholderPin(uid: string, newPin: string): Promise<{success: boolean}> {
  const res = await sendToScript({ action: 'UPDATE_PIN', uid: uid, newPin: newPin });
  return { success: res.success === true };
}

export async function saveShareholderAccount(uid: string, accountData: any): Promise<{success: boolean}> {
  const res = await sendToScript({
    action: 'append',
    tab: 'DATOS_PAGO_SOCIOS',
    data: {
      UID_SOCIO: uid,
      TIPO_METODO: accountData.type,
      TITULAR_NOMBRE: accountData.holderName,
      TITULAR_DOC_TIPO: accountData.docType || 'N/A',
      TITULAR_DOC_NUM: accountData.docNumber || 'N/A',
      INSTITUCION_NOMBRE: accountData.institution,
      CUENTA_NUMERO: accountData.identifier,
      TIPO_CUENTA_RED: accountData.network,
      PAIS_EXCHANGE: accountData.platform,
      CODIGO_SWIFT_BIC: accountData.swiftCode || 'N/A',
      FECHA_REGISTRO: new Date().toISOString(),
      ESTATUS_VERIFICACION: 'PENDIENTE',
      SOLICITUDES_CAMBIO: ''
    }
  });
  return { success: res.success === true };
}

export async function logAccountChangeRequest(uid: string, currentAccount: string): Promise<{success: boolean}> {
  const res = await sendToScript({
    action: 'update',
    tab: 'DATOS_PAGO_SOCIOS',
    data: {
      UID_SOCIO: uid,
      SOLICITUDES_CAMBIO: `Solicitud de modificación el ${new Date().toLocaleString('es-ES')}`
    }
  });
  return { success: res.success === true };
}

export async function fetchShareholderAccount(uid: string): Promise<any | null> {
  const data = await fetchTableData('DATOS_PAGO_SOCIOS', true);
  const targetUid = norm(uid);
  const record = data.find(r => norm(findValue(r, ['UID_SOCIO', 'uid'])) === targetUid);
  if (!record) return null;

  return {
    type: String(findValue(record, ['TIPO_METODO', 'tipo']) || ''),
    institution: String(findValue(record, ['INSTITUCION_NOMBRE', 'institucion']) || ''),
    account: String(findValue(record, ['CUENTA_NUMERO', 'cuenta']) || ''),
    network: String(findValue(record, ['TIPO_CUENTA_RED', 'red']) || ''),
    platform: String(findValue(record, ['PAIS_EXCHANGE', 'plataforma']) || ''),
    status: String(findValue(record, ['ESTATUS_VERIFICACION', 'estatus']) || 'PENDIENTE'),
    requestPending: String(findValue(record, ['SOLICITUDES_CAMBIO', 'solicitud']) || '').toLowerCase().includes('solicitud'),
    holderInfo: `${findValue(record, ['TITULAR_NOMBRE', 'nombre'])} (${findValue(record, ['TITULAR_DOC_NUM', 'documento'])})`
  };
}

export async function fetchReportsAdmin(ignoreCache = false): Promise<Report[]> {
  try {
    const data = await fetchTableData('REPORTES_ADMIN', ignoreCache);
    if (!data || data.length === 0) return MOCK_REPORTS;
    
    // Procesamos con timestamp para un ordenamiento exacto por fecha
    const reports: (Report & { _timestamp: number })[] = data
      .filter(row => norm(findValue(row, ['STATUS', 'status'])) === 'publicado')
      .map(row => {
        const rawDate = findValue(row, ['FECHA_PUBLICACION', 'date']);
        const parsedDate = new Date(rawDate);
        return {
          id: String(findValue(row, ['ID_REPORTE', 'id']) || Math.random().toString()),
          title: String(findValue(row, ['TITULO', 'title']) || 'Reporte Institucional'),
          date: formatSheetDate(rawDate),
          category: String(findValue(row, ['CATEGORIA', 'category']) || 'General') as any,
          summary: String(findValue(row, ['DESCRIPCION_CORTA', 'summary']) || ''),
          highlight: String(findValue(row, ['TEXTO_DESTACADO', 'highlight']) || ''),
          notaImportante: String(findValue(row, ['NOTA_IMPORTANTE', 'note']) || ''),
          visibleEnTodos: norm(findValue(row, ['VISIBLE_EN_TODOS', 'visible'])) === 'si',
          ordenForzado: parseSheetNumber(findValue(row, ['ORDEN_FORZADO', 'order'])),
          color: String(findValue(row, ['COLOR', 'color', 'hex_color']) || ''),
          _timestamp: isNaN(parsedDate.getTime()) ? 0 : parsedDate.getTime()
        };
      });

    // Lógica de ordenamiento: 
    // 1. ORDEN_FORZADO descendente (prioridad manual).
    // 2. _timestamp descendente (los más nuevos primero).
    return reports.sort((a, b) => {
      if (b.ordenForzado !== a.ordenForzado) {
        return b.ordenForzado - a.ordenForzado;
      }
      return b._timestamp - a._timestamp;
    });
  } catch (error) {
    return MOCK_REPORTS;
  }
}

export async function fetchPortfolioStructure(): Promise<PortfolioCategory[]> {
  const data = await fetchTableData('ESTRUCTURA_PORTAFOLIO');
  return data.map(item => ({
    name: String(findValue(item, ['CATEGORIA', 'name', 'categoria']) || 'Otros'),
    value: parseSheetNumber(findValue(item, ['PORCENTAJE', 'value', 'porcentaje'])),
    color: String(findValue(item, ['COLOR', 'color', 'hex']) || '#9CA3AF')
  }));
}

export async function fetchPortfolioKpis(): Promise<PortfolioKpi[]> {
  const data = await fetchTableData('KPI_PORTAFOLIO');
  return data.map(item => ({
    label: String(findValue(item, ['ETIQUETA', 'label', 'titulo']) || ''),
    value: String(findValue(item, ['VALOR', 'value', 'dato']) || '---'),
    sub: String(findValue(item, ['SUBTEXTO', 'subtext', 'descripcion']) || ''),
    type: String(findValue(item, ['TIPO', 'type']) || '').toLowerCase() as any
  }));
}

export async function updateTableData(tabName: string, data: any): Promise<{success: boolean, message: string}> {
  const res = await sendToScript({ action: 'update', tab: tabName, data: data });
  return { success: res.success, message: "Operación finalizada" };
}

export async function fetchPerformanceHistory(): Promise<any[]> {
  const raw = await fetchTableData('HISTORIAL_RENDIMIENTOS');
  if (!raw || raw.length === 0) return [];
  const monthNames = ['ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN', 'JUL', 'AGO', 'SEP', 'OCT', 'NOV', 'DIC'];
  let currentPortfolio = 1000;
  let currentBenchmark = 1000;
  return raw.map(item => {
    const pYield = parseSheetNumber(findValue(item, ['RENDIMIENTO_FONDO', 'pYield']));
    const bYield = parseSheetNumber(findValue(item, ['RENDIMIENTO_SP500', 'bYield']));
    currentPortfolio *= (1 + pYield);
    currentBenchmark *= (1 + bYield);
    return {
      name: monthNames[parseInt(String(findValue(item, ['MES']))) - 1],
      year: String(findValue(item, ['ANIO'])),
      pYield: (pYield * 100).toFixed(2),
      bYield: (bYield * 100).toFixed(2),
      portfolio: parseFloat(currentPortfolio.toFixed(2)),
      benchmark: parseFloat(currentBenchmark.toFixed(2))
    };
  });
}

export const fetchExecutionsFromApi = async (category: MarketCategory = 'forex'): Promise<ExecutionData> => {
  try {
    const data = await fetchTableData(`${category.toUpperCase()}_OPEN`);
    const mapRecord = (item: any, isTradeOpen: boolean): Execution => ({
      ticket: String(findValue(item, ['ticket', 'id', 'orden']) || '0'),
      symbol: String(findValue(item, ['symbol', 'simbolo']) || '---'),
      side: String(findValue(item, ['accion', 'side']) || '---'),
      lots: String(findValue(item, ['lotes', 'lots']) || '0.00'),
      open_time: String(findValue(item, ['fechadeapertura']) || ''),
      close_time: isTradeOpen ? 'PENDIENTE' : String(findValue(item, ['fechadecierre']) || ''),
      open_price: String(findValue(item, ['preciodeapertura']) || '0.00'),
      close_price: isTradeOpen ? '---' : String(findValue(item, ['preciodecierre']) || '0.00'),
      sl: '---', tp: '---',
      profit: parseSheetNumber(findValue(item, ['beneficioneto'])),
      gain: String(findValue(item, ['ganancia']) || '0.00'),
      swap: '0', commission: '0', comment: '', isOpen: isTradeOpen
    });

    return {
      closed: data.filter(r => findValue(r, ['STATUS', 'status']) === 'CLOSED').map(r => mapRecord(r, false)),
      open: data.filter(r => findValue(r, ['STATUS', 'status']) !== 'CLOSED').map(r => mapRecord(r, true))
    };
  } catch (error) {
    return { closed: [], open: [] };
  }
};

export const warmUpCache = async () => {
  const tabs = ['CONFIG_MAESTRA', 'HISTORIAL_RENDIMIENTOS', 'RESUMEN_KPI', 'PROTOCOLO_LIQUIDEZ', 'REPORTE_ESTRATEGICO', 'KPI_PORTAFOLIO', 'ESTRUCTURA_PORTAFOLIO', 'LIBRO_ACCIONISTAS'];
  return Promise.allSettled(tabs.map(tab => fetchTableData(tab)));
};
