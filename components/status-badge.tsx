import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const STYLES: Record<string, string> = {
  // quote statuses
  pending: "bg-amber-100 text-amber-900 border-amber-200",
  approved: "bg-green-100 text-green-900 border-green-200",
  adjusted: "bg-blue-100 text-blue-900 border-blue-200",
  rejected: "bg-red-100 text-red-900 border-red-200",
  expired: "bg-neutral-100 text-neutral-600 border-neutral-200",
  // booking statuses
  enquiry: "bg-amber-100 text-amber-900 border-amber-200",
  quoted: "bg-blue-100 text-blue-900 border-blue-200",
  booked: "bg-green-100 text-green-900 border-green-200",
  in_progress: "bg-indigo-100 text-indigo-900 border-indigo-200",
  completed: "bg-green-100 text-green-900 border-green-200",
  invoiced: "bg-purple-100 text-purple-900 border-purple-200",
  paid: "bg-emerald-100 text-emerald-900 border-emerald-200",
  cancelled: "bg-neutral-100 text-neutral-600 border-neutral-200",
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <Badge
      variant="outline"
      className={cn("capitalize", STYLES[status] ?? "")}
    >
      {status.replace(/_/g, " ")}
    </Badge>
  );
}
