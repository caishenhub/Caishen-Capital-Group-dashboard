/**
 * UTILERÍA DE OFUSCACIÓN CAISHEN v1.1
 * Protege los datos en tránsito entre el cliente y el servidor proxy.
 * Actualizado para soporte robusto de caracteres UTF-8 en Node y Navegador.
 */

const SECRET_KEY = "CAISHEN_SHIELD_VIBRANIUM_2026";

/**
 * Aplica un cifrado XOR seguido de Base64 para ocultar datos en el Network Tab.
 */
export function obfuscate(text: string): string {
  try {
    // 1. Convertir texto a bytes UTF-8 (Consistente entre entornos)
    const utf8Bytes = typeof Buffer !== 'undefined' 
      ? Buffer.from(text, 'utf-8') 
      : new TextEncoder().encode(text);
    
    // 2. Aplicar XOR sobre los bytes
    const xored = new Uint8Array(utf8Bytes.length);
    for (let i = 0; i < utf8Bytes.length; i++) {
      xored[i] = utf8Bytes[i] ^ SECRET_KEY.charCodeAt(i % SECRET_KEY.length);
    }
    
    // 3. Convertir a Base64
    if (typeof Buffer !== 'undefined') {
      return Buffer.from(xored).toString('base64');
    } else {
      let binary = '';
      const len = xored.byteLength;
      for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(xored[i]);
      }
      return btoa(binary);
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
    // 1. Convertir Base64 a bytes
    let xored: Uint8Array;
    if (typeof Buffer !== 'undefined') {
      xored = new Uint8Array(Buffer.from(encoded, 'base64'));
    } else {
      const binary = atob(encoded);
      xored = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) {
        xored[i] = binary.charCodeAt(i);
      }
    }
    
    // 2. Revertir XOR
    const utf8Bytes = new Uint8Array(xored.length);
    for (let i = 0; i < xored.length; i++) {
      utf8Bytes[i] = xored[i] ^ SECRET_KEY.charCodeAt(i % SECRET_KEY.length);
    }
    
    // 3. Convertir bytes de vuelta a texto UTF-8
    if (typeof Buffer !== 'undefined') {
      return Buffer.from(utf8Bytes).toString('utf-8');
    } else {
      return new TextDecoder().decode(utf8Bytes);
    }
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
      const decrypted = deobfuscate(wrapped._s);
      return JSON.parse(decrypted);
    } catch (e) {
      console.warn("Fallo al desencriptar respuesta:", e);
      return wrapped;
    }
  }
  return wrapped;
}
