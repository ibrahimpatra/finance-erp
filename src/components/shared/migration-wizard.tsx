"use client";
import { useState, useMemo } from "react";
import { Modal }             from "@/components/shared/modal";
import { AccountForm }       from "@/components/bank-accounts/account-form";
import { BankAccountSchema } from "@/lib/validations/bank-account";
import { useBankAccountStore } from "@/stores/bank-account.store";
import { useIncomeStore }    from "@/stores/income.store";
import { useAuthStore }      from "@/stores/auth.store";
import { useToast }          from "@/components/ui/toaster";
import { updateIncome }      from "@/services/income.service";
import { BankAccount }       from "@/types";
import { Check, ChevronRight, Landmark, Link2, Zap, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils/helpers";

interface MigrationWizardProps {
  isOpen:     boolean;
  onClose:    () => void;
  onComplete: () => void;
}

type Step = "create" | "link" | "done";

export function MigrationWizard({ isOpen, onClose, onComplete }: MigrationWizardProps) {
  const { user }         = useAuthStore();
  const { addAccount, accounts, fetchAccounts } = useBankAccountStore();
  const { incomes, fetchIncomes } = useIncomeStore();
  const { toast }        = useToast();

  const [step,       setStep]       = useState<Step>("create");
  const [linking,    setLinking]    = useState(false);
  // incomeId → accountId mapping selected by user
  const [selections, setSelections] = useState<Record<string, string>>({});

  // Incomes that don't yet have an accountId
  const unlinkdIncomes = useMemo(
    () => incomes.filter((i) => !i.accountId),
    [incomes]
  );

  const handleCreateAccount = async (data: BankAccountSchema) => {
    if (!user) return;
    await addAccount(user.uid, data as Parameters<typeof addAccount>[1]);
    await fetchAccounts(user.uid);
    toast("Account created!", "success");
    // Stay on create step so user can add more accounts
  };

  const handleLinkIncomes = async () => {
    if (!user) return;
    const toLink = Object.entries(selections).filter(([, aId]) => !!aId);
    if (toLink.length === 0) {
      setStep("done");
      return;
    }
    setLinking(true);
    try {
      await Promise.all(
        toLink.map(([incomeId, accountId]) =>
          updateIncome(user.uid, incomeId, { accountId })
        )
      );
      await fetchIncomes(user.uid);
      toast(`${toLink.length} income entries linked!`, "success");
      setStep("done");
    } catch (e: unknown) {
      toast((e as Error).message ?? "Linking failed", "error");
    } finally {
      setLinking(false);
    }
  };

  const STEPS = [
    { id: "create", label: "Create Accounts",  icon: Landmark },
    { id: "link",   label: "Link Income",       icon: Link2 },
    { id: "done",   label: "Done",              icon: Zap },
  ] as const;

  const stepIdx = STEPS.findIndex((s) => s.id === step);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Set Up Bank Accounts"
      description="Link your income entries to bank accounts for per-account balance tracking"
      maxWidth="max-w-lg"
    >
      {/* Step indicator */}
      <div className="flex items-center gap-2 mb-6">
        {STEPS.map((s, i) => {
          const past    = i < stepIdx;
          const current = i === stepIdx;
          return (
            <div key={s.id} className="flex items-center gap-2 flex-1">
              <div className={cn(
                "w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-all",
                past    ? "bg-primary text-white" :
                current ? "bg-primary text-white ring-4 ring-primary/20" :
                          "bg-muted text-muted-foreground"
              )}>
                {past ? <Check className="w-3 h-3" /> : i + 1}
              </div>
              <span className={cn(
                "text-xs font-medium hidden sm:block",
                current ? "text-foreground" : "text-muted-foreground"
              )}>
                {s.label}
              </span>
              {i < STEPS.length - 1 && (
                <ChevronRight className="w-3.5 h-3.5 text-muted-foreground ml-auto shrink-0" />
              )}
            </div>
          );
        })}
      </div>

      {/* ── Step 1: Create account ── */}
      {step === "create" && (
        <div className="space-y-4">
          {accounts.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-2">
              {accounts.map((a: BankAccount) => (
                <span key={a.id}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold">
                  <Check className="w-3 h-3" /> {a.name}
                </span>
              ))}
            </div>
          )}

          <AccountForm
            onSubmit={handleCreateAccount}
            onCancel={() => accounts.length > 0 ? setStep("link") : onClose()}
            submitLabel="Create Account"
          />

          {accounts.length > 0 && (
            <button
              onClick={() => setStep("link")}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-primary text-primary text-sm font-semibold hover:bg-primary/5 transition-all"
            >
              Continue to link income <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </div>
      )}

      {/* ── Step 2: Link incomes ── */}
      {step === "link" && (
        <div className="space-y-4">
          {unlinkdIncomes.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              All income entries already have an account linked.
            </p>
          ) : (
            <>
              <p className="text-sm text-muted-foreground">
                Select which bank account each income entry belongs to.
                You can skip any that don't apply yet.
              </p>
              <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1">
                {unlinkdIncomes.map((income) => (
                  <div key={income.id} className="flex items-center gap-3 p-3 rounded-xl border border-border">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{income.name}</p>
                      <p className="text-xs text-muted-foreground">{income.source}</p>
                    </div>
                    <select
                      value={selections[income.id] ?? ""}
                      onChange={(e) =>
                        setSelections((p) => ({ ...p, [income.id]: e.target.value }))
                      }
                      className="w-40 px-2 py-1.5 rounded-lg border border-input bg-background text-xs focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary"
                    >
                      <option value="">Skip for now</option>
                      {accounts.map((a: BankAccount) => (
                        <option key={a.id} value={a.id}>
                          {a.name} [{a.currencyCode}]
                        </option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
            </>
          )}

          <div className="flex gap-3 pt-1">
            <button
              onClick={() => setStep("create")}
              className="px-4 py-2.5 rounded-lg border border-border text-sm font-medium hover:bg-muted transition-colors"
            >
              Back
            </button>
            <button
              onClick={handleLinkIncomes}
              disabled={linking}
              className="flex-1 flex items-center justify-center gap-2 bg-primary text-white px-4 py-2.5 rounded-lg text-sm font-semibold hover:bg-primary/90 disabled:opacity-60 transition-all"
            >
              {linking ? <Loader2 className="w-4 h-4 animate-spin" /> : <Link2 className="w-4 h-4" />}
              {Object.values(selections).filter(Boolean).length > 0
                ? `Link ${Object.values(selections).filter(Boolean).length} entries`
                : "Skip linking"}
            </button>
          </div>
        </div>
      )}

      {/* ── Step 3: Done ── */}
      {step === "done" && (
        <div className="text-center space-y-4 py-4">
          <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto">
            <Check className="w-8 h-8 text-emerald-600" />
          </div>
          <div>
            <p className="text-base font-semibold text-foreground">All set!</p>
            <p className="text-sm text-muted-foreground mt-1">
              Your bank accounts are configured. New income and expenses you add
              will be linked to accounts automatically.
            </p>
          </div>
          <button
            onClick={onComplete}
            className="w-full bg-primary text-white px-4 py-2.5 rounded-lg text-sm font-semibold hover:bg-primary/90 transition-all"
          >
            Go to Accounts
          </button>
        </div>
      )}
    </Modal>
  );
}
