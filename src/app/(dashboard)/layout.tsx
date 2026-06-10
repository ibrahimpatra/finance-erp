"use client";
import { useAuthStore } from "@/stores/auth.store";
import { useUIStore } from "@/stores/ui.store";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { QuickAddFAB } from "@/components/expenses/quick-add-fab";
import { CommandPalette } from "@/components/shared/command-palette";
import { cn } from "@/lib/utils/helpers";
import { Loader2 } from "lucide-react";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { loading } = useAuthStore();
  const { sidebarOpen } = useUIStore();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
          <p className="text-sm text-muted-foreground">Loading your data…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <div className={cn(
        "transition-all duration-300",
        sidebarOpen ? "ml-[var(--sidebar-width)]" : "ml-16"
      )}>
        <Header />
        <main className="p-6 min-h-[calc(100vh-var(--header-height))]">
          {children}
        </main>
      </div>
      <QuickAddFAB />
      <CommandPalette />
    </div>
  );
}
