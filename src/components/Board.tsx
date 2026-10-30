"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Direction, Flight } from "@flights";
import type { Board as BoardData } from "@/lib/board";
import { hhmm, matchesQuery, statusHint } from "@/lib/format";
import { getSupabase } from "@/lib/supabase";
import { FlightDetail, StatusBadge } from "./FlightDetail";

const POLL_MS = 60_000;
const SOURCE_LABEL: Record<string, string> = {
  demo: "демо-данные",
  airlabs: "AirLabs",
  aerodatabox: "AeroDataBox",
};

/** Ключ содержимого рейса: по нему понимаем, что строка изменилась, и подсвечиваем её. */
const signature = (f: Flight) => [f.status, f.estimatedAt, f.actualAt, f.gate, f.checkinDesks, f.baggageBelt].join("|");

function firstActive(list: Flight[]): Flight | undefined {
  return list.find((f) => !["departed", "arrived", "landed", "cancelled"].includes(f.status)) ?? list[0];
}

export function Board({ initial }: { initial: BoardData }) {
  const [board, setBoard] = useState(initial);
  const [tab, setTab] = useState<Direction>("dep");
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [flash, setFlash] = useState<Set<string>>(new Set());
  const prev = useRef(new Map(initial.flights.map((f) => [f.id, signature(f)])));

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/flights", { cache: "no-store" });
      if (!res.ok) return;
      const next = (await res.json()) as BoardData;
      const changed = new Set(next.flights.filter((f) => prev.current.has(f.id) && prev.current.get(f.id) !== signature(f)).map((f) => f.id));
      prev.current = new Map(next.flights.map((f) => [f.id, signature(f)]));
      setBoard(next);
      if (changed.size) {
        setFlash(changed);
        setTimeout(() => setFlash(new Set()), 1700);
      }
    } catch {
      // сеть пропала: оставляем последние данные, следующий опрос попробует снова
    }
  }, []);

  // Supabase Realtime присылает событие при любом изменении рейса; несколько событий подряд склеиваем.
  useEffect(() => {
    const db = getSupabase();
    let timer: ReturnType<typeof setTimeout> | undefined;
    const channel = db
      ?.channel("flights-board")
      .on("postgres_changes", { event: "*", schema: "public", table: "flights" }, () => {
        clearTimeout(timer);
        timer = setTimeout(refresh, 800);
      })
      .subscribe();
    const poll = setInterval(refresh, POLL_MS);
    return () => {
      clearTimeout(timer);
      clearInterval(poll);
      if (channel) db?.removeChannel(channel);
    };
  }, [refresh]);

  const list = useMemo(
    () => board.flights.filter((f) => f.direction === tab && matchesQuery(f, query.trim())),
    [board.flights, tab, query],
  );
  const selected = list.find((f) => f.id === selectedId) ?? firstActive(list);

  const onRowClick = (e: React.MouseEvent, f: Flight) => {
    // На планшете и десктопе карточка рейса открывается справа, на телефоне — отдельной страницей.
    if (e.metaKey || e.ctrlKey || e.shiftKey || !window.matchMedia("(min-width: 768px)").matches) return;
    e.preventDefault();
    setSelectedId(f.id);
  };

  const tabBtn = (dir: Direction, label: string) => (
    <button
      type="button"
      role="tab"
      aria-selected={tab === dir}
      onClick={() => {
        setTab(dir);
        setSelectedId(null);
      }}
      className={`h-11 flex-1 rounded-full px-6 text-[15px] font-bold transition-colors md:flex-none ${tab === dir ? "bg-seg-on text-on-seg-on" : "hover:bg-bg"}`}
    >
      {label}
    </button>
  );

  return (
    <section aria-labelledby="board-title" className="flex flex-col gap-4">
      <h2 id="board-title" className="sr-only">Онлайн-табло</h2>
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div role="tablist" aria-label="Направление" className="flex gap-1 rounded-full bg-surface p-1.5 md:w-fit">
          {tabBtn("dep", "Вылет")}
          {tabBtn("arr", "Прилёт")}
        </div>
        <label className="flex h-[52px] items-center gap-3 rounded-full bg-surface px-5 md:h-14 md:w-[420px]">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
            <circle cx="11" cy="11" r="7" />
            <path d="M20 20l-3.5-3.5" />
          </svg>
          <span className="sr-only">Поиск рейса</span>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Рейс, город или авиакомпания"
            className="min-w-0 flex-1 bg-transparent text-[16px] outline-none placeholder:text-text-2"
          />
        </label>
      </div>

      <div className="flex flex-col gap-4 md:flex-row md:items-start">
        <div className="@container flex min-w-0 flex-1 flex-col gap-2.5 md:gap-0 md:rounded-[28px] md:bg-surface md:px-3 md:py-2">
          {list.map((f) => (
            <Link
              key={f.id}
              href={`/flight/${encodeURIComponent(f.id)}`}
              onClick={(e) => onRowClick(e, f)}
              aria-current={selected?.id === f.id ? "true" : undefined}
              className={[
                "grid grid-cols-[58px_minmax(0,1fr)_auto] items-center gap-3.5 rounded-[22px] bg-surface px-4 py-3.5 transition-colors",
                "md:rounded-[18px] md:bg-transparent md:px-3 md:py-3",
                "@2xl:grid-cols-[84px_minmax(0,1fr)_minmax(0,200px)_auto]",
                selected?.id === f.id ? "md:bg-row-on" : "md:hover:bg-row-on/60",
                ["departed", "arrived"].includes(f.status) ? "opacity-60" : "",
                flash.has(f.id) ? "flash" : "",
              ].join(" ")}
            >
              <span className="text-[20px] font-extrabold @2xl:text-[24px]">{hhmm(f.scheduledAt)}</span>
              <span className="flex min-w-0 flex-col gap-0.5">
                <span className="truncate text-[16px] font-bold @2xl:text-[18px]">{f.cityName}</span>
                <span className="truncate text-[13px] text-text-2 @2xl:text-[14px]">
                  <span className="hidden @2xl:inline">{f.airportName} · </span>
                  {f.flightNumber} · {f.airlineName}
                </span>
              </span>
              <span className="hidden truncate text-[14px] text-text-2 @2xl:block">{statusHint(f)}</span>
              <StatusBadge flight={f} short className="px-3 py-1.5 text-[12px] @2xl:px-4 @2xl:py-2 @2xl:text-[14px]" />
            </Link>
          ))}
          {list.length === 0 ? (
            <p className="rounded-[22px] bg-surface px-6 py-12 text-center text-[16px] text-text-2 md:bg-transparent">
              Рейсов по запросу не нашлось. Проверьте номер рейса или город.
            </p>
          ) : null}
          <p className="flex items-center gap-2 px-3 py-3 text-[13px] text-text-2">
            <span className="relative flex size-2">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-accent opacity-60" />
              <span className="relative inline-flex size-2 rounded-full bg-accent" />
            </span>
            Обновлено в {hhmm(board.updatedAt)} · {SOURCE_LABEL[board.source] ?? board.source} · время местное (UTC+2)
          </p>
        </div>

        {selected ? (
          <aside className="hidden w-[380px] shrink-0 md:sticky md:top-6 md:block lg:w-[440px] xl:w-[480px]" aria-label="Выбранный рейс">
            <FlightDetail flight={selected} />
          </aside>
        ) : null}
      </div>
    </section>
  );
}
