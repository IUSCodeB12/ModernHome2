"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { adminAction, type ActionResult } from "@/lib/admin/guard";
import { canTransition, type BookingStatus } from "@/lib/bookings/status";
import { isSupabaseConfigured } from "@/lib/supabase/admin";
import type { TablesUpdate } from "@/lib/database.types";

const schema = z.object({
  bookingId: z.string().min(1),
  toStatus: z.enum([
    "enquiry", "quoted", "approved", "booked", "in_progress",
    "completed", "invoiced", "paid", "cancelled",
  ]),
});

export async function updateBookingStatus(
  input: z.input<typeof schema>
): Promise<ActionResult<{ status: BookingStatus }>> {
  const parsed = schema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid request." };
  const { bookingId, toStatus } = parsed.data;

  if (!isSupabaseConfigured()) {
    return { ok: true, data: { status: toStatus } } as ActionResult<{ status: BookingStatus }>;
  }

  return adminAction(async ({ admin }) => {
    const { data: booking } = await admin
      .from("bookings")
      .select("id, status")
      .eq("id", bookingId)
      .single();
    if (!booking) throw new Error("Booking not found.");

    const from = booking.status as BookingStatus;
    if (!canTransition(from, toStatus)) {
      throw new Error(`Can't move a ${from} job straight to ${toStatus}.`);
    }

    const patch: TablesUpdate<"bookings"> = { status: toStatus };
    if (toStatus === "paid") patch.deposit_paid_at = new Date().toISOString();

    const { error } = await admin.from("bookings").update(patch).eq("id", bookingId);
    if (error) throw new Error(error.message);

    revalidatePath("/admin/bookings");
    revalidatePath("/admin/calendar");
    revalidatePath("/admin");
    return { status: toStatus };
  });
}
