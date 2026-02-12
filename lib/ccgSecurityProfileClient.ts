
/**
 * CCG SECURITY & PROFILE CLIENT v2.2
 * Cliente aislado para la gestión de credenciales y datos maestros de socios.
 */

// URL ACTUALIZADA SEGÚN LA NUEVA IMPLEMENTACIÓN DEL USUARIO
const SECURITY_WEBAPP_URL = 'https://script.google.com/macros/s/AKfycbxbd9_bBKc85CR4oyHvdmj_LQx0St3j1t-1--tzwQ8iGR_2CgBLQcCHw9f-CpciDXJlpw/exec';

export interface ProfileUpdateData {
  TELEFONO?: string;
  FECHA_NACIMIENTO?: string;
  GENERO?: string;
  NUM_DOCUMENTO?: string;
  DIRECCION_RESIDENCIA?: string;
  AVATAR_URL?: string;
}

/**
 * Actualiza el PIN de acceso de un socio en el Libro de Accionistas.
 */
export async function ccgUpdatePin(uid: string, newPin: string): Promise<{ success: boolean; error?: string }> {
  if (!uid) return { success: false, error: 'UID de socio requerido' };
  
  // Validación de longitud 4 dígitos
  if (!/^\d{4}$/.test(newPin)) {
    return { success: false, error: 'El PIN debe tener 4 dígitos numéricos' };
  }

  const payload = {
    action: 'UPDATE_PIN',
    uid: uid,
    newPin: newPin
  };

  try {
    const response = await fetch(SECURITY_WEBAPP_URL, {
      method: 'POST',
      mode: 'cors',
      redirect: 'follow',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
      },
      body: JSON.stringify(payload)
    });

    const result = await response.json();
    return { 
      success: result.success === true || result.status === 'success', 
      error: result.error || result.message 
    };
  } catch (e) {
    console.error('CCG Security Error:', e);
    return { success: false, error: 'Error de comunicación con el servidor de seguridad' };
  }
}

/**
 * Actualiza los datos informativos del perfil en el Libro de Accionistas.
 */
export async function ccgUpdateProfile(uid: string, data: ProfileUpdateData): Promise<{ success: boolean; error?: string; updated?: string[] }> {
  if (!uid) return { success: false, error: 'UID de socio requerido' };

  const payload = {
    action: 'UPDATE_PROFILE',
    uid: uid,
    ...data
  };

  try {
    const response = await fetch(SECURITY_WEBAPP_URL, {
      method: 'POST',
      mode: 'cors',
      redirect: 'follow',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
      },
      body: JSON.stringify(payload)
    });

    const result = await response.json();
    return { 
      success: result.success === true || result.status === 'success', 
      error: result.error || result.message,
      updated: result.updated
    };
  } catch (e) {
    console.error('CCG Profile Update Error:', e);
    return { success: false, error: 'Error al actualizar el perfil institucional' };
  }
}
