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
           ((percentile_cont(0.75) within group (order by l.price_eur))
            - (percentile_cont(0.25) within group (order by l.price_eur))) / 1.349,
           1
         )::numeric(12,2)
  from public.listings l
  where l.active and l.segment_key is not null
  group by l.segment_key
  having count(*) >= 8;

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