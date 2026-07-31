insert into public.countries (code, name_de, name_en, name_sq) values
('DE','Deutschland','Germany','Gjermani'),
('AT','Österreich','Austria','Austri'),
('CH','Schweiz','Switzerland','Zvicër'),
('FR','Frankreich','France','Francë'),
('IT','Italien','Italy','Itali'),
('ES','Spanien','Spain','Spanjë'),
('PT','Portugal','Portugal','Portugali'),
('NL','Niederlande','Netherlands','Holandë'),
('BE','Belgien','Belgium','Belgjikë'),
('LU','Luxemburg','Luxembourg','Luksemburg'),
('DK','Dänemark','Denmark','Danimarkë'),
('SE','Schweden','Sweden','Suedi'),
('NO','Norwegen','Norway','Norvegji'),
('FI','Finnland','Finland','Finlandë'),
('PL','Polen','Poland','Poloni'),
('CZ','Tschechien','Czechia','Çeki'),
('SK','Slowakei','Slovakia','Sllovaki'),
('HU','Ungarn','Hungary','Hungari'),
('RO','Rumänien','Romania','Rumani'),
('BG','Bulgarien','Bulgaria','Bullgari'),
('GR','Griechenland','Greece','Greqi'),
('HR','Kroatien','Croatia','Kroaci'),
('SI','Slowenien','Slovenia','Slloveni'),
('RS','Serbien','Serbia','Serbi'),
('BA','Bosnien und Herzegowina','Bosnia and Herzegovina','Bosnjë dhe Hercegovinë'),
('ME','Montenegro','Montenegro','Mal i Zi'),
('MK','Nordmazedonien','North Macedonia','Maqedoni e Veriut'),
('AL','Albanien','Albania','Shqipëri'),
('XK','Kosovo','Kosovo','Kosovë'),
('IE','Irland','Ireland','Irlandë');

