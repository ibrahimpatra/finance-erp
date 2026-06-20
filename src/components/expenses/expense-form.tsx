"use client";
import { useEffect, useMemo, useState } from "react";
import { useForm }   from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { expenseSchema, ExpenseSchema } from "@/lib/validations/expense";
import { TagSelector } from "@/components/shared/tag-selector";
import { AddExpenseCategoryModal } from "@/components/shared/add-expense-category-modal";
import { AddIncomeSourceModal }    from "@/components/shared/add-income-source-modal";
import { AttributionPromptModal, AttributionIncomeOption } from "@/components/shared/attribution-prompt-modal";
import { useIncome }        from "@/hooks/use-income";
import { useSpentBy }       from "@/hooks/use-spent-by";
import { useExpenseTypes }  from "@/hooks/use-expense-types";
import { useBankAccounts }  from "@/hooks/use-bank-accounts";
import { useCurrency }      from "@/hooks/use-currency";
import { useSettingsStore } from "@/stores/settings.store";
import { resolveFIFOPrimaryIncome }            from "@/services/attribution.service";
import { useToast }                            from "@/components/ui/toaster";
import { IncomeWithBalance } from "@/types";
import { Loader2, AlertCircle, Plus, Lock, Landmark } from "lucide-react";
import Link from "next/link";

interface ExpenseFormProps {
  defaultValues?: Partial<ExpenseSchema>;
  onSubmit: (data: ExpenseSchema) => Promise<void>;
  onCancel: () => void;
  submitLabel?: string;
  modalLevel?: 1 | 2 | 3;
  /** Pre-select an account (e.g. launched from account detail page) */
  preselectedAccountId?: string;
}

const inp = "w-full px-3.5 py-2.5 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all";

