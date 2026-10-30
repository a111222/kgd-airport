-- Рейсы Храброво: вылеты и прилёты в окне ±сутки. Пишет только сборщик (service role).
create table public.flights (
  id text primary key,
  direction text not null check (direction in ('dep', 'arr')),
  flight_number text not null,
  airline_code text not null,
  airline_name text not null,
  city_name text not null,
  airport_iata text not null,
  airport_name text not null,
  scheduled_at timestamptz not null,
  estimated_at timestamptz,
  actual_at timestamptz,
  status text not null,
  terminal text,
  gate text,
  checkin_desks text,
  baggage_belt text,
  source text not null,
  updated_at timestamptz not null default now()
);

create index flights_direction_scheduled_idx on public.flights (direction, scheduled_at);

alter table public.flights enable row level security;
create policy "Табло видно всем" on public.flights for select to anon, authenticated using (true);

-- Настройки сайта, которыми будет управлять админка.
create table public.settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.settings enable row level security;
create policy "Публичные настройки видны всем" on public.settings
  for select to anon, authenticated using (key in ('theme', 'collector_status'));

insert into public.settings (key, value) values
  ('theme', '{"policy": "user", "default": "warm"}'),
  ('flights', '{"provider": "demo", "intervalMin": 30}'),
  ('collector_status', '{}');

-- Изменения рейсов сразу уходят открытым табло.
alter publication supabase_realtime add table public.flights;
