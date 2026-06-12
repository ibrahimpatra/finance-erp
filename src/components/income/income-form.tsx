"use client";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { incomeSchema, IncomeSchema } from "@/lib/validations/income";
import { TagSelector } from "@/components/shared/tag-selector";
import { AddIncomeTypeModal } from "@/components/shared/add-income-type-modal";
import { useIncomeSourceTypes } from "@/hooks/use-income-source-types";
import { useCurrencies } from "@/hooks/use-currencies";
import { useSettingsStore } from "@/stores/settings.store";
import { PRESET_CURRENCIES } from "@/types";
import { Loader2, AlertCircle, Plus } from "lucide-react";

interface IncomeFormProps {
  defaultValues?: Partial<IncomeSchema>;
  onSubmit: (data: IncomeSchema) => Promise<void>;
  onCancel: () => void;
  submitLabel?: string;
  modalLevel?: 1 | 2 | 3;
}

const field = "space-y-1.5";
const label = "block text-sm font-medium text-foreground";
const inp   = "w-full px-4 py-3 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all placeholder:text-muted-foreground/60";
const err   = "text-xs text-destructive mt-1";

export function IncomeForm({ defaultValues, onSubmit, onCancel, submitLabel = "Save", modalLevel = 1 }: IncomeFormProps) {
  const { sourceTypes }  = useIncomeSourceTypes();
  const { currencies }   = useCurrencies();
  const { settings }     = useSettingsStore();
  const defaultCode      = settings?.currencyCode ?? "KWD";

  const [showTypeModal, setShowTypeModal] = useState(false);
  const typeLevel = Math.min(modalLevel, 3) as 1|2|3;

  const { register, handleSubmit, setValue, watch, formState: { errors, isSubmitting } } = useForm<IncomeSchema>({
    resolver: zodResolver(incomeSchema),
    defaultValues: { tagIds: [], currencyCode: defaultCode, ...defaultValues },
  });

  const tagIds        = watch("tagIds") ?? [];
  const activeSources = sourceTypes.filter(s => s.isActive);

  const allCurrencies = [
    { code: defaultCode, name: settings?.currencyName ?? "Default" },
    ...currencies.filter(c => c.code !== defaultCode),
    ...PRESET_CURRENCIES.filter(p => p.code !== defaultCode && !currencies.some(c => c.code === p.code)),
  ];

  const handleTypeCreated = (type: { id: string; name: string }) => {
    setValue("source", type.name);
    setShowTypeModal(false);
  };

  return (
    <>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">

        {/* No source types banner */}
        {activeSources.length === 0 && (
          <div className="flex items-start gap-3 p-4 rounded-xl border border-amber-200 bg-amber-50">
            <AlertCircle className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-amber-800">No income types configured</p>
              <p className="text-xs text-amber-600 mt-0.5">Add at least one type (e.g. Salary) to continue.</p>
            </div>
            <button type="button" onClick={() => setShowTypeModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 text-white rounded-lg text-xs font-semibold hover:bg-amber-600 transition-colors shrink-0">
              <Plus className="w-3 h-3" /> Add
            </button>
          </div>
        )}

        {/* Name */}
        <div className={field}>
          <label className={label}>Income Name *</label>
          <input {...register("name")} placeholder="e.g. January Salary" className={inp} />
          {errors.name && <p className={err}>{errors.name.message}</p>}
        </div>

        {/* Source type */}
        <div className={field}>
          <div className="flex items-center justify-between">
            <label className={label}>Source Type *</label>
            <button type="button" onClick={() => setShowTypeModal(true)}
              className="flex items-center gap-1 text-xs font-medium text-primary hover:text-primary/80 transition-colors">
              <Plus className="w-3.5 h-3.5" /> New type
            </button>
          </div>
          <select {...register("source")} className={inp}>
            <option value="">Select source type…</option>
            {activeSources.map(s => (
              <option key={s.id} value={s.name}>{s.icon ? `${s.icon} ` : ""}{s.name}</option>
            ))}
          </select>
          {errors.source && <p className={err}>{errors.source.message}</p>}
        </div>

        {/* Amount + Currency */}
        <div className="grid grid-cols-2 gap-4">
          <div className={field}>
            <label className={label}>Amount *</label>
            <input {...register("amount")} type="number" step="0.001" min="0.001" placeholder="0.000" className={inp} />
            {errors.amount && <p className={err}>{errors.amount.message}</p>}
          </div>
          <div className={field}>
            <label className={label}>Currency</label>
            <select {...register("currencyCode")} className={inp}>
              {allCurrencies.map(c => (
                <option key={c.code} value={c.code}>{c.code} – {c.name}</option>
              ))}
            </select>
          </div>
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
          <button type="submit" disabled={isSubmitting || activeSources.length === 0}
            className="flex-1 flex items-center justify-center gap-2 bg-primary text-white px-4 py-3 rounded-xl text-sm font-semibold hover:bg-primary/90 disabled:opacity-60 active:scale-[0.98] transition-all shadow-sm shadow-primary/25">
            {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
            {submitLabel}
          </button>
        </div>
      </form>

      <AddIncomeTypeModal isOpen={showTypeModal} onClose={() => setShowTypeModal(false)}
        onCreated={handleTypeCreated} level={typeLevel} />
    </>
  );
}
