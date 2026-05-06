/**
 * UTILERÍA DE OFUSCACIÓN CAISHEN v1.3
 * Implementación robusta basada en bytes para compatibilidad total Node/Navegador.
 */

const SECRET_KEY = "CAISHEN_SHIELD_VIBRANIUM_2026";

/**
 * Convierte un string a Uint8Array (UTF-8).
 */
function stringToBytes(str: string): Uint8Array {
  if (typeof TextEncoder !== 'undefined') {
    return new TextEncoder().encode(str);
  }
  // Fallback para entornos Node antiguos (aunque el agente usa Node moderno)
  return new Uint8Array(Buffer.from(str, 'utf-8'));
}

/**
 * Convierte Uint8Array a string (UTF-8).
 */
function bytesToString(bytes: Uint8Array): string {
  if (typeof TextDecoder !== 'undefined') {
    return new TextDecoder().decode(bytes);
  }
  return Buffer.from(bytes).toString('utf-8');
}

/**
 * Aplica XOR sobre un Uint8Array.
 */
function xor(bytes: Uint8Array): Uint8Array {
  const keyBytes = stringToBytes(SECRET_KEY);
  const result = new Uint8Array(bytes.length);
  for (let i = 0; i < bytes.length; i++) {
    result[i] = bytes[i] ^ keyBytes[i % keyBytes.length];
  }
  return result;
}

/**
 * Codifica Uint8Array a Base64.
 */
function bytesToBase64(bytes: Uint8Array): string {
  if (typeof Buffer !== 'undefined') {
    return Buffer.from(bytes).toString('base64');
  }
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

/**
 * Decodifica Base64 a Uint8Array.
 */
function base64ToBytes(base64: string): Uint8Array {
  if (typeof Buffer !== 'undefined') {
    return new Uint8Array(Buffer.from(base64, 'base64'));
  }
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

export function obfuscate(text: string): string {
  try {
    const bytes = stringToBytes(text);
    const xored = xor(bytes);
    return bytesToBase64(xored);
  } catch (e) {
    console.error("Error al ofuscar:", e);
    return text;
  }
}

export function deobfuscate(encoded: string): string {
  try {
    const bytes = base64ToBytes(encoded);
    const xored = xor(bytes);
    return bytesToString(xored);
  } catch (e) {
    console.error("Error al desofuscar:", e);
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
