-- ---------------------------------------------------------------------------
-- Invoice numbers that don't publish how many jobs we've done.
--
-- `INV-0001` tells every customer they are the first job the business has ever
-- billed, and `INV-0007` that it has billed seven. That is commercially useless
-- information to give away, and it is an artefact of the numbering scheme
-- rather than anything the customer needs.
--
-- New format:  AS-26H17-3040V
--              ^^ ^^^^^ ^^^^^
--              |  |     |   check letter
--              |  |     scrambled counter
--              |  date: 2-digit year, month as a letter (A=Jan..L=Dec), day
--              trading initials
--
-- THE DECODE KEY (this is the part that is meant to mean something):
--
--   The 4-digit block is the true invoice count put through an affine cipher:
--
--       shown = (count * 137 + 2903) mod 10000
--       count = (shown - 2903) * 73  mod 10000
--
--   73 is the modular inverse of 137 (137 * 73 = 10001 = 1 mod 10000), so the
--   round trip is exact and you can do it on a phone calculator. 137 is coprime
--   with 10000, which is what makes the mapping one-to-one — every count from 0
--   to 9999 lands on a distinct block, so two invoices can never collide before
--   the ten-thousandth.
--
--   Worked example: the very first invoice is count 1 -> 137 + 2903 = 3040.
--   To read it back: (3040 - 2903) * 73 = 137 * 73 = 10001 -> 1 mod 10000.
--
--   A useful side effect: consecutive invoices step by exactly 137, so a
--   customer holding two of them sees a gap suggesting a hundred-odd jobs in
--   between. The numbering stops advertising a new business without anyone
--   having to claim anything untrue.
--
-- The date segment encodes nothing secret — the invoice already prints its
-- issue date — but it makes the number self-filing and lets you place any
-- invoice on a calendar at a glance.
--
-- The trailing letter is a weighted checksum over the digits. It catches a
-- transposed or mistyped number when a customer reads one back over the phone;
-- it carries no information of its own. I, O and Z are left out of the alphabet
-- so the letter is never mistaken for 1, 0 or 2.
--
-- NOTE ON SECRECY: this repository is public, so the constants above are
-- readable by anyone who finds it, and the 137 step is derivable from any two
-- invoices regardless. This scheme is opacity, not cryptography — it is enough
-- to stop a customer inferring the job count, which is the actual goal. If the
-- mapping ever needs to be genuinely private, move 137/2903 into environment
-- variables and generate the number in the application instead — at the cost of
-- the atomicity the sequence gives us here.
-- ---------------------------------------------------------------------------

create or replace function public.next_invoice_number()
  returns text
  language plpgsql
  volatile
as $$
declare
  -- nextval inside the column default keeps allocation atomic: two invoices
  -- raised in the same instant can't be handed the same number, which is why
  -- this stays in the database rather than moving into the application.
  n        bigint := nextval('public.invoice_number_seq');
  today    date   := (now() at time zone 'Australia/Melbourne')::date;
  shown    int    := ((n * 137) + 2903) % 10000;
  body     text;
  digits   text;
  total    int    := 0;
  i        int;
  alphabet constant text := 'ABCDEFGHJKLMNPQRSTUVWXY';  -- 23 letters, no I/O/Z
begin
  body := 'AS-'
       || to_char(today, 'YY')
       || substr('ABCDEFGHIJKL', extract(month from today)::int, 1)
       || to_char(today, 'DD')
       || '-'
       || lpad(shown::text, 4, '0');

  digits := regexp_replace(body, '\D', '', 'g');
  for i in 1 .. length(digits) loop
    total := total + (substr(digits, i, 1))::int * i;
  end loop;

  return body || substr(alphabet, (total % 23) + 1, 1);
end;
$$;

comment on function public.next_invoice_number() is
  'Generates an invoice number of the form AS-26H17-3040V. The 4-digit block is (count*137 + 2903) mod 10000; invert with (block-2903)*73 mod 10000.';

alter table public.invoices
  alter column invoice_number set default public.next_invoice_number();

-- Start the counter from 1 so the first real invoice reads 3040, but only while
-- there is nothing to renumber. Same guard, and for the same reason, as
-- 20260817140000: invoice_number is UNIQUE, so replaying an unconditional reset
-- against a populated table would hand out numbers already in use and fail at
-- the moment someone tried to bill a customer.
do $$
begin
  if not exists (select 1 from public.invoices) then
    perform setval('public.invoice_number_seq', 1, false);
  end if;
end $$;
