-- Запуск сборщика рейсов раз в 2 минуты через pg_cron + pg_net.
-- Секрет генерируется в базе и лежит в закрытой строке settings (аноним её не видит).
create extension if not exists pg_cron;
create extension if not exists pg_net;

insert into public.settings (key, value) values
  ('cron', jsonb_build_object(
    'secret', replace(gen_random_uuid()::text || gen_random_uuid()::text, '-', ''),
    'url', 'https://cdqrygyoqirigmsaxter.supabase.co/functions/v1/collect-flights'))
on conflict (key) do nothing;

select cron.schedule(
  'collect-flights',
  '*/2 * * * *',
  $$
  select net.http_post(
    url := (select value->>'url' from public.settings where key = 'cron'),
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-cron-secret', (select value->>'secret' from public.settings where key = 'cron')),
    body := '{}'::jsonb,
    timeout_milliseconds := 20000)
  $$
);
