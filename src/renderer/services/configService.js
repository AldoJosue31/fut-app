// src/services/configService.js
import { supabase } from '../supabaseClient';

const CONFIG_TABLE = 'global_lineup_config';
const CONFIG_PK    = 1;

/** Lee la configuración global de plantilla. */
export async function getGlobalLineupConfig() {
  const { data, error, status } = await supabase
    .from(CONFIG_TABLE)
    .select('starters,subs')
    .eq('id', CONFIG_PK)
    .single();

  // Si no existe la fila o tabla, devolvemos por defecto:
  if ((error && error.code === 'PGRST116') || status === 404) {
    return { starters: 5, subs: 6 };
  }
  if (error) throw error;
  return data || { starters: 5, subs: 6 };
}

/** Inserta o actualiza la configuración global. */
export async function upsertGlobalLineupConfig(starters, subs) {
  const { error } = await supabase
    .from(CONFIG_TABLE)
    .upsert(
      { id: CONFIG_PK, starters, subs },
      { onConflict: 'id' }
    );
  if (error) throw error;
}
