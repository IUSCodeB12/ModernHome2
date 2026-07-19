import type { Enums } from "@/lib/database.types";

export type BookingStatus = Enums<"booking_status">;

export const BOOKING_STATUSES: BookingStatus[] = [
  "enquiry",
  "quoted",
  "approved",
  "booked",
  "in_progress",
  "completed",
  "invoiced",
  "paid",
  "cancelled",
];

export const BOOKING_STATUS_LABELS: Record<BookingStatus, string> = {
  enquiry: "Enquiry",
  quoted: "Quoted",
  approved: "Approved",
  booked: "Booked",
  in_progress: "In progress",
  completed: "Completed",
  invoiced: "Invoiced",
  paid: "Paid",
  cancelled: "Cancelled",
};

/**
 * Columns shown on the pipeline board. Cancelled is handled separately
 * (reachable from anywhere) so it doesn't clutter the flow.
 */
export const PIPELINE_COLUMNS: BookingStatus[] = [
  "enquiry",
  "quoted",
  "approved",
  "booked",
  "in_progress",
  "completed",
  "invoiced",
  "paid",
];

/** Allowed forward/back transitions. Any status can be cancelled. */
const TRANSITIONS: Record<BookingStatus, BookingStatus[]> = {
  enquiry: ["quoted", "cancelled"],
  quoted: ["approved", "enquiry", "cancelled"],
  approved: ["booked", "quoted", "cancelled"],
  booked: ["in_progress", "approved", "cancelled"],
  in_progress: ["completed", "booked", "cancelled"],
  completed: ["invoiced", "in_progress", "cancelled"],
  invoiced: ["paid", "completed", "cancelled"],
  paid: ["invoiced"],
  cancelled: ["enquiry"],
};

export function canTransition(from: BookingStatus, to: BookingStatus): boolean {
  if (from === to) return false;
  return TRANSITIONS[from]?.includes(to) ?? false;
}

export function allowedTransitions(from: BookingStatus): BookingStatus[] {
  return TRANSITIONS[from] ?? [];
}
