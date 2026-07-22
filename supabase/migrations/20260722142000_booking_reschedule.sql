-- ---------------------------------------------------------------------------
-- Reschedule support.
--
-- Customers can flag that they'd like a different arrival time (with an
-- optional note); admins see the flag and set a new slot. The slot change
-- itself is protected by the bookings_no_slot_overlap exclusion constraint.
-- ---------------------------------------------------------------------------

alter table public.bookings
  add column reschedule_requested_at timestamptz,
  add column reschedule_note text;
