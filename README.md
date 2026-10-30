# KGD Гид — аэропорт Калининграда

Неофициальный независимый гид по аэропорту Храброво (KGD): онлайн-табло вылета и прилёта, статусы рейсов,
как добраться, поиск авиабилетов и трансфер через партнёров.

## Как устроено

```
Источник рейсов (AirLabs / AeroDataBox / демо)
        │  раз в 2 минуты, pg_cron → Edge Function collect-flights
        ▼
Supabase Postgres: flights, settings ──Realtime──► браузер (табло обновляется само)
        │
        ▼
Next.js (App Router): серверный рендер страниц, /api/flights для клиента
```

- `supabase/functions/_shared/flights/` — провайдеры рейсов, общие для Edge Function (Deno) и Next.js (алиас `@flights`).
  Нет ключа или источник упал — используются демо-данные, табло не пустеет.
- `supabase/functions/collect-flights/` — сборщик: забирает рейсы, записывает только изменившиеся, чистит старые.
  Платные и лимитированные API опрашиваются не чаще `settings.flights.intervalMin` (по умолчанию 30 минут).
- `supabase/migrations/` — схема, RLS, расписание cron.
- `src/app/` — главная (табло, билеты, трансфер, дорога) и страница рейса `/flight/[id]`.
- `src/components/Board.tsx` — живое табло: Realtime-подписка, опрос раз в минуту, подсветка изменившихся строк.
  На телефоне рейс открывается отдельной страницей, на планшете и десктопе — панелью справа.

## Темы

Две темы: «Тёплая» и «Тёмная премиальная» (токены в `src/app/globals.css`).
Политика хранится в `settings` с ключом `theme`:

```json
{ "policy": "user", "default": "warm" }
```

- `policy: "user"` — посетитель переключает тему сам, выбор хранится в браузере;
- `policy: "warm"` или `"dark"` — тема зафиксирована для всех, переключатель скрыт.

## Настройка

```bash
cp .env.example .env.local   # URL и publishable key проекта Supabase
npm install
npm run dev
```

Ключи источников рейсов задаются в Supabase → Edge Functions → Secrets:
`AIRLABS_API_KEY` или `AERODATABOX_API_KEY`, а провайдер выбирается в `settings.flights.provider`.

Партнёрский маркер Travelpayouts для поиска билетов: `NEXT_PUBLIC_TP_MARKER`.

## Дисклеймер

Сервис не связан с АО «Аэропорт Храброво» и авиакомпаниями. Данные о рейсах берутся из открытых источников.
