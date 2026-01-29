import { createClient } from '@supabase/supabase-js';

// URL de tu proyecto Supabase
const supabaseUrl = 'https://ijaxrzajwhvukdabouec.supabase.co';
// API Key Pública (Debe estar en tus variables de entorno o pegada aquí para pruebas)
const supabaseKey = process.env.API_KEY || 'TU_ANON_KEY_PUBLICA_DE_SUPABASE'; 

export const supabase = createClient(supabaseUrl, supabaseKey);

export const checkSupabaseConnection = async () => {
  try {
    // Intentamos seleccionar de la tabla recién creada
    const { data, error } = await supabase.from('financial_config').select('id').limit(1);
    if (error) {
      console.warn("Supabase check error:", error.message);
      return false;
    }
    return true;
  } catch (e) {
    return false;
  }
};