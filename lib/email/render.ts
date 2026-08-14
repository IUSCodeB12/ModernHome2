import { formatInTimeZone } from "date-fns-tz";
import { BUSINESS_TIME_ZONE } from "@/lib/slots";
import { BRAND, SITE_ORIGIN } from "@/lib/brand";
import { BUSINESS } from "@/lib/business";

/**
 * The email content model, and the two renderers that consume it.
 *
 * Templates describe what an email *says* as structured blocks, never as
 * markup. Both the HTML and the plain-text renderer read those same blocks, so
 * the two parts of a multipart email cannot drift — previously there was no
 * text part at all, which is a deliverability penalty on a domain sitting
 * behind `p=quarantine`.
 *
 * **Facts, not bolded prose.** Dates and amounts belong in a `facts` block,
 * not interpolated into a sentence. A missing value then disappears cleanly
 * with its label instead of rendering "confirmed for **&nbsp;**" — the old
 * formatters returned `""` on bad input, so a null slot produced a confident
 * sentence with a hole in it. Formatters here return `null` and null rows are
 * dropped.
 */

/** One label/value row. A null value means "unknown" and is omitted entirely. */
export type Fact = { label: string; value: string | null };

export type Block =
  | { kind: "heading"; text: string }
  | { kind: "para"; text: string }
  | { kind: "facts"; rows: Fact[] }
  /** Quieter secondary text — reasons, caveats, small print. */
  | { kind: "note"; text: string };

/** Who the email is from, and how to reach them. Built by `config.signature()`. */
export type Signature = { from: string; contacts: string[] };

/** The single button at the bottom. `path` is site-relative. */
export type Cta = { label: string; path: string };

// --- formatters ------------------------------------------------------------
// All return `string | null`. Null propagates to an omitted row; it never
// becomes an empty string in the middle of a sentence.

function parseDate(iso: unknown): Date | null {
  if (typeof iso !== "string" || !iso.trim()) return null;
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? null : d;
}

/** Cents → "$340.00". Rejects NaN/Infinity, which would render "$NaN". */
export function money(cents: number | null | undefined): string | null {
  if (typeof cents !== "number" || !Number.isFinite(cents)) return null;
  return `$${(cents / 100).toLocaleString("en-AU", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

/** A quoted range → "$280.00 – $400.00". Null unless both ends are real. */
export function moneyRange(
  lowCents: number | null | undefined,
  highCents: number | null | undefined
): string | null {
  const low = money(lowCents);
  const high = money(highCents);
  if (!low || !high) return null;
  return low === high ? low : `${low} – ${high}`;
}

/** ISO → "Tuesday 19 Aug, 9:00am" in Melbourne time. */
export function dateTime(iso: unknown): string | null {
  const d = parseDate(iso);
  if (!d) return null;
  return formatInTimeZone(d, BUSINESS_TIME_ZONE, "EEEE d MMM, h:mmaaa");
}

/** ISO pair → "Tuesday 19 Aug, 9:00am – 11:00am". Degrades to the start alone. */
export function slotWindow(startIso: unknown, endIso?: unknown): string | null {
  const start = parseDate(startIso);
  if (!start) return null;
  const startText = formatInTimeZone(start, BUSINESS_TIME_ZONE, "EEEE d MMM, h:mmaaa");
  const end = parseDate(endIso);
  if (!end) return startText;
  return `${startText} – ${formatInTimeZone(end, BUSINESS_TIME_ZONE, "h:mmaaa")}`;
}

// --- rendering -------------------------------------------------------------

const ESCAPES: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
};

/**
 * Escape interpolated values. Service names, customer names and reschedule
 * notes all reach templates from the database; an unescaped `&` in a business
 * name is enough to corrupt the markup.
 */
export function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (c) => ESCAPES[c] ?? c);
}

/** Drop unknown rows, so a facts block never renders a dangling label. */
const knownRows = (rows: Fact[]) =>
  rows.filter((r): r is Fact & { value: string } => Boolean(r.value?.trim()));

function htmlBlock(block: Block): string {
  switch (block.kind) {
    case "heading":
      return `<h1 style="margin:0 0 12px;font-size:21px;font-weight:600;letter-spacing:-0.01em;color:#1c1917">${escapeHtml(block.text)}</h1>`;
    case "para":
      return `<p style="margin:0 0 12px">${escapeHtml(block.text)}</p>`;
    case "note":
      return `<p style="margin:0 0 12px;font-size:13px;color:#78716c">${escapeHtml(block.text)}</p>`;
    case "facts": {
      const rows = knownRows(block.rows);
      if (!rows.length) return "";
      const cells = rows
        .map(
          (r) =>
            `<tr><td style="padding:9px 12px 9px 0;border-bottom:1px solid #f0efec;color:#78716c;font-size:13px;vertical-align:top;white-space:nowrap">${escapeHtml(r.label)}</td>` +
            `<td style="padding:9px 0;border-bottom:1px solid #f0efec;color:#1c1917;font-size:14px;font-weight:600;vertical-align:top">${escapeHtml(r.value)}</td></tr>`
        )
        .join("");
      return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="width:100%;border-collapse:collapse;margin:4px 0 16px">${cells}</table>`;
    }
  }
}

