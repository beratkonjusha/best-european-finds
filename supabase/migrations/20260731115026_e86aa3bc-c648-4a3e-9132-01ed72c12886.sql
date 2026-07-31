-- ENUMS
create type public.app_role as enum ('admin','moderator','user');
create type public.listing_category as enum ('real_estate','apartments','cars','motorcycles');
create type public.price_band as enum ('great','good','fair','high','check');

-- COUNTRIES
create table public.countries (
  code text primary key,
  name_de text not null,
  name_en text not null,
  name_sq text not null,
  region text not null default 'europe'
);
grant select on public.countries to anon, authenticated;
grant all on public.countries to service_role;
alter table public.countries enable row level security;
create policy "countries public read" on public.countries for select using (true);

-- CITIES
create table public.cities (
  id uuid primary key default gen_random_uuid(),
  country_code text not null references public.countries(code) on delete cascade,
  name text not null,
  lat double precision not null,
  lng double precision not null,
  unique (country_code, name)
);
grant select on public.cities to anon, authenticated;
grant all on public.cities to service_role;
alter table public.cities enable row level security;
create policy "cities public read" on public.cities for select using (true);
create index cities_country_idx on public.cities(country_code);

-- SOURCES
create table public.sources (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  base_url text not null,
  country_codes text[] not null default '{}',
  categories public.listing_category[] not null default '{}',
  legal_mode text not null default 'api',
  enabled boolean not null default true,
  health text not null default 'ok',
  last_run_at timestamptz
);
grant select on public.sources to anon, authenticated;
grant all on public.sources to service_role;
alter table public.sources enable row level security;
create policy "sources public read" on public.sources for select using (true);

-- LISTINGS
create table public.listings (
  id uuid primary key default gen_random_uuid(),
  source_id uuid not null references public.sources(id) on delete cascade,
  external_id text not null,
  url text not null,
  category public.listing_category not null,
  title text not null,
  description text,
  price_eur numeric(12,2) not null,
  currency text not null default 'EUR',
  country_code text not null references public.countries(code),
  city_id uuid references public.cities(id) on delete set null,
  lat double precision,
  lng double precision,
  images jsonb not null default '[]'::jsonb,
  attributes jsonb not null default '{}'::jsonb,
  segment_key text,
  price_score numeric(6,2),
  price_band public.price_band,
  posted_at timestamptz not null default now(),
  fetched_at timestamptz not null default now(),
  active boolean not null default true,
  unique (source_id, external_id)
);
grant select on public.listings to anon, authenticated;
grant all on public.listings to service_role;
alter table public.listings enable row level security;
create policy "listings public read" on public.listings for select using (active = true);
create index listings_category_idx on public.listings(category);
create index listings_country_idx on public.listings(country_code);
create index listings_city_idx on public.listings(city_id);
create index listings_price_idx on public.listings(price_eur);
create index listings_posted_idx on public.listings(posted_at desc);
create index listings_segment_idx on public.listings(segment_key);
create index listings_search_idx on public.listings using gin (to_tsvector('simple', title || ' ' || coalesce(description,'')));

-- PRICE STATS
create table public.price_stats (
  id uuid primary key default gen_random_uuid(),
  segment_key text not null unique,
  category public.listing_category not null,
  n integer not null,
  median_eur numeric(12,2) not null,
  p25 numeric(12,2) not null,
  p75 numeric(12,2) not null,
  mad numeric(12,2) not null,
  updated_at timestamptz not null default now()
);
grant select on public.price_stats to anon, authenticated;
grant all on public.price_stats to service_role;
alter table public.price_stats enable row level security;
create policy "price_stats public read" on public.price_stats for select using (true);

-- ROLES
create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.app_role not null,
  unique (user_id, role)
);
grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;
create policy "own roles readable" on public.user_roles for select to authenticated using (auth.uid() = user_id);

create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role = _role)
$$;

