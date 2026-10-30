import { Board } from "@/components/Board";
import { Footer } from "@/components/Footer";
import { BottomNav, Header } from "@/components/Header";
import { TicketSearch } from "@/components/TicketSearch";
import { getBoard } from "@/lib/board";
import { longDay } from "@/lib/format";
import { getThemeSettings } from "@/lib/settings";
import { getWeather } from "@/lib/weather";

export const dynamic = "force-dynamic";

const ROUTES = [
  { title: "Автобус-экспресс 244э", text: "До Южного вокзала в центре Калининграда, в пути около 40 минут. Остановка у выхода из терминала." },
  { title: "Такси", text: "Стоянка у терминала и заказ через приложения. До центра 24 км, обычно 30–40 минут." },
  { title: "На своей машине", text: "Платная парковка у терминала: краткосрочная для встречи и долгосрочная на время поездки." },
];

export default async function Home() {
  const [board, theme, weather] = await Promise.all([getBoard(), getThemeSettings(), getWeather()]);
  const now = new Date();
  const deps = board.flights.filter((f) => f.direction === "dep");
  const delayed = board.flights.filter((f) => f.status === "delayed" || f.status === "cancelled").length;

  return (
    <div className="mx-auto flex w-full max-w-[1480px] flex-col gap-6 px-4 pt-4 md:gap-8 md:px-8 md:pt-6">
      <Header policy={theme.policy} weather={weather} now={now.toISOString()} />

      <main className="flex flex-col gap-10 md:gap-14">
        <section className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="flex flex-col gap-3">
            <p className="text-[15px] font-semibold text-text-2 first-letter:uppercase">{longDay(now)}</p>
            <h1 className="max-w-[16ch] text-[40px] leading-[1.02] font-extrabold tracking-[-0.035em] md:text-[64px] xl:text-[76px]">
              <span className="only-warm">Встречаете или улетаете?</span>
              <span className="only-dark">Храброво. В&nbsp;реальном времени.</span>
            </h1>
            <p className="max-w-[52ch] text-[17px] text-text-2">
              Онлайн-табло аэропорта Калининграда: вылеты и прилёты, задержки, выходы на посадку и ленты багажа.
            </p>
          </div>
          <dl className="grid grid-cols-3 gap-3 lg:w-[460px]">
            {[
              { k: "Вылетов", v: deps.length },
              { k: "Прилётов", v: board.flights.length - deps.length },
              { k: "Задержки", v: delayed },
            ].map((s) => (
              <div key={s.k} className="flex flex-col gap-1 rounded-[22px] bg-surface px-4 py-4 md:px-5">
                <dt className="text-[13px] text-text-2">{s.k}</dt>
                <dd className="text-[28px] leading-none font-extrabold md:text-[34px]">{s.v}</dd>
              </div>
            ))}
          </dl>
        </section>

        <Board initial={board} />

        <section id="tickets" className="scroll-mt-6 grid gap-6 rounded-[32px] bg-cta p-6 text-on-cta md:p-10 lg:grid-cols-[1fr_1.4fr] lg:items-center">
          <div className="flex flex-col gap-2">
            <p className="text-[14px] text-on-cta-2">Авиабилеты</p>
            <h2 className="text-[30px] leading-tight font-extrabold tracking-[-0.02em] md:text-[40px]">Из Калининграда — куда угодно</h2>
            <p className="text-[15px] text-on-cta-2">Сравниваем цены сотен авиакомпаний и агентств. Покупка на сайте продавца.</p>
          </div>
          <TicketSearch />
        </section>

        <div className="grid gap-6 lg:grid-cols-2">
          <section id="transfer" className="scroll-mt-6 flex flex-col justify-between gap-6 rounded-[32px] bg-surface p-6 md:p-10">
            <div className="flex flex-col gap-2">
              <p className="text-[14px] text-text-2">Трансфер</p>
              <h2 className="text-[28px] leading-tight font-extrabold tracking-[-0.02em] md:text-[36px]">К морю или в город с встречей у выхода</h2>
              <p className="text-[15px] text-text-2">
                Зеленоградск, Светлогорск, Куршская коса и центр Калининграда. Фиксированная цена, водитель ждёт с табличкой, даже если рейс
                задержали.
              </p>
            </div>
            <span className="self-start rounded-full border border-line-2 px-5 py-3 text-[15px] font-bold text-text-2">
              Онлайн-заказ появится совсем скоро
            </span>
          </section>

          <section id="getting-here" className="scroll-mt-6 flex flex-col gap-5 rounded-[32px] bg-surface p-6 md:p-10">
            <div className="flex flex-col gap-2">
              <p className="text-[14px] text-text-2">Как добраться</p>
              <h2 className="text-[28px] leading-tight font-extrabold tracking-[-0.02em] md:text-[36px]">24 км от центра Калининграда</h2>
            </div>
            <ul className="flex flex-col gap-3">
              {ROUTES.map((r) => (
                <li key={r.title} className="flex flex-col gap-1 rounded-[20px] bg-surface-2 px-5 py-4">
                  <span className="text-[17px] font-bold">{r.title}</span>
                  <span className="text-[14px] text-text-2">{r.text}</span>
                </li>
              ))}
            </ul>
          </section>
        </div>
      </main>

      <Footer />
      <BottomNav />
    </div>
  );
}
