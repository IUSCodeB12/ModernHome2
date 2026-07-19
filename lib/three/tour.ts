/**
 * Keyframes for the scroll-driven room tour. Scroll progress (0..1) maps
 * along these stops; the camera lerps between adjacent camera/target pairs.
 *
 * Stop 0 is an establishing wide shot (matches the hero's opening angle) so
 * grabbing the scrollbar at the top starts the tour with no jarring jump.
 * The remaining stops mirror the hotspot dolly positions in room.tsx.
 */
export type TourStop = {
  id: string;
  camera: [number, number, number];
  target: [number, number, number];
  /** Null for the intro stop, which has no copy card / CTA. */
  slug: string | null;
  eyebrow: string;
  title: string;
  body: string;
  priceHint: string;
};

export const TOUR_STOPS: TourStop[] = [
  {
    id: "intro",
    camera: [3.4, 1.9, 4.6],
    target: [-0.4, 1.15, -1.0],
    slug: null,
    eyebrow: "A room we built",
    title: "Everything in here, we install",
    body: "Scroll to walk through the room. Each piece is a service you can price and book online in minutes.",
    priceHint: "",
  },
  {
    id: "tv",
    camera: [0.6, 1.7, 0.9],
    target: [0.6, 1.6, -2.9],
    slug: "tv-wall-mounting",
    eyebrow: "TV Wall Mounting",
    title: "Any TV, any wall",
    body: "Plasterboard, brick or concrete — mounted level, cables concealed, power sorted.",
    priceHint: "from $149",
  },
  {
    id: "cabinet",
    camera: [0.7, 1.15, 1.0],
    target: [0.6, 0.72, -2.72],
    slug: "tv-floating-cabinet",
    eyebrow: "Floating Cabinet",
    title: "Floating cabinets with LED glow",
    body: "Made to measure, wall-mounted with a seamless look and warm underglow lighting.",
    priceHint: "from $450 / m",
  },
  {
    id: "showcase",
    camera: [-1.2, 1.5, 1.6],
    target: [-3.68, 1.25, -0.5],
    slug: "showcase-cabinet",
    eyebrow: "Showcase Cabinet",
    title: "Show off what you love",
    body: "Built-in display cabinets with glass shelves and integrated lighting.",
    priceHint: "from $1,200",
  },
  {
    id: "led",
    camera: [0, 2.1, 1.1],
    target: [0, 3.0, -2.9],
    slug: "led-strip-lighting",
    eyebrow: "LED Strip Lighting",
    title: "Light that sets the mood",
    body: "Kickboards, ceiling coves, cabinets — supplied, installed and dimmable.",
    priceHint: "from $85 / m",
  },
  {
    id: "heater",
    camera: [-1.4, 1.05, 1.8],
    target: [-3.9, 0.75, 1.4],
    slug: "room-heater-installation",
    eyebrow: "Room Heater Installation",
    title: "Warm rooms, tidy install",
    body: "Panel and strip heaters supplied and mounted, or your own unit fitted properly.",
    priceHint: "from $249",
  },
];
