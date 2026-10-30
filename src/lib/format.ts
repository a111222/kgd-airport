import type { Flight } from "@flights";

const timeFmt = new Intl.DateTimeFormat("ru-RU", { timeZone: "Europe/Kaliningrad", hour: "2-digit", minute: "2-digit" });
const dayFmt = new Intl.DateTimeFormat("ru-RU", { timeZone: "Europe/Kaliningrad", weekday: "long", day: "numeric", month: "long" });

export const hhmm = (iso: string | null | undefined) => (iso ? timeFmt.format(new Date(iso)) : "—");
export const longDay = (d: Date) => dayFmt.format(d);

/** Визуальный тип статуса: задаёт цвет плашки (см. .status[data-kind] в globals.css). */
export type StatusKind = "scheduled" | "info" | "go" | "warn" | "bad" | "done";

export function statusKind(f: Flight): StatusKind {
  switch (f.status) {
    case "checkin":
    case "airborne":
      return "info";
    case "boarding":
    case "gate_closed":
      return "go";
    case "delayed":
      return "warn";
    case "cancelled":
      return "bad";
    case "departed":
    case "landed":
    case "arrived":
      return "done";
    default:
      return "scheduled";
  }
}

export function statusLabel(f: Flight, short = false): string {
  const dep = f.direction === "dep";
  switch (f.status) {
    case "scheduled": return short ? "По плану" : "По расписанию";
    case "checkin": return "Регистрация";
    case "boarding": return "Посадка";
    case "gate_closed": return short ? "Выход закрыт" : "Посадка завершена";
    case "departed": return dep ? "Вылетел" : "В полёте";
    case "airborne": return "В полёте";
    case "delayed": return short && f.estimatedAt ? `До ${hhmm(f.estimatedAt)}` : "Задерживается";
    case "cancelled": return "Отменён";
    case "landed": return "Приземлился";
    case "arrived": return "Прибыл";
    default: return "Уточняется";
  }
}

/** Короткая подсказка рядом со статусом: стойки, выход, новое время, лента багажа. */
export function statusHint(f: Flight): string {
  if (f.direction === "dep") {
    switch (f.status) {
      case "checkin": return f.checkinDesks ? `Стойки ${f.checkinDesks}` : "Идёт регистрация";
      case "boarding": return f.gate ? `Выход ${f.gate} · идёт посадка` : "Идёт посадка";
      case "gate_closed": return f.gate ? `Выход ${f.gate} закрыт` : "Выход закрыт";
      case "delayed": return f.estimatedAt ? `Новое время ${hhmm(f.estimatedAt)}` : "Время уточняется";
      case "departed": return `Вылетел в ${hhmm(f.actualAt ?? f.estimatedAt ?? f.scheduledAt)}`;
      case "cancelled": return "Уточняйте у авиакомпании";
      default: return `Регистрация с ${hhmm(new Date(Date.parse(f.scheduledAt) - 2 * 3_600_000).toISOString())}`;
    }
  }
  switch (f.status) {
    case "landed":
    case "arrived":
      return f.baggageBelt ? `Багаж: лента ${f.baggageBelt}` : `Приземлился в ${hhmm(f.actualAt ?? f.scheduledAt)}`;
    case "delayed": return f.estimatedAt ? `Новое время ${hhmm(f.estimatedAt)}` : "Время уточняется";
    case "airborne":
    case "departed":
      return `Ожидается в ${hhmm(f.estimatedAt ?? f.scheduledAt)}`;
    case "cancelled": return "Уточняйте у авиакомпании";
    default: return "";
  }
}

export interface Step { label: string; state: "done" | "current" | "todo" }

export function flightSteps(f: Flight): Step[] {
  const labels = f.direction === "dep" ? ["Регистрация", "Посадка", "Вылет"] : ["Вылетел", "В полёте", "Приземлился"];
  const progress: Record<Flight["status"], number> = f.direction === "dep"
    ? { scheduled: 0, delayed: 0, unknown: 0, cancelled: 0, checkin: 0.5, boarding: 1.5, gate_closed: 1.5, departed: 3, airborne: 3, landed: 3, arrived: 3 }
    : { scheduled: 0, delayed: 0, unknown: 0, cancelled: 0, checkin: 0, boarding: 0, gate_closed: 0, departed: 1.5, airborne: 1.5, landed: 3, arrived: 3 };
  const p = progress[f.status];
  return labels.map((label, i) => ({ label, state: i < Math.floor(p) ? "done" : i < p ? "current" : "todo" }));
}

export function matchesQuery(f: Flight, q: string): boolean {
  if (!q) return true;
  const hay = `${f.cityName} ${f.airportName} ${f.airportIata} ${f.flightNumber} ${f.flightNumber.replace(/\s/g, "")} ${f.airlineName}`.toLowerCase();
  return q.toLowerCase().split(/\s+/).every((w) => hay.includes(w));
}