export function ExpenseForm({
  defaultValues, onSubmit, onCancel, submitLabel = "Save", modalLevel = 1,
  preselectedAccountId,
}: ExpenseFormProps) {
  const { incomes }       = useIncome();
  const { spentBys }      = useSpentBy();
  const { expenseTypes }  = useExpenseTypes();
  const { accounts }      = useBankAccounts();
  const { formatFor }     = useCurrency();
  const { settings }      = useSettingsStore();
  const { toast }         = useToast();
  const defaultCode       = settings?.currencyCode ?? "KWD";

  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showIncomeModal,   setShowIncomeModal]   = useState(false);
  // Attribution prompt — shown after save when mode is "prompt"
  const [attributionData,   setAttributionData]   = useState<{
    expenseId: string; expenseReason: string; expenseAmount: number;
    accountId: string; currencyCode: string;
  } | null>(null);

  const catLevel = Math.min(modalLevel + 0, 3) as 1 | 2 | 3;
  const incLevel = Math.min(modalLevel + 0, 3) as 1 | 2 | 3;

  const {
    register, handleSubmit, setValue, watch,
    formState: { errors, isSubmitting },
  } = useForm<ExpenseSchema>({
    resolver: zodResolver(expenseSchema),
    defaultValues: {
      tagIds:      [],
      currencyCode: defaultCode,
      accountId:   preselectedAccountId ?? "",
      ...defaultValues,
    },
  });

  const tagIds          = watch("tagIds") ?? [];
  const watchedIncomeId = watch("incomeSourceId");
  const watchedAccountId = watch("accountId");

  const selectedIncome  = incomes.find((i) => i.id === watchedIncomeId);
  const selectedAccount = accounts.find((a) => a.id === watchedAccountId);

  // Incomes filtered to the selected account (when account mode is active)
  const incomesForAccount = useMemo(
    () => (watchedAccountId
      ? (incomes as IncomeWithBalance[]).filter((i) => i.accountId === watchedAccountId)
      : []),
    [incomes, watchedAccountId]
  );

  // ── Currency locking ────────────────────────────────────────────
  useEffect(() => {
    if (selectedAccount) {
      setValue("currencyCode", selectedAccount.currencyCode);
    } else if (selectedIncome?.currencyCode) {
      setValue("currencyCode", selectedIncome.currencyCode);
    } else {
      setValue("currencyCode", defaultCode);
    }
  }, [watchedAccountId, watchedIncomeId, selectedAccount, selectedIncome, defaultCode, setValue]);

  // ── When account changes, reset incomeSourceId (it may not belong to new account) ──
  useEffect(() => {
    if (watchedAccountId && watchedIncomeId) {
      const incomeStillValid = incomesForAccount.some((i) => i.id === watchedIncomeId);
      if (!incomeStillValid) setValue("incomeSourceId", "");
    }
  }, [watchedAccountId]); // eslint-disable-line react-hooks/exhaustive-deps

  const lockedCurrency  = selectedAccount?.currencyCode ?? selectedIncome?.currencyCode ?? defaultCode;
  const activeTypes     = expenseTypes.filter((t) => t.isActive);
  const hasNoCategories = activeTypes.length === 0;
  const hasNoIncomes    = incomes.length === 0;
  const useAccountMode  = accounts.length > 0; // show account selector when accounts exist

  // ── Handlers ───────────────────────────────────────────────────
  const handleCategoryCreated = (type: { id: string; name: string }) => {
    setValue("expenseTypeId", type.id);
    setShowCategoryModal(false);
  };

  const handleIncomeCreated = (income: { id: string; name: string; currencyCode: string }) => {
    setValue("incomeSourceId", income.id);
    setShowIncomeModal(false);
  };

  /**
   * Wraps the parent onSubmit to:
   * 1. Resolve incomeSourceId via FIFO if account mode is active and user left it blank.
   * 2. Trigger attribution prompt if attributionMode === "prompt".
   *
   * This ensures the service ALWAYS receives a populated incomeSourceId for the ledger.
   */
  const handleFormSubmit = async (data: ExpenseSchema) => {
    let resolved = { ...data };

    if (useAccountMode && data.accountId && !data.incomeSourceId) {
      const accountIncomes = (incomes as IncomeWithBalance[]).filter(
        (i) => i.accountId === data.accountId
      );

      if (accountIncomes.length === 0) {
        // FIX: previously submitted silently with incomeSourceId = undefined,
        // causing a ledger entry with no income source — balance never debited.
        // Now we block the save and show a clear error.
        toast(
          "This account has no income entries yet. Add income to this account before logging an expense.",
          "error"
        );
        return;
      }

      const primaryId = resolveFIFOPrimaryIncome(accountIncomes);
      if (primaryId) {
        resolved = { ...resolved, incomeSourceId: primaryId };
      }
    }

    await onSubmit(resolved);
  };

  return (
    <>
      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">

        {/* ── Dependency banners ─────────────────────────────────────── */}
        {hasNoCategories && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 flex items-start gap-3">
            <AlertCircle className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-amber-800">No expense categories yet</p>
              <p className="text-xs text-amber-600 mt-0.5">Add at least one category first.</p>
            </div>
            <button type="button" onClick={() => setShowCategoryModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500 text-white text-xs font-medium hover:bg-amber-600 transition-colors shrink-0">
              <Plus className="w-3 h-3" /> Add Category
            </button>
          </div>
        )}

        {!useAccountMode && hasNoIncomes && (
          <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 flex items-start gap-3">
            <AlertCircle className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-blue-800">No income sources found</p>
              <p className="text-xs text-blue-600 mt-0.5">An income source is needed to log expenses.</p>
            </div>
            <button type="button" onClick={() => setShowIncomeModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-500 text-white text-xs font-medium hover:bg-blue-600 transition-colors shrink-0">
              <Plus className="w-3 h-3" /> Add Income
            </button>
          </div>
        )}

        {/* ── Bank Account (account mode) ────────────────────────────── */}
        {useAccountMode && (
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium flex items-center gap-1.5">
                <Landmark className="w-3.5 h-3.5 text-muted-foreground" /> Account *
              </label>
              <Link href="/accounts" className="text-xs text-primary hover:underline">
                Manage
              </Link>
            </div>
            <select
              value={watchedAccountId ?? ""}
              onChange={(e) => {
                setValue("accountId", e.target.value);
                setValue("incomeSourceId", "");
              }}
              className={inp}
            >
              <option value="">Select account…</option>
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.icon ?? "🏦"} {a.name} [{a.currencyCode}]
                </option>
              ))}
            </select>
            <input type="hidden" {...register("accountId")} />
            {errors.root && (
              <p className="text-xs text-destructive">{errors.root.message}</p>
            )}
          </div>
        )}

        {/* ── Income Source ──────────────────────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">
                {useAccountMode ? "Income Source" : "Income Source *"}
              </label>
              <button type="button" onClick={() => setShowIncomeModal(true)}
                className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition-colors">
                <Plus className="w-3 h-3" /> New
              </button>
            </div>
            <select {...register("incomeSourceId")} className={inp}>
              {useAccountMode
                ? <option value="">Auto (FIFO match)</option>
                : <option value="">Select income source…</option>
              }
              {(useAccountMode && watchedAccountId
                ? incomesForAccount
                : (incomes as IncomeWithBalance[])
              ).map((i) => {
                const cur = i.currencyCode || defaultCode;
                return (
                  <option key={i.id} value={i.id}>
                    {i.name} · {formatFor(i.balance, cur)} left [{cur}]
                  </option>
                );
              })}
            </select>
            {errors.incomeSourceId && (
              <p className="text-xs text-destructive">{errors.incomeSourceId.message}</p>
            )}
            {useAccountMode && watchedAccountId && !watchedIncomeId && (
              <p className="text-xs text-muted-foreground">
                Leave blank — oldest income with balance will be used automatically.
              </p>
            )}
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium">Spent By *</label>
            <select {...register("spentById")} className={inp}>
              <option value="">Select person…</option>
              {spentBys.filter((s) => s.isActive).map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
            {errors.spentById && (
              <p className="text-xs text-destructive">{errors.spentById.message}</p>
            )}
          </div>
        </div>

        {/* ── Amount + Currency + Category ─────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="space-y-1">
            <label className="text-sm font-medium">Amount *</label>
            <input {...register("amount")} type="number" step="0.001" min="0.001"
              placeholder="0.000" className={inp} />
            {errors.amount && (
              <p className="text-xs text-destructive">{errors.amount.message}</p>
            )}
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium flex items-center gap-1.5">
              Currency
              <Lock className="w-3 h-3 text-muted-foreground" />
            </label>
            <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-lg border border-input bg-muted/50 text-sm">
              <span className="font-semibold text-foreground">{lockedCurrency}</span>
              <span className="text-xs text-muted-foreground">
                {selectedAccount ? "locked to account" : selectedIncome ? "locked to income" : "default"}
              </span>
            </div>
            <input type="hidden" {...register("currencyCode")} />
          </div>

          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Category *</label>
              <button type="button" onClick={() => setShowCategoryModal(true)}
                className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition-colors">
                <Plus className="w-3 h-3" /> New
              </button>
            </div>
            <select {...register("expenseTypeId")} className={inp}>
              <option value="">Select category…</option>
              {activeTypes.map((t) => (
                <option key={t.id} value={t.id}>{t.icon} {t.name}</option>
              ))}
            </select>
            {errors.expenseTypeId && (
              <p className="text-xs text-destructive">{errors.expenseTypeId.message}</p>
            )}
          </div>
        </div>

        {/* ── Reason ─────────────────────────────────────────────────── */}
        <div className="space-y-1">
          <label className="text-sm font-medium">Reason *</label>
          <input {...register("reason")} placeholder="What was this expense for?" className={inp} />
          {errors.reason && (
            <p className="text-xs text-destructive">{errors.reason.message}</p>
          )}
        </div>

        {/* ── Notes ──────────────────────────────────────────────────── */}
        <div className="space-y-1">
          <label className="text-sm font-medium">Notes</label>
          <textarea {...register("notes")} placeholder="Optional notes…" rows={2}
            className={`${inp} resize-none`} />
        </div>

        {/* ── Tags ───────────────────────────────────────────────────── */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium">Tags</label>
          <TagSelector selectedIds={tagIds} onChange={(ids) => setValue("tagIds", ids)} />
        </div>

        {/* ── Actions ────────────────────────────────────────────────── */}
        <div className="flex gap-3 pt-2">
          <button type="button" onClick={onCancel}
            className="flex-1 px-4 py-2.5 rounded-lg border border-border text-sm font-medium hover:bg-muted transition-colors">
            Cancel
          </button>
          <button type="submit" disabled={isSubmitting}
            className="flex-1 flex items-center justify-center gap-2 bg-primary text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-primary/90 disabled:opacity-60 transition-all">
            {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
            {submitLabel}
          </button>
        </div>
      </form>

      {/* ── Modals ────────────────────────────────────────────────────── */}
      <AddExpenseCategoryModal
        isOpen={showCategoryModal}
        onClose={() => setShowCategoryModal(false)}
        onCreated={handleCategoryCreated}
        level={catLevel}
      />
      <AddIncomeSourceModal
        isOpen={showIncomeModal}
        onClose={() => setShowIncomeModal(false)}
        onCreated={handleIncomeCreated}
        level={incLevel}
      />
    </>
  );
}
