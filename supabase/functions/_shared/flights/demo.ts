// Демо-провайдер: правдоподобное расписание Храброво, статусы которого «живут»
// относительно текущего времени. Работает без ключей API и нужен для разработки
// и как запасной вариант, если внешний источник недоступен.

import { airlineName, airportInfo } from "./dictionary.ts";
import { type Direction, type Flight, type FlightStatus, flightId, KGD_UTC_OFFSET_MIN } from "./types.ts";

type Row = [time: string, airline: string, number: string, iata: string];

const DEPARTURES: Row[] = [
  ["06:10", "SU", "1001", "SVO"],
  ["07:05", "DP", "542", "VKO"],
  ["07:40", "FV", "6312", "LED"],
  ["08:30", "S7", "1092", "DME"],
  ["09:15", "U6", "2841", "SVX"],
  ["10:00", "SU", "1003", "SVO"],
  ["11:05", "SU", "1009", "SVO"],
  ["11:50", "FV", "6316", "LED"],
  ["12:20", "DP", "544", "VKO"],
  ["12:45", "U6", "2843", "AER"],
  ["13:10", "S7", "5408", "OVB"],
  ["13:55", "B2", "958", "MSQ"],
  ["14:40", "DP", "6430", "KZN"],
  ["15:30", "SU", "1011", "SVO"],
  ["16:15", "DP", "546", "VKO"],
  ["17:00", "FV", "6318", "LED"],
  ["17:50", "N4", "1234", "AER"],
  ["18:35", "SU", "1013", "SVO"],
  ["19:20", "DP", "6434", "KUF"],
  ["20:10", "S7", "1096", "DME"],
  ["21:05", "FV", "6320", "LED"],
  ["22:30", "SU", "1015", "SVO"],
];

const ARRIVALS: Row[] = [
  ["00:40", "SU", "1014", "SVO"],
  ["08:45", "SU", "1000", "SVO"],
  ["09:30", "DP", "541", "VKO"],
  ["10:05", "FV", "6311", "LED"],
  ["10:50", "S7", "1091", "DME"],
  ["11:10", "SU", "1008", "SVO"],
  ["12:00", "DP", "543", "VKO"],
  ["12:35", "U6", "2840", "SVX"],
  ["13:40", "B2", "957", "MSQ"],
  ["14:15", "U6", "2842", "AER"],
  ["14:30", "FV", "6315", "LED"],
  ["15:20", "S7", "5407", "OVB"],
  ["16:05", "DP", "6429", "KZN"],
  ["17:10", "SU", "1010", "SVO"],
  ["18:00", "DP", "545", "VKO"],
  ["19:15", "FV", "6317", "LED"],
  ["20:00", "N4", "1233", "AER"],
  ["21:20", "SU", "1012", "SVO"],
  ["22:10", "DP", "6433", "KUF"],
  ["23:35", "S7", "1095", "DME"],
];

/** Время в пути из/в Калининград, минут. */
const DURATION: Record<string, number> = {
  SVO: 130, VKO: 125, DME: 130, LED: 95, SVX: 220, AER: 225, OVB: 330, KZN: 165, KUF: 185, MSQ: 75,
};

const MIN = 60_000;

function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** Полночь по Калининграду для суток, в которые попадает момент `at`. */
function kgdMidnightUtc(at: number): number {
  const local = at + KGD_UTC_OFFSET_MIN * MIN;
  return local - (local % (24 * 60 * MIN)) - KGD_UTC_OFFSET_MIN * MIN;
}

function build(direction: Direction, row: Row, dayStart: number, now: number): Flight {
  const [time, airline, num, iata] = row;
  const [hh, mm] = time.split(":").map(Number);
  const scheduled = dayStart + (hh * 60 + mm) * MIN;
  const scheduledIso = new Date(scheduled).toISOString();
  const flightNumber = `${airline} ${num}`;
  const h = hash(flightNumber + scheduledIso.slice(0, 10));

  const cancelled = h % 53 === 0;
  const delayMin = h % 7 === 0 ? 30 + (h % 70) : 0;
  const estimated = scheduled + delayMin * MIN;
  const diff = (estimated - now) / MIN;
  const delayed = delayMin >= 15;
  const place = airportInfo(iata);

  let status: FlightStatus;
  let actualAt: string | null = null;
  let gate: string | null = null;
  let desks: string | null = null;
  let belt: string | null = null;

  if (direction === "dep") {
    const firstDesk = 1 + (h % 6) * 2;
    if (cancelled) status = "cancelled";
    else if (diff <= 0) { status = "departed"; actualAt = new Date(estimated).toISOString(); }
    else if (diff <= 15) status = "gate_closed";
    else if (diff <= 40) status = "boarding";
    else if (delayed) status = "delayed";
    else if (diff <= 150) status = "checkin";
    else status = "scheduled";
    if (!cancelled && diff <= 150) desks = `${firstDesk}–${firstDesk + 3}`;
    if (!cancelled && diff <= 60) gate = String(1 + (h % 6));
  } else {
    const dur = DURATION[iata] ?? 150;
    if (cancelled) status = "cancelled";
    else if (diff <= -15) { status = "arrived"; actualAt = new Date(estimated).toISOString(); }
    else if (diff <= 0) { status = "landed"; actualAt = new Date(estimated).toISOString(); }
    else if (delayed) status = "delayed";
    else if (diff <= dur) status = "airborne";
    else status = "scheduled";
    if (status === "landed" || status === "arrived") belt = String(1 + (h % 3));
  }

  return {
    id: flightId(direction, flightNumber, scheduledIso),
    direction,
    flightNumber,
    airlineCode: airline,
    airlineName: airlineName(airline),
    cityName: place.city,
    airportIata: iata,
    airportName: place.airport,
    scheduledAt: scheduledIso,
    estimatedAt: delayMin > 0 && !cancelled ? new Date(estimated).toISOString() : null,
    actualAt,
    status,
    terminal: "1",
    gate,
    checkinDesks: desks,
    baggageBelt: belt,
    source: "demo",
    updatedAt: new Date(now).toISOString(),
  };
}

/** Рейсы в окне от −2 часов до +12 часов относительно `now`. */
export function demoFlights(now: number = Date.now()): Flight[] {
  const from = now - 120 * MIN;
  const to = now + 720 * MIN;
  const today = kgdMidnightUtc(now);
  const days = [today - 24 * 60 * MIN, today, today + 24 * 60 * MIN];
  const out: Flight[] = [];
  for (const day of days) {
    for (const row of DEPARTURES) out.push(build("dep", row, day, now));
    for (const row of ARRIVALS) out.push(build("arr", row, day, now));
  }
  return out
    .filter((f) => {
      const t = Date.parse(f.scheduledAt);
      return t >= from && t <= to;
    })
    .sort((a, b) => a.scheduledAt.localeCompare(b.scheduledAt));
}
