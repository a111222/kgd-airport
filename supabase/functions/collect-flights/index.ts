// Сборщик рейсов. Его раз в 2 минуты вызывает pg_cron (см. supabase/migrations/*_cron.sql).
// Он берёт рейсы у провайдера из настроек, записывает в таблицу flights только
// изменившиеся строки, и Supabase Realtime сразу рассылает их открытым табло.

import { createClient } from "jsr:@supabase/supabase-js@2";
import { fetchFlights, type Flight, type ProviderName } from "../_shared/flights/index.ts";

interface FlightsSettings {
  provider?: ProviderName;
  /** Как часто ходить к платному/лимитированному API, минут. Демо обновляется при каждом вызове. */
  intervalMin?: number;
}

const toRow = (f: Flight) => ({
  id: f.id,
  direction: f.direction,
  flight_number: f.flightNumber,
  airline_code: f.airlineCode,
  airline_name: f.airlineName,
  city_name: f.cityName,
  airport_iata: f.airportIata,
  airport_name: f.airportName,
  scheduled_at: f.scheduledAt,
  estimated_at: f.estimatedAt,
  actual_at: f.actualAt,
  status: f.status,
  terminal: f.terminal,
  gate: f.gate,
  checkin_desks: f.checkinDesks,
  baggage_belt: f.baggageBelt,
  source: f.source,
  updated_at: f.updatedAt,
});

type Row = ReturnType<typeof toRow>;
const COMPARED: (keyof Row)[] = ["status", "estimated_at", "actual_at", "gate", "terminal", "checkin_desks", "baggage_belt", "source"];
const sameTime = (a: string | null, b: string | null) => (a && b ? Date.parse(a) === Date.parse(b) : a === b);

Deno.serve(async (req) => {
  const db = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

  const { data: settingsRows } = await db.from("settings").select("key,value").in("key", ["flights", "collector_status", "cron"]);
  const settings = Object.fromEntries((settingsRows ?? []).map((r) => [r.key, r.value]));

  // Секрет лежит в закрытой строке settings (RLS не даёт её читать анониму) и в задании pg_cron.
  const secret: string | undefined = settings.cron?.secret;
  if (!secret || req.headers.get("x-cron-secret") !== secret) {
    return new Response("Forbidden", { status: 403 });
  }
  const cfg: FlightsSettings = settings.flights ?? {};
  const last = settings.collector_status ?? {};
  const provider: ProviderName = cfg.provider ?? (Deno.env.get("FLIGHTS_PROVIDER") as ProviderName) ?? "demo";

  // Лимитированные API опрашиваем не чаще intervalMin.
  if (provider !== "demo" && last.provider === provider && last.at && !last.error) {
    const minutes = (Date.now() - Date.parse(last.at)) / 60_000;
    if (minutes < (cfg.intervalMin ?? 30)) {
      return Response.json({ skipped: true, nextInMin: Math.ceil((cfg.intervalMin ?? 30) - minutes) });
    }
  }

  const result = await fetchFlights(provider, {
    airlabsKey: Deno.env.get("AIRLABS_API_KEY"),
    aerodataboxKey: Deno.env.get("AERODATABOX_API_KEY"),
    aerodataboxHost: Deno.env.get("AERODATABOX_HOST"),
  });

  const rows = result.flights.map(toRow);
  const { data: existing } = await db.from("flights").select(["id", ...COMPARED].join(",")).in("id", rows.map((r) => r.id));
  const byId = new Map((existing as unknown as Row[] | null ?? []).map((r) => [r.id, r]));
  const changed = rows.filter((r) => {
    const old = byId.get(r.id);
    if (!old) return true;
    return COMPARED.some((k) => (k.endsWith("_at") ? !sameTime(old[k] as string | null, r[k] as string | null) : old[k] !== r[k]));
  });

  if (changed.length) {
    const { error } = await db.from("flights").upsert(changed);
    if (error) return Response.json({ error: error.message }, { status: 500 });
  }
  await db.from("flights").delete().lt("scheduled_at", new Date(Date.now() - 2 * 86_400_000).toISOString());

  const status = {
    provider: result.provider,
    requested: provider,
    error: result.error ?? null,
    total: rows.length,
    changed: changed.length,
    at: new Date().toISOString(),
  };
  await db.from("settings").upsert({ key: "collector_status", value: status, updated_at: status.at });
  return Response.json(status);
});
