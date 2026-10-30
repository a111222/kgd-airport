import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// Публичные данные проекта kgd-airport; переменные окружения позволяют подключить другой проект.
const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://cdqrygyoqirigmsaxter.supabase.co";
const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || "sb_publishable_9k4PNC4Y9IqbGCHycV1Z1w_bma-NI3N";

let client: SupabaseClient | null = null;

/** Публичный клиент (только чтение по RLS). Если база недоступна, сайт работает на демо-данных. */
export function getSupabase(): SupabaseClient | null {
  if (!url || !key) return null;
  client ??= createClient(url, key, { auth: { persistSession: false } });
  return client;
}
