// AeroDataBox FIDS: https://aerodatabox.com/realtive-fids/
// Один запрос возвращает вылеты и прилёты аэропорта в окне «−2 ч … +12 ч».

import { airlineName, airportInfo } from "./dictionary.ts";
import { type Direction, type Flight, type FlightStatus, flightId, KGD_IATA } from "./types.ts";

interface AdbTime { utc?: string }
interface AdbMovement {
  airport?: { iata?: string; name?: string; municipalityName?: string };
  scheduledTime?: AdbTime;
  revisedTime?: AdbTime;
  runwayTime?: AdbTime;
  terminal?: string;
  gate?: string;
  checkInDesk?: string;
  baggageBelt?: string;
}
interface AdbFlight {
  number?: string;
  status?: string;
  codeshareStatus?: string;
  airline?: { name?: string; iata?: string };
  movement?: AdbMovement;
}

const toIso = (t?: AdbTime) => (t?.utc ? new Date(t.utc.replace(" ", "T").replace(/Z?$/, "Z")).toISOString() : null);

function mapStatus(direction: Direction, s?: string): FlightStatus {
  switch (s) {
    case "CheckIn": return "checkin";
    case "Boarding": return "boarding";
    case "GateClosed": return "gate_closed";
    case "Departed": return direction === "dep" ? "departed" : "airborne";
    case "EnRoute": return direction === "dep" ? "departed" : "airborne";
    case "Approaching": return "airborne";
    case "Delayed": return "delayed";
    case "Arrived": return direction === "dep" ? "departed" : "arrived";
    case "Canceled":
    case "CanceledUncertain": return "cancelled";
    case "Expected": return "scheduled";
    default: return "unknown";
  }
}

function mapFlight(direction: Direction, f: AdbFlight, now: string): Flight | null {
  if (f.codeshareStatus === "IsCodeshared") return null;
  const m = f.movement ?? {};
  const scheduled = toIso(m.scheduledTime);
  if (!f.number || !scheduled) return null;
  const code = f.airline?.iata || f.number.split(" ")[0];
  const flightNumber = f.number.trim();
  const iata = m.airport?.iata || "";
  const place = airportInfo(iata, m.airport?.municipalityName, m.airport?.name);
  return {
    id: flightId(direction, flightNumber, scheduled),
    direction,
    flightNumber,
    airlineCode: code,
    airlineName: airlineName(code, f.airline?.name),
    cityName: place.city,
    airportIata: iata,
    airportName: place.airport,
    scheduledAt: scheduled,
    estimatedAt: toIso(m.revisedTime),
    actualAt: toIso(m.runwayTime),
    status: mapStatus(direction, f.status),
    terminal: m.terminal ?? null,
    gate: m.gate ?? null,
    checkinDesks: m.checkInDesk ?? null,
    baggageBelt: m.baggageBelt ?? null,
    source: "aerodatabox",
    updatedAt: now,
  };
}

export async function aerodataboxFlights(apiKey: string, host = "aerodatabox.p.rapidapi.com"): Promise<Flight[]> {
  const url = `https://${host}/flights/airports/iata/${KGD_IATA}?offsetMinutes=-120&durationMinutes=720` +
    "&withLeg=false&direction=Both&withCancelled=true&withCodeshared=false&withCargo=false&withPrivate=false";
  const res = await fetch(url, { headers: { "X-RapidAPI-Key": apiKey, "X-RapidAPI-Host": host } });
  if (!res.ok) throw new Error(`AeroDataBox: HTTP ${res.status}`);
  const body = (await res.json()) as { departures?: AdbFlight[]; arrivals?: AdbFlight[] };
  const now = new Date().toISOString();
  return [
    ...(body.departures ?? []).map((f) => mapFlight("dep", f, now)),
    ...(body.arrivals ?? []).map((f) => mapFlight("arr", f, now)),
  ].filter((f): f is Flight => f !== null);
}
