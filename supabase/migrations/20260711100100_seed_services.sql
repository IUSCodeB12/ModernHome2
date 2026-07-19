-- ModernHome — Phase 1 seed data
-- 5 services + quote questions. Prices are AUD placeholders (cents),
-- adjustable later in admin.

insert into public.services
  (slug, name, description, base_price_cents, price_unit, active, sort_order)
values
  (
    'tv-wall-mounting',
    'TV Wall Mounting',
    'Professional TV wall mounting on any wall type, with optional in-wall cable concealment for a clean finish.',
    14900, 'fixed', true, 1
  ),
  (
    'tv-floating-cabinet',
    'TV / Floating Cabinet',
    'Custom floating entertainment cabinets, made to measure and wall-mounted with a seamless look.',
    45000, 'per_metre', true, 2
  ),
  (
    'showcase-cabinet',
    'Showcase Cabinet',
    'Built-in display cabinets for your collectibles, glassware or books — optional glass shelving and lighting.',
    120000, 'fixed', true, 3
  ),
  (
    'led-strip-lighting',
    'LED Strip Lighting',
    'LED strip lighting supplied and installed — kickboards, ceiling coves, cabinets and more.',
    8500, 'per_metre', true, 4
  ),
  (
    'room-heater-installation',
    'Room Heater Installation',
    'Wall-mounted panel and strip heater installation, or professional mounting of your existing unit.',
    24900, 'fixed', true, 5
  );

-- ---------------------------------------------------------------------------
-- TV Wall Mounting
-- ---------------------------------------------------------------------------
insert into public.service_questions
  (service_id, question_text, input_type, options, requires_photo, photo_guide_text, sort_order)
values
  (
    (select id from public.services where slug = 'tv-wall-mounting'),
    'What size is your TV?',
    'single_select',
    '[
      {"label": "Up to 43\"", "value": "43", "price_modifier_cents": 0, "price_modifier_pct": null},
      {"label": "55\"", "value": "55", "price_modifier_cents": 2000, "price_modifier_pct": null},
      {"label": "65\"", "value": "65", "price_modifier_cents": 4000, "price_modifier_pct": null},
      {"label": "75\" or larger", "value": "75plus", "price_modifier_cents": 7000, "price_modifier_pct": null}
    ]'::jsonb,
    false, null, 1
  ),
  (
    (select id from public.services where slug = 'tv-wall-mounting'),
    'What type of wall will the TV be mounted on?',
    'single_select',
    '[
      {"label": "Plasterboard", "value": "plasterboard", "price_modifier_cents": 0, "price_modifier_pct": null},
      {"label": "Brick", "value": "brick", "price_modifier_cents": 5000, "price_modifier_pct": null},
      {"label": "Concrete", "value": "concrete", "price_modifier_cents": 8000, "price_modifier_pct": null}
    ]'::jsonb,
    true,
    'Take a clear, straight-on photo of the wall where the TV will be mounted.',
    2
  ),
  (
    (select id from public.services where slug = 'tv-wall-mounting'),
    'Conceal the cables inside the wall?',
    'boolean',
    '[
      {"label": "Yes, hide my cables", "value": "yes", "price_modifier_cents": 12000, "price_modifier_pct": null}
    ]'::jsonb,
    false, null, 3
  ),
  (
    (select id from public.services where slug = 'tv-wall-mounting'),
    'Is there a power point near the mounting location?',
    'boolean',
    '[
      {"label": "Yes", "value": "yes", "price_modifier_cents": 0, "price_modifier_pct": null}
    ]'::jsonb,
    true,
    'Take a photo showing the nearest power point to the mounting spot.',
    4
  );

-- ---------------------------------------------------------------------------
-- TV / Floating Cabinet
-- ---------------------------------------------------------------------------
insert into public.service_questions
  (service_id, question_text, input_type, options, requires_photo, photo_guide_text, sort_order)
values
  (
    (select id from public.services where slug = 'tv-floating-cabinet'),
    'How wide should the cabinet be? (metres)',
    'number',
    null,
    false, null, 1
  ),
  (
    (select id from public.services where slug = 'tv-floating-cabinet'),
    'What type of wall will the cabinet mount to?',
    'single_select',
    '[
      {"label": "Plasterboard", "value": "plasterboard", "price_modifier_cents": 0, "price_modifier_pct": null},
      {"label": "Brick", "value": "brick", "price_modifier_cents": 5000, "price_modifier_pct": null},
      {"label": "Concrete", "value": "concrete", "price_modifier_cents": 8000, "price_modifier_pct": null}
    ]'::jsonb,
    false, null, 2
  ),
  (
    (select id from public.services where slug = 'tv-floating-cabinet'),
    'Add LED backlighting behind the cabinet?',
    'boolean',
    '[
      {"label": "Yes, add LED backlight", "value": "yes", "price_modifier_cents": 15000, "price_modifier_pct": null}
    ]'::jsonb,
    false, null, 3
  );

