
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

const FOREX_API_URL = 'https://script.google.com/macros/s/AKfycbyJwdqsA0fTS7HB4BAMWTO7_gogMAq1SzdvDJOAUg8tWA5G3dqpm7m4LBTwRdzDHVAY/exec'; 
const COMMODITIES_API_URL = 'https://script.google.com/macros/s/AKfycbyIKYItxgt7yRPTdP84d1QGxsQejGF2dQj5M9VFSSZBiDsSwsMsNRIGUjY5wXFgJDOjMQ/exec';
const STOCKS_API_URL = GOOGLE_CONFIG.SCRIPT_API_URL; 

const PROFILE_API_URL = 'https://script.google.com/macros/s/AKfycbyjcgbOFYd3BnOstoI25WycHJY-h6ybeTQRqWHQC23dUiHVsTXZBlb1646AJs0ARHmvlQ/exec';

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
  if (isNaN(date.getTime())) {
    return String(dateVal).replace(/\./g, '');
  }
  return date.toLocaleDateString('es-ES', { 
    day: '2-digit', 
    month: 'short', 
    year: 'numeric' 
  }).replace(/\./g, '');
}

export const warmUpCache = async () => {
  const tabs = ['CONFIG_MAESTRA', 'HISTORIAL_RENDIMIENTOS', 'RESUMEN_KPI', 'PROTOCOLO_LIQUIDEZ', 'REPORTE_ESTRATEGICO', 'KPI_PORTAFOLIO', 'ESTRUCTURA_PORTAFOLIO', 'LIBRO_ACCIONISTAS'];
  return Promise.allSettled(tabs.map(tab => fetchTableData(tab)));
};

export async function checkConnection(): Promise<boolean> {
  if (!GOOGLE_CONFIG.SCRIPT_API_URL || GOOGLE_CONFIG.SCRIPT_API_URL.length < 20) return false;
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3000);
    const res = await fetch(`${GOOGLE_CONFIG.SCRIPT_API_URL}?tab=PING`, { signal: controller.signal });
    clearTimeout(timeout);
    return res.ok;
  } catch (e) {
    return false;
  }
}

export async function fetchTableData(tabName: string, ignoreCache = false): Promise<any[]> {
  if (!GOOGLE_CONFIG.SCRIPT_API_URL) return [];

  if (!ignoreCache && prefetchCache[tabName]) {
    const cached = prefetchCache[tabName];
    if (Date.now() - cached.timestamp < CACHE_DURATION) {
      if (Date.now() - cached.timestamp > 1000 * 60) {
        refreshInBackground(tabName);
      }
      return cached.data;
    }
  }

  if (inFlightRequests[tabName]) {
    return inFlightRequests[tabName];
  }

  const fetchPromise = (async () => {
    try {
      const url = `${GOOGLE_CONFIG.SCRIPT_API_URL}?tab=${tabName}&cache_bust=${Date.now()}`;
      const response = await fetch(url, { method: 'GET' });
      if (!response.ok) throw new Error(`Status: ${response.status}`);
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
      console.error(`Error fetching ${tabName}:`, err);
      return prefetchCache[tabName]?.data || [];
    } finally {
      delete inFlightRequests[tabName];
    }
  })();

  inFlightRequests[tabName] = fetchPromise;
  return fetchPromise;
}

async function refreshInBackground(tabName: string) {
  if (inFlightRequests[tabName]) return;
  try {
    const url = `${GOOGLE_CONFIG.SCRIPT_API_URL}?tab=${tabName}&cache_bust=${Date.now()}`;
    const response = await fetch(url);
    const json = await response.json();
    const rows = Array.isArray(json) ? json : (json.rows || []);
    const processedData = rows.map((row: any) => {
      const cleanRow: any = {};
      Object.keys(row).forEach(key => { cleanRow[key.trim()] = row[key]; });
      return cleanRow;
    });
    prefetchCache[tabName] = { data: processedData, timestamp: Date.now() };
  } catch (e) { }
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
  const payload = {
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
  };
  try {
    await fetch(PROFILE_API_URL, {
      method: 'POST',
      mode: 'cors',
      redirect: 'follow',
      body: JSON.stringify(payload)
    });
    return { success: true };
  } catch (e) {
    return { success: false };
  }
}