insert into public.cities (country_code, name, lat, lng) values
('DE','Berlin',52.52,13.405),('DE','München',48.135,11.582),('DE','Hamburg',53.551,9.994),('DE','Köln',50.938,6.96),('DE','Frankfurt am Main',50.11,8.682),('DE','Stuttgart',48.776,9.183),
('AT','Wien',48.208,16.373),('AT','Graz',47.071,15.439),('AT','Linz',48.306,14.286),('AT','Salzburg',47.81,13.055),
('CH','Zürich',47.377,8.542),('CH','Genf',46.204,6.143),('CH','Basel',47.559,7.588),('CH','Bern',46.948,7.447),
('FR','Paris',48.857,2.352),('FR','Lyon',45.764,4.836),('FR','Marseille',43.296,5.37),('FR','Toulouse',43.605,1.444),('FR','Nizza',43.71,7.262),
('IT','Rom',41.903,12.496),('IT','Mailand',45.464,9.19),('IT','Neapel',40.852,14.268),('IT','Turin',45.07,7.687),('IT','Bologna',44.494,11.343),
('ES','Madrid',40.417,-3.704),('ES','Barcelona',41.385,2.173),('ES','Valencia',39.47,-0.377),('ES','Sevilla',37.389,-5.984),('ES','Málaga',36.721,-4.421),
('PT','Lissabon',38.722,-9.139),('PT','Porto',41.158,-8.629),('PT','Faro',37.019,-7.93),
('NL','Amsterdam',52.37,4.895),('NL','Rotterdam',51.924,4.478),('NL','Den Haag',52.078,4.288),('NL','Utrecht',52.091,5.122),
('BE','Brüssel',50.851,4.352),('BE','Antwerpen',51.22,4.402),('BE','Gent',51.054,3.717),
('LU','Luxemburg',49.611,6.13),
('DK','Kopenhagen',55.677,12.569),('DK','Aarhus',56.163,10.204),
('SE','Stockholm',59.329,18.069),('SE','Göteborg',57.709,11.974),('SE','Malmö',55.605,13.003),
('NO','Oslo',59.914,10.752),('NO','Bergen',60.392,5.325),
('FI','Helsinki',60.169,24.938),('FI','Tampere',61.498,23.761),
('PL','Warschau',52.23,21.012),('PL','Krakau',50.065,19.945),('PL','Danzig',54.352,18.646),('PL','Breslau',51.108,17.039),
('CZ','Prag',50.075,14.437),('CZ','Brünn',49.195,16.608),('CZ','Ostrava',49.82,18.263),
('SK','Bratislava',48.146,17.107),('SK','Košice',48.716,21.261),
('HU','Budapest',47.498,19.04),('HU','Debrecen',47.532,21.639),('HU','Szeged',46.253,20.148),
('RO','Bukarest',44.427,26.103),('RO','Cluj-Napoca',46.771,23.6),('RO','Timișoara',45.749,21.227),('RO','Iași',47.158,27.601),
('BG','Sofia',42.698,23.322),('BG','Plovdiv',42.136,24.745),('BG','Varna',43.214,27.915),('BG','Burgas',42.504,27.462),
('GR','Athen',37.984,23.728),('GR','Thessaloniki',40.64,22.944),('GR','Patras',38.246,21.735),('GR','Heraklion',35.339,25.144),
('HR','Zagreb',45.815,15.982),('HR','Split',43.508,16.44),('HR','Rijeka',45.327,14.442),('HR','Zadar',44.119,15.232),('HR','Dubrovnik',42.65,18.094),
('SI','Ljubljana',46.056,14.506),('SI','Maribor',46.554,15.646),('SI','Koper',45.548,13.73),
('RS','Belgrad',44.787,20.449),('RS','Novi Sad',45.267,19.833),('RS','Niš',43.321,21.896),('RS','Kragujevac',44.013,20.912),
('BA','Sarajevo',43.857,18.413),('BA','Banja Luka',44.772,17.191),('BA','Mostar',43.343,17.808),('BA','Tuzla',44.539,18.677),
('ME','Podgorica',42.442,19.264),('ME','Budva',42.288,18.84),('ME','Bar',42.094,19.1),('ME','Herceg Novi',42.451,18.538),
('MK','Skopje',41.998,21.426),('MK','Tetovo',42.009,20.971),('MK','Bitola',41.031,21.335),('MK','Ohrid',41.117,20.802),('MK','Gostivar',41.796,20.909),
('AL','Tirana',41.328,19.818),('AL','Durrës',41.324,19.446),('AL','Vlorë',40.466,19.491),('AL','Shkodër',42.068,19.512),('AL','Elbasan',41.112,20.082),('AL','Sarandë',39.875,20.006),('AL','Fier',40.725,19.556),('AL','Korçë',40.618,20.78),
('XK','Prishtina',42.663,21.162),('XK','Prizren',42.214,20.741),('XK','Peja',42.66,20.289),('XK','Gjakova',42.38,20.43),('XK','Ferizaj',42.37,21.156),('XK','Gjilan',42.464,21.469),('XK','Mitrovica',42.891,20.866),
('IE','Dublin',53.35,-6.26),('IE','Cork',51.898,-8.475);

insert into public.sources (slug, name, base_url, country_codes, categories, legal_mode) values
('immoscout24','ImmobilienScout24','https://www.immobilienscout24.de','{DE}','{real_estate,apartments}','api'),
('immowelt','Immowelt','https://www.immowelt.de','{DE,AT}','{real_estate,apartments}','api'),
('willhaben','willhaben','https://www.willhaben.at','{AT}','{real_estate,apartments,cars,motorcycles}','api'),
('idealista','Idealista','https://www.idealista.com','{ES,IT,PT}','{real_estate,apartments}','api'),
('seloger','SeLoger','https://www.seloger.com','{FR}','{real_estate,apartments}','feed'),
('funda','Funda','https://www.funda.nl','{NL}','{real_estate,apartments}','feed'),
('otodom','Otodom','https://www.otodom.pl','{PL}','{real_estate,apartments}','api'),
('imotbg','Imot.bg','https://www.imot.bg','{BG}','{real_estate,apartments}','feed'),
('njuskalo','Njuškalo','https://www.njuskalo.hr','{HR}','{real_estate,apartments,cars,motorcycles}','feed'),
('halooglasi','Halo Oglasi','https://www.halooglasi.com','{RS}','{real_estate,apartments,cars}','feed'),
('merrjep','MerrJep','https://www.merrjep.al','{AL,XK,MK}','{real_estate,apartments,cars,motorcycles}','feed'),
('gjirafa50','Gjirafa50','https://gjirafa50.com','{XK,AL}','{cars,motorcycles}','feed'),
('mobilede','mobile.de','https://www.mobile.de','{DE,AT,CH}','{cars,motorcycles}','api'),
('autoscout24','AutoScout24','https://www.autoscout24.com','{DE,AT,CH,IT,FR,BE,NL,ES}','{cars,motorcycles}','api'),
('polovniautomobili','Polovni Automobili','https://www.polovniautomobili.com','{RS,BA,ME}','{cars,motorcycles}','feed'),
('mobilebg','Mobile.bg','https://www.mobile.bg','{BG}','{cars,motorcycles}','feed'),
('euromarkt','EuroMarkt Feed','https://euromarkt.example.eu','{}','{real_estate,apartments,cars,motorcycles}','feed');

