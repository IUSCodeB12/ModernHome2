-- ---------------------------------------------------------------------------
-- Prevent double-booked slots at the database level.
--
-- The app-level "is this slot free?" check in submitQuoteRequest is a
-- time-of-check/time-of-use race: two concurrent submissions can both pass it
-- and both insert. A GiST exclusion constraint makes overlap impossible —
-- Postgres rejects the second insert atomically.
--
-- Scope: only active (non-cancelled) bookings with a real time window collide.
-- ---------------------------------------------------------------------------

create extension if not exists btree_gist;

alter table public.bookings
  add constraint bookings_no_slot_overlap
  exclude using gist (
    tstzrange(slot_start, slot_end) with &&
  )
  where (
    status <> 'cancelled'
    and slot_start is not null
    and slot_end is not null
  );
