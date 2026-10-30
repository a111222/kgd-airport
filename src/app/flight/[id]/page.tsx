import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AutoRefresh } from "@/components/AutoRefresh";
import { FlightDetail } from "@/components/FlightDetail";
import { Footer } from "@/components/Footer";
import { BottomNav, Header } from "@/components/Header";
import { getFlight } from "@/lib/board";
import { hhmm } from "@/lib/format";
import { getThemeSettings } from "@/lib/settings";
import { getWeather } from "@/lib/weather";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const flight = await getFlight(decodeURIComponent((await params).id));
  if (!flight) return { title: "Рейс не найден" };
  const what = flight.direction === "dep" ? `Вылет в ${flight.cityName}` : `Прилёт из ${flight.cityName}`;
  return {
    title: `${flight.flightNumber} — ${what}, ${hhmm(flight.scheduledAt)}`,
    description: `Статус рейса ${flight.flightNumber} ${flight.airlineName} в аэропорту Храброво: время, выход, регистрация и багаж.`,
  };
}

export default async function FlightPage({ params }: Props) {
  const [flight, theme, weather] = await Promise.all([getFlight(decodeURIComponent((await params).id)), getThemeSettings(), getWeather()]);
  if (!flight) notFound();

  return (
    <div className="mx-auto flex w-full max-w-[880px] flex-col gap-6 px-4 pt-4 md:px-8 md:pt-6">
      <Header policy={theme.policy} weather={weather} now={new Date().toISOString()} />
      <main className="flex flex-col gap-4">
        <Link href="/" className="flex items-center gap-2 self-start rounded-full px-2 py-2 text-[15px] font-bold text-text-2 hover:text-text">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
            <path d="M15 18l-6-6 6-6" />
          </svg>
          Всё табло
        </Link>
        <FlightDetail flight={flight} />
      </main>
      <Footer />
      <BottomNav />
      <AutoRefresh seconds={60} />
    </div>
  );
}
