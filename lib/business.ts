/**
 * Business identity — the single source of truth.
 *
 * Every one of these values used to be hardcoded separately in the site
 * footer, the homepage trust strip and the invoice PDF. That's how the site
 * ended up publishing two different contact addresses
 * (`hello@example.com.au` and `hello@modernhome.com.au`) and printing a
 * placeholder ABN onto real tax invoices.
 *
 * `null` means "not registered yet". Consumers must **omit** a null value, not
 * substitute a stand-in. A plausible-looking `ABN 00 000 000 000` is worse
 * than showing nothing: it implies a registration that doesn't exist, on
 * documents a customer may rely on to claim a GST credit.
 *
 * TODO(company): fill these in once the entity is registered. Grep for
 * `BUSINESS.` to find every surface that changes when they land.
 *
 * NOTE: GST registration requires an ABN. While `abn` is null the invoice
 * PDF still renders a "GST (10%)" line, because the estimate and invoice
 * maths compute it — worth confirming with an accountant whether GST should
 * be charged at all before registration, since that's a tax decision rather
 * than a display one.
 */
import { BRAND } from "@/lib/brand";

export type BusinessIdentity = {
  /** Public-facing name. Safe to use anywhere. */
  tradingName: string;
  /** Registered entity name, once incorporated. */
  legalName: string | null;
  abn: string | null;
  acn: string | null;
  /** Electrical contractor registration, for LED and hard-wired heater work. */
  electricalLicence: string | null;
  email: string | null;
  phone: string | null;
  serviceArea: string;
  /** Governing law for the terms — Australian state or territory. */
  jurisdiction: string;
};

export const BUSINESS: BusinessIdentity = {
  tradingName: BRAND.name,
  legalName: null,
  abn: null,
  acn: null,
  electricalLicence: null,
  email: null,
  phone: null,
  serviceArea: "Greater Melbourne",
  jurisdiction: "Victoria",
};

/**
 * True once the entity details are in place. The legal pages use this to show
 * a draft notice and stay out of search results until the real values land.
 */
export function isBusinessRegistered(): boolean {
  return Boolean(BUSINESS.abn && BUSINESS.legalName && BUSINESS.email);
}

/** The name to use in a contract: the legal entity if known, else the trading name. */
export function contractingName(): string {
  return BUSINESS.legalName ?? BUSINESS.tradingName;
}
