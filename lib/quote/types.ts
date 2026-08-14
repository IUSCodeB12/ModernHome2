import type { Tables } from "@/lib/database.types";
import type { AvailabilityRule, BlockedDate, BusyInterval } from "@/lib/slots";
import type { QuoteIdentity } from "@/lib/quote/saved-contact";

export type ServiceWithQuestions = Tables<"services"> & {
  service_questions: Tables<"service_questions">[];
};

export type QuoteWizardData = {
  services: ServiceWithQuestions[];
  rules: AvailabilityRule[];
  blockedDates: BlockedDate[];
  busy: BusyInterval[];
  /** Showcase photo per service id (curated in /admin/showcase). */
  photos: Record<string, string>;
  /** false when Supabase env vars are missing → wizard runs in demo mode. */
  configured: boolean;
  /**
   * Who's booking and what's already on file. Drives one-tap checkout on the
   * contact step and lets the review step skip verification.
   */
  identity: QuoteIdentity;
};
