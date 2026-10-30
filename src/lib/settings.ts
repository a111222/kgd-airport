import { getSupabase } from "./supabase";

export type ThemeName = "warm" | "dark";
/** user — посетитель переключает сам; warm/dark — админ зафиксировал тему для всех. */
export type ThemePolicy = "user" | ThemeName;

export interface ThemeSettings {
  policy: ThemePolicy;
  default: ThemeName;
}

const FALLBACK: ThemeSettings = { policy: "user", default: "warm" };

export async function getThemeSettings(): Promise<ThemeSettings> {
  const db = getSupabase();
  if (!db) return FALLBACK;
  const { data } = await db.from("settings").select("value").eq("key", "theme").maybeSingle();
  const v = (data?.value ?? {}) as Partial<ThemeSettings>;
  const policy: ThemePolicy = v.policy === "warm" || v.policy === "dark" ? v.policy : "user";
  const def: ThemeName = v.default === "dark" ? "dark" : "warm";
  return { policy, default: def };
}

/** Тема, с которой страница рендерится на сервере (до учёта выбора посетителя). */
export function initialTheme(s: ThemeSettings): ThemeName {
  return s.policy === "user" ? s.default : s.policy;
}
