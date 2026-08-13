import { describe, expect, it } from "vitest";
import { buildEmail } from "@/lib/email/send";
import { TEMPLATES, type EmailTemplate, type TemplatePayloads } from "@/lib/email/templates";
import {
  dateTime,
  escapeHtml,
  money,
  moneyRange,
  slotWindow,
} from "@/lib/email/render";

/**
 * These tests exist because email is the one part of the app nobody sees
 * fail. A broken page throws in front of the user; a broken email just
 * quietly arrives wrong — or arrives saying "confirmed for **&nbsp;**".
 *
 * The fixture maps are keyed over `EmailTemplate`, so a new template with no
 * fixture is a compile error rather than an untested send.
 */

/** Only the required fields — every optional left out or null. */
const MINIMAL: { [K in EmailTemplate]: TemplatePayloads[K] } = {
  quote_received: { service: "TV mounting" },
  quote_ready: { service: "TV mounting", amountCents: 34000 },
  quote_adjusted: { service: "TV mounting", amountCents: 41250 },
  quote_rejected: { service: "TV mounting" },
  booking_confirmed: { service: "TV mounting" },
  booking_cancelled: { service: "TV mounting" },
  reschedule_requested: { service: "TV mounting" },
  reschedule_confirmed: { service: "TV mounting" },
  payment_due: { service: "TV mounting" },
  receipt_ready: { service: "TV mounting" },
  admin_new_quote: { service: "TV mounting" },
  admin_quote_accepted: { service: "TV mounting" },
  admin_quote_declined: { service: "TV mounting" },
  admin_reschedule_requested: { service: "TV mounting" },
};

const START = "2026-08-19T23:00:00.000Z"; // 9am Wed 20 Aug, Melbourne
const END = "2026-08-20T01:00:00.000Z"; // 11am the same morning

/** Everything populated, as a real send would be. */
const FULL: { [K in EmailTemplate]: TemplatePayloads[K] } = {
  quote_received: {
    service: "TV mounting",
    estimateLowCents: 28000,
    estimateHighCents: 40000,
    slotStart: START,
    slotEnd: END,
  },
  quote_ready: { service: "TV mounting", amountCents: 34000 },
  quote_adjusted: { service: "TV mounting", amountCents: 41250 },
  quote_rejected: { service: "TV mounting", reason: "Outside our service area." },
  booking_confirmed: {
    service: "TV mounting",
    slotStart: START,
    slotEnd: END,
    address: "12 Smith St, Brunswick 3056",
  },
  booking_cancelled: { service: "TV mounting", slotStart: START },
  reschedule_requested: { service: "TV mounting", slotStart: START },
  reschedule_confirmed: { service: "TV mounting", slotStart: START, slotEnd: END },
  payment_due: { service: "TV mounting", amountCents: 41250 },
  receipt_ready: { service: "TV mounting", amountCents: 41250 },
  admin_new_quote: {
    service: "TV mounting",
    customerName: "Jo Nguyen",
    suburb: "Brunswick",
    slotStart: START,
    slotEnd: END,
    estimateLowCents: 28000,
    estimateHighCents: 40000,
  },
  admin_quote_accepted: {
    service: "TV mounting",
    customerName: "Jo Nguyen",
    amountCents: 34000,
    slotStart: START,
    slotEnd: END,
  },
  admin_quote_declined: {
    service: "TV mounting",
    customerName: "Jo Nguyen",
    amountCents: 34000,
  },
  admin_reschedule_requested: {
    service: "TV mounting",
    customerName: "Jo Nguyen",
    slotStart: START,
    note: "Could we do an afternoon instead?",
  },
};

const ALL = Object.keys(TEMPLATES) as EmailTemplate[];

const build = (t: EmailTemplate, fixtures: typeof MINIMAL) =>
  buildEmail(t, fixtures[t] as never);

describe("formatters", () => {
  it("return null rather than an empty string for missing input", () => {
    // The whole point: "" would flow into a sentence and leave a hole in it.
    expect(money(null)).toBeNull();
    expect(money(undefined)).toBeNull();
    expect(dateTime(null)).toBeNull();
    expect(dateTime("")).toBeNull();
    expect(slotWindow(undefined)).toBeNull();
    expect(moneyRange(1000, null)).toBeNull();
  });

  it("reject values that would render as NaN or Invalid Date", () => {
    expect(money(Number.NaN)).toBeNull();
    expect(money(Number.POSITIVE_INFINITY)).toBeNull();
    expect(dateTime("not-a-date")).toBeNull();
    expect(slotWindow("not-a-date", END)).toBeNull();
  });

  it("format money and windows in AU conventions", () => {
    expect(money(41250)).toBe("$412.50");
    expect(money(0)).toBe("$0.00");
    expect(moneyRange(28000, 40000)).toBe("$280.00 – $400.00");
    // A zero-width range reads as one price, not "$280.00 – $280.00".
    expect(moneyRange(28000, 28000)).toBe("$280.00");
  });

  it("renders the slot window in Melbourne time, not UTC", () => {
    // START is 23:00 UTC the previous day; Melbourne makes it 9am Thursday.
    const window = slotWindow(START, END);
    expect(window).toContain("9:00am");
    expect(window).toContain("11:00am");
    expect(window).toContain("20 Aug");
  });

  it("falls back to the start alone when the end is unusable", () => {
    expect(slotWindow(START, "nonsense")).toBe(dateTime(START));
  });
});

