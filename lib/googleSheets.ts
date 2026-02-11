
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
  orden: number;
  visible: boolean;
}

export type MarketCategory = 'forex' | 'stocks' | 'commodities';

const prefetchCache: Record<string, { data: any[], timestamp: number }> = {};
const inFlightRequests: Record<string, Promise<any[]>> = {};
const CACHE_DURATION = 1000 * 60 * 10;

// --- MOTOR DE PETICIONES RESILIENTE PARA GOOGLE APPS SCRIPT ---
async function robustFetch(url: string, options: RequestInit = {}, retries = 3): Promise<Response> {
  let lastError: any;
  for (let i = 0; i < retries; i++) {
    try {
      const controller = new AbortController();
      const id = setTimeout(() => controller.abort(), 10000); // 10s timeout
      const response = await fetch(url, { ...options, signal: controller.signal });
      clearTimeout(id);
      if (response.ok) return response;
      throw new Error(`HTTP ${response.status}`);
    } catch (err) {
      lastError = err;
      console.warn(`Intento de conexión ${i + 1} fallido:`, url);
      if (i < retries - 1) await new Promise(r => setTimeout(r, 1000 * (i + 1)));
    }
  }
  throw lastError;
}

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

export const warmUpCache = async () => {
  const tabs = ['CONFIG_MAESTRA', 'HISTORIAL_RENDIMIENTOS', 'RESUMEN_KPI', 'PROTOCOLO_LIQUIDEZ', 'REPORTE_ESTRATEGICO'];
  return Promise.allSettled(tabs.map(tab => fetchTableData(tab)));
};

export async function checkConnection(): Promise<boolean> {
  try {
    const res = await robustFetch(`${GOOGLE_CONFIG.SCRIPT_API_URL}?tab=PING`, { method: 'GET' }, 1);
    return res.ok;
  } catch (e) {
    return false;
  }
}

export async function fetchTableData(tabName: string, ignoreCache = false): Promise<any[]> {
  if (!GOOGLE_CONFIG.SCRIPT_API_URL) return [];

  if (!ignoreCache && prefetchCache[tabName]) {
    const cached = prefetchCache[tabName];
    if (Date.now() - cached.timestamp < CACHE_DURATION) return cached.data;
  }

  if (inFlightRequests[tabName]) return inFlightRequests[tabName];

  const fetchPromise = (async () => {
    try {
      const url = `${GOOGLE_CONFIG.SCRIPT_API_URL}?tab=${tabName}&cache_bust=${Date.now()}`;
      const response = await robustFetch(url, { method: 'GET' });
      const json = await response.json();
      const rows = Array.isArray(json) ? json : (json.rows || []);
      
      const processedData = rows.map((row: any) => {
        const cleanRow: any = {};
        Object.keys(row).forEach(key => { cleanRow[key.trim()] = row[key]; });
        return cleanRow;
      });

      prefetchCache[tabName] = { data: processedData, timestamp: Date.now() };
      return processedData;
    } catch (err) {
      console.error(`Fallo crítico al sincronizar ${tabName}:`, err);
      return prefetchCache[tabName]?.data || [];
    } finally {
      delete inFlightRequests[tabName];
    }
  })();

  inFlightRequests[tabName] = fetchPromise;
  return fetchPromise;
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
      orden: parseSheetNumber(findValue(row, ['ORDEN', 'order', 'orden'])),
      visible: String(findValue(row, ['VISIBLE', 'visible'])).toLowerCase() === 'true'
    }))
    .filter(s => s.visible)
    .sort((a, b) => a.orden - b.orden);
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
      orden: parseSheetNumber(findValue(row, ['ORDEN', 'order', 'orden']))
    }))
    .sort((a, b) => a.orden - b.orden);
}

export async function fetchCorporateNotices(ignoreCache = false): Promise<CorporateNotice[]> {
  const data = await fetchTableData('AVISOS_CORPORATIVOS', ignoreCache);
  return data.map((row, idx) => ({
    id: String(findValue(row, ['ID', 'id']) || `notice-${idx}`),
    title: String(findValue(row, ['TITULO', 'title', 'titulo']) || 'Aviso Corporativo'),
    date: formatSheetDate(findValue(row, ['FECHA', 'date', 'fecha'])), 
    description: String(findValue(row, ['DESCRIPCION', 'description', 'descripcion']) || ''),
    type: (findValue(row, ['TIPO', 'type', 'tipo']) || 'Info') as any,
    fullContent: String(findValue(row, ['CONTENIDO', 'content', 'contenido']) || ''),
    imageUrl: String(findValue(row, ['IMAGEN', 'image', 'imagen', 'image_url']) || '')
  })).reverse();
}

