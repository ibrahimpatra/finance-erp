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

const inp = "w-full px-3.5 py-2.5 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all";

export function IncomeForm({
  defaultValues, onSubmit, onCancel, submitLabel = "Save", modalLevel = 1,
}: IncomeFormProps) {
  const { sourceTypes } = useIncomeSourceTypes();
  const { currencies } = useCurrencies();
  const { settings } = useSettingsStore();
  const defaultCode = settings?.currencyCode ?? "KWD";

  const [showTypeModal, setShowTypeModal] = useState(false);
  const typeLevel = Math.min(modalLevel + 0, 3) as 1 | 2 | 3;

  const {
    register, handleSubmit, setValue, watch,
    formState: { errors, isSubmitting },
  } = useForm<IncomeSchema>({
    resolver: zodResolver(incomeSchema),
    defaultValues: { tagIds: [], currencyCode: defaultCode, ...defaultValues },
  });

  const tagIds       = watch("tagIds") ?? [];
  const activeSources = sourceTypes.filter((s) => s.isActive);

  // All currencies: default first, then user-defined, then presets (no duplicates)
  const allCurrencies = [
    { code: defaultCode, name: settings?.currencyName ?? "Default", symbol: settings?.currencySymbol ?? "KD" },
    ...currencies.filter((c) => c.code !== defaultCode),
    ...PRESET_CURRENCIES.filter(
      (p) => p.code !== defaultCode && !currencies.some((c) => c.code === p.code)
    ),
  ];

  const handleTypeCreated = (type: { id: string; name: string }) => {
    setValue("source", type.name); // auto-select the new type by its name
    setShowTypeModal(false);
  };

  return (
    <>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">

        {/* ── Missing source type banner ───────────────────────────────── */}
        {activeSources.length === 0 && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 flex items-start gap-3">
            <AlertCircle className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-amber-800">No income types configured yet</p>
              <p className="text-xs text-amber-600 mt-0.5">Add at least one income type to continue.</p>
            </div>
            <button type="button" onClick={() => setShowTypeModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500 text-white text-xs font-medium hover:bg-amber-600 transition-colors shrink-0">
              <Plus className="w-3 h-3" /> Add Type
            </button>
          </div>
        )}

        {/* ── Name + Source type ───────────────────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-sm font-medium">Income Name *</label>
            <input {...register("name")} placeholder="e.g. January Salary" className={inp} />
            {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
          </div>

          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Source Type *</label>
              <button type="button" onClick={() => setShowTypeModal(true)}
                className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition-colors">
                <Plus className="w-3 h-3" /> New type
              </button>
            </div>
            <select {...register("source")} className={inp}>
              <option value="">Select source type…</option>
              {activeSources.map((s) => (
                <option key={s.id} value={s.name}>
                  {s.icon ? `${s.icon} ` : ""}{s.name}
                </option>
              ))}
            </select>
            {errors.source && <p className="text-xs text-destructive">{errors.source.message}</p>}
          </div>
        </div>

        {/* ── Amount + Currency ────────────────────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-sm font-medium">Amount *</label>
            <input {...register("amount")} type="number" step="0.001" min="0.001"
              placeholder="0.000" className={inp} />
            {errors.amount && <p className="text-xs text-destructive">{errors.amount.message}</p>}
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium">Currency</label>
            <select {...register("currencyCode")} className={inp}>
              {allCurrencies.map((c) => (
                <option key={c.code} value={c.code}>{c.code} – {c.name}</option>
              ))}
            </select>
          </div>
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
          <button type="submit" disabled={isSubmitting || activeSources.length === 0}
            className="flex-1 flex items-center justify-center gap-2 bg-primary text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-primary/90 disabled:opacity-60 transition-all">
            {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
            {submitLabel}
          </button>
        </div>
      </form>

      <AddIncomeTypeModal
        isOpen={showTypeModal}
        onClose={() => setShowTypeModal(false)}
        onCreated={handleTypeCreated}
        level={typeLevel}
      />
    </>
  );
}
