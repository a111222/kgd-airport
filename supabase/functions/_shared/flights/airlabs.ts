// AirLabs Schedules API: https://airlabs.co/docs/schedules
// Отдаёт вылеты (dep_iata) и прилёты (arr_iata) на ближайшие ~10 часов с задержками.

import { airlineName, airportInfo } from "./dictionary.ts";
import { type Direction, type Flight, type FlightStatus, flightId, KGD_IATA } from "./types.ts";

interface AirLabsRow {
  flight_iata?: string;
  airline_iata?: string;
  dep_iata?: string;
  arr_iata?: string;
  dep_time_utc?: string;
  dep_estimated_utc?: string;
  dep_actual_utc?: string;
  arr_time_utc?: string;
  arr_estimated_utc?: string;
  arr_actual_utc?: string;
  dep_terminal?: string;
  dep_gate?: string;
  arr_terminal?: string;
  arr_gate?: string;
  arr_baggage?: string;
  status?: string;
  delayed?: number;
  cs_flight_iata?: string | null;
}

const toIso = (utc?: string | null) => (utc ? new Date(utc.replace(" ", "T") + "Z").toISOString() : null);

function mapStatus(direction: Direction, s: string | undefined, delayed: number | undefined): FlightStatus {
  if (s === "cancelled") return "cancelled";
  if (direction === "dep") {
    if (s === "active" || s === "landed") return "departed";
    return (delayed ?? 0) >= 15 ? "delayed" : "scheduled";
  }
  if (s === "landed") return "landed";
  if (s === "active") return (delayed ?? 0) >= 15 ? "delayed" : "airborne";
  return (delayed ?? 0) >= 15 ? "delayed" : "scheduled";
}

function mapRow(direction: Direction, r: AirLabsRow, now: string): Flight | null {
  if (r.cs_flight_iata) return null; // код-шеринг: показываем только выполняющий рейс
  const scheduled = toIso(direction === "dep" ? r.dep_time_utc : r.arr_time_utc);
  if (!r.flight_iata || !scheduled) return null;
  const otherIata = (direction === "dep" ? r.arr_iata : r.dep_iata) || "";
  const code = r.airline_iata || r.flight_iata.slice(0, 2);
  const flightNumber = `${code} ${r.flight_iata.slice(code.length)}`;
  const place = airportInfo(otherIata);
  return {
    id: flightId(direction, flightNumber, scheduled),
    direction,
    flightNumber,
    airlineCode: code,
    airlineName: airlineName(code),
    cityName: place.city,
    airportIata: otherIata,
    airportName: place.airport,
    scheduledAt: scheduled,
    estimatedAt: toIso(direction === "dep" ? r.dep_estimated_utc : r.arr_estimated_utc),
    actualAt: toIso(direction === "dep" ? r.dep_actual_utc : r.arr_actual_utc),
    status: mapStatus(direction, r.status, r.delayed),
    terminal: (direction === "dep" ? r.dep_terminal : r.arr_terminal) ?? null,
    gate: (direction === "dep" ? r.dep_gate : r.arr_gate) ?? null,
    checkinDesks: null,
    baggageBelt: direction === "arr" ? r.arr_baggage ?? null : null,
    source: "airlabs",
    updatedAt: now,
  };
}

export async function airlabsFlights(apiKey: string): Promise<Flight[]> {
  const now = new Date().toISOString();
  const get = async (direction: Direction) => {
    const param = direction === "dep" ? "dep_iata" : "arr_iata";
    const res = await fetch(`https://airlabs.co/api/v9/schedules?${param}=${KGD_IATA}&api_key=${encodeURIComponent(apiKey)}`);
    if (!res.ok) throw new Error(`AirLabs ${direction}: HTTP ${res.status}`);
    const body = (await res.json()) as { response?: AirLabsRow[]; error?: { message?: string } };
    if (body.error) throw new Error(`AirLabs ${direction}: ${body.error.message ?? "error"}`);
    return (body.response ?? []).map((r) => mapRow(direction, r, now)).filter((f): f is Flight => f !== null);
  };
  const [dep, arr] = await Promise.all([get("dep"), get("arr")]);
  return [...dep, ...arr];
}
