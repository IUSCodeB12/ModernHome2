-- ---------------------------------------------------------------------------
-- Homepage hero slideshow. Admin-curated interior photos, ordered, that the
-- hero rotates through. Images live in the public `gallery` bucket under a
-- `hero/` prefix. Public read is limited to active rows; admins manage all.
-- ---------------------------------------------------------------------------

create table public.hero_slides (
  id uuid primary key default gen_random_uuid(),
  image_url text not null,
  headline text,
  sort_order integer not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index hero_slides_sort_idx on public.hero_slides (sort_order);

create trigger hero_slides_set_updated_at
  before update on public.hero_slides
  for each row execute function public.set_updated_at();

alter table public.hero_slides enable row level security;

create policy "hero_slides_public_read" on public.hero_slides
  for select
  using (active = true);

create policy "hero_slides_admin_all" on public.hero_slides
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());
