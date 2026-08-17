-- ---------------------------------------------------------------------------
-- Start invoice numbering again at INV-0001.
--
-- The first seven invoice numbers were spent on test data that has since been
-- deleted, which would have made the first invoice issued to a real customer
-- INV-0008 — a gap that looks like five missing bills to anyone auditing the
-- books, and an odd first impression on a tax invoice.
--
-- Guarded on the table being empty rather than reset unconditionally. A bare
-- `setval` here would be a loaded gun: replayed against a database that already
-- holds real invoices it would hand out numbers that are already in use, and
-- `invoices.invoice_number` is UNIQUE — so the damage would surface as a failed
-- insert at the moment the tradie tried to bill someone, not here. With the
-- guard this migration is safe to replay anywhere: on a fresh database the
-- sequence is already at 1, and on a populated one it does nothing at all.
--
-- `is_called = false` means the *next* nextval() returns 1 rather than 2.
-- ---------------------------------------------------------------------------

do $$
begin
  if not exists (select 1 from public.invoices) then
    perform setval('public.invoice_number_seq', 1, false);
  end if;
end $$;
