"use client";

import { useState } from "react";

// Популярные направления из Калининграда. Поиск открывается на Aviasales;
// партнёрский маркер Travelpayouts подставится, когда появится в настройках.
const DESTINATIONS = [
  { iata: "MOW", name: "Москва" },
  { iata: "LED", name: "Санкт-Петербург" },
  { iata: "AER", name: "Сочи" },
  { iata: "KZN", name: "Казань" },
  { iata: "SVX", name: "Екатеринбург" },
  { iata: "MRV", name: "Минеральные Воды" },
  { iata: "IST", name: "Стамбул" },
];

const marker = process.env.NEXT_PUBLIC_TP_MARKER;

function searchUrl(to: string, date: string): string {
  const [, mm, dd] = date.split("-");
  const url = new URL(`https://www.aviasales.ru/search/KGD${dd}${mm}${to}1`);
  if (marker) url.searchParams.set("marker", marker);
  return url.toString();
}

export function TicketSearch() {
  const [to, setTo] = useState("MOW");
  const [date, setDate] = useState(() => new Date(Date.now() + 86_400_000).toISOString().slice(0, 10));

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        window.open(searchUrl(to, date), "_blank", "noopener");
      }}
      className="grid gap-3 sm:grid-cols-[1fr_1fr_auto]"
    >
      <label className="flex flex-col gap-1 rounded-[18px] bg-field px-4 py-3 text-on-field">
        <span className="text-[12px] opacity-70">Куда</span>
        <select value={to} onChange={(e) => setTo(e.target.value)} className="bg-transparent text-[17px] font-bold outline-none">
          {DESTINATIONS.map((d) => (
            <option key={d.iata} value={d.iata}>
              {d.name}
            </option>
          ))}
        </select>
      </label>
      <label className="flex flex-col gap-1 rounded-[18px] bg-field px-4 py-3 text-on-field">
        <span className="text-[12px] opacity-70">Когда</span>
        <input
          type="date"
          value={date}
          min={new Date().toISOString().slice(0, 10)}
          onChange={(e) => setDate(e.target.value)}
          className="bg-transparent text-[17px] font-bold outline-none"
        />
      </label>
      <button type="submit" className="h-14 rounded-full bg-accent px-7 whitespace-nowrap text-[16px] font-extrabold text-on-accent sm:h-auto">
        Найти билеты
      </button>
    </form>
  );
}
