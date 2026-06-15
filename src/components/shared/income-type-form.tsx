"use client";
import { UseFormReturn } from "react-hook-form";
import { ExpenseTypeSchema } from "@/lib/validations/expense-type";
import { ColorPickerInput } from "@/components/shared/color-picker-input";
import { Loader2 } from "lucide-react";

const inp = "w-full px-3.5 py-2.5 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary transition-all";

const QUICK_ICONS = ["💼","🎁","🏢","💰","📈","💻","🏠","📦","💳","🌐","🎯","🔧"];

interface IncomeTypeFormProps {
  form: UseFormReturn<ExpenseTypeSchema>;
  color: string;
  onColorChange: (c: string) => void;
  onSubmit: (data: ExpenseTypeSchema) => Promise<void>;
  onCancel: () => void;
  submitLabel?: string;
  isEdit?: boolean;
}

export function IncomeTypeForm({
  form, color, onColorChange, onSubmit, onCancel,
  submitLabel = "Add Type", isEdit = false,
}: IncomeTypeFormProps) {
  const { register, handleSubmit, setValue, watch, formState: { errors, isSubmitting } } = form;
  const icon = watch("icon") ?? "💼";

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-1.5">
        <label className="text-sm font-medium">Name *</label>
        <input {...register("name")} placeholder="e.g. Salary" className={inp} autoFocus />
        {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
      </div>

      <div className="space-y-1.5">
        <label className="text-sm font-medium">Icon</label>
        <div className="flex flex-wrap gap-2 mb-2">
          {QUICK_ICONS.map((ic) => (
            <button key={ic} type="button" onClick={() => setValue("icon", ic)}
              className={`w-9 h-9 rounded-lg text-lg flex items-center justify-center transition-all ${
                icon === ic ? "bg-primary/15 ring-2 ring-primary" : "bg-muted hover:bg-muted/80"
              }`}>
              {ic}
            </button>
          ))}
        </div>
        <input {...register("icon")} placeholder="Or type any emoji" className={inp + " text-lg"} />
      </div>

      <ColorPickerInput label="Color" value={color} onChange={(c) => { onColorChange(c); setValue("color", c); }} />

      <div className="flex gap-3 pt-1">
        <button type="button" onClick={onCancel}
          className="flex-1 px-4 py-2.5 rounded-lg border border-border text-sm font-medium hover:bg-muted transition-colors">
          Cancel
        </button>
        <button type="submit" disabled={isSubmitting}
          className="flex-1 flex items-center justify-center gap-2 bg-primary text-white px-4 py-2.5 rounded-lg text-sm font-semibold hover:bg-primary/90 disabled:opacity-60 transition-all">
          {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
          {isEdit ? "Save Changes" : submitLabel}
        </button>
      </div>
    </form>
  );
}
