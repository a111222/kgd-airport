// Русские названия городов, аэропортов и авиакомпаний для маршрутов из Калининграда.
// Провайдеры отдают коды IATA и английские названия, а табло показывает их по-русски.

export const AIRPORTS: Record<string, { city: string; airport: string }> = {
  SVO: { city: "Москва", airport: "Шереметьево" },
  VKO: { city: "Москва", airport: "Внуково" },
  DME: { city: "Москва", airport: "Домодедово" },
  ZIA: { city: "Москва", airport: "Жуковский" },
  LED: { city: "Санкт-Петербург", airport: "Пулково" },
  AER: { city: "Сочи", airport: "Адлер" },
  SVX: { city: "Екатеринбург", airport: "Кольцово" },
  OVB: { city: "Новосибирск", airport: "Толмачёво" },
  KZN: { city: "Казань", airport: "Казань" },
  KUF: { city: "Самара", airport: "Курумоч" },
  UFA: { city: "Уфа", airport: "Уфа" },
  CEK: { city: "Челябинск", airport: "Баландино" },
  PEE: { city: "Пермь", airport: "Большое Савино" },
  GOJ: { city: "Нижний Новгород", airport: "Стригино" },
  TJM: { city: "Тюмень", airport: "Рощино" },
  KJA: { city: "Красноярск", airport: "Емельяново" },
  MMK: { city: "Мурманск", airport: "Мурманск" },
  ARH: { city: "Архангельск", airport: "Талаги" },
  MRV: { city: "Минеральные Воды", airport: "Минеральные Воды" },
  MCX: { city: "Махачкала", airport: "Уйташ" },
  SGC: { city: "Сургут", airport: "Сургут" },
  OMS: { city: "Омск", airport: "Центральный" },
  VOG: { city: "Волгоград", airport: "Гумрак" },
  MSQ: { city: "Минск", airport: "Национальный" },
  IST: { city: "Стамбул", airport: "Стамбул" },
  AYT: { city: "Анталья", airport: "Анталья" },
};

export const AIRLINES: Record<string, string> = {
  SU: "Аэрофлот",
  FV: "Россия",
  DP: "Победа",
  S7: "S7 Airlines",
  U6: "Уральские авиалинии",
  N4: "Nordwind",
  WZ: "Red Wings",
  "5N": "Smartavia",
  UT: "ЮТэйр",
  A4: "Азимут",
  ZF: "Azur Air",
  YC: "Ямал",
  B2: "Белавиа",
  "7R": "РусЛайн",
  IO: "ИрАэро",
};

export function airportInfo(iata: string, fallbackCity?: string | null, fallbackName?: string | null) {
  const known = AIRPORTS[iata];
  if (known) return known;
  return { city: fallbackCity || fallbackName || iata, airport: fallbackName || iata };
}

export function airlineName(code: string, fallback?: string | null): string {
  return AIRLINES[code] || fallback || code;
}
