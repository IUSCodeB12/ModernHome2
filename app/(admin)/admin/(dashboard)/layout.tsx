import Link from "next/link";
import {
  Calendar,
  CalendarCheck,
  FileText,
  Images,
  LayoutDashboard,
  Receipt,
  Settings,
  Users,
  Wrench,
} from "lucide-react";
import { Toaster } from "@/components/ui/sonner";

const sidebarLinks = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/bookings", label: "Bookings", icon: CalendarCheck },
  { href: "/admin/quotes", label: "Quotes", icon: FileText },
  { href: "/admin/calendar", label: "Calendar", icon: Calendar },
  { href: "/admin/services", label: "Services", icon: Wrench },
  { href: "/admin/gallery", label: "Gallery", icon: Images },
  { href: "/admin/invoices", label: "Invoices", icon: Receipt },
  { href: "/admin/customers", label: "Customers", icon: Users },
  { href: "/admin/settings", label: "Settings", icon: Settings },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen">
      <aside className="flex w-60 shrink-0 flex-col border-r bg-sidebar text-sidebar-foreground">
        <div className="flex h-16 items-center gap-2 border-b px-4">
          <span className="flex size-8 items-center justify-center rounded-md bg-sidebar-primary text-xs font-bold text-sidebar-primary-foreground">
            MH
          </span>
          <span className="font-semibold">ModernHome Admin</span>
        </div>
        <nav className="flex-1 space-y-1 p-3">
          {sidebarLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-sidebar-foreground/70 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            >
              <link.icon className="size-4" />
              {link.label}
            </Link>
          ))}
        </nav>
      </aside>
      <main className="flex-1 p-6">{children}</main>
      <Toaster richColors position="top-right" />
    </div>
  );
}
