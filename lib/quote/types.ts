import type { Tables } from "@/lib/database.types";
import type { AvailabilityRule, BlockedDate, BusyInterval } from "@/lib/slots";

export type ServiceWithQuestions = Tables<"services"> & {
  service_questions: Tables<"service_questions">[];
};

export type QuoteWizardData = {
  services: ServiceWithQuestions[];
  rules: AvailabilityRule[];
  blockedDates: BlockedDate[];
  busy: BusyInterval[];
  /** false when Supabase env vars are missing → wizard runs in demo mode. */
  configured: boolean;
};
