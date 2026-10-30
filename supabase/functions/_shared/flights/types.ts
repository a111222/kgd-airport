// Общая модель рейса. Этот модуль используют и Next.js-приложение, и Edge Function
// сборщика в Supabase (Deno), поэтому здесь только чистый TypeScript без зависимостей.

export type Direction = "dep" | "arr";

export type FlightStatus =
  | "scheduled"
  | "checkin"
  | "boarding"
  | "gate_closed"
  | "departed"
  | "delayed"
  | "cancelled"
  | "airborne"
  | "landed"
  | "arrived"
  | "unknown";

export interface Flight {
  /** Стабильный ключ: направление + номер рейса + плановая дата/время (UTC). */
  id: string;
  direction: Direction;
  flightNumber: string;
  airlineCode: string;
  airlineName: string;
  /** Город и аэропорт на другом конце маршрута. */
  cityName: string;
  airportIata: string;
  airportName: string;
  /** Время в аэропорту Храброво, ISO-строки UTC. */
  scheduledAt: string;
  estimatedAt: string | null;
  actualAt: string | null;
  status: FlightStatus;
  terminal: string | null;
  gate: string | null;
  checkinDesks: string | null;
  baggageBelt: string | null;
  source: string;
  updatedAt: string;
}

export type ProviderName = "demo" | "airlabs" | "aerodatabox";

export interface ProviderKeys {
  airlabsKey?: string;
  aerodataboxKey?: string;
  /** Хост RapidAPI или api.market для AeroDataBox. */
  aerodataboxHost?: string;
}

export const KGD_IATA = "KGD";
/** Калининград живёт по UTC+2 круглый год (без перехода на летнее время). */
export const KGD_UTC_OFFSET_MIN = 120;

export function flightId(direction: Direction, flightNumber: string, scheduledAtIso: string): string {
  return `${direction}-${flightNumber.replace(/\s+/g, "")}-${scheduledAtIso.slice(0, 16)}`;
}
