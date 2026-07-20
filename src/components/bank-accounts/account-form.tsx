"use client";
import { useForm }  from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { bankAccountSchema, BankAccountSchema } from "@/lib/validations/bank-account";
import { ACCOUNT_TYPES } from "@/types";
import { ColorPickerInput } from "@/components/shared/color-picker-input";
import { useCurrencies }    from "@/hooks/use-currencies";
import { useSettingsStore } from "@/stores/settings.store";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils/helpers";

interface AccountFormProps {
  defaultValues?: Partial<BankAccountSchema>;
  onSubmit:       (data: BankAccountSchema) => Promise<void>;
  onCancel:       () => void;
  submitLabel?:   string;
  /** If editing, lock the currency field */
  currencyLocked?: boolean;
}

const inp = "w-full px-3.5 py-2.5 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all";

export function AccountForm({
  defaultValues, onSubmit, onCancel,
  submitLabel = "Save Account", currencyLocked = false,
}: AccountFormProps) {
  const { settings }   = useSettingsStore();
  const { currencies } = useCurrencies();
  const defaultCode    = settings?.currencyCode ?? "";

  const allCurrencies = [
    { code: defaultCode, name: settings?.currencyName ?? "Default", symbol: settings?.currencySymbol ?? "" },
    ...currencies.filter((c) => c.code !== defaultCode),
  ];

  const {
    register, handleSubmit, setValue, watch,
    formState: { errors, isSubmitting },
  } = useForm<BankAccountSchema>({
    resolver: zodResolver(bankAccountSchema),
    defaultValues: {
      accountType: "checking",
      currencyCode: defaultCode,
      color: "#3b82f6",
      isActive: true,
      isDefault: false,
      ...defaultValues,
    },
  });

  const color    = watch("color") ?? "#3b82f6";
  const selType  = watch("accountType");
  const isCreate = !defaultValues; // opening balance only makes sense at creation

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">

      {/* Account Name */}
      <div className="space-y-1.5">
        <label className="text-sm font-medium">Account Name *</label>
        <input {...register("name")} placeholder="e.g. NBK Main Account" className={inp} />
        {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
      </div>

      {/* Account Type */}
      <div className="space-y-1.5">
        <label className="text-sm font-medium">Account Type *</label>
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
          {ACCOUNT_TYPES.map((t) => (
            <button
              key={t.value} type="button"
              onClick={() => setValue("accountType", t.value)}
              className={cn(
                "flex flex-col items-center gap-1 p-2.5 rounded-xl border text-center transition-all",
                selType === t.value
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border hover:bg-muted text-muted-foreground"
              )}
            >
              <span className="text-lg">{t.icon}</span>
              <span className="text-[10px] font-medium leading-none">{t.label}</span>
            </button>
          ))}
        </div>
        {errors.accountType && <p className="text-xs text-destructive">{errors.accountType.message}</p>}
      </div>

      {/* Currency + Last 4 */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className="text-sm font-medium">Currency *</label>
          {currencyLocked ? (
            <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-lg border border-input bg-muted/50 text-sm">
              <span className="font-semibold">{watch("currencyCode")}</span>
              <span className="text-xs text-muted-foreground">locked</span>
            </div>
          ) : (
            <select {...register("currencyCode")} className={inp}>
              {allCurrencies.map((c) => (
                <option key={c.code} value={c.code}>{c.code} – {c.name}</option>
              ))}
            </select>
          )}
          {errors.currencyCode && <p className="text-xs text-destructive">{errors.currencyCode.message}</p>}
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium">Last 4 Digits</label>
          <input
            {...register("lastFourDigits")}
            placeholder="4521"
            maxLength={4}
            className={inp}
          />
          {errors.lastFourDigits && <p className="text-xs text-destructive">{errors.lastFourDigits.message}</p>}
        </div>
      </div>

      {/* Bank Name — free text, no hardcoded list (works for any country/bank) */}
      <div className="space-y-1.5">
        <label className="text-sm font-medium">Bank Name</label>
        <input
          {...register("bankName")}
          placeholder="e.g. Chase, HSBC, or your local bank…"
          className={inp}
        />
      </div>

      {/* Opening Balance — NEW, optional, create-only */}
      {isCreate && (
        <div className="space-y-1.5">
          <label className="text-sm font-medium">
            Opening Balance <span className="text-xs font-normal text-muted-foreground">(optional)</span>
          </label>
          <input
            {...register("openingBalance")}
            type="number"
            step="0.001"
            placeholder="0.000"
            className={inp}
          />
          <p className="text-xs text-muted-foreground">
            If this account already has money in it, enter the starting balance here.
            Leave blank to start at zero.
          </p>
        </div>
      )}

      {/* Color + Icon */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className="text-sm font-medium">Color</label>
          <ColorPickerInput value={color} onChange={(c) => setValue("color", c)} />
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium">Icon (emoji)</label>
          <input
            {...register("icon")}
            placeholder="🏦"
            maxLength={2}
            className={inp}
          />
        </div>
      </div>

      {/* Notes */}
      <div className="space-y-1.5">
        <label className="text-sm font-medium">Notes</label>
        <textarea
          {...register("notes")}
          placeholder="Optional notes about this account…"
          rows={2}
          className={`${inp} resize-none`}
        />
      </div>

      {/* Default toggle */}
      <label className="flex items-center gap-3 cursor-pointer group">
        <div className="relative">
          <input type="checkbox" className="sr-only" {...register("isDefault")} />
          <div className={cn(
            "w-10 h-5 rounded-full transition-colors",
            watch("isDefault") ? "bg-primary" : "bg-muted border border-input"
          )}>
            <div className={cn(
              "absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-transform",
              watch("isDefault") ? "translate-x-5" : "translate-x-0"
            )} />
          </div>
        </div>
        <div>
          <p className="text-sm font-medium">Set as default account</p>
          <p className="text-xs text-muted-foreground">New expenses will pre-select this account</p>
        </div>
      </label>

      {/* Actions */}
      <div className="flex gap-3 pt-2">
        <button
          type="button" onClick={onCancel}
          className="flex-1 px-4 py-2.5 rounded-lg border border-border text-sm font-medium hover:bg-muted transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit" disabled={isSubmitting}
          className="flex-1 flex items-center justify-center gap-2 bg-primary text-white px-4 py-2.5 rounded-lg text-sm font-semibold hover:bg-primary/90 disabled:opacity-60 transition-all"
        >
          {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
          {submitLabel}
        </button>
      </div>
    </form>
  );
}