export async function publishNotice(notice: Partial<CorporateNotice>): Promise<{success: boolean}> {
  try {
    await robustFetch(GOOGLE_CONFIG.SCRIPT_API_URL, {
      method: 'POST',
      mode: 'no-cors',
      body: JSON.stringify({
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
      })
    });
    return { success: true };
  } catch (e) {
    return { success: false };
  }
}

export async function saveShareholderAccount(uid: string, accountData: any): Promise<{success: boolean}> {
  try {
    await robustFetch(GOOGLE_CONFIG.SCRIPT_API_URL, {
      method: 'POST',
      mode: 'no-cors',
      body: JSON.stringify({
        action: 'append',
        tab: 'DATOS_PAGO_SOCIOS',
        data: {
          UID_SOCIO: uid,
          TIPO_METODO: accountData.type,
          TITULAR_NOMBRE: accountData.holderName || '',
          TITULAR_DOC_TIPO: accountData.docType || '',
          TITULAR_DOC_NUM: accountData.docNumber || '',
          INSTITUCION_NOMBRE: accountData.institution,
          CUENTA_NUMERO: accountData.identifier,
          TIPO_CUENTA_RED: accountData.network,
          PAIS_EXCHANGE: accountData.platform,
          CODIGO_SWIFT_BIC: accountData.swiftCode || 'N/A',
          FECHA_REGISTRO: new Date().toISOString(),
          ESTATUS_VERIFICACION: 'PENDIENTE',
          SOLICITUDES_CAMBIO: ''
        }
      })
    });
    return { success: true };
  } catch (e) {
    return { success: false };
  }
}

export async function logAccountChangeRequest(uid: string, currentAccount: string): Promise<{success: boolean}> {
  try {
    await robustFetch(GOOGLE_CONFIG.SCRIPT_API_URL, {
      method: 'POST',
      mode: 'no-cors',
      body: JSON.stringify({
        action: 'update',
        tab: 'DATOS_PAGO_SOCIOS',
        data: { UID_SOCIO: uid, SOLICITUDES_CAMBIO: `Solicitud de modificación enviada el ${new Date().toLocaleString('es-ES')}` }
      })
    });
    return { success: true };
  } catch (e) {
    return { success: false };
  }
}

export async function fetchShareholderAccount(uid: string): Promise<any | null> {
  const data = await fetchTableData('DATOS_PAGO_SOCIOS', true);
  const targetUid = norm(uid);
  const record = data.find(r => norm(findValue(r, ['UID_SOCIO', 'uid'])) === targetUid);
  if (!record) return null;

  const type = String(findValue(record, ['TIPO_METODO', 'tipo']) || '');
  const institution = String(findValue(record, ['INSTITUCION_NOMBRE', 'institucion']) || '');
  const account = String(findValue(record, ['CUENTA_NUMERO', 'cuenta']) || '');
  const network = String(findValue(record, ['TIPO_CUENTA_RED', 'red']) || '');
  const platform = String(findValue(record, ['PAIS_EXCHANGE', 'plataforma']) || '');
  const holder = String(findValue(record, ['TITULAR_NOMBRE', 'nombre']) || '');
  const docNum = String(findValue(record, ['TITULAR_DOC_NUM', 'documento']) || '');
  const status = String(findValue(record, ['ESTATUS_VERIFICACION', 'estatus']) || 'PENDIENTE');
  const requests = String(findValue(record, ['SOLICITUDES_CAMBIO', 'solicitud']) || '');

  return {
    type, institution, account, network, platform, status,
    requestPending: requests.toLowerCase().includes('solicitud'),
    holderInfo: type === 'CRYPTO' ? `Wallet: ${account.slice(0, 10)}...` : `${holder} (${docNum})`
  };
}

