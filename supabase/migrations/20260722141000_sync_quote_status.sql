-- ---------------------------------------------------------------------------
-- Keep quote_requests.status in lockstep with the booking lifecycle.
--
-- The two status columns are updated by separate code paths and can drift —
-- e.g. a customer declines a quote (booking -> 'cancelled') but the quote row
-- stays 'adjusted' and keeps showing as open in the admin quotes list.
--
-- When a booking is cancelled, expire its quote (unless an admin already
-- explicitly rejected it, which we preserve for reporting).
-- ---------------------------------------------------------------------------

create or replace function public.sync_quote_status_on_booking()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status = 'cancelled' and old.status is distinct from 'cancelled' then
    update public.quote_requests
      set status = 'expired'
      where id = new.quote_request_id
        and status <> 'rejected';
  end if;
  return new;
end;
$$;

create trigger bookings_sync_quote_status
  after update of status on public.bookings
  for each row
  execute function public.sync_quote_status_on_booking();
