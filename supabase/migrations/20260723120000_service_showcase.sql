-- ---------------------------------------------------------------------------
-- Homepage service showcase — the photographic replacement for the 3D room
-- tour. One curated panel per service: a real photo of that work plus the
-- selling copy, which the homepage pins in a sticky column while the panels
-- scroll past.
--
-- Copy lives here rather than in code so the tradie can reword a pitch or
-- change a price hint without a deploy. image_url is NULLABLE on purpose: a
-- panel is useful the moment its copy exists, and the UI shows a warm
-- placeholder until a photo is uploaded. Images live in the public `gallery`
-- bucket under a `showcase/` prefix.
-- ---------------------------------------------------------------------------

create table public.service_showcase (
  id uuid primary key default gen_random_uuid(),
  service_id uuid references public.services (id) on delete set null,
  image_url text,
  eyebrow text,
  title text not null,
  body text,
  price_hint text,
  sort_order integer not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index service_showcase_sort_idx on public.service_showcase (sort_order);

create trigger service_showcase_set_updated_at
  before update on public.service_showcase
  for each row execute function public.set_updated_at();

alter table public.service_showcase enable row level security;

create policy "service_showcase_public_read" on public.service_showcase
  for select
  using (active = true);

create policy "service_showcase_admin_all" on public.service_showcase
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- Seed the panels from the retired room tour's copy, matched to services by
-- slug, so the section is populated the moment it ships. Photos get added in
-- /admin/showcase. Services missing from this list simply get no panel.
insert into public.service_showcase (service_id, eyebrow, title, body, price_hint, sort_order)
select s.id, v.eyebrow, v.title, v.body, v.price_hint, v.sort_order
from (values
  ('tv-wall-mounting',        'TV Wall Mounting',         'Any TV, any wall',                 'Plasterboard, brick or concrete — mounted level, cables concealed, power sorted.',   'from $149',      1),
  ('tv-floating-cabinet',     'Floating Cabinet',         'Floating cabinets with LED glow',  'Made to measure, wall-mounted with a seamless look and warm underglow lighting.',    'from $450 / m',  2),
  ('showcase-cabinet',        'Showcase Cabinet',         'Show off what you love',           'Built-in display cabinets with glass shelves and integrated lighting.',              'from $1,200',    3),
  ('led-strip-lighting',      'LED Strip Lighting',       'Light that sets the mood',         'Kickboards, ceiling coves, cabinets — supplied, installed and dimmable.',            'from $85 / m',   4),
  ('room-heater-installation','Room Heater Installation', 'Warm rooms, tidy install',         'Panel and strip heaters supplied and mounted, or your own unit fitted properly.',    'from $249',      5)
) as v(slug, eyebrow, title, body, price_hint, sort_order)
join public.services s on s.slug = v.slug;
