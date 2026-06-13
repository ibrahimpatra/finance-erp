"use client";
import { useAuthStore } from "@/stores/auth.store";
import { Navbar } from "@/components/layout/navbar";
import { QuickAddFAB } from "@/components/expenses/quick-add-fab";
import { CommandPalette } from "@/components/shared/command-palette";
import { Loader2 } from "lucide-react";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { loading } = useAuthStore();

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
      <Navbar />
      <main className="pt-[var(--navbar-height)]">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-6 min-h-[calc(100vh-var(--navbar-height))]">
          {children}
        </div>
      </main>
      <QuickAddFAB />
      <CommandPalette />
    </div>
  );
}
