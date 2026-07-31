update public.listings
set segment_key = case category
  when 'cars' then 'cars|' || split_part(title, ' · ', 1)
  when 'motorcycles' then 'moto|' || split_part(title, ' · ', 1)
  when 'real_estate' then 'house|' || (((attributes->>'sqm')::int / 60) * 60)
  else 'flat|' || (((attributes->>'sqm')::int / 40) * 40)
end;

select public.recompute_price_stats();