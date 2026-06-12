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
  modalLevel?: 1 | 2 | 3;
}

const field = "space-y-1.5";
const label = "block text-sm font-medium text-foreground";
const inp   = "w-full px-4 py-3 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all placeholder:text-muted-foreground/60";
const err   = "text-xs text-destructive mt-1";
const addBtn = "flex items-center gap-1 text-xs font-medium text-primary hover:text-primary/80 transition-colors";

export function ExpenseForm({ defaultValues, onSubmit, onCancel, submitLabel = "Save", modalLevel = 1 }: ExpenseFormProps) {
  const { incomes }      = useIncome();
  const { spentBys }     = useSpentBy();
  const { expenseTypes } = useExpenseTypes();
  const { formatFor }    = useCurrency();
  const { settings }     = useSettingsStore();
  const defaultCode      = settings?.currencyCode ?? "KWD";

  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showIncomeModal,   setShowIncomeModal]   = useState(false);
  const catLevel = Math.min(modalLevel, 3) as 1|2|3;
  const incLevel = Math.min(modalLevel, 3) as 1|2|3;

  const { register, handleSubmit, setValue, watch, formState: { errors, isSubmitting } } = useForm<ExpenseSchema>({
    resolver: zodResolver(expenseSchema),
    defaultValues: { tagIds: [], currencyCode: defaultCode, ...defaultValues },
  });

  const tagIds          = watch("tagIds") ?? [];
  const watchedIncomeId = watch("incomeSourceId");
  const selectedIncome  = incomes.find(i => i.id === watchedIncomeId);
  const lockedCurrency  = selectedIncome?.currencyCode || defaultCode;
  const activeTypes     = expenseTypes.filter(t => t.isActive);

  useEffect(() => {
    setValue("currencyCode", selectedIncome?.currencyCode || defaultCode);
  }, [watchedIncomeId, selectedIncome, defaultCode, setValue]);

  return (
    <>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">

        {/* Dependency banners */}
        {activeTypes.length === 0 && (
          <div className="flex items-start gap-3 p-4 rounded-xl border border-amber-200 bg-amber-50">
            <AlertCircle className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-amber-800">No expense categories</p>
              <p className="text-xs text-amber-600 mt-0.5">You need at least one category to record an expense.</p>
            </div>
            <button type="button" onClick={() => setShowCategoryModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 text-white rounded-lg text-xs font-semibold hover:bg-amber-600 transition-colors shrink-0">
              <Plus className="w-3 h-3" /> Add
            </button>
          </div>
        )}
        {incomes.length === 0 && (
          <div className="flex items-start gap-3 p-4 rounded-xl border border-blue-200 bg-blue-50">
            <AlertCircle className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-blue-800">No income sources</p>
              <p className="text-xs text-blue-600 mt-0.5">An income source is required to log expenses.</p>
            </div>
            <button type="button" onClick={() => setShowIncomeModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-500 text-white rounded-lg text-xs font-semibold hover:bg-blue-600 transition-colors shrink-0">
              <Plus className="w-3 h-3" /> Add
            </button>
          </div>
        )}

        {/* Income Source */}
        <div className={field}>
          <div className="flex items-center justify-between">
            <label className={label}>Income Source *</label>
            <button type="button" onClick={() => setShowIncomeModal(true)} className={addBtn}>
              <Plus className="w-3.5 h-3.5" /> New
            </button>
          </div>
          <select {...register("incomeSourceId")} className={inp}>
            <option value="">Select income source…</option>
            {incomes.map(i => {
              const c = i.currencyCode || defaultCode;
              return <option key={i.id} value={i.id}>{i.name}  ·  {formatFor(i.balance, c)} left  [{c}]</option>;
            })}
          </select>
          {errors.incomeSourceId && <p className={err}>{errors.incomeSourceId.message}</p>}
        </div>

        {/* Spent by */}
        <div className={field}>
          <label className={label}>Spent By *</label>
          <select {...register("spentById")} className={inp}>
            <option value="">Select person…</option>
            {spentBys.filter(s => s.isActive).map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
          {errors.spentById && <p className={err}>{errors.spentById.message}</p>}
        </div>

        {/* Amount + locked currency */}
        <div className="grid grid-cols-2 gap-4">
          <div className={field}>
            <label className={label}>Amount *</label>
            <input {...register("amount")} type="number" step="0.001" min="0.001" placeholder="0.000" className={inp} />
            {errors.amount && <p className={err}>{errors.amount.message}</p>}
          </div>
          <div className={field}>
            <label className={label + " flex items-center gap-1.5"}>
              Currency {selectedIncome && <Lock className="w-3 h-3 text-muted-foreground" />}
            </label>
            {selectedIncome ? (
              <div className="flex items-center gap-2 px-4 py-3 rounded-xl border border-input bg-muted/50 text-sm">
                <span className="font-bold text-foreground amount-display">{lockedCurrency}</span>
                <span className="text-xs text-muted-foreground">locked to income</span>
              </div>
            ) : (
              <div className="flex items-center px-4 py-3 rounded-xl border border-dashed border-input text-sm text-muted-foreground">
                Select income first
              </div>
            )}
            <input type="hidden" {...register("currencyCode")} />
          </div>
        </div>

        {/* Category */}
        <div className={field}>
          <div className="flex items-center justify-between">
            <label className={label}>Category *</label>
            <button type="button" onClick={() => setShowCategoryModal(true)} className={addBtn}>
              <Plus className="w-3.5 h-3.5" /> New
            </button>
          </div>
          <select {...register("expenseTypeId")} className={inp}>
            <option value="">Select category…</option>
            {activeTypes.map(t => <option key={t.id} value={t.id}>{t.icon} {t.name}</option>)}
          </select>
          {errors.expenseTypeId && <p className={err}>{errors.expenseTypeId.message}</p>}
        </div>

        {/* Reason */}
        <div className={field}>
          <label className={label}>Reason *</label>
          <input {...register("reason")} placeholder="What was this expense for?" className={inp} />
          {errors.reason && <p className={err}>{errors.reason.message}</p>}
        </div>

        {/* Notes */}
        <div className={field}>
          <label className={label}>Notes <span className="text-muted-foreground font-normal">(optional)</span></label>
          <textarea {...register("notes")} placeholder="Any extra details…" rows={2}
            className={inp + " resize-none"} />
        </div>

        {/* Tags */}
        <div className={field}>
          <label className={label}>Tags</label>
          <TagSelector selectedIds={tagIds} onChange={ids => setValue("tagIds", ids)} />
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          <button type="button" onClick={onCancel}
            className="flex-1 px-4 py-3 rounded-xl border border-border text-sm font-semibold hover:bg-muted transition-colors">
            Cancel
          </button>
          <button type="submit" disabled={isSubmitting}
            className="flex-1 flex items-center justify-center gap-2 bg-primary text-white px-4 py-3 rounded-xl text-sm font-semibold hover:bg-primary/90 disabled:opacity-60 active:scale-[0.98] transition-all shadow-sm shadow-primary/25">
            {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
            {submitLabel}
          </button>
        </div>
      </form>

      <AddExpenseCategoryModal isOpen={showCategoryModal} onClose={() => setShowCategoryModal(false)}
        onCreated={t => { setValue("expenseTypeId", t.id); setShowCategoryModal(false); }}
        level={catLevel} />
      <AddIncomeSourceModal isOpen={showIncomeModal} onClose={() => setShowIncomeModal(false)}
        onCreated={i => { setValue("incomeSourceId", i.id); setShowIncomeModal(false); }}
        level={incLevel} />
    </>
  );
}
