// Текущая погода в аэропорту Храброво. Open-Meteo бесплатен и не требует ключа.
const URL =
  "https://api.open-meteo.com/v1/forecast?latitude=54.89&longitude=20.59&current=temperature_2m,weather_code&timezone=Europe%2FKaliningrad";

const CODES: [number[], string][] = [
  [[0], "ясно"],
  [[1, 2], "переменная облачность"],
  [[3], "облачно"],
  [[45, 48], "туман"],
  [[51, 53, 55, 56, 57], "морось"],
  [[61, 63, 65, 66, 67, 80, 81, 82], "дождь"],
  [[71, 73, 75, 77, 85, 86], "снег"],
  [[95, 96, 99], "гроза"],
];

export interface Weather { temp: number; text: string }

export async function getWeather(): Promise<Weather | null> {
  try {
    const res = await fetch(URL, { next: { revalidate: 600 } });
    if (!res.ok) return null;
    const body = (await res.json()) as { current?: { temperature_2m?: number; weather_code?: number } };
    const t = body.current?.temperature_2m;
    if (typeof t !== "number") return null;
    const code = body.current?.weather_code ?? -1;
    return { temp: Math.round(t), text: CODES.find(([c]) => c.includes(code))?.[1] ?? "" };
  } catch {
    return null;
  }
}