do $$
declare
  car_models text[] := array['BMW 320d','BMW X3 xDrive','Mercedes-Benz C 220 d','Mercedes-Benz E 350','Audi A4 Avant','Audi Q5 TDI','VW Golf 2.0 TDI','VW Passat Variant','Skoda Octavia Combi','Opel Astra','Renault Clio','Peugeot 308','Toyota Corolla Hybrid','Ford Focus','Volvo XC60','Seat Leon FR','Fiat 500','Hyundai Tucson','Kia Sportage','Tesla Model 3'];
  car_base int[] := array[34000,49000,31000,42000,33000,45000,24000,29000,22000,18000,13000,16000,26000,17000,41000,23000,11000,27000,26000,38000];
  moto_models text[] := array['Yamaha MT-07','Honda CB650R','Kawasaki Z900','BMW R 1250 GS','Ducati Monster','KTM 390 Duke','Suzuki V-Strom 650','Triumph Street Triple','Harley-Davidson Iron 883','Aprilia Tuono 660','Honda Africa Twin','Yamaha Tracer 900'];
  moto_base int[] := array[7200,8900,10500,18500,11000,5200,8100,10900,9500,9900,14500,11500];
  house_types text[] := array['Einfamilienhaus','Villa mit Garten','Doppelhaushaelfte','Reihenhaus','Landhaus','Bungalow','Stadthaus','Neubau-Haus'];
  flat_types text[] := array['2-Zimmer-Wohnung','3-Zimmer-Wohnung','4-Zimmer-Wohnung','Penthouse','Loft','Studio-Apartment','Maisonette','Dachgeschosswohnung'];
  fuels text[] := array['Diesel','Benzin','Hybrid','Elektro'];
  gears text[] := array['Automatik','Schaltgetriebe'];
  ccms int[] := array[390,650,700,900,1250];

  i int;
  cat public.listing_category;
  city record;
  src_id uuid;
  src_url text;
  mname text;
  yr int; km int; sqm int; rooms int;
  noise numeric; price numeric;
  v_title text; v_descr text; v_seg text; v_attrs jsonb;
