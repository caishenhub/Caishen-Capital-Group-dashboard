
/**
 * CCG SECURITY & PROFILE CLIENT v2.2
 * Cliente unificado con el nuevo Master Engine.
 */

import { GOOGLE_CONFIG } from '../constants';

const SECURITY_WEBAPP_URL = GOOGLE_CONFIG.SCRIPT_API_URL;

export interface ProfileUpdateData {
  TELEFONO?: string;
  FECHA_NACIMIENTO?: string;
  GENERO?: string;
  NUM_DOCUMENTO?: string;
  DIRECCION_RESIDENCIA?: string;
  AVATAR_URL?: string;
}

export async function ccgUpdatePin(uid: string, newPin: string): Promise<{ success: boolean; error?: string }> {
  if (!uid) return { success: false, error: 'UID de socio requerido' };
  
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
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(payload)
    });

    const result = await response.json();
    return { success: result.success === true || result.status === 'success', error: result.error };
  } catch (e) {
    return { success: false, error: 'Error de comunicación' };
  }
}

export async function ccgUpdateProfile(uid: string, data: ProfileUpdateData): Promise<{ success: boolean; error?: string }> {
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
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(payload)
    });

    const result = await response.json();
    return { success: result.success === true || result.status === 'success', error: result.error };
  } catch (e) {
    return { success: false, error: 'Error al actualizar perfil' };
  }
}
