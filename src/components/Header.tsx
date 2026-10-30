import Link from "next/link";
import type { ThemePolicy } from "@/lib/settings";
import type { Weather } from "@/lib/weather";
import { Clock } from "./Clock";
import { ThemeToggle } from "./ThemeToggle";

export const NAV = [
  { href: "/", label: "Табло" },
  { href: "/#tickets", label: "Авиабилеты" },
  { href: "/#transfer", label: "Трансфер" },
  { href: "/#getting-here", label: "Как добраться" },
];

export function Logo() {
  return (
    <Link href="/" className="flex items-center gap-3" aria-label="KGD Гид, на главную">
      <span className="grid size-10 place-items-center rounded-full bg-accent text-[12px] font-extrabold text-on-accent md:size-11 md:text-[13px]">
        KGD
      </span>
      <span className="flex flex-col leading-tight">
        <span className="text-[16px] font-extrabold md:text-[17px]">KGD Гид</span>
        <span className="hidden text-[12px] text-text-2 sm:block">аэропорт Калининграда · независимый сервис</span>
      </span>
    </Link>
  );
}

export function Header({ policy, weather, now, active = "/" }: { policy: ThemePolicy; weather: Weather | null; now: string; active?: string }) {
  return (
    <header className="flex h-16 items-center justify-between gap-4 rounded-full bg-surface pl-3 pr-2 md:h-[68px] md:pl-5">
      <Logo />
      <nav aria-label="Основное меню" className="hidden items-center gap-1 text-[15px] font-semibold lg:flex">
        {NAV.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            aria-current={item.href === active ? "page" : undefined}
            className={`rounded-full px-5 py-3 transition-colors ${item.href === active ? "bg-nav-on text-on-nav-on" : "hover:bg-bg"}`}
          >
            {item.label}
          </Link>
        ))}
      </nav>
      <div className="flex items-center gap-3">
        <span className="text-[14px] font-semibold text-text-2">
          <Clock initial={now} />
          {weather ? <span className="hidden sm:inline"> · {weather.temp > 0 ? "+" : ""}{weather.temp} °C{weather.text ? `, ${weather.text}` : ""}</span> : null}
        </span>
        {policy === "user" ? <ThemeToggle /> : null}
      </div>
    </header>
  );
}

export function BottomNav() {
  return (
    <nav
      aria-label="Нижнее меню"
      className="fixed inset-x-4 bottom-4 z-20 grid h-[60px] grid-cols-4 rounded-full bg-cta text-[12px] font-bold text-on-cta shadow-lg md:hidden"
    >
      {NAV.map((item, i) => (
        <Link
          key={item.href}
          href={item.href}
          className={`m-1.5 grid place-items-center rounded-full text-center ${i === 0 ? "bg-accent text-on-accent" : ""}`}
        >
          {item.label === "Как добраться" ? "Дорога" : item.label === "Авиабилеты" ? "Билеты" : item.label}
        </Link>
      ))}
    </nav>
  );
}
