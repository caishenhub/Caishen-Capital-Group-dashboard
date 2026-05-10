
/**
 * CCG SECURITY & PROFILE CLIENT v2.2
 * Cliente unificado con el nuevo Master Engine.
 */

import { updateShareholderPin, updateShareholderProfile } from './googleSheets';

export interface ProfileUpdateData {
  TELEFONO?: string;
  FECHA_NACIMIENTO?: string;
  GENERO?: string;
  NUM_DOCUMENTO?: string;
  DIRECCION_RESIDENCIA?: string;
}

export async function ccgUpdatePin(uid: string, newPin: string): Promise<{ success: boolean; error?: string }> {
  const result = await updateShareholderPin(uid, newPin);
  return { success: result.success, error: result.success ? undefined : 'Error al actualizar PIN' };
}

export async function ccgUpdateProfile(uid: string, data: ProfileUpdateData): Promise<{ success: boolean; error?: string }> {
  const result = await updateShareholderProfile(uid, data);
  return { success: result.success, error: result.success ? undefined : 'Error al actualizar perfil' };
}