export async function fetchReportsAdmin(ignoreCache = false): Promise<Report[]> {
  try {
    const data = await fetchTableData('REPORTES_ADMIN', ignoreCache);
    if (!data || data.length === 0) return MOCK_REPORTS;
    return data
      .filter(row => norm(findValue(row, ['STATUS', 'status'])) === 'publicado')
      .map(row => ({
          id: String(findValue(row, ['ID_REPORTE', 'id']) || Math.random().toString()),
          title: String(findValue(row, ['TITULO', 'title']) || 'Reporte Institucional'),
          date: formatSheetDate(findValue(row, ['FECHA_PUBLICACION', 'date'])),
          category: String(findValue(row, ['CATEGORIA', 'category']) || 'General') as any,
          summary: String(findValue(row, ['DESCRIPCION_CORTA', 'summary']) || ''),
          highlight: String(findValue(row, ['TEXTO_DESTACADO', 'highlight']) || ''),
          sections: [], // Simplificado para esta vista
          notaImportante: String(findValue(row, ['NOTA_IMPORTANTE', 'note']) || ''),
          visibleEnTodos: norm(findValue(row, ['VISIBLE_EN_TODOS', 'visible'])) === 'si',
          ordenForzado: parseSheetNumber(findValue(row, ['ORDEN_FORZADO', 'order'])),
          updatedAt: String(findValue(row, ['UPDATED_AT', 'updated']) || ''),
          color: String(findValue(row, ['COLOR', 'color', 'hex_color']) || '')
      })).sort((a, b) => (b.ordenForzado || 0) - (a.ordenForzado || 0));
  } catch (error) {
    return MOCK_REPORTS;
  }
}

export async function fetchPortfolioStructure(): Promise<PortfolioCategory[]> {
  const data = await fetchTableData('ESTRUCTURA_PORTAFOLIO');
  return data.map(item => ({
    name: String(findValue(item, ['CATEGORIA', 'name', 'categoria']) || 'Otros'),
    value: parseSheetNumber(findValue(item, ['PORCENTAJE', 'value', 'pct', 'porcentaje'])),
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
  try {
    await robustFetch(`${GOOGLE_CONFIG.SCRIPT_API_URL}?tab=${tabName}&action=update`, {
      method: 'POST', mode: 'no-cors', cache: 'no-cache', body: JSON.stringify(data)
    });
    return { success: true, message: "Petición enviada." };
  } catch (e) {
    return { success: false, message: "Error de red." };
  }
}

export async function fetchPerformanceHistory(): Promise<any[]> {
  const raw = await fetchTableData('HISTORIAL_RENDIMIENTOS');
  if (!raw || raw.length === 0) return [];
  const monthNames = ['ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN', 'JUL', 'AGO', 'SEP', 'OCT', 'NOV', 'DIC'];
  return raw.map(item => {
    const mes = parseInt(String(findValue(item, ['MES', 'month']) || 1));
    return {
      name: monthNames[mes - 1],
      year: String(findValue(item, ['ANIO', 'year']) || ''),
      pYield: (parseSheetNumber(findValue(item, ['RENDIMIENTO_FONDO', 'rendimiento'])) * 100).toFixed(2),
      portfolio: 1000 // Placeholder para cálculo acumulativo
    };
  });
}

export const fetchExecutionsFromApi = async (category: MarketCategory = 'forex'): Promise<ExecutionData> => {
  try {
    let targetUrl = GOOGLE_CONFIG.SCRIPT_API_URL;
    let openTab = 'STOCKS_OPEN';
    let closedTab = 'STOCKS_CLOSED';

    if (category === 'forex') targetUrl = GOOGLE_CONFIG.FOREX_API_URL;
    else if (category === 'commodities') targetUrl = GOOGLE_CONFIG.COMMODITIES_API_URL;

    const fetchFunc = async (tab: string) => {
      try {
        const res = await robustFetch(`${targetUrl}?tab=${tab}&t=${Date.now()}`);
        const j = await res.json();
        return Array.isArray(j) ? j : (j.rows || []);
      } catch (e) { return []; }
    };

    const [rawOpen, rawClosed] = await Promise.all([fetchFunc(openTab), fetchFunc(closedTab)]);
    return { 
      closed: rawClosed.map((item: any) => ({ 
        ticket: String(findValue(item, ['ticket', 'id'])),
        symbol: String(findValue(item, ['symbol', 'asset'])),
        side: String(findValue(item, ['accion', 'side'])),
        profit: parseSheetNumber(findValue(item, ['beneficio', 'profit'])),
        gain: String(findValue(item, ['ganancia', 'gain'])),
        open_time: String(findValue(item, ['apertura', 'open_time'])),
        close_time: String(findValue(item, ['cierre', 'close_time'])),
        isOpen: false
      })),
      open: rawOpen.map((item: any) => ({
        ticket: String(findValue(item, ['ticket', 'id'])),
        symbol: String(findValue(item, ['symbol', 'asset'])),
        side: String(findValue(item, ['accion', 'side'])),
        profit: parseSheetNumber(findValue(item, ['beneficio', 'profit'])),
        gain: String(findValue(item, ['ganancia', 'gain'])),
        open_time: String(findValue(item, ['apertura', 'open_time'])),
        isOpen: true
      }))
    };
  } catch (error) { return { closed: [], open: [] }; }
};
