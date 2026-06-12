"use client";
import { useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { NavPanel } from "./nav-panel";
import { useAuthStore } from "@/stores/auth.store";
import { useUIStore } from "@/stores/ui.store";
import { useSettingsStore } from "@/stores/settings.store";
import { Wallet, Grid3X3, Plus, Search } from "lucide-react";

const PAGE_LABELS: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/income": "Income",
  "/expenses": "Expenses",
  "/transfers": "Transfers",
  "/spent-by": "People",
  "/tags": "Tags",
  "/analytics": "Analytics",
  "/timeline": "Timeline",
  "/search": "Search",
  "/settings": "Settings",
};

export function Header() {
  const pathname = usePathname();
  const { user } = useAuthStore();
  const { openQuickAdd } = useUIStore();
  const { settings } = useSettingsStore();
  const [panelOpen, setPanelOpen] = useState(false);

  const segment  = "/" + (pathname.split("/")[1] ?? "");
  const pageLabel = PAGE_LABELS[segment] ?? "";

  const initials = user?.displayName
    ? user.displayName.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()
    : user?.email?.[0].toUpperCase() ?? "U";

  return (
    <>
      <header className="sticky top-0 z-40 h-14 bg-white/90 backdrop-blur-md border-b border-border flex items-center px-4 gap-3">
        {/* Logo */}
        <Link href="/dashboard" className="flex items-center gap-2 shrink-0">
          <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center">
            <Wallet className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-foreground text-sm hidden sm:block">Finance</span>
        </Link>

        {/* Page title / breadcrumb */}
        {pageLabel && (
          <div className="flex items-center gap-1.5 text-sm">
            <span className="text-muted-foreground hidden sm:block">/</span>
            <span className="font-semibold text-foreground">{pageLabel}</span>
          </div>
        )}

        <div className="flex-1" />

        {/* Currency indicator */}
        {settings && (
          <div className="hidden sm:flex items-center gap-1 px-2.5 py-1 rounded-full bg-muted text-xs font-semibold text-muted-foreground">
            {settings.currencyCode}
          </div>
        )}

        {/* Search shortcut */}
        <Link href="/search"
          className="p-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground">
          <Search className="w-4 h-4" />
        </Link>

        {/* Quick add */}
        <button onClick={openQuickAdd}
          className="flex items-center gap-1.5 bg-primary text-white px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-primary/90 transition-all shadow-sm shadow-primary/25">
          <Plus className="w-3.5 h-3.5" />
          <span className="hidden sm:block">Add</span>
        </button>

        {/* User avatar → nav panel */}
        <button
          onClick={() => setPanelOpen(true)}
          className="w-8 h-8 rounded-xl bg-primary/10 hover:bg-primary/20 flex items-center justify-center text-primary font-bold text-xs transition-colors"
          title="Open navigation"
        >
          {initials}
        </button>
      </header>

      <NavPanel isOpen={panelOpen} onClose={() => setPanelOpen(false)} />
    </>
  );
}
