-- ModernHome — Phase 1 initial schema
-- Tables, triggers, RLS policies and storage buckets.

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------
create type public.user_role as enum ('customer', 'admin');
create type public.price_unit as enum ('fixed', 'per_metre', 'per_hour');
create type public.question_input_type as enum ('single_select', 'multi_select', 'number', 'boolean');
create type public.quote_status as enum ('pending', 'approved', 'adjusted', 'rejected', 'expired');
create type public.booking_status as enum (
  'enquiry', 'quoted', 'approved', 'booked', 'in_progress',
  'completed', 'invoiced', 'paid', 'cancelled'
);
create type public.invoice_status as enum ('draft', 'sent', 'paid');

-- ---------------------------------------------------------------------------
-- updated_at helper
-- ---------------------------------------------------------------------------
create function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- profiles
-- ---------------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text,
  phone text,
  role public.user_role not null default 'customer',
  suburb text,
  postcode text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- Auto-create a profile row when a user signs up.
create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, phone)
  values (
    new.id,
    new.raw_user_meta_data ->> 'full_name',
    new.raw_user_meta_data ->> 'phone'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Role check used by RLS policies. SECURITY DEFINER avoids infinite
-- recursion when policies on profiles reference profiles.
create function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = (select auth.uid()) and role = 'admin'
  );
$$;

-- ---------------------------------------------------------------------------
-- services
-- ---------------------------------------------------------------------------
create table public.services (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  description text,
  base_price_cents integer not null default 0,
  price_unit public.price_unit not null default 'fixed',
  active boolean not null default true,
  sort_order integer not null default 0,
  ar_model_glb_url text,
  ar_model_usdz_url text,
  hero_image_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger services_set_updated_at
  before update on public.services
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- service_questions
-- ---------------------------------------------------------------------------
create table public.service_questions (
  id uuid primary key default gen_random_uuid(),
  service_id uuid not null references public.services (id) on delete cascade,
  question_text text not null,
  input_type public.question_input_type not null,
  -- Array of {label, value, price_modifier_cents, price_modifier_pct}
  options jsonb,
  requires_photo boolean not null default false,
  photo_guide_text text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index service_questions_service_id_idx on public.service_questions (service_id);

create trigger service_questions_set_updated_at
  before update on public.service_questions
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- quote_requests
-- ---------------------------------------------------------------------------
create table public.quote_requests (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.profiles (id) on delete cascade,
  service_id uuid not null references public.services (id),
  answers jsonb not null default '{}'::jsonb,
  photo_urls text[] not null default '{}',
  estimate_low_cents integer,
  estimate_high_cents integer,
  status public.quote_status not null default 'pending',
  admin_notes text,
  final_quote_cents integer,
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index quote_requests_customer_id_idx on public.quote_requests (customer_id);
create index quote_requests_service_id_idx on public.quote_requests (service_id);
create index quote_requests_status_idx on public.quote_requests (status);

create trigger quote_requests_set_updated_at
  before update on public.quote_requests
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- bookings
-- ---------------------------------------------------------------------------
create table public.bookings (
  id uuid primary key default gen_random_uuid(),
  quote_request_id uuid unique references public.quote_requests (id),
  customer_id uuid not null references public.profiles (id),
  slot_start timestamptz,
  slot_end timestamptz,
  status public.booking_status not null default 'enquiry',
  deposit_cents integer,
  deposit_paid_at timestamptz,
  stripe_checkout_session_id text,
  address_line1 text,
  suburb text,
  postcode text,
  access_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint bookings_slot_valid check (
    slot_start is null or slot_end is null or slot_end > slot_start
  )
);

create index bookings_customer_id_idx on public.bookings (customer_id);
create index bookings_status_idx on public.bookings (status);
create index bookings_slot_start_idx on public.bookings (slot_start);

create trigger bookings_set_updated_at
  before update on public.bookings
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- availability_rules
-- ---------------------------------------------------------------------------
create table public.availability_rules (
  id uuid primary key default gen_random_uuid(),
  day_of_week smallint not null check (day_of_week between 0 and 6),
  start_time time not null,
  end_time time not null,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint availability_rules_time_valid check (end_time > start_time)
);

create trigger availability_rules_set_updated_at
  before update on public.availability_rules
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- blocked_dates
-- ---------------------------------------------------------------------------
create table public.blocked_dates (
  id uuid primary key default gen_random_uuid(),
  date date not null unique,
  reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger blocked_dates_set_updated_at
  before update on public.blocked_dates
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- invoices
-- ---------------------------------------------------------------------------
create sequence public.invoice_number_seq;

create table public.invoices (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.bookings (id),
  invoice_number text not null unique
    default ('INV-' || lpad(nextval('public.invoice_number_seq')::text, 4, '0')),
  -- Array of {description, quantity, unit_price_cents, total_cents}
  line_items jsonb not null default '[]'::jsonb,
  subtotal_cents integer not null default 0,
  gst_cents integer not null default 0,
  total_cents integer not null default 0,
  status public.invoice_status not null default 'draft',
  pdf_url text,
  paid_at timestamptz,
  stripe_payment_intent_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index invoices_booking_id_idx on public.invoices (booking_id);
create index invoices_status_idx on public.invoices (status);

create trigger invoices_set_updated_at
  before update on public.invoices
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- gallery_items
-- ---------------------------------------------------------------------------
create table public.gallery_items (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  service_id uuid references public.services (id) on delete set null,
  before_image_url text not null,
  after_image_url text, -- nullable: single-image items allowed
  featured boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index gallery_items_service_id_idx on public.gallery_items (service_id);

create trigger gallery_items_set_updated_at
  before update on public.gallery_items
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.services enable row level security;
alter table public.service_questions enable row level security;
alter table public.quote_requests enable row level security;
alter table public.bookings enable row level security;
alter table public.availability_rules enable row level security;
alter table public.blocked_dates enable row level security;
alter table public.invoices enable row level security;
alter table public.gallery_items enable row level security;

-- profiles: customers read their own; admins everything.
create policy "profiles_select_own" on public.profiles
  for select to authenticated
  using (id = (select auth.uid()));

create policy "profiles_admin_all" on public.profiles
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- services: public read while active; admin write.
create policy "services_public_read" on public.services
  for select
  using (active = true or public.is_admin());

create policy "services_admin_write" on public.services
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- service_questions: public read when parent service is active; admin write.
create policy "service_questions_public_read" on public.service_questions
  for select
  using (
    exists (
      select 1 from public.services s
      where s.id = service_id and s.active = true
    )
    or public.is_admin()
  );

create policy "service_questions_admin_write" on public.service_questions
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- quote_requests: customers read + insert their own; admins everything.
create policy "quote_requests_select_own" on public.quote_requests
  for select to authenticated
  using (customer_id = (select auth.uid()));

create policy "quote_requests_insert_own" on public.quote_requests
  for insert to authenticated
  with check (customer_id = (select auth.uid()));

create policy "quote_requests_admin_all" on public.quote_requests
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- bookings: customers read their own; no direct customer writes
-- (server actions use the service role). Admins everything.
create policy "bookings_select_own" on public.bookings
  for select to authenticated
  using (customer_id = (select auth.uid()));

create policy "bookings_admin_all" on public.bookings
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- availability_rules: public read while active; admin write.
create policy "availability_rules_public_read" on public.availability_rules
  for select
  using (active = true or public.is_admin());

create policy "availability_rules_admin_write" on public.availability_rules
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- blocked_dates: public read (needed for the booking calendar); admin write.
create policy "blocked_dates_public_read" on public.blocked_dates
  for select
  using (true);

create policy "blocked_dates_admin_write" on public.blocked_dates
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- invoices: customers read invoices for their own bookings; admins everything.
create policy "invoices_select_own" on public.invoices
  for select to authenticated
  using (
    exists (
      select 1 from public.bookings b
      where b.id = booking_id and b.customer_id = (select auth.uid())
    )
  );

create policy "invoices_admin_all" on public.invoices
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- gallery_items: public read; admin write.
create policy "gallery_items_public_read" on public.gallery_items
  for select
  using (true);

create policy "gallery_items_admin_write" on public.gallery_items
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- Storage buckets + policies
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values
  ('quote-photos', 'quote-photos', false),
  ('gallery', 'gallery', true),
  ('invoices', 'invoices', false),
  ('models', 'models', true)
on conflict (id) do nothing;

-- quote-photos: customers upload to their own folder ({uid}/...), read their
-- own; admins read everything.
create policy "quote_photos_insert_own_folder" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'quote-photos'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy "quote_photos_select_own_or_admin" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'quote-photos'
    and (
      (storage.foldername(name))[1] = (select auth.uid())::text
      or public.is_admin()
    )
  );

create policy "quote_photos_admin_delete" on storage.objects
  for delete to authenticated
  using (bucket_id = 'quote-photos' and public.is_admin());

-- gallery: public read, admin write.
create policy "gallery_public_read" on storage.objects
  for select
  using (bucket_id = 'gallery');

create policy "gallery_admin_insert" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'gallery' and public.is_admin());

create policy "gallery_admin_update" on storage.objects
  for update to authenticated
  using (bucket_id = 'gallery' and public.is_admin());

create policy "gallery_admin_delete" on storage.objects
  for delete to authenticated
  using (bucket_id = 'gallery' and public.is_admin());

-- invoices: private — admin only (customers receive signed URLs generated
-- server-side with the service role).
create policy "invoices_admin_all_storage" on storage.objects
  for all to authenticated
  using (bucket_id = 'invoices' and public.is_admin())
  with check (bucket_id = 'invoices' and public.is_admin());

-- models: public read (AR .glb/.usdz files), admin write.
create policy "models_public_read" on storage.objects
  for select
  using (bucket_id = 'models');

create policy "models_admin_insert" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'models' and public.is_admin());

create policy "models_admin_update" on storage.objects
  for update to authenticated
  using (bucket_id = 'models' and public.is_admin());

create policy "models_admin_delete" on storage.objects
  for delete to authenticated
  using (bucket_id = 'models' and public.is_admin());
