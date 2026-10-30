import { aerodataboxFlights } from "./aerodatabox.ts";
import { airlabsFlights } from "./airlabs.ts";
import { demoFlights } from "./demo.ts";
import type { Flight, ProviderKeys, ProviderName } from "./types.ts";

export * from "./types.ts";
export { airlineName, airportInfo } from "./dictionary.ts";
export { demoFlights } from "./demo.ts";

export interface ProviderResult {
  flights: Flight[];
  provider: ProviderName;
  /** Ошибка основного источника, если пришлось перейти на демо-данные. */
  error?: string;
}

/** Берёт рейсы у выбранного провайдера; при ошибке или без ключа — демо-данные. */
export async function fetchFlights(provider: ProviderName, keys: ProviderKeys): Promise<ProviderResult> {
  try {
    if (provider === "airlabs" && keys.airlabsKey) {
      return { flights: await airlabsFlights(keys.airlabsKey), provider };
    }
    if (provider === "aerodatabox" && keys.aerodataboxKey) {
      return { flights: await aerodataboxFlights(keys.aerodataboxKey, keys.aerodataboxHost), provider };
    }
    if (provider !== "demo") {
      return { flights: demoFlights(), provider: "demo", error: `Нет ключа для ${provider}` };
    }
  } catch (e) {
    return { flights: demoFlights(), provider: "demo", error: e instanceof Error ? e.message : String(e) };
  }
  return { flights: demoFlights(), provider: "demo" };
}
