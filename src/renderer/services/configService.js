// src/services/configService.js
import { supabase } from '../supabaseClient';

const CONFIG_TABLE = 'lineup_config'; // <<– aquí el nombre real de la tabla
const CONFIG_PK    = 1;

/**
 * Lee la configuración global de plantilla (la fila con id=1).
 * Si no existe, devuelve los valores por defecto.
 */
export async function getGlobalLineupConfig() {
  const { data, error, status } = await supabase
    .from(CONFIG_TABLE)
    .select('starters,subs')
    .eq('id', CONFIG_PK)
    .single();

  // Si no está la fila (PGRST116) o no existe la tabla (404), devolvemos defecto:
  if ((error && error.code === 'PGRST116') || status === 404) {
    return { starters: 5, subs: 6 };
  }
  if (error) throw error;

  return data || { starters: 5, subs: 6 };
}

/**
 * Upsert de la configuración global.
 */
export async function upsertGlobalLineupConfig(starters, subs) {
  const { error } = await supabase
    .from(CONFIG_TABLE)
    .upsert(
      { id: CONFIG_PK, starters, subs },
      { onConflict: 'id' }
    );
  if (error) throw error;
}
