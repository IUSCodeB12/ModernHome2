-- ---------------------------------------------------------------------------
-- Installer assignment. Single-tradie today, but recording who's assigned to a
-- job prepares for multiple installers. Free-text for now (no separate staff
-- table yet); upgrade to a FK + per-installer availability when the team grows.
-- ---------------------------------------------------------------------------

alter table public.bookings
  add column assigned_installer text;
