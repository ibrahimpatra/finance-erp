"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils/helpers";
import { useAuthStore } from "@/stores/auth.store";
import { useUIStore } from "@/stores/ui.store";
import { logoutUser } from "@/lib/firebase/auth";
import { useRouter } from "next/navigation";
import {
  LayoutDashboard, TrendingUp, Receipt, ArrowLeftRight,
  Users, Tag, BarChart3, Clock, Search, Settings, LogOut,
  ChevronLeft, Layers,
} from "lucide-react";

const NAV_ITEMS = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Income", href: "/income", icon: TrendingUp },
  { label: "Expenses", href: "/expenses", icon: Receipt },
  { label: "Transfers", href: "/transfers", icon: ArrowLeftRight },
  { label: "Spent By", href: "/spent-by", icon: Users },
  { label: "Tags", href: "/tags", icon: Tag },
  { label: "Analytics", href: "/analytics", icon: BarChart3 },
  { label: "Timeline", href: "/timeline", icon: Clock },
  { label: "Search", href: "/search", icon: Search },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user } = useAuthStore();
  const { sidebarOpen, toggleSidebar } = useUIStore();
  const router = useRouter();

  const handleLogout = async () => {
    await logoutUser();
    router.replace("/login");
  };

  return (
    <aside className={cn(
      "fixed left-0 top-0 h-screen bg-white border-r border-border flex flex-col z-40 transition-all duration-300 shadow-sidebar",
      sidebarOpen ? "w-[var(--sidebar-width)]" : "w-16"
    )}>
      {/* Logo */}
      <div className="flex items-center h-[var(--header-height)] px-4 border-b border-border gap-3">
        <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center shrink-0 shadow-sm shadow-primary/25">
          <Layers className="w-4 h-4 text-white" />
        </div>
        {sidebarOpen && (
          <div className="overflow-hidden">
            <div className="font-bold text-sm text-foreground leading-none">Finance ERP</div>
            <div className="text-xs text-muted-foreground mt-0.5">Money Tracker</div>
          </div>
        )}
        <button onClick={toggleSidebar}
          className={cn("ml-auto p-1 rounded hover:bg-muted transition-colors text-muted-foreground", !sidebarOpen && "hidden")}>
          <ChevronLeft className="w-4 h-4" />
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5 scrollbar-thin">
        {NAV_ITEMS.map(({ label, href, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link key={href} href={href}
              className={cn("nav-link", active && "active", !sidebarOpen && "justify-center px-0")}>
              <Icon className="w-4 h-4 shrink-0" />
              {sidebarOpen && <span>{label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Bottom */}
      <div className="border-t border-border p-2 space-y-0.5">
        <Link href="/settings"
          className={cn("nav-link", pathname === "/settings" && "active", !sidebarOpen && "justify-center px-0")}>
          <Settings className="w-4 h-4 shrink-0" />
          {sidebarOpen && <span>Settings</span>}
        </Link>
        <button onClick={handleLogout}
          className={cn("nav-link w-full text-left hover:bg-destructive/10 hover:text-destructive", !sidebarOpen && "justify-center px-0")}>
          <LogOut className="w-4 h-4 shrink-0" />
          {sidebarOpen && <span>Sign out</span>}
        </button>
        {sidebarOpen && user && (
          <div className="flex items-center gap-2 px-3 py-2 mt-1">
            <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary shrink-0">
              {(user.displayName || user.email || "?")[0].toUpperCase()}
            </div>
            <div className="overflow-hidden flex-1">
              <div className="text-xs font-medium text-foreground truncate">{user.displayName || "User"}</div>
              <div className="text-xs text-muted-foreground truncate">{user.email}</div>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
