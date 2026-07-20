"use client";
import { useState, useMemo } from "react";
import { Modal }             from "@/components/shared/modal";
import { useCurrency }       from "@/hooks/use-currency";
import { createManualAllocation } from "@/services/attribution.service";
import { useAuthStore }      from "@/stores/auth.store";
import { useToast }          from "@/components/ui/toaster";
import { Loader2, TrendingUp, Check, SkipForward } from "lucide-react";

export interface AttributionIncomeOption {
  id:           string;
  name:         string;
  amount:       number;
  remaining:    number; // income.balance — unallocated to other expenses
  currencyCode: string;
}

interface AttributionPromptModalProps {
  isOpen:         boolean;
  onClose:        () => void;
  onComplete:     () => void;
  expenseId:      string;
  accountId:      string;
  expenseAmount:  number;
  expenseReason:  string;
  currencyCode:   string;
  incomeOptions:  AttributionIncomeOption[];
}

export function AttributionPromptModal({
  isOpen, onClose, onComplete,
  expenseId, accountId, expenseAmount, expenseReason,
  currencyCode, incomeOptions,
}: AttributionPromptModalProps) {
  const { user }      = useAuthStore();
  const { formatFor } = useCurrency();
  const { toast }     = useToast();

  const [allocations, setAllocations] = useState<Record<string, number>>({});
  const [saving,      setSaving]      = useState(false);

  const totalAllocated = useMemo(
    () => Object.values(allocations).reduce((a, v) => a + (v || 0), 0),
    [allocations]
  );
  const remaining = expenseAmount - totalAllocated;
  const isValid   = Math.abs(remaining) < 0.001;

  const handleChange = (incomeId: string, raw: string) => {
    const num = parseFloat(raw) || 0;
    setAllocations((p) => ({ ...p, [incomeId]: num }));
  };

  const handleFill = (incomeId: string, available: number) => {
    const take = Math.min(Math.max(0, remaining), available);
    if (take <= 0) return;
    setAllocations((p) => ({ ...p, [incomeId]: (p[incomeId] ?? 0) + take }));
  };

  const handleSave = async () => {
    if (!user || !isValid) return;
    setSaving(true);
    try {
      for (const [incomeId, amount] of Object.entries(allocations)) {
        if (amount > 0) {
          await createManualAllocation(user.uid, {
            accountId, expenseId, incomeId, amount, isAutoMapped: false,
          });
        }
      }
      toast("Attribution saved", "success");
      onComplete();
    } catch (e: unknown) {
      toast((e as Error).message ?? "Failed to save attribution", "error");
    } finally {
      setSaving(false);
    }
  };

  const statusColor = remaining > 0.001
    ? "bg-amber-50 text-amber-700 border-amber-200"
    : remaining < -0.001
    ? "bg-red-50 text-red-700 border-red-200"
    : "bg-emerald-50 text-emerald-700 border-emerald-200";

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Match Expense to Income"
      description={`Allocate "${expenseReason}" across your income entries`}
      level={2}
    >
      <div className="space-y-4">
        {/* Remaining indicator */}
        <div className={`flex items-center justify-between px-4 py-3 rounded-xl border font-medium text-sm ${statusColor}`}>
          {remaining > 0.001 ? (
            <>
              <span>Remaining to allocate</span>
              <span className="amount-display font-bold">{formatFor(remaining, currencyCode)}</span>
            </>
          ) : remaining < -0.001 ? (
            <>
              <span>Over-allocated by</span>
              <span className="amount-display font-bold">{formatFor(Math.abs(remaining), currencyCode)}</span>
            </>
          ) : (
            <span className="w-full text-center">✓ Fully allocated — {formatFor(expenseAmount, currencyCode)}</span>
          )}
        </div>

        {/* Income rows */}
        <div className="space-y-2.5">
          {incomeOptions.map((income) => (
            <div key={income.id} className="border border-border rounded-xl p-4 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-blue-500 shrink-0" />
                  <span className="text-sm font-medium truncate">{income.name}</span>
                </div>
                <span className="text-xs text-muted-foreground shrink-0">
                  <span className="amount-display font-semibold text-foreground">
                    {formatFor(income.remaining, income.currencyCode)}
                  </span>{" "}
                  available
                </span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  step="0.001"
                  min="0"
                  max={income.remaining}
                  value={allocations[income.id] ?? ""}
                  onChange={(e) => handleChange(income.id, e.target.value)}
                  placeholder="0.000"
                  className="flex-1 px-3 py-2 rounded-lg border border-input text-sm focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary"
                />
                <button
                  type="button"
                  onClick={() => handleFill(income.id, income.remaining)}
                  className="px-3 py-2 rounded-lg bg-muted text-xs font-medium hover:bg-muted/80 transition-colors whitespace-nowrap"
                >
                  Fill {formatFor(Math.min(Math.max(0, remaining), income.remaining), income.currencyCode)}
                </button>
              </div>
            </div>
          ))}

          {incomeOptions.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">
              No income entries in this account yet.
            </p>
          )}
        </div>

        <div className="flex gap-3 pt-1">
          <button
            type="button"
            onClick={onComplete}
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-border text-sm font-medium hover:bg-muted transition-colors"
          >
            <SkipForward className="w-4 h-4" />
            Skip (Auto FIFO)
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving || !isValid || incomeOptions.length === 0}
            className="flex-1 flex items-center justify-center gap-2 bg-primary text-white px-4 py-2.5 rounded-lg text-sm font-semibold hover:bg-primary/90 disabled:opacity-60 transition-all"
          >
            {saving
              ? <Loader2 className="w-4 h-4 animate-spin" />
              : <Check className="w-4 h-4" />
            }
            Confirm Attribution
          </button>
        </div>
      </div>
    </Modal>
  );
}
