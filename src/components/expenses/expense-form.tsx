"use client";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { expenseSchema, ExpenseSchema } from "@/lib/validations/expense";
import { TagSelector } from "@/components/shared/tag-selector";
import { useIncome } from "@/hooks/use-income";
import { useSpentBy } from "@/hooks/use-spent-by";
import { useExpenseTypes } from "@/hooks/use-expense-types";
import { useCurrency } from "@/hooks/use-currency";
import { Loader2 } from "lucide-react";

interface ExpenseFormProps {
  defaultValues?: Partial<ExpenseSchema>;
  onSubmit: (data: ExpenseSchema) => Promise<void>;
  onCancel: () => void;
  submitLabel?: string;
}

const inp = "w-full px-3.5 py-2.5 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all";

export function ExpenseForm({ defaultValues, onSubmit, onCancel, submitLabel = "Save" }: ExpenseFormProps) {
  const { incomes } = useIncome();
  const { spentBys } = useSpentBy();
  const { expenseTypes } = useExpenseTypes();
  const { symbol } = useCurrency();

  const { register, handleSubmit, setValue, watch, formState: { errors, isSubmitting } } = useForm<ExpenseSchema>({
    resolver: zodResolver(expenseSchema),
    defaultValues: { tagIds: [], ...defaultValues },
  });

  const tagIds = watch("tagIds") ?? [];

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1">
          <label className="text-sm font-medium">Income Source *</label>
          <select {...register("incomeSourceId")} className={inp}>
            <option value="">Select income source…</option>
            {incomes.map((i) => (
              <option key={i.id} value={i.id}>{i.name} (Balance: {i.balance.toFixed(3)})</option>
            ))}
          </select>
          {errors.incomeSourceId && <p className="text-xs text-destructive">{errors.incomeSourceId.message}</p>}
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium">Spent By *</label>
          <select {...register("spentById")} className={inp}>
            <option value="">Select person…</option>
            {spentBys.filter((s) => s.isActive).map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
          {errors.spentById && <p className="text-xs text-destructive">{errors.spentById.message}</p>}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1">
          <label className="text-sm font-medium">Amount ({symbol}) *</label>
          <input {...register("amount")} type="number" step="0.001" min="0.001" placeholder="0.000" className={inp} />
          {errors.amount && <p className="text-xs text-destructive">{errors.amount.message}</p>}
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium">Category *</label>
          <select {...register("expenseTypeId")} className={inp}>
            <option value="">Select category…</option>
            {expenseTypes.filter((t) => t.isActive).map((t) => (
              <option key={t.id} value={t.id}>{t.icon} {t.name}</option>
            ))}
          </select>
          {errors.expenseTypeId && <p className="text-xs text-destructive">{errors.expenseTypeId.message}</p>}
        </div>
      </div>

      <div className="space-y-1">
        <label className="text-sm font-medium">Reason *</label>
        <input {...register("reason")} placeholder="What was this expense for?" className={inp} />
        {errors.reason && <p className="text-xs text-destructive">{errors.reason.message}</p>}
      </div>

      <div className="space-y-1">
        <label className="text-sm font-medium">Notes</label>
        <textarea {...register("notes")} placeholder="Optional notes…" rows={2} className={`${inp} resize-none`} />
      </div>

      <div className="space-y-1.5">
        <label className="text-sm font-medium">Tags</label>
        <TagSelector selectedIds={tagIds} onChange={(ids) => setValue("tagIds", ids)} />
      </div>

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
  );
}
