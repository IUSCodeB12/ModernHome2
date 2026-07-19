-- Enable Supabase Realtime for admin dashboard live updates.
-- New customer quote requests (and booking changes) push to subscribed
-- admin clients via the supabase_realtime publication.

alter publication supabase_realtime add table public.quote_requests;
alter publication supabase_realtime add table public.bookings;

-- Realtime respects RLS: only admins (via is_admin()) can read these rows,
-- so only admin sessions receive the change payloads.