function textBlock(block: Block): string | null {
  switch (block.kind) {
    case "heading":
      return `${block.text}\n${"=".repeat(block.text.length)}`;
    case "para":
    case "note":
      return block.text;
    case "facts": {
      const rows = knownRows(block.rows);
      if (!rows.length) return null;
      return rows.map((r) => `${r.label}: ${r.value}`).join("\n");
    }
  }
}

/**
 * Inbox-preview text. Without one, clients scrape the first body text — which
 * for a table-based layout is often the brand name repeated back.
 */
function preheaderHtml(text: string): string {
  // The entity run stops Gmail appending body text after the preheader.
  const pad = "&#847;&zwnj;&nbsp;".repeat(40);
  return `<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;height:0;width:0">${escapeHtml(text)}${pad}</div>`;
}

/**
 * Sign-off block, shown on customer mail only.
 *
 * A transactional email that ends at a button reads like it came from a
 * system. Naming the sender and printing the phone number turns the same
 * message into correspondence someone can reply to.
 */
function signatureHtml(sig: Signature): string {
  const contacts = sig.contacts.filter(Boolean).map(escapeHtml).join(" &middot; ");
  return `<div style="margin-top:20px;padding-top:16px;border-top:1px solid #f0efec">
      <p style="margin:0 0 2px;color:#78716c;font-size:14px">Kind regards,</p>
      <p style="margin:0;font-weight:600;font-size:14px;color:#1c1917">${escapeHtml(sig.from)}</p>
      <p style="margin:2px 0 0;color:#78716c;font-size:13px">${contacts}</p>
    </div>`;
}

export function renderHtml(
  blocks: Block[],
  options: { preheader: string; cta: Cta; signature?: Signature }
): string {
  const { preheader, cta, signature } = options;
  const inner = blocks.map(htmlBlock).join("");
  const footerContact = BUSINESS.email ? ` · ${escapeHtml(BUSINESS.email)}` : "";
  // Australian Spam Act sender identification: name the sender and give a way
  // to reach them. Legal entity and ABN appear once `lib/business.ts` is
  // filled in; until then the trading name and service area are what we have.
  const legal = BUSINESS.legalName
    ? `${escapeHtml(BUSINESS.legalName)}${BUSINESS.abn ? ` · ABN ${escapeHtml(BUSINESS.abn)}` : ""}`
    : escapeHtml(BRAND.name);

  return `<!doctype html><html lang="en"><body style="margin:0;background:#f5f3ee;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#1c1917">
    ${preheaderHtml(preheader)}
    <div style="max-width:520px;margin:0 auto;padding:32px 24px">
      <table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>
        <td style="padding-right:10px;vertical-align:middle"><img src="${SITE_ORIGIN}${BRAND.mark.src}" width="56" height="44" alt="" style="display:block;border:0" /></td>
        <td style="vertical-align:middle;font-size:20px;font-weight:700;letter-spacing:-0.02em;color:#1c1917">${escapeHtml(BRAND.name)}</td>
      </tr></table>
      <div style="background:#fff;border:1px solid #e7e5e4;border-radius:16px;padding:24px;margin-top:16px;line-height:1.55;font-size:15px">
        ${inner}
        <p style="margin:20px 0 0"><a href="${SITE_ORIGIN}${cta.path}" style="display:inline-block;background:#1c1917;color:#fff;text-decoration:none;padding:10px 18px;border-radius:8px;font-weight:600">${escapeHtml(cta.label)}</a></p>
        ${signature ? signatureHtml(signature) : ""}
      </div>
      <p style="color:#a8a29e;font-size:12px;margin-top:16px;line-height:1.5">${legal} · Servicing ${escapeHtml(BUSINESS.serviceArea)}${footerContact}</p>
    </div>
  </body></html>`;
}

export function renderText(
  blocks: Block[],
  options: { cta: Cta; signature?: Signature }
): string {
  const body = blocks
    .map(textBlock)
    .filter((b): b is string => b !== null && b !== "")
    .join("\n\n");
  const sig = options.signature
    ? `\n\nKind regards,\n${options.signature.from}\n${options.signature.contacts.filter(Boolean).join(" · ")}`
    : "";
  const legal = BUSINESS.legalName
    ? `${BUSINESS.legalName}${BUSINESS.abn ? ` · ABN ${BUSINESS.abn}` : ""}`
    : BRAND.name;
  const contact = BUSINESS.email ? ` · ${BUSINESS.email}` : "";
  return `${body}\n\n${options.cta.label}: ${SITE_ORIGIN}${options.cta.path}${sig}\n\n—\n${legal} · Servicing ${BUSINESS.serviceArea}${contact}`;
}
