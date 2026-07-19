import type { QuoteWizardData, ServiceWithQuestions } from "@/lib/quote/types";

/**
 * Fallback wizard data used when Supabase env vars are not configured
 * (local dev before `supabase link`). Mirrors the Phase 1 seed migration.
 */
const wallTypeOptions = [
  { label: "Plasterboard", value: "plasterboard", price_modifier_cents: 0, price_modifier_pct: null },
  { label: "Brick", value: "brick", price_modifier_cents: 5000, price_modifier_pct: null },
  { label: "Concrete", value: "concrete", price_modifier_cents: 8000, price_modifier_pct: null },
];

function q(
  id: string,
  service_id: string,
  question_text: string,
  input_type: "single_select" | "multi_select" | "number" | "boolean",
  options: unknown,
  sort_order: number,
  requires_photo = false,
  photo_guide_text: string | null = null
) {
  return {
    id,
    service_id,
    question_text,
    input_type,
    options: options as ServiceWithQuestions["service_questions"][number]["options"],
    requires_photo,
    photo_guide_text,
    sort_order,
    created_at: "",
    updated_at: "",
  };
}

const demoServices: ServiceWithQuestions[] = [
  {
    id: "00000000-0000-4000-8000-000000000001",
    slug: "tv-wall-mounting",
    name: "TV Wall Mounting",
    description:
      "Professional TV wall mounting on any wall type, with optional in-wall cable concealment.",
    base_price_cents: 14900,
    price_unit: "fixed",
    active: true,
    sort_order: 1,
    ar_model_glb_url: null,
    ar_model_usdz_url: null,
    hero_image_url: null,
    created_at: "",
    updated_at: "",
    service_questions: [
      q("d1-size", "00000000-0000-4000-8000-000000000001", "What size is your TV?", "single_select", [
        { label: 'Up to 43"', value: "43", price_modifier_cents: 0, price_modifier_pct: null },
        { label: '55"', value: "55", price_modifier_cents: 2000, price_modifier_pct: null },
        { label: '65"', value: "65", price_modifier_cents: 4000, price_modifier_pct: null },
        { label: '75" or larger', value: "75plus", price_modifier_cents: 7000, price_modifier_pct: null },
      ], 1),
      q("d1-wall", "00000000-0000-4000-8000-000000000001", "What type of wall will the TV be mounted on?", "single_select", wallTypeOptions, 2, true, "Take a clear, straight-on photo of the wall where the TV will be mounted."),
      q("d1-cables", "00000000-0000-4000-8000-000000000001", "Conceal the cables inside the wall?", "boolean", [
        { label: "Yes, hide my cables", value: "yes", price_modifier_cents: 12000, price_modifier_pct: null },
      ], 3),
      q("d1-power", "00000000-0000-4000-8000-000000000001", "Is there a power point near the mounting location?", "boolean", [
        { label: "Yes", value: "yes", price_modifier_cents: 0, price_modifier_pct: null },
      ], 4, true, "Take a photo showing the nearest power point to the mounting spot."),
    ],
  },
  {
    id: "00000000-0000-4000-8000-000000000002",
    slug: "tv-floating-cabinet",
    name: "TV / Floating Cabinet",
    description: "Custom floating entertainment cabinets, made to measure.",
    base_price_cents: 45000,
    price_unit: "per_metre",
    active: true,
    sort_order: 2,
    // Placeholder model so the AR flow is testable pre-launch.
    ar_model_glb_url: "/models/floating-cabinet.glb",
    ar_model_usdz_url: null,
    hero_image_url: null,
    created_at: "",
    updated_at: "",
    service_questions: [
      q("d2-width", "00000000-0000-4000-8000-000000000002", "How wide should the cabinet be? (metres)", "number", null, 1),
      q("d2-wall", "00000000-0000-4000-8000-000000000002", "What type of wall will the cabinet mount to?", "single_select", wallTypeOptions, 2),
      q("d2-led", "00000000-0000-4000-8000-000000000002", "Add LED backlighting behind the cabinet?", "boolean", [
        { label: "Yes, add LED backlight", value: "yes", price_modifier_cents: 15000, price_modifier_pct: null },
      ], 3),
    ],
  },
  {
    id: "00000000-0000-4000-8000-000000000003",
    slug: "showcase-cabinet",
    name: "Showcase Cabinet",
    description: "Built-in display cabinets with optional glass shelving and lighting.",
    base_price_cents: 120000,
    price_unit: "fixed",
    active: true,
    sort_order: 3,
    ar_model_glb_url: null,
    ar_model_usdz_url: null,
    hero_image_url: null,
    created_at: "",
    updated_at: "",
    service_questions: [
      q("d3-size", "00000000-0000-4000-8000-000000000003", "What size showcase cabinet do you need?", "single_select", [
        { label: "Small (up to 1.2m wide)", value: "small", price_modifier_cents: 0, price_modifier_pct: null },
        { label: "Medium (1.2m – 2m wide)", value: "medium", price_modifier_cents: 40000, price_modifier_pct: null },
        { label: "Large (over 2m wide)", value: "large", price_modifier_cents: 80000, price_modifier_pct: null },
      ], 1, true, "Take a photo of the room corner or wall where the cabinet will sit."),
      q("d3-glass", "00000000-0000-4000-8000-000000000003", "Include glass shelves?", "boolean", [
        { label: "Yes, glass shelves", value: "yes", price_modifier_cents: 18000, price_modifier_pct: null },
      ], 2),
      q("d3-light", "00000000-0000-4000-8000-000000000003", "Include integrated lighting?", "boolean", [
        { label: "Yes, integrated lighting", value: "yes", price_modifier_cents: 25000, price_modifier_pct: null },
      ], 3),
    ],
  },
  {
    id: "00000000-0000-4000-8000-000000000004",
    slug: "led-strip-lighting",
    name: "LED Strip Lighting",
    description: "LED strip lighting supplied and installed.",
    base_price_cents: 8500,
    price_unit: "per_metre",
    active: true,
    sort_order: 4,
    ar_model_glb_url: null,
    ar_model_usdz_url: null,
    hero_image_url: null,
    created_at: "",
    updated_at: "",
    service_questions: [
      q("d4-length", "00000000-0000-4000-8000-000000000004", "How many metres of LED strip do you need?", "number", null, 1),
      q("d4-loc", "00000000-0000-4000-8000-000000000004", "Where will the LED strip be installed?", "single_select", [
        { label: "Kitchen kickboard", value: "kickboard", price_modifier_cents: 0, price_modifier_pct: null },
        { label: "Ceiling cove", value: "ceiling_cove", price_modifier_cents: null, price_modifier_pct: 20 },
        { label: "Inside a cabinet", value: "cabinet", price_modifier_cents: 0, price_modifier_pct: null },
        { label: "Other", value: "other", price_modifier_cents: 0, price_modifier_pct: null },
      ], 2),
      q("d4-dimmer", "00000000-0000-4000-8000-000000000004", "Add a dimmer controller?", "boolean", [
        { label: "Yes, add a dimmer", value: "yes", price_modifier_cents: 9500, price_modifier_pct: null },
      ], 3),
    ],
  },
  {
    id: "00000000-0000-4000-8000-000000000005",
    slug: "room-heater-installation",
    name: "Room Heater Installation",
    description: "Wall-mounted panel and strip heater installation.",
    base_price_cents: 24900,
    price_unit: "fixed",
    active: true,
    sort_order: 5,
    ar_model_glb_url: null,
    ar_model_usdz_url: null,
    hero_image_url: null,
    created_at: "",
    updated_at: "",
    service_questions: [
      q("d5-type", "00000000-0000-4000-8000-000000000005", "What type of heater is being installed?", "single_select", [
        { label: "Panel heater (we supply)", value: "panel", price_modifier_cents: 0, price_modifier_pct: null },
        { label: "Strip heater (we supply)", value: "strip", price_modifier_cents: 3000, price_modifier_pct: null },
        { label: "I have my own unit", value: "existing_unit", price_modifier_cents: -5000, price_modifier_pct: null },
      ], 1),
      q("d5-wall", "00000000-0000-4000-8000-000000000005", "What type of wall will the heater mount to?", "single_select", wallTypeOptions, 2, true, "Take a photo of the wall where the heater will go, including the nearest power point."),
    ],
  },
];

export function getDemoWizardData(): QuoteWizardData {
  return {
    services: demoServices,
    rules: [1, 2, 3, 4, 5].map((day) => ({
      day_of_week: day,
      start_time: "09:00",
      end_time: "17:00",
      active: true,
    })),
    blockedDates: [],
    busy: [],
    configured: false,
  };
}
