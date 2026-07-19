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
  step: number; // 0-based index into the 6 steps
  serviceId: string | null;
  answers: Answers;
  /** question id -> storage paths of uploaded photos (set at submit time). */
  photoPaths: Record<string, string[]>;
  contact: ContactDetails;
  slot: SlotSelection | null;
  /** Client-generated quote_request id — used for the photo folder. */
  draftId: string;
};

export const EMPTY_CONTACT: ContactDetails = {
  email: "",
  fullName: "",
  phone: "",
  addressLine1: "",
  suburb: "",
  postcode: "",
  accessNotes: "",
};

const STORAGE_KEY = "mh-quote-wizard-v1";

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
  };
}

export function loadWizardState(): WizardState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as WizardState;
    if (typeof parsed.step !== "number" || !parsed.draftId) return null;
    return { ...newWizardState(), ...parsed };
  } catch {
    return null;
  }
}

export function saveWizardState(state: WizardState): void {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Quota/private-mode failures are non-fatal — user just loses refresh-resume.
  }
}

export function clearWizardState(): void {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}
