import type { Answers } from "@/lib/quote/estimate";

export type ContactDetails = {
  email: string;
  fullName: string;
  phone: string;
  addressLine1: string;
  suburb: string;
  postcode: string;
  accessNotes: string;
};

export type SlotSelection = {
  start: string; // ISO
  end: string; // ISO
  label: string;
  localDate: string;
};

export type WizardState = {
  step: number; // 0-based index into the 5 steps
  serviceId: string | null;
  answers: Answers;
  /** question id -> storage paths of uploaded photos (set at submit time). */
  photoPaths: Record<string, string[]>;
  contact: ContactDetails;
  slot: SlotSelection | null;
  /** Client-generated quote_request id — used for the photo folder. */
  draftId: string;
  /** ms epoch of the last save — drives the "pick up where you left off" banner. */
  savedAt: number;
};

/** Enough to submit without opening the form — the one-tap checkout gate. */
export function isContactComplete(contact: ContactDetails): boolean {
  return Boolean(
    contact.fullName.trim() &&
      contact.phone.trim() &&
      contact.email.trim() &&
      contact.addressLine1.trim() &&
      contact.suburb.trim() &&
      /^\d{4}$/.test(contact.postcode.trim())
  );
}

export const EMPTY_CONTACT: ContactDetails = {
  email: "",
  fullName: "",
  phone: "",
  addressLine1: "",
  suburb: "",
  postcode: "",
  accessNotes: "",
};

/* v2: localStorage (was sessionStorage) + savedAt. The key is versioned so a
   half-finished v1 draft can't rehydrate into the restructured step order. */
const STORAGE_KEY = "mh-quote-wizard-v2";

/** Drafts older than this are ignored — prices and open slots have moved on. */
const DRAFT_TTL_MS = 7 * 24 * 60 * 60 * 1000;

export function newWizardState(): WizardState {
  return {
    step: 0,
    serviceId: null,
    answers: {},
    photoPaths: {},
    contact: EMPTY_CONTACT,
    slot: null,
    draftId:
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    savedAt: 0,
  };
}

export function loadWizardState(): WizardState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as WizardState;
    if (typeof parsed.step !== "number" || !parsed.draftId) return null;
    if (parsed.savedAt && Date.now() - parsed.savedAt > DRAFT_TTL_MS) {
      window.localStorage.removeItem(STORAGE_KEY);
      return null;
    }
    // A held slot goes stale the moment it's in the past — drop it rather than
    // letting someone resume onto a window that's already been and gone.
    const slot =
      parsed.slot && new Date(parsed.slot.start).getTime() > Date.now()
        ? parsed.slot
        : null;
    return { ...newWizardState(), ...parsed, slot };
  } catch {
    return null;
  }
}

export function saveWizardState(state: WizardState): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ ...state, savedAt: Date.now() })
    );
  } catch {
    // Quota/private-mode failures are non-fatal — user just loses resume.
  }
}

export function clearWizardState(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}
