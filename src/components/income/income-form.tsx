"use client";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { incomeSchema, IncomeSchema } from "@/lib/validations/income";
import { TagSelector } from "@/components/shared/tag-selector";
import { useIncomeSourceTypes } from "@/hooks/use-income-source-types";
import { Loader2 } from "lucide-react";

interface IncomeFormProps {
  defaultValues?: Partial<IncomeSchema>;
  onSubmit: (data: IncomeSchema) => Promise<void>;
  onCancel: () => void;
  submitLabel?: string;
}

const inp = "w-full px-3.5 py-2.5 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all";

export function IncomeForm({ defaultValues, onSubmit, onCancel, submitLabel = "Save" }: IncomeFormProps) {
  const { sourceTypes } = useIncomeSourceTypes();

  const { register, handleSubmit, setValue, watch, formState: { errors, isSubmitting } } = useForm<IncomeSchema>({
    resolver: zodResolver(incomeSchema),
    defaultValues: { tagIds: [], ...defaultValues },
  });

  const tagIds = watch("tagIds") ?? [];

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1">
          <label className="text-sm font-medium">Income Name *</label>
          <input {...register("name")} placeholder="e.g. January Salary" className={inp} />
          {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium">Source Type *</label>
          <select {...register("source")} className={inp}>
            <option value="">Select source type…</option>
            {sourceTypes.filter((s) => s.isActive).map((s) => (
              <option key={s.id} value={s.name}>
                {s.icon ? `${s.icon} ` : ""}{s.name}
              </option>
            ))}
          </select>
          {errors.source && <p className="text-xs text-destructive">{errors.source.message}</p>}
        </div>
      </div>
      <div className="space-y-1">
        <label className="text-sm font-medium">Amount *</label>
        <input {...register("amount")} type="number" step="0.001" min="0.001" placeholder="0.000" className={inp} />
        {errors.amount && <p className="text-xs text-destructive">{errors.amount.message}</p>}
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
