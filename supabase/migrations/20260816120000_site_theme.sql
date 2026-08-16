-- ---------------------------------------------------------------------------
-- Website theme settings. One published theme for the public site, edited by
-- admins from /admin/settings/theme, with a draft and a rollback history.
--
-- Two tables rather than one, and the split is a privacy boundary rather than
-- bookkeeping. `theme_settings` holds only what is already visible to anyone
-- who loads the site, so it can carry a blanket public-read policy — which is
-- what lets the public loader use the cookie-free anon client and keeps the
-- marketing pages CDN-cacheable. Drafts and history live in `theme_versions`,
-- admin-only, so an unpublished redesign is never readable by the public. RLS
-- is row-level, so keeping a draft column on a publicly readable row could not
-- have hidden it.
--
-- `theme_versions` also *is* the audit log: every publish inserts a row
-- carrying who and when, so no separate audit table is needed.
--
-- The blob shape is owned by `lib/theme/tokens.ts` (`ThemeInput`) and is
-- validated with zod before it is ever written. `schema_version` inside the
-- blob lets a later migration upgrade old rows instead of guessing.
-- ---------------------------------------------------------------------------

create table public.theme_settings (
  -- Singleton. The check constraint admits only `true`, and it is the primary
  -- key, so the table can hold exactly one row — no "which row is live?"
  -- ambiguity and no ordering needed in the read path.
  id boolean primary key default true check (id),
  tokens jsonb not null,
  -- Increments on every publish. Used as the cache-busting key.
  version integer not null default 1,
  updated_at timestamptz not null default now()
);

create trigger theme_settings_set_updated_at
  before update on public.theme_settings
  for each row execute function public.set_updated_at();

alter table public.theme_settings enable row level security;

-- Public: this is what already renders in every visitor's <head>.
create policy "theme_settings_public_read" on public.theme_settings
  for select
  using (true);

create policy "theme_settings_admin_all" on public.theme_settings
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create table public.theme_versions (
  id uuid primary key default gen_random_uuid(),
  status text not null check (status in ('draft', 'published')),
  tokens jsonb not null,
  -- Null on drafts; set to the published version number on publish.
  version integer,
  note text,
  -- Audit trail. `on delete set null` so removing a staff account preserves
  -- the record that a publish happened rather than deleting site history.
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);

-- At most one draft at a time. Enforced here rather than in the action so two
-- admins editing at once cannot silently create rival drafts.
create unique index theme_versions_single_draft
  on public.theme_versions (status)
  where status = 'draft';

create index theme_versions_history_idx
  on public.theme_versions (created_at desc)
  where status = 'published';

alter table public.theme_versions enable row level security;

-- No public policy at all: drafts and history are admin-only.
create policy "theme_versions_admin_all" on public.theme_versions
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- Seed with the palette currently live in app/globals.css, which is also
-- `DEFAULT_THEME` in lib/theme/tokens.ts and the `Ivory` preset. Seeding the
-- current look means this migration changes nothing visually on deploy.
-- ---------------------------------------------------------------------------

insert into public.theme_settings (id, tokens, version)
values (
  true,
  '{
    "schemaVersion": 1,
    "light": {
      "background": { "l": 0.988, "c": 0.005, "h": 84 },
      "foreground": { "l": 0.21, "c": 0.014, "h": 55 },
      "primary": { "l": 0.245, "c": 0.016, "h": 55 },
      "brand": { "l": 0.755, "c": 0.095, "h": 82 }
    },
    "dark": {
      "background": { "l": 0.165, "c": 0.008, "h": 58 },
      "foreground": { "l": 0.955, "c": 0.006, "h": 84 },
      "primary": { "l": 0.945, "c": 0.007, "h": 84 },
      "brand": { "l": 0.8, "c": 0.1, "h": 84 }
    },
    "radius": 0.75,
    "fonts": { "body": "geist", "display": "fraunces" },
    "defaultMode": "system",
    "logo": { "light": null, "dark": null }
  }'::jsonb,
  1
)
on conflict (id) do nothing;

-- Logo uploads reuse the existing public `gallery` bucket under a `brand/`
-- prefix, so the admin-write and public-read storage policies from the initial
-- schema already cover them. No new bucket, and no new storage policy.