export async function updateShareholderPin(uid: string, newPin: string): Promise<{success: boolean}> {
  const payload = {
    action: 'UPDATE_PIN',
    uid: uid,
    newPin: newPin
  };
  
  try {
    const response = await fetch(PROFILE_API_URL, {
      method: 'POST',
      mode: 'cors', 
      redirect: 'follow',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(payload)
    });
    const result = await response.json();
    return { success: result.success === true || result.status === 'success' }; 
  } catch (e) {
    console.error("Error en actualización de PIN:", e);
    return { success: false }; 
  }
}

export async function saveShareholderAccount(uid: string, accountData: any): Promise<{success: boolean}> {
  const payload = {
    action: 'append',
    tab: 'DATOS_PAGO_SOCIOS',
    data: {
      UID_SOCIO: uid,
      TIPO_METODO: accountData.type,
      TITULAR_NOMBRE: accountData.holderName,
      TITULAR_DOC_TIPO: accountData.docType,
      TITULAR_DOC_NUM: accountData.docNumber,
      INSTITUCION_NOMBRE: accountData.institution,
      CUENTA_NUMERO: accountData.identifier,
      TIPO_CUENTA_RED: accountData.network,
      PAIS_EXCHANGE: accountData.platform,
      CODIGO_SWIFT_BIC: accountData.swiftCode || 'N/A',
      FECHA_REGISTRO: new Date().toISOString(),
      ESTATUS_VERIFICACION: 'PENDIENTE',
      SOLICITUDES_CAMBIO: ''
    }
  };
  try {
    const res = await fetch(PROFILE_API_URL, {
      method: 'POST',
      mode: 'cors',
      redirect: 'follow',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(payload)
    });
    const result = await res.json();
    return { success: result.success === true || result.status === 'success' };
  } catch (e) {
    console.error("Error guardando cuenta:", e);
    return { success: false };
  }
}

export async function logAccountChangeRequest(uid: string, currentAccount: string): Promise<{success: boolean}> {
  const payload = {
    action: 'update',
    tab: 'DATOS_PAGO_SOCIOS',
    data: {
      UID_SOCIO: uid,
      SOLICITUDES_CAMBIO: `Solicitud de modificación enviada el ${new Date().toLocaleString('es-ES')}`
    }
  };
  try {
    const res = await fetch(PROFILE_API_URL, {
      method: 'POST',
      mode: 'cors',
      redirect: 'follow',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(payload)
    });
    const result = await res.json();
    return { success: result.success === true || result.status === 'success' };
  } catch (e) {
    console.error("Error solicitando cambio:", e);
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
    type,
    institution,
    account,
    network,
    platform,
    status,
    requestPending: requests.toLowerCase().includes('solicitud'),
    holderInfo: type === 'CRYPTO' ? `Wallet: ${account.slice(0, 10)}...` : `${holder} (${docNum})`
  };
}

function normalizeSections(rawJson: string): ReportSection[] {
  if (!rawJson || rawJson.trim() === '') return [];
  let sanitized = rawJson.trim();
  try {
    const parsed = JSON.parse(sanitized);
    if (!Array.isArray(parsed)) return [];
    return parsed.map(s => ({
      titulo: s.titulo || s.title || 'Sección',
      parrafos: Array.isArray(s.parrafos) ? s.parrafos : (s.content ? [s.content] : []),
      items: Array.isArray(s.items) ? s.items : []
    }));
  } catch (e) {
    return [{
      titulo: 'Contenido del Comunicado',
      parrafos: [sanitized.replace(/[\[\]\{\}"\\]/g, ' ').trim()],
      items: []
    }];
  }
}

export async function fetchReportsAdmin(ignoreCache = false): Promise<Report[]> {
  try {
    const data = await fetchTableData('REPORTES_ADMIN', ignoreCache);
    if (!data || data.length === 0) return MOCK_REPORTS;
    const reports: Report[] = data
      .filter(row => norm(findValue(row, ['STATUS', 'status'])) === 'publicado')
      .map(row => {
        const sectionsJson = String(findValue(row, ['SECCIONES_JSON', 'secciones_json']) || '');
        const sections = normalizeSections(sectionsJson);
        return {
          id: String(findValue(row, ['ID_REPORTE', 'id']) || Math.random().toString()),
          title: String(findValue(row, ['TITULO', 'title']) || 'Reporte Institucional'),
          date: formatSheetDate(findValue(row, ['FECHA_PUBLICACION', 'date'])),
          category: String(findValue(row, ['CATEGORIA', 'category']) || 'General') as any,
          summary: String(findValue(row, ['DESCRIPCION_CORTA', 'summary']) || ''),
          highlight: String(findValue(row, ['TEXTO_DESTACADO', 'highlight']) || ''),
          sections: sections,
          notaImportante: String(findValue(row, ['NOTA_IMPORTANTE', 'note']) || ''),
          visibleEnTodos: norm(findValue(row, ['VISIBLE_EN_TODOS', 'visible'])) === 'si',
          ordenForzado: parseSheetNumber(findValue(row, ['ORDEN_FORZADO', 'order'])),
          updatedAt: String(findValue(row, ['UPDATED_AT', 'updated']) || ''),
          color: String(findValue(row, ['COLOR', 'color', 'hex_color']) || '')
        };
      });
    return reports.sort((a, b) => {
      if ((b.ordenForzado || 0) !== (a.ordenForzado || 0)) return (b.ordenForzado || 0) - (a.ordenForzado || 0);
      const timeA = new Date(a.date).getTime();
      const timeB = new Date(b.date).getTime();
      if (timeB !== timeA) return timeB - timeA;
      const updateA = new Date(a.updatedAt || '').getTime();
      const updateB = new Date(b.updatedAt || '').getTime();
      return updateB - updateA;
    });
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
  return data.map(item => {
    const rawVal = findValue(item, ['VALOR', 'value', 'dato']);
    const numVal = parseSheetNumber(rawVal);
    const type = String(findValue(item, ['TIPO', 'type']) || '').toLowerCase();
    let displayValue = String(rawVal || '---');
    if (numVal !== 0 && (type === 'exposicion' || type === 'diversificacion')) {
      const pctValue = Math.abs(numVal) < 1 ? numVal * 100 : numVal;
      displayValue = pctValue.toLocaleString('es-ES', { minimumFractionDigits: 1, maximumFractionDigits: 2 }) + '%';
    } else if (typeof rawVal === 'number' && rawVal > 1) {
      displayValue = rawVal.toLocaleString('es-ES');
    }
    return {
      label: String(findValue(item, ['ETIQUETA', 'label', 'titulo']) || ''),
      value: displayValue,
      sub: String(findValue(item, ['SUBTEXTO', 'subtext', 'descripcion']) || ''),
      type: type as any
    };
  });
}

export async function updateTableData(tabName: string, data: any): Promise<{success: boolean, message: string}> {
  try {
    const url = `${GOOGLE_CONFIG.SCRIPT_API_URL}?tab=${tabName}&action=update`;
    await fetch(url, {
      method: 'POST',
      mode: 'no-cors',
      cache: 'no-cache',
      body: JSON.stringify(data)
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
  const sorted = [...raw].sort((a, b) => {
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
      try {
        const url = `${targetUrl}?tab=${tab}&t=${Date.now()}`;
        const res = await fetch(url);
        if (!res.ok) return [];
        const j = await res.json();
        return Array.isArray(j) ? j : (j.rows || []);
      } catch (e) {
        return [];
      }
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
