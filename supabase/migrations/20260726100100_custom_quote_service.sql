-- ---------------------------------------------------------------------------
-- "Custom job" — the catch-all service for work that doesn't fit the fixed
-- price list (see 20260726100000 for the 'text' input type it depends on).
--
-- base_price_cents is 0 on purpose: there is no instant price. The wizard
-- shows "Priced on review" instead of "from $0", stores a null estimate, and
-- the admin prices it with the line-item builder (Adjust price…). Sorted last
-- so it reads as the fallback after the five real services.
-- ---------------------------------------------------------------------------

insert into public.services
  (slug, name, description, base_price_cents, price_unit, active, sort_order)
values
  (
    'custom-job',
    'Custom job',
    'Something else in mind? Describe the job and we''ll come back to you with a fixed price.',
    0, 'fixed', true, 99
  )
on conflict (slug) do nothing;

-- One free-text question. Photos do the heavy lifting for pricing, so they're
-- required here in a way they aren't for the fixed-price services.
insert into public.service_questions
  (service_id, question_text, input_type, options, requires_photo, photo_guide_text, sort_order)
select
  s.id,
  'What would you like done?',
  'text',
  null,
  true,
  'Photos of the space help us price accurately — the wall or room, plus anything tricky like power points, brickwork or tight access.',
  1
from public.services s
where s.slug = 'custom-job'
  and not exists (
    select 1 from public.service_questions q where q.service_id = s.id
  );