-- ---------------------------------------------------------------------------
-- Showcase Cabinet
-- ---------------------------------------------------------------------------
insert into public.service_questions
  (service_id, question_text, input_type, options, requires_photo, photo_guide_text, sort_order)
values
  (
    (select id from public.services where slug = 'showcase-cabinet'),
    'What size showcase cabinet do you need?',
    'single_select',
    '[
      {"label": "Small (up to 1.2m wide)", "value": "small", "price_modifier_cents": 0, "price_modifier_pct": null},
      {"label": "Medium (1.2m – 2m wide)", "value": "medium", "price_modifier_cents": 40000, "price_modifier_pct": null},
      {"label": "Large (over 2m wide)", "value": "large", "price_modifier_cents": 80000, "price_modifier_pct": null}
    ]'::jsonb,
    true,
    'Take a photo of the room corner or wall where the cabinet will sit, showing floor and ceiling.',
    1
  ),
  (
    (select id from public.services where slug = 'showcase-cabinet'),
    'Include glass shelves?',
    'boolean',
    '[
      {"label": "Yes, glass shelves", "value": "yes", "price_modifier_cents": 18000, "price_modifier_pct": null}
    ]'::jsonb,
    false, null, 2
  ),
  (
    (select id from public.services where slug = 'showcase-cabinet'),
    'Include integrated lighting?',
    'boolean',
    '[
      {"label": "Yes, integrated lighting", "value": "yes", "price_modifier_cents": 25000, "price_modifier_pct": null}
    ]'::jsonb,
    false, null, 3
  );

-- ---------------------------------------------------------------------------
-- LED Strip Lighting
-- ---------------------------------------------------------------------------
insert into public.service_questions
  (service_id, question_text, input_type, options, requires_photo, photo_guide_text, sort_order)
values
  (
    (select id from public.services where slug = 'led-strip-lighting'),
    'How many metres of LED strip do you need?',
    'number',
    null,
    false, null, 1
  ),
  (
    (select id from public.services where slug = 'led-strip-lighting'),
    'Where will the LED strip be installed?',
    'single_select',
    '[
      {"label": "Kitchen kickboard", "value": "kickboard", "price_modifier_cents": 0, "price_modifier_pct": null},
      {"label": "Ceiling cove", "value": "ceiling_cove", "price_modifier_cents": null, "price_modifier_pct": 20},
      {"label": "Inside a cabinet", "value": "cabinet", "price_modifier_cents": 0, "price_modifier_pct": null},
      {"label": "Other", "value": "other", "price_modifier_cents": 0, "price_modifier_pct": null}
    ]'::jsonb,
    false, null, 2
  ),
  (
    (select id from public.services where slug = 'led-strip-lighting'),
    'Add a dimmer controller?',
    'boolean',
    '[
      {"label": "Yes, add a dimmer", "value": "yes", "price_modifier_cents": 9500, "price_modifier_pct": null}
    ]'::jsonb,
    false, null, 3
  );

-- ---------------------------------------------------------------------------
-- Room Heater Installation
-- ---------------------------------------------------------------------------
insert into public.service_questions
  (service_id, question_text, input_type, options, requires_photo, photo_guide_text, sort_order)
values
  (
    (select id from public.services where slug = 'room-heater-installation'),
    'What type of heater is being installed?',
    'single_select',
    '[
      {"label": "Panel heater (we supply)", "value": "panel", "price_modifier_cents": 0, "price_modifier_pct": null},
      {"label": "Strip heater (we supply)", "value": "strip", "price_modifier_cents": 3000, "price_modifier_pct": null},
      {"label": "I have my own unit", "value": "existing_unit", "price_modifier_cents": -5000, "price_modifier_pct": null}
    ]'::jsonb,
    false, null, 1
  ),
  (
    (select id from public.services where slug = 'room-heater-installation'),
    'What type of wall will the heater mount to?',
    'single_select',
    '[
      {"label": "Plasterboard", "value": "plasterboard", "price_modifier_cents": 0, "price_modifier_pct": null},
      {"label": "Brick", "value": "brick", "price_modifier_cents": 5000, "price_modifier_pct": null},
      {"label": "Concrete", "value": "concrete", "price_modifier_cents": 8000, "price_modifier_pct": null}
    ]'::jsonb,
    true,
    'Take a photo of the wall where the heater will go, including the nearest power point.',
    2
  );
