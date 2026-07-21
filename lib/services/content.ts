/**
 * Static editorial content for service detail pages — process steps,
 * what's included, and FAQs. Keyed by service slug. This is presentation
 * copy only (no DB schema change); unknown slugs fall back to GENERIC.
 */

export type ServiceFaq = { question: string; answer: string };

export type ServiceContent = {
  /** One-line promise shown under the title. */
  tagline: string;
  /** 3–4 step "how it works" for this specific service. */
  process: { title: string; detail: string }[];
  /** Bullet list of what every job includes. */
  includes: string[];
  faqs: ServiceFaq[];
};

const GENERIC: ServiceContent = {
  tagline: "Fixed-price, fully insured, and booked online in minutes.",
  process: [
    { title: "Get your quote", detail: "Answer a few questions and see a fixed price instantly — no callout fee." },
    { title: "Pick a 2-hour window", detail: "Choose an arrival time that suits you. We confirm by email." },
    { title: "We install", detail: "A licensed installer arrives on time and does the job cleanly." },
    { title: "Tidy & sign off", detail: "We test everything, clean up, and you only pay once you're happy." },
  ],
  includes: [
    "Licensed & insured installer",
    "All standard fixings & hardware",
    "Cable management and tidy finish",
    "Full clean-up and rubbish removal",
    "Workmanship guarantee",
  ],
  faqs: [
    { question: "Is the price really fixed?", answer: "Yes. The quote you get online is the price you pay for the scope you selected. If anything unusual comes up, we talk to you before doing any extra work." },
    { question: "Do you charge a callout fee?", answer: "No callout fees. You only pay the quoted price for the job." },
    { question: "Are you insured?", answer: "Every installer is licensed where required and fully insured. Our workmanship is guaranteed." },
  ],
};

const CONTENT: Record<string, ServiceContent> = {
  "tv-wall-mounting": {
    tagline: "Perfectly level, cables hidden, ready to watch the same day.",
    process: [
      { title: "Tell us your setup", detail: "TV size, wall type, and whether you want cables concealed." },
      { title: "Lock in a window", detail: "Pick a 2-hour arrival slot — most mounts take under an hour." },
      { title: "We mount & align", detail: "Secure bracket into studs or masonry, TV levelled and tested." },
      { title: "Cable tidy & sign off", detail: "Cables routed or in-wall, everything cleaned up." },
    ],
    includes: [
      "Wall assessment & stud/masonry fixing",
      "Bracket fitted and TV levelled",
      "Basic cable management",
      "Device tested & connected",
      "Full clean-up",
    ],
    faqs: [
      { question: "Can you hide the cables in the wall?", answer: "Yes — in-wall concealment is available on most plasterboard walls. Select it in the quote and we'll include the fittings." },
      { question: "Do you supply the bracket?", answer: "We can supply a suitable bracket or fit one you already have — just tell us in the quote." },
      { question: "What wall types can you mount on?", answer: "Plasterboard with studs, brick, concrete and most masonry. Let us know your wall type so we bring the right fixings." },
    ],
  },
  "tv-floating-cabinet": {
    tagline: "Wall-hung media units, dead level with concealed brackets.",
    process: [
      { title: "Share your unit", detail: "Cabinet weight and wall type so we bring the right fixings." },
      { title: "Book a window", detail: "Pick a 2-hour arrival slot that suits you." },
      { title: "We hang it level", detail: "Concealed brackets into studs/masonry, unit set dead level." },
      { title: "Test & tidy", detail: "Load-checked, cables managed, area cleaned." },
    ],
    includes: [
      "Concealed heavy-duty brackets",
      "Precision levelling",
      "Cable pass-through where needed",
      "Load & stability check",
      "Full clean-up",
    ],
    faqs: [
      { question: "How much weight can a floating cabinet hold?", answer: "With correct fixings into studs or masonry, most wall-hung units safely carry typical media loads. We assess your wall and cabinet first." },
      { question: "Will there be visible brackets?", answer: "No — we use concealed mounting so the unit appears to float." },
    ],
  },
  "showcase-cabinet": {
    tagline: "Display cabinets installed square, secured and lit.",
    process: [
      { title: "Describe the cabinet", detail: "Size, glass, and whether you want display lighting." },
      { title: "Choose a window", detail: "Pick a 2-hour arrival slot." },
      { title: "We install & secure", detail: "Cabinet positioned, levelled and anti-tip secured." },
      { title: "Light & sign off", detail: "Optional lighting connected, glass cleaned, area tidied." },
    ],
    includes: [
      "Level & square installation",
      "Anti-tip wall securing",
      "Optional display lighting hook-up",
      "Glass & surface clean",
      "Full clean-up",
    ],
    faqs: [
      { question: "Can you add lighting inside?", answer: "Yes — we can connect low-voltage display lighting. Select it in the quote." },
      { question: "Do you secure it to the wall?", answer: "Always. We anti-tip secure display cabinets for safety, especially around children." },
    ],
  },
  "led-strip-lighting": {
    tagline: "Warm, even LED lighting — no hotspots, no visible wiring.",
    process: [
      { title: "Map the run", detail: "Where you want light and the total metres required." },
      { title: "Pick a window", detail: "Choose a 2-hour arrival slot." },
      { title: "We fit & wire", detail: "Strips mounted in channels, driver placed discreetly." },
      { title: "Dial in & tidy", detail: "Brightness/colour set, wiring hidden, area cleaned." },
    ],
    includes: [
      "Quality LED strip & aluminium channel",
      "Driver & controller placement",
      "Concealed wiring where possible",
      "Colour/brightness set to taste",
      "Full clean-up",
    ],
    faqs: [
      { question: "How is it priced?", answer: "LED lighting is priced per metre of run, so your quote scales with the length you need." },
      { question: "Can I control the colour?", answer: "Yes — we can fit tunable-white or RGB strips with a controller or app, depending on what you choose." },
    ],
  },
  "room-heater-installation": {
    tagline: "Panel and strip heaters mounted safely and neatly.",
    process: [
      { title: "Tell us the heater", detail: "Model, mounting location and wall type." },
      { title: "Book a window", detail: "Pick a 2-hour arrival slot." },
      { title: "We mount & connect", detail: "Heater fixed securely with correct clearances." },
      { title: "Test & tidy", detail: "Powered up, checked and the area cleaned." },
    ],
    includes: [
      "Safe mounting with correct clearances",
      "Secure fixing for your wall type",
      "Tidy connection",
      "Operation tested",
      "Full clean-up",
    ],
    faqs: [
      { question: "Do you do the electrical wiring?", answer: "Hard-wired heaters requiring a licensed electrician are noted at quote time; plug-in and standard mounts we handle end to end." },
      { question: "Where can a panel heater go?", answer: "Most walls, provided safe clearances are met. We confirm placement on arrival." },
    ],
  },
};

export function getServiceContent(slug: string): ServiceContent {
  return CONTENT[slug] ?? GENERIC;
}
