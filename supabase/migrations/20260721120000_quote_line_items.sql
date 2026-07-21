-- ---------------------------------------------------------------------------
-- Persist the adjusted-quote line-item breakdown on the quote request so the
-- customer can see *what* was quoted (labour, materials, etc.), not just the
-- final total. Additive + nullable-with-default: safe for existing rows.
--
-- Shape mirrors invoices.line_items:
--   [{ description, quantity, unit_price_cents, total_cents }]
-- Empty array means "no itemised breakdown" (e.g. approved at the estimate
-- midpoint). Customers read this via the existing quote_requests_select_own
-- RLS policy; no new policy needed.
-- ---------------------------------------------------------------------------

alter table public.quote_requests
  add column quote_line_items jsonb not null default '[]'::jsonb;
