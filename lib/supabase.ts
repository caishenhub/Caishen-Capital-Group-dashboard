
import { createClient } from '@supabase/supabase-js';

// URL de tu proyecto Supabase
const supabaseUrl = 'https://ijaxrzajwhvukdabouec.supabase.co';
// API Key Pública obtenida de process.env.API_KEY según requerimientos del sistema
const supabaseKey = process.env.API_KEY || ''; 

export const supabase = createClient(supabaseUrl, supabaseKey);

export const checkSupabaseConnection = async () => {
  if (!supabaseUrl || !supabaseKey) return false;
  try {
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
