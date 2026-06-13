"use client";
import { usePathname } from "next/navigation";
import { useUIStore } from "@/stores/ui.store";
import { Menu, Search, Bell } from "lucide-react";
import { useCurrency } from "@/hooks/use-currency";

const PAGE_TITLES: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/income": "Income Sources",
  "/expenses": "Expenses",
  "/transfers": "Transfers",
  "/spent-by": "Spent By",
  "/tags": "Tags",
  "/analytics": "Analytics",
  "/timeline": "Timeline",
  "/search": "Search",
  "/settings": "Settings",
};

export function Header() {
  const pathname = usePathname();
  const { toggleSidebar, toggleCommand, sidebarOpen } = useUIStore();
  const { symbol, name } = useCurrency();

  const title = PAGE_TITLES[pathname] || PAGE_TITLES[`/${pathname.split("/")[1]}`] || "Finance ERP";

  return (
    <header className="h-[var(--header-height)] border-b border-border bg-white/80 backdrop-blur-sm flex items-center px-6 gap-4 sticky top-0 z-30">
      {!sidebarOpen && (
        <button onClick={toggleSidebar} className="p-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground">
          <Menu className="w-4 h-4" />
        </button>
      )}
      <h1 className="text-base font-semibold text-foreground">{title}</h1>
      <div className="ml-auto flex items-center gap-2">
        <div className="hidden sm:flex items-center gap-1.5 bg-muted/60 rounded-lg px-3 py-1.5 text-xs text-muted-foreground">
          <span className="font-medium text-foreground">{symbol}</span>
          <span>{name}</span>
        </div>
        <button onClick={toggleCommand}
          className="flex items-center gap-2 bg-muted/60 hover:bg-muted rounded-lg px-3 py-1.5 text-xs text-muted-foreground transition-colors">
          <Search className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Search</span>
          <kbd className="hidden sm:inline text-[10px] bg-background border border-border rounded px-1 py-0.5">⌘K</kbd>
        </button>
      </div>
    </header>
  );
}
