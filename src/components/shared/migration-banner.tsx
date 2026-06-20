"use client";
import { useState } from "react";
import { Landmark, X, ArrowRight } from "lucide-react";
import { MigrationWizard } from "./migration-wizard";

interface MigrationBannerProps {
  /** Show only when incomes > 0 AND accounts === 0 */
  show: boolean;
}

const DISMISSED_KEY = "finance_erp_account_migration_dismissed";

export function MigrationBanner({ show }: MigrationBannerProps) {
  const [dismissed, setDismissed] = useState(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem(DISMISSED_KEY) === "1";
  });
  const [wizardOpen, setWizardOpen] = useState(false);

  if (!show || dismissed) return null;

  const dismiss = () => {
    localStorage.setItem(DISMISSED_KEY, "1");
    setDismissed(true);
  };

  return (
    <>
      <div className="flex items-start gap-4 px-5 py-4 rounded-2xl border border-primary/30 bg-primary/5 mb-4">
        <div className="w-9 h-9 rounded-xl bg-primary/15 flex items-center justify-center shrink-0">
          <Landmark className="w-4.5 h-4.5 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-foreground">
            New: Bank Accounts
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Link your income entries to bank accounts to see per-account balances
            and track which income funded each expense.
          </p>
          <button
            onClick={() => setWizardOpen(true)}
            className="mt-2 flex items-center gap-1.5 text-xs font-semibold text-primary hover:text-primary/80 transition-colors"
          >
            Set up accounts <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
        <button
          onClick={dismiss}
          className="p-1.5 rounded-lg text-muted-foreground hover:bg-muted transition-colors shrink-0"
          aria-label="Dismiss"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <MigrationWizard
        isOpen={wizardOpen}
        onClose={() => setWizardOpen(false)}
        onComplete={() => {
          setWizardOpen(false);
          dismiss();
        }}
      />
    </>
  );
}