begin
  for i in 1..900 loop
    cat := (case i % 4 when 0 then 'cars' when 1 then 'apartments' when 2 then 'real_estate' else 'motorcycles' end)::public.listing_category;

    select c.id, c.country_code, c.lat, c.lng into city
    from public.cities c order by md5(c.id::text || i::text) limit 1;

    select s.id, s.base_url into src_id, src_url from public.sources s
    where cat = any(s.categories) and city.country_code = any(s.country_codes)
    order by md5(s.id::text || i::text) limit 1;

    if src_id is null then
      select s.id, s.base_url into src_id, src_url from public.sources s
      where s.slug = 'euromarkt';
    end if;

    yr := 2026 - (i % 14);
    km := ((i * 37) % 220 + 8) * 1000;
    sqm := 45 + (i * 13) % 210;
    rooms := 1 + (i % 6);
    noise := (((i * 31) % 41) - 20)::numeric / 100;

    if cat = 'cars' then
      mname := car_models[1 + (i % 20)];
      price := greatest(round(((car_base[1 + (i % 20)] * (1 - (2026 - yr) * 0.075) - km * 0.045) * (1 + noise))::numeric, -2), 900);
      v_title := mname || ' · ' || yr || ' · ' || (km/1000) || ' tkm';
      v_descr := 'Gepflegtes Fahrzeug aus ' || yr || ', ' || km || ' km, Scheckheft gepflegt, unfallfrei, TUEV neu. Klimaautomatik, Navigation, Sitzheizung, Einparkhilfe.';
      v_attrs := jsonb_build_object('year', yr, 'km', km, 'fuel', fuels[1 + (i % 4)], 'gearbox', gears[1 + (i % 2)], 'power_hp', 90 + (i * 7) % 210);
      v_seg := 'cars|' || city.country_code || '|' || mname || '|' || ((yr / 3) * 3) || '|' || ((km / 50000) * 50000);
    elsif cat = 'motorcycles' then
      mname := moto_models[1 + (i % 12)];
      price := greatest(round(((moto_base[1 + (i % 12)] * (1 - (2026 - yr) * 0.055)) * (1 + noise))::numeric, -2), 600);
      v_title := mname || ' · ' || yr;
      v_descr := 'Motorrad Baujahr ' || yr || ' mit ' || (km/6) || ' km. Regelmaessig gewartet, Reifen neu, sturzfrei, Koffersystem inklusive.';
      v_attrs := jsonb_build_object('year', yr, 'km', km/6, 'ccm', ccms[1 + (i % 5)], 'power_hp', 35 + (i * 5) % 110);
      v_seg := 'moto|' || city.country_code || '|' || mname || '|' || ((yr / 4) * 4);
    elsif cat = 'real_estate' then
      mname := house_types[1 + (i % 8)];
      sqm := sqm + 40;
      rooms := rooms + 2;
      price := round((sqm * (1400 + (i * 53) % 2600) * (1 + noise))::numeric, -3);
      v_title := mname || ' · ' || sqm || ' m²';
      v_descr := 'Freistehendes Objekt mit ' || sqm || ' m² Wohnflaeche und ' || rooms || ' Zimmern. Grundstueck, Garage, Terrasse, energieeffizient saniert.';
      v_attrs := jsonb_build_object('sqm', sqm, 'rooms', rooms, 'year', 1975 + (i % 48), 'plot_sqm', 300 + (i * 11) % 800);
      v_seg := 'house|' || city.country_code || '|' || ((sqm / 60) * 60) || '|' || rooms;
    else
      mname := flat_types[1 + (i % 8)];
      price := round((sqm * (1700 + (i * 41) % 3200) * (1 + noise))::numeric, -3);
      v_title := mname || ' · ' || sqm || ' m²';
      v_descr := 'Helle Wohnung mit ' || sqm || ' m² und ' || rooms || ' Zimmern. Balkon, Einbaukueche, Aufzug, Keller. Zentrale Lage mit guter Anbindung.';
      v_attrs := jsonb_build_object('sqm', sqm, 'rooms', rooms, 'floor', (i % 7), 'year', 1970 + (i % 53));
      v_seg := 'flat|' || city.country_code || '|' || ((sqm / 40) * 40) || '|' || rooms;
    end if;

    insert into public.listings (source_id, external_id, url, category, title, description, price_eur, country_code, city_id, lat, lng, images, attributes, segment_key, posted_at)
    values (
      src_id, 'demo-' || i, src_url || '/anzeige/' || i,
      cat, v_title, v_descr, price, city.country_code, city.id,
      city.lat + ((i % 17) - 8) * 0.012,
      city.lng + ((i % 13) - 6) * 0.014,
      jsonb_build_array(
        'https://picsum.photos/seed/' || (i*7) || '/900/600',
        'https://picsum.photos/seed/' || (i*7+1) || '/900/600',
        'https://picsum.photos/seed/' || (i*7+2) || '/900/600',
        'https://picsum.photos/seed/' || (i*7+3) || '/900/600'
      ),
      v_attrs, v_seg,
      now() - ((i % 45) || ' days')::interval - ((i % 23) || ' hours')::interval
    );
  end loop;
end $$;

select public.recompute_price_stats();