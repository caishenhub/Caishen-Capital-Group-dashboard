/**
 * UTILERÍA DE OFUSCACIÓN CAISHEN v1.4
 * Optimizado para compatibilidad total con Google Apps Script.
 */

const SECRET_KEY = "CAISHEN_SHIELD_VIBRANIUM_2026";

/**
 * XOR simple compatible con caracteres UTF-16 (estándar JS)
 */
function xor(str: string): string {
  const kLen = SECRET_KEY.length;
  let out = '';
  for (let i = 0; i < str.length; i++) {
    out += String.fromCharCode(str.charCodeAt(i) ^ SECRET_KEY.charCodeAt(i % kLen));
  }
  return out;
}

export function obfuscate(text: string): string {
  try {
    const xored = xor(text);
    if (typeof btoa !== 'undefined') {
      return btoa(unescape(encodeURIComponent(xored)));
    } else {
      return Buffer.from(xored, 'utf-8').toString('base64');
    }
  } catch (e) {
    return text;
  }
}

export function deobfuscate(encoded: string): string {
  try {
    let decoded: string;
    if (typeof atob !== 'undefined') {
      decoded = decodeURIComponent(escape(atob(encoded)));
    } else {
      decoded = Buffer.from(encoded, 'base64').toString('utf-8');
    }
    return xor(decoded);
  } catch (e) {
    return encoded;
  }
}

/**
 * Helper para envolver respuestas JSON en un contenedor ofuscado.
 */
export function wrapResponse(data: any): { _s: string } {
  return { _s: obfuscate(JSON.stringify(data)) };
}

/**
 * Helper para extraer datos de un contenedor ofuscado.
 */
export function unwrapResponse(wrapped: any): any {
  if (wrapped && wrapped._s) {
    try {
      const decrypted = deobfuscate(wrapped._s);
      return JSON.parse(decrypted);
    } catch (e) {
      console.warn("Fallo al desencriptar respuesta:", e);
      return wrapped;
    }
  }
  return wrapped;
}
