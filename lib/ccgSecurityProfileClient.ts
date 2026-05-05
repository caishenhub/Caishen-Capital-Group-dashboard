/**
 * CCG SECURITY & PROFILE CLIENT v2.5 (OFUSCADO)
 * Cliente de seguridad con capa de protección en tránsito.
 */

import { GOOGLE_CONFIG } from '../constants';
import { obfuscate, unwrapResponse } from './obfuscation';

const SECURITY_WEBAPP_URL = GOOGLE_CONFIG.SCRIPT_API_URL;

export interface ProfileUpdateData {
  TELEFONO?: string;
  FECHA_NACIMIENTO?: string;
  GENERO?: string;
  NUM_DOCUMENTO?: string;
  DIRECCION_RESIDENCIA?: string;
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
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ _s: obfuscate(JSON.stringify(payload)) })
    });

    const wrappedResults = await response.json();
    const result = unwrapResponse(wrappedResults);
    return { 
      success: result.success === true || result.status === 'success', 
      error: result.error 
    };
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
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ _s: obfuscate(JSON.stringify(payload)) })
    });

    const wrappedResults = await response.json();
    const result = unwrapResponse(wrappedResults);
    return { 
      success: result.success === true || result.status === 'success', 
      error: result.error 
    };
  } catch (e) {
    return { success: false, error: 'Error al actualizar perfil' };
  }
}
