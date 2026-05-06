/**
 * UTILERÍA DE OFUSCACIÓN CAISHEN v1.2
 * Diseño simplificado para máxima compatibilidad entre Node y Navegador.
 */

const SECRET_KEY = "CAISHEN_SHIELD_VIBRANIUM_2026";

/**
 * Encriptación XOR robusta compatible con caracteres especiales.
 */
function applyXor(input: string): string {
  const keyLength = SECRET_KEY.length;
  return input.split('').map((char, i) => {
    return String.fromCharCode(char.charCodeAt(0) ^ SECRET_KEY.charCodeAt(i % keyLength));
  }).join('');
}

export function obfuscate(text: string): string {
  try {
    const xored = applyXor(text);
    if (typeof btoa !== 'undefined') {
      // Navegador: Usamos escape para asegurar compatibilidad con caracteres especiales
      return btoa(unescape(encodeURIComponent(xored)));
    } else {
      // Servidor (Node)
      return Buffer.from(xored, 'utf-8').toString('base64');
    }
  } catch (e) {
    console.error("Error al ofuscar:", e);
    return text;
  }
}

export function deobfuscate(encoded: string): string {
  try {
    let decoded: string;
    if (typeof atob !== 'undefined') {
      // Navegador
      decoded = decodeURIComponent(escape(atob(encoded)));
    } else {
      // Servidor (Node)
      decoded = Buffer.from(encoded, 'base64').toString('utf-8');
    }
    return applyXor(decoded);
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