-- FAVORITES
create table public.favorites (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  listing_id uuid not null references public.listings(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, listing_id)
);
grant select, insert, update, delete on public.favorites to authenticated;
grant all on public.favorites to service_role;
alter table public.favorites enable row level security;
create policy "own favorites" on public.favorites for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- USER SETTINGS
create table public.user_settings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  language text not null default 'de',
  filters jsonb not null default '{}'::jsonb,
  source_ids uuid[] not null default '{}',
  sort text not null default 'price_asc',
  push_enabled boolean not null default false,
  updated_at timestamptz not null default now()
);
grant select, insert, update, delete on public.user_settings to authenticated;
grant all on public.user_settings to service_role;
alter table public.user_settings enable row level security;
create policy "own settings" on public.user_settings for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- SAVED SEARCHES
create table public.saved_searches (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  label text not null,
  query jsonb not null default '{}'::jsonb,
  notify boolean not null default true,
  last_notified_at timestamptz,
  created_at timestamptz not null default now()
);
grant select, insert, update, delete on public.saved_searches to authenticated;
grant all on public.saved_searches to service_role;
alter table public.saved_searches enable row level security;
create policy "own saved searches" on public.saved_searches for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- REVIEWS
create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  author_name text not null,
  rating smallint not null,
  body text,
  published boolean not null default true,
  created_at timestamptz not null default now()
);
alter table public.reviews add constraint reviews_rating_range check (rating between 1 and 5);
alter table public.reviews add constraint reviews_body_len check (body is null or char_length(body) <= 1000);
alter table public.reviews add constraint reviews_name_len check (char_length(author_name) between 1 and 80);
grant select on public.reviews to anon;
grant select, insert, update, delete on public.reviews to authenticated;
grant all on public.reviews to service_role;
alter table public.reviews enable row level security;
create policy "published reviews readable" on public.reviews for select using (published = true);
create policy "own review insert" on public.reviews for insert to authenticated with check (auth.uid() = user_id);
create policy "own review update" on public.reviews for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own review delete" on public.reviews for delete to authenticated using (auth.uid() = user_id);

-- SUPPORT MESSAGES
create table public.support_messages (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  message text not null,
  handled boolean not null default false,
  created_at timestamptz not null default now()
);
alter table public.support_messages add constraint support_len check (char_length(name) between 1 and 100 and char_length(email) between 3 and 255 and char_length(message) between 1 and 2000);
grant insert on public.support_messages to anon, authenticated;
grant all on public.support_messages to service_role;
alter table public.support_messages enable row level security;
create policy "anyone can send support" on public.support_messages for insert with check (true);
create policy "admins read support" on public.support_messages for select to authenticated using (public.has_role(auth.uid(),'admin'));

-- PRICE ANALYSIS
create or replace function public.recompute_price_stats()
returns void language plpgsql security definer set search_path = public as $$
begin
  delete from public.price_stats;
  insert into public.price_stats (segment_key, category, n, median_eur, p25, p75, mad)
  select l.segment_key,
         min(l.category),
         count(*)::int,
         percentile_cont(0.5) within group (order by l.price_eur)::numeric(12,2),
         percentile_cont(0.25) within group (order by l.price_eur)::numeric(12,2),
         percentile_cont(0.75) within group (order by l.price_eur)::numeric(12,2),
         greatest(
           percentile_cont(0.5) within group (
             order by abs(l.price_eur - (percentile_cont(0.5) within group (order by l.price_eur) over ()))
           ),
           1
         )::numeric(12,2)
  from public.listings l
  where l.active and l.segment_key is not null
  group by l.segment_key
  having count(*) >= 8;

  -- robust spread fallback: use IQR-based MAD estimate
  update public.price_stats set mad = greatest((p75 - p25) / 1.349, 1);

  update public.listings l
  set price_score = round(((l.price_eur - s.median_eur) / s.mad)::numeric, 2),
      price_band = case
        when l.price_eur < s.median_eur * 0.15 then 'check'::public.price_band
        when ((l.price_eur - s.median_eur) / s.mad) <= -1.0 then 'great'::public.price_band
        when ((l.price_eur - s.median_eur) / s.mad) <= -0.25 then 'good'::public.price_band
        when ((l.price_eur - s.median_eur) / s.mad) <= 0.75 then 'fair'::public.price_band
        else 'high'::public.price_band
      end
  from public.price_stats s
  where s.segment_key = l.segment_key;

  update public.listings set price_band = 'fair'::public.price_band, price_score = 0
  where price_band is null and active;
end;
$$;

revoke all on function public.recompute_price_stats() from public, anon, authenticated;