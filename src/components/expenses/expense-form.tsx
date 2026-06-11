"use client";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { expenseSchema, ExpenseSchema } from "@/lib/validations/expense";
import { TagSelector } from "@/components/shared/tag-selector";
import { AddExpenseCategoryModal } from "@/components/shared/add-expense-category-modal";
import { AddIncomeSourceModal } from "@/components/shared/add-income-source-modal";
import { useIncome } from "@/hooks/use-income";
import { useSpentBy } from "@/hooks/use-spent-by";
import { useExpenseTypes } from "@/hooks/use-expense-types";
import { useCurrency } from "@/hooks/use-currency";
import { useSettingsStore } from "@/stores/settings.store";
import { Loader2, AlertCircle, Plus, Lock } from "lucide-react";

interface ExpenseFormProps {
  defaultValues?: Partial<ExpenseSchema>;
  onSubmit: (data: ExpenseSchema) => Promise<void>;
  onCancel: () => void;
  submitLabel?: string;
  /** Modal level — pass higher values when this form is already inside a modal */
  modalLevel?: 1 | 2 | 3;
}

const inp = "w-full px-3.5 py-2.5 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all";

export function ExpenseForm({
  defaultValues, onSubmit, onCancel, submitLabel = "Save", modalLevel = 1,
}: ExpenseFormProps) {
  const { incomes } = useIncome();
  const { spentBys } = useSpentBy();
  const { expenseTypes } = useExpenseTypes();
  const { formatFor } = useCurrency();
  const { settings } = useSettingsStore();
  const defaultCode = settings?.currencyCode ?? "KWD";

  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showIncomeModal,   setShowIncomeModal]   = useState(false);

  const catLevel  = Math.min(modalLevel + 0, 3) as 1 | 2 | 3;
  const incLevel  = Math.min(modalLevel + 0, 3) as 1 | 2 | 3;

  const {
    register, handleSubmit, setValue, watch,
    formState: { errors, isSubmitting },
  } = useForm<ExpenseSchema>({
    resolver: zodResolver(expenseSchema),
    defaultValues: { tagIds: [], currencyCode: defaultCode, ...defaultValues },
  });

  const tagIds           = watch("tagIds") ?? [];
  const watchedIncomeId  = watch("incomeSourceId");
  const selectedIncome   = incomes.find((i) => i.id === watchedIncomeId);

  // ── Currency locking: auto-set currency when income source changes ──────────
  useEffect(() => {
    const locked = selectedIncome?.currencyCode || defaultCode;
    setValue("currencyCode", locked);
  }, [watchedIncomeId, selectedIncome, defaultCode, setValue]);

  const lockedCurrency   = selectedIncome?.currencyCode || defaultCode;
  const activeTypes      = expenseTypes.filter((t) => t.isActive);
  const hasNoIncomes     = incomes.length === 0;
  const hasNoCategories  = activeTypes.length === 0;

  // ── Handlers: auto-select newly created items ───────────────────────────────
  const handleCategoryCreated = (type: { id: string; name: string }) => {
    setValue("expenseTypeId", type.id);
    setShowCategoryModal(false);
  };

  const handleIncomeCreated = (income: { id: string; name: string; currencyCode: string }) => {
    setValue("incomeSourceId", income.id);
    // currency will be auto-set via the useEffect above after Zustand refreshes
    setShowIncomeModal(false);
  };

  return (
    <>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">

        {/* ── Dependency banners ───────────────────────────────────────── */}
        {hasNoCategories && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 flex items-start gap-3">
            <AlertCircle className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-amber-800">No expense categories yet</p>
              <p className="text-xs text-amber-600 mt-0.5">Add at least one category to record an expense.</p>
            </div>
            <button type="button" onClick={() => setShowCategoryModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500 text-white text-xs font-medium hover:bg-amber-600 transition-colors shrink-0">
              <Plus className="w-3 h-3" /> Add Category
            </button>
          </div>
        )}

        {hasNoIncomes && (
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

        {/* ── Income source + Spent by ─────────────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Income Source *</label>
              <button type="button" onClick={() => setShowIncomeModal(true)}
                className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition-colors">
                <Plus className="w-3 h-3" /> New
              </button>
            </div>
            <select {...register("incomeSourceId")} className={inp}>
              <option value="">Select income source…</option>
              {incomes.map((i) => {
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

        {/* ── Amount + Currency (locked) + Category ───────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="space-y-1">
            <label className="text-sm font-medium">Amount *</label>
            <input {...register("amount")} type="number" step="0.001" min="0.001"
              placeholder="0.000" className={inp} />
            {errors.amount && (
              <p className="text-xs text-destructive">{errors.amount.message}</p>
            )}
          </div>

          {/* Currency — LOCKED to income source's currency */}
          <div className="space-y-1">
            <label className="text-sm font-medium flex items-center gap-1.5">
              Currency
              {selectedIncome && <Lock className="w-3 h-3 text-muted-foreground" />}
            </label>
            {selectedIncome ? (
              <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-lg border border-input bg-muted/50 text-sm">
                <span className="font-semibold text-foreground">{lockedCurrency}</span>
                <span className="text-xs text-muted-foreground">locked to income source</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-lg border border-dashed border-input bg-muted/30 text-sm text-muted-foreground">
                Select income source first
              </div>
            )}
            {/* Hidden field to submit the locked value */}
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

        {/* ── Reason ──────────────────────────────────────────────────── */}
        <div className="space-y-1">
          <label className="text-sm font-medium">Reason *</label>
          <input {...register("reason")} placeholder="What was this expense for?" className={inp} />
          {errors.reason && (
            <p className="text-xs text-destructive">{errors.reason.message}</p>
          )}
        </div>

        {/* ── Notes ───────────────────────────────────────────────────── */}
        <div className="space-y-1">
          <label className="text-sm font-medium">Notes</label>
          <textarea {...register("notes")} placeholder="Optional notes…" rows={2}
            className={`${inp} resize-none`} />
        </div>

        {/* ── Tags ────────────────────────────────────────────────────── */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium">Tags</label>
          <TagSelector selectedIds={tagIds} onChange={(ids) => setValue("tagIds", ids)} />
        </div>

        {/* ── Actions ─────────────────────────────────────────────────── */}
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

      {/* ── Modals ─────────────────────────────────────────────────────── */}
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
