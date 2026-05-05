/**
 * UTILERÍA DE OFUSCACIÓN CAISHEN v1.0
 * Protege los datos en tránsito entre el cliente y el servidor proxy.
 */

const SECRET_KEY = "CAISHEN_SHIELD_VIBRANIUM_2026";

/**
 * Aplica un cifrado XOR simple seguido de Base64 para ocultar datos en el Network Tab.
 */
export function obfuscate(text: string): string {
  try {
    const xored = text.split('').map((char: string, i: number) => 
      String.fromCharCode(char.charCodeAt(0) ^ SECRET_KEY.charCodeAt(i % SECRET_KEY.length))
    ).join('');
    
    // Usamos btoa para navegadores y Buffer para Node
    if (typeof btoa !== 'undefined') {
      return btoa(unescape(encodeURIComponent(xored)));
    } else {
      // @ts-ignore
      return Buffer.from(xored, 'binary').toString('base64');
    }
  } catch (e) {
    console.error("Obfuscation error:", e);
    return text;
  }
}

/**
 * Revierte la ofuscación aplicada.
 */
export function deobfuscate(encoded: string): string {
  try {
    let decoded: string;
    if (typeof atob !== 'undefined') {
      decoded = decodeURIComponent(escape(atob(encoded)));
    } else {
      // @ts-ignore
      decoded = Buffer.from(encoded, 'base64').toString('binary');
    }
    
    return decoded.split('').map((char: string, i: number) => 
      String.fromCharCode(char.charCodeAt(0) ^ SECRET_KEY.charCodeAt(i % SECRET_KEY.length))
    ).join('');
  } catch (e) {
    console.error("Deobfuscation error:", e);
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
      return JSON.parse(deobfuscate(wrapped._s));
    } catch (e) {
      return wrapped;
    }
  }
  return wrapped;
}