describe("every template", () => {
  it.each(ALL)("%s renders both parts with a full payload", (template) => {
    const { subject, html, text } = build(template, FULL);
    expect(subject.length).toBeGreaterThan(0);
    expect(html).toContain("<!doctype html>");
    expect(text.length).toBeGreaterThan(0);
  });

  it.each(ALL)("%s survives a payload with every optional missing", (template) => {
    const { subject, html, text } = build(template, MINIMAL);
    expect(subject.length).toBeGreaterThan(0);
    expect(html).toContain("<!doctype html>");
    expect(text.length).toBeGreaterThan(0);
  });

  // The bug this whole restructure was built to prevent.
  it.each(ALL)("%s never leaks a placeholder value into the copy", (template) => {
    for (const fixtures of [MINIMAL, FULL]) {
      const { subject, html, text } = build(template, fixtures);
      for (const output of [subject, html, text]) {
        expect(output).not.toMatch(/Invalid Date|NaN|undefined|\bnull\b/);
      }
    }
  });

  it.each(ALL)("%s emits no empty fact rows", (template) => {
    const { html, text } = build(template, MINIMAL);
    // An unknown value must take its label with it, not leave a bare cell.
    expect(html).not.toMatch(/<td[^>]*>\s*<\/td>/);

    // ...and in plain text, no label sitting there with nothing after it.
    // Checked against the template's own labels rather than "any line ending
    // in a colon", which would flag ordinary prose like "Here are the details:".
    const labels = TEMPLATES[template]
      .blocks(MINIMAL[template] as never)
      .flatMap((b) => (b.kind === "facts" ? b.rows.map((r) => r.label) : []));
    for (const line of text.split("\n")) {
      for (const label of labels) {
        expect(line).not.toBe(`${label}:`);
        expect(line).not.toBe(`${label}: `);
      }
    }
  });

  it.each(ALL)("%s has a subject that says something specific", (template) => {
    const { subject } = build(template, FULL);
    expect(subject.length).toBeLessThan(80); // stays readable in a phone inbox
    expect(subject).not.toMatch(/undefined|null/);
  });

  it.each(ALL)("%s gives the text part the same headline as the HTML", (template) => {
    const { html, text } = build(template, FULL);
    const heading = TEMPLATES[template].blocks(FULL[template] as never).find(
      (b) => b.kind === "heading"
    );
    expect(heading).toBeDefined();
    if (heading?.kind === "heading") {
      expect(text).toContain(heading.text);
      // The HTML part carries the escaped form — "You're" becomes "You&#39;re".
      expect(html).toContain(escapeHtml(heading.text));
    }
  });
});

describe("audience routing", () => {
  it("sends customers to the portal and admins to the dashboard", () => {
    for (const template of ALL) {
      const { html } = build(template, FULL);
      const isAdmin = TEMPLATES[template].audience === "admin";
      const cta = TEMPLATES[template].cta.path;
      expect(cta.startsWith(isAdmin ? "/admin" : "/portal")).toBe(true);
      expect(html).toContain(cta);
    }
  });

  it("names admin templates with the admin_ prefix that notify.ts relies on", () => {
    // notifyCustomer/notifyAdmin narrow on this prefix at the type level, so a
    // mismatch here would let internal copy reach a customer.
    for (const template of ALL) {
      expect(template.startsWith("admin_")).toBe(
        TEMPLATES[template].audience === "admin"
      );
    }
  });
});

describe("escaping", () => {
  it("neutralises markup in interpolated values", () => {
    expect(escapeHtml("Ben & Jerry's <b>")).toBe(
      "Ben &amp; Jerry&#39;s &lt;b&gt;"
    );
  });

  it("escapes database-sourced values inside a real template", () => {
    const { html, text } = buildEmail("admin_reschedule_requested", {
      service: "Cabinets & shelving",
      customerName: "<script>alert(1)</script>",
      slotStart: START,
      note: "Before 5 & after 2",
    });
    expect(html).not.toContain("<script>");
    expect(html).toContain("Cabinets &amp; shelving");
    // Plain text is not markup, so it keeps the original characters.
    expect(text).toContain("Cabinets & shelving");
  });
});

describe("copy that other code promises", () => {
  it("puts the rejection reason in front of the customer", () => {
    // components/admin/quote-actions.tsx tells the admin "the customer will be
    // notified with this reason". It previously wasn't.
    const { html, text } = buildEmail("quote_rejected", {
      service: "TV mounting",
      reason: "Outside our service area.",
    });
    expect(html).toContain("Outside our service area.");
    expect(text).toContain("Outside our service area.");
  });

  it("omits the reason line entirely when none was given", () => {
    const { text } = buildEmail("quote_rejected", { service: "TV mounting" });
    expect(text).not.toContain("Reason:");
  });

  it("states the amount owed on the invoice email", () => {
    const { text } = buildEmail("payment_due", {
      service: "TV mounting",
      amountCents: 41250,
    });
    expect(text).toContain("$412.50");
  });

  it("drops the total when there is nothing to bill", () => {
    const { text } = buildEmail("payment_due", {
      service: "TV mounting",
      amountCents: null,
    });
    expect(text).not.toContain("Total due");
    expect(text).not.toContain("$");
  });
});
