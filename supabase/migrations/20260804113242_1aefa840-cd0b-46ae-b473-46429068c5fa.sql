
delete from public.push_deliveries where listing_id in (select id from public.listings where images::text like '%picsum.photos%');
delete from public.favorites where listing_id in (select id from public.listings where images::text like '%picsum.photos%');
delete from public.listing_translations where listing_id in (select id from public.listings where images::text like '%picsum.photos%');
delete from public.listings where images::text like '%picsum.photos%';
delete from public.price_stats;

alter table public.sources
  add column if not exists next_retry_at timestamptz,
  add column if not exists backoff_seconds integer not null default 300,
  add column if not exists fallback_slug text;

create table if not exists public.push_dispatch_runs (
  id uuid primary key default gen_random_uuid(),
  saved_search_id uuid not null references public.saved_searches(id) on delete cascade,
  dispatch_key text not null,
  notified integer not null default 0,
  created_at timestamptz not null default now(),
  unique (saved_search_id, dispatch_key)
);

grant all on public.push_dispatch_runs to service_role;
alter table public.push_dispatch_runs enable row level security;
