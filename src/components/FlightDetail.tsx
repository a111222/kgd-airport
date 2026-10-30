import Link from "next/link";
import type { Flight } from "@flights";
import { flightSteps, hhmm, statusHint, statusKind, statusLabel } from "@/lib/format";

export function StatusBadge({ flight, short = false, className = "" }: { flight: Flight; short?: boolean; className?: string }) {
  return (
    <span data-kind={statusKind(flight)} className={`status inline-flex shrink-0 items-center rounded-full font-bold whitespace-nowrap ${className}`}>
      {statusLabel(flight, short)}
    </span>
  );
}

function infoCards(f: Flight): { k: string; v: string }[] {
  const changed = f.estimatedAt && f.estimatedAt !== f.scheduledAt;
  if (f.direction === "dep") {
    return [
      { k: "Терминал", v: f.terminal ?? "1" },
      { k: "Выход", v: f.gate ?? "—" },
      { k: "Стойки регистрации", v: f.checkinDesks ?? "—" },
      changed ? { k: "Новое время", v: hhmm(f.estimatedAt) } : { k: "Регистрация с", v: hhmm(new Date(Date.parse(f.scheduledAt) - 2 * 3_600_000).toISOString()) },
    ];
  }
  return [
    { k: "Терминал", v: f.terminal ?? "1" },
    { k: "Лента багажа", v: f.baggageBelt ?? "—" },
    f.actualAt ? { k: "Посадка", v: hhmm(f.actualAt) } : { k: "Ожидается", v: hhmm(f.estimatedAt ?? f.scheduledAt) },
    { k: "Аэропорт", v: f.airportIata },
  ];
}

export function FlightDetail({ flight: f }: { flight: Flight }) {
  const steps = flightSteps(f);
  const hint = statusHint(f);
  return (
    <div className="flex flex-col gap-4">
      <article className="@container flex flex-col gap-6 rounded-[28px] bg-surface p-6 md:p-8" aria-live="polite">
        <div className="flex items-start justify-between gap-4">
          <div className="flex min-w-0 flex-col gap-1.5">
            <span className="text-[14px] font-semibold text-text-2">
              {f.direction === "dep" ? "Вылет" : "Прилёт из"} · {f.flightNumber} · {f.airlineName}
            </span>
            <h2 className="text-[32px] leading-none font-extrabold tracking-[-0.03em] md:text-[44px]">{f.cityName}</h2>
            <span className="text-[15px] text-text-2">{f.airportName}</span>
          </div>
          <div className="flex flex-col items-end gap-2">
            <span className="text-[32px] leading-none font-extrabold tracking-[-0.02em] md:text-[44px]">{hhmm(f.scheduledAt)}</span>
            <StatusBadge flight={f} className="px-3.5 py-1.5 text-[14px]" />
          </div>
        </div>
        {hint ? <p className="-mt-2 text-[15px] font-semibold">{hint}</p> : null}
        <ol className="flex gap-2" aria-label="Этапы рейса">
          {steps.map((s) => (
            <li key={s.label} className="flex flex-1 flex-col gap-2">
              <span
                className={`h-1.5 rounded-full ${s.state === "todo" ? "bg-step-todo" : "bg-step-done"} ${s.state === "current" ? "animate-pulse" : ""}`}
              />
              <span className={`text-[13px] font-semibold ${s.state === "todo" ? "text-text-2" : ""}`}>{s.label}</span>
            </li>
          ))}
        </ol>
        <dl className="grid grid-cols-2 gap-3 @xl:grid-cols-4">
          {infoCards(f).map((i) => (
            <div key={i.k} className="flex flex-col gap-1 rounded-[18px] bg-surface-2 px-4 py-3.5">
              <dt className="text-[12px] text-text-2">{i.k}</dt>
              <dd className="text-[20px] font-extrabold">{i.v}</dd>
            </div>
          ))}
        </dl>
      </article>
      <div className="grid gap-4 sm:grid-cols-2">
        <Link href="/#tickets" className="flex flex-col justify-between gap-6 rounded-[28px] bg-cta p-6 text-on-cta">
          <span className="flex flex-col gap-1.5">
            <span className="text-[13px] text-on-cta-2">Авиабилеты</span>
            <span className="text-[22px] leading-tight font-extrabold">Калининград — {f.cityName}</span>
            <span className="text-[14px] text-on-cta-2">Цены на ближайшие даты</span>
          </span>
          <span className="self-start rounded-full bg-accent px-5 py-3 text-[15px] font-extrabold text-on-accent">Показать цены</span>
        </Link>
        <Link href={f.direction === "dep" ? "/#getting-here" : "/#transfer"} className="flex flex-col justify-between gap-6 rounded-[28px] bg-surface p-6">
          <span className="flex flex-col gap-1.5">
            <span className="text-[13px] text-text-2">{f.direction === "dep" ? "Перед вылетом" : "После прилёта"}</span>
            <span className="text-[22px] leading-tight font-extrabold">
              {f.direction === "dep" ? "Как добраться до аэропорта" : "Трансфер к морю или в город"}
            </span>
            <span className="text-[14px] text-text-2">{f.direction === "dep" ? "Автобус, такси, парковка" : "Встреча у выхода из зоны прилёта"}</span>
          </span>
          <span className="self-start rounded-full border border-line-2 px-5 py-3 text-[15px] font-bold">Подробнее</span>
        </Link>
      </div>
    </div>
  );
}
