-- ---------------------------------------------------------------------------
-- Give an invoice a *balance*, not just a total.
--
-- Until now `invoices` recorded one number — `total_cents` — and payment was a
-- boolean dressed up as a status. Three things that a real bill needs had
-- nowhere to live:
--
--   1. The deposit. `bookings.deposit_cents` / `deposit_paid_at` have existed
--      since the initial schema, and the homepage FAQ and the quote review step
--      both promise the deposit "comes straight off your final bill" — but the
--      invoice billed the full quoted amount and never read those columns. On
--      paper that overcharges; once Stripe deposits are live it charges the
--      money twice. `deposit_credit_cents` is the credit, captured at issue
--      time so a later change to the booking can't silently restate a bill the
--      customer has already been sent.
--
--   2. Part payment. `amount_paid_cents` accumulates what's actually been
--      received, so "paid $300 of $780 cash on the day" stops being unrecordable.
--      It *includes* the deposit credit — the deposit is money received, so
--      there is exactly one balance formula (`total - amount_paid`) rather than
--      two subtractions to keep in step. `deposit_credit_cents` is the labelled
--      portion of it, kept separate only so the invoice can show it on its own
--      line ("Less deposit paid").
--
--   3. A date it's due by. `due_date` drives the payment-due email and the
--      overdue treatment in the admin list.
--
-- Deliberately NOT added: an 'overdue' value on the invoice_status enum.
-- Overdue is a function of `due_date` and the outstanding balance — storing it
-- would need a cron to flip rows at midnight and would go stale the moment one
-- run was missed. It's derived in `lib/invoice/calc.ts` instead.
--
-- All three are additive with defaults, so existing rows keep their current
-- meaning: no deposit credited, nothing recorded as paid, no due date.
-- Historical paid invoices are backfilled below so `amount_paid_cents` agrees
-- with `status` from day one.
-- ---------------------------------------------------------------------------

alter table public.invoices
  add column deposit_credit_cents integer not null default 0,
  add column amount_paid_cents integer not null default 0,
  add column due_date date;

-- Money columns are never negative, a credit can't exceed the bill, and the
-- deposit credit is part of what's been received. Editing an invoice *below*
-- an already-paid deposit trips the first constraint: that's a refund, which
-- the app has no path for, so the server action rejects it with a readable
-- message before it ever reaches Postgres.
alter table public.invoices
  add constraint invoices_deposit_credit_nonneg
    check (deposit_credit_cents >= 0 and deposit_credit_cents <= total_cents),
  add constraint invoices_amount_paid_nonneg
    check (amount_paid_cents >= 0 and amount_paid_cents >= deposit_credit_cents);

-- Backfill: an invoice already marked paid was paid in full, by definition of
-- the only path that could set that status (markInvoicePaidForBooking).
update public.invoices
  set amount_paid_cents = total_cents
  where status = 'paid' and amount_paid_cents = 0;

-- The admin list sorts and filters outstanding invoices by when they fall due.
create index invoices_due_date_idx on public.invoices (due_date)
  where status <> 'paid';

comment on column public.invoices.deposit_credit_cents is
  'Deposit already paid on the booking, credited against this invoice. Snapshot taken when the invoice is raised.';
comment on column public.invoices.amount_paid_cents is
  'Total received against this invoice, including the deposit credit. Balance = total_cents - amount_paid_cents.';
comment on column public.invoices.due_date is
  'Date payment falls due (Australia/Melbourne). Null means due on receipt.';
