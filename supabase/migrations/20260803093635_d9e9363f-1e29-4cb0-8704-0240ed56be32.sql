-- auto profile + settings on signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path to 'public' as $$
begin
  insert into public.profiles (user_id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email,'@',1)))
  on conflict (user_id) do nothing;
  insert into public.user_settings (user_id) values (new.id) on conflict (user_id) do nothing;
  return new;
end; $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- backfill for existing users
insert into public.profiles (user_id, display_name)
select u.id, split_part(u.email,'@',1) from auth.users u
on conflict (user_id) do nothing;
insert into public.user_settings (user_id)
select u.id from auth.users u
on conflict (user_id) do nothing;

-- dedupe-safe push subscriptions
create unique index if not exists push_subscriptions_user_endpoint_key
  on public.push_subscriptions (user_id, endpoint);
alter table public.push_subscriptions
  add column if not exists user_agent text,
  add column if not exists last_success_at timestamptz;

-- throttle config for saved searches
alter table public.saved_searches
  add column if not exists throttle_minutes integer not null default 60,
  add column if not exists last_notified_listing_at timestamptz;

-- delivery log to guarantee duplicate-free notifications
create table if not exists public.push_deliveries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  saved_search_id uuid references public.saved_searches(id) on delete cascade,
  listing_id uuid not null references public.listings(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, listing_id)
);
grant select on public.push_deliveries to authenticated;
grant all on public.push_deliveries to service_role;
alter table public.push_deliveries enable row level security;
create policy "own deliveries readable" on public.push_deliveries
  for select to authenticated using (auth.uid() = user_id);