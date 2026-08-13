-- ---------------------------------------------------------------------------
-- Transactional email log.
--
-- Two jobs, one table:
--
-- 1. Answering "did the customer actually get their booking confirmation?"
--    Until now the only record of a send lived in Resend's dashboard, so the
--    app could not answer that question at all.
--
-- 2. Making sends idempotent. Moving a booking booked -> approved -> booked
--    re-fired the confirmation email every time.
--
-- `dedupe_key` is how (2) works, and it is deliberately a *reservation*, not a
-- flag. The sender inserts a pending row before talking to Resend; the partial
-- unique index below rejects a second attempt. Checking "has this been sent?"
-- and then sending would race two fast clicks through the gap between the read
-- and the write — this cannot, because Postgres arbitrates.
--
-- Keys embed the detail that makes a resend legitimate, e.g.
-- `booking_confirmed:<booking>:<slot_start>` — re-confirming the same window
-- is suppressed, but confirming a *new* window is a different key and sends.
--
-- A failed send clears its own dedupe_key (see lib/email/log.ts) so a retry is
-- not permanently blocked by the attempt that failed.
-- ---------------------------------------------------------------------------

create type public.email_status as enum ('pending', 'sent', 'failed', 'skipped');

create table public.email_log (
  id uuid primary key default gen_random_uuid(),
  -- Not an enum: the template union lives in TypeScript and changes with the
  -- app. A stale enum here would reject a new template's log row and, worse,
  -- take its email down with it.
  template text not null,
  -- The address we actually sent to. Customer PII — hence admin-only RLS
  -- below and no customer-facing select policy.
  recipient text not null,
  status public.email_status not null default 'pending',
  dedupe_key text,
  -- Resend's message id, for cross-referencing their dashboard on a bounce.
  provider_id text,
  error text,
  -- Nullable and ON DELETE SET NULL: the log outlives the job it describes,
  -- because "we emailed them and then deleted the booking" is exactly the
  -- history worth keeping.
  booking_id uuid references public.bookings(id) on delete set null,
  quote_request_id uuid references public.quote_requests(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger email_log_set_updated_at
  before update on public.email_log
  for each row execute function public.set_updated_at();

-- The reservation. Partial, so the many rows that opt out of deduping
-- (dedupe_key null) don't collide with each other.
create unique index email_log_dedupe_key_idx
  on public.email_log (dedupe_key)
  where dedupe_key is not null;

-- "What did we send this customer about this job?"
create index email_log_booking_idx
  on public.email_log (booking_id, created_at desc);

-- "What failed recently?" — the query an admin surface would run.
create index email_log_status_idx
  on public.email_log (status, created_at desc);

alter table public.email_log enable row level security;

-- Admin-only, read and write. Customers get no policy at all: the table holds
-- recipient addresses, and a customer has no reason to read delivery metadata.
-- The service-role client used by lib/email bypasses RLS, so sends still log.
create policy "email_log_admin_all" on public.email_log
  for all
  using (public.is_admin())
  with check (public.is_admin());
