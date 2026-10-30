import { demoFlights, type Flight } from "@flights";
import { getSupabase } from "./supabase";

export interface Board {
  flights: Flight[];
  source: string;
  /** Когда сборщик последний раз получил данные. */
  updatedAt: string;
}

interface FlightRow {
  id: string;
  direction: Flight["direction"];
  flight_number: string;
  airline_code: string;
  airline_name: string;
  city_name: string;
  airport_iata: string;
  airport_name: string;
  scheduled_at: string;
  estimated_at: string | null;
  actual_at: string | null;
  status: Flight["status"];
  terminal: string | null;
  gate: string | null;
  checkin_desks: string | null;
  baggage_belt: string | null;
  source: string;
  updated_at: string;
}

const fromRow = (r: FlightRow): Flight => ({
  id: r.id,
  direction: r.direction,
  flightNumber: r.flight_number,
  airlineCode: r.airline_code,
  airlineName: r.airline_name,
  cityName: r.city_name,
  airportIata: r.airport_iata,
  airportName: r.airport_name,
  scheduledAt: r.scheduled_at,
  estimatedAt: r.estimated_at,
  actualAt: r.actual_at,
  status: r.status,
  terminal: r.terminal,
  gate: r.gate,
  checkinDesks: r.checkin_desks,
  baggageBelt: r.baggage_belt,
  source: r.source,
  updatedAt: r.updated_at,
});

const HOUR = 3_600_000;

/** Рейсы для табло: из Supabase, а если база недоступна или пуста — демо-расписание. */
export async function getBoard(): Promise<Board> {
  const db = getSupabase();
  if (db) {
    const now = Date.now();
    const [flights, status] = await Promise.all([
      db
        .from("flights")
        .select("*")
        .gte("scheduled_at", new Date(now - 2 * HOUR).toISOString())
        .lte("scheduled_at", new Date(now + 12 * HOUR).toISOString())
        .order("scheduled_at"),
      db.from("settings").select("value").eq("key", "collector_status").maybeSingle(),
    ]);
    if (!flights.error && flights.data?.length) {
      const st = (status.data?.value ?? {}) as { provider?: string; at?: string };
      return {
        flights: (flights.data as FlightRow[]).map(fromRow),
        source: st.provider ?? flights.data[0].source,
        updatedAt: st.at ?? new Date().toISOString(),
      };
    }
  }
  return { flights: demoFlights(), source: "demo", updatedAt: new Date().toISOString() };
}

export async function getFlight(id: string): Promise<Flight | null> {
  const db = getSupabase();
  if (db) {
    const { data } = await db.from("flights").select("*").eq("id", id).maybeSingle();
    if (data) return fromRow(data as FlightRow);
  }
  return demoFlights().find((f) => f.id === id) ?? null;
}
