"use client";
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { incomeSchema, IncomeSchema } from "@/lib/validations/income";
import { TagSelector } from "@/components/shared/tag-selector";
import { AddIncomeTypeModal } from "@/components/shared/add-income-type-modal";
import { useIncomeSourceTypes } from "@/hooks/use-income-source-types";
import { useCurrencies } from "@/hooks/use-currencies";
import { useSettingsStore } from "@/stores/settings.store";
import { useBankAccounts } from "@/hooks/use-bank-accounts";
import { Loader2, AlertCircle, Plus, Landmark } from "lucide-react";
import Link from "next/link";

interface IncomeFormProps {
  defaultValues?: Partial<IncomeSchema>;
  onSubmit: (data: IncomeSchema) => Promise<void>;
  onCancel: () => void;
  submitLabel?: string;
  modalLevel?: 1 | 2 | 3;
  /** Pre-select an account (e.g. when launched from account detail page) */
  preselectedAccountId?: string;
}

const inp = "w-full px-3.5 py-2.5 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all";

export function IncomeForm({
  defaultValues, onSubmit, onCancel, submitLabel = "Save", modalLevel = 1,
  preselectedAccountId,
}: IncomeFormProps) {
  const { sourceTypes } = useIncomeSourceTypes();
  const { currencies }  = useCurrencies();
  const { settings, fetched } = useSettingsStore();
  const { accounts }    = useBankAccounts();
  // FIX: removed ?? "KWD" — if settings haven't loaded yet, defaultCode is ""
  // and we sync it via useEffect once fetched=true. Using "KWD" caused the form
  // to initialize with KWD currency for non-KWD users if they opened it before
  // settings finished loading from Firestore.
  const defaultCode     = settings?.currencyCode ?? "";

  const [showTypeModal, setShowTypeModal] = useState(false);
  const typeLevel = Math.min(modalLevel + 0, 3) as 1 | 2 | 3;

  const {
    register, handleSubmit, setValue, watch,
    formState: { errors, isSubmitting },
  } = useForm<IncomeSchema>({
    resolver: zodResolver(incomeSchema),
    defaultValues: {
      tagIds:      [],
      currencyCode: defaultValues?.currencyCode ?? defaultCode,
      accountId:   preselectedAccountId ?? "",
      ...defaultValues,
    },
  });

  const tagIds        = watch("tagIds") ?? [];
  const selectedAccId = watch("accountId");
  const watchedCurrency = watch("currencyCode");
  const activeSources = sourceTypes.filter((s) => s.isActive);

  // Sync currency field when settings arrive after the form already mounted.
  // Only updates if: settings just loaded, no account locks the currency, and
  // the field is still empty (user hasn't manually chosen).
  useEffect(() => {
    if (fetched && defaultCode && !selectedAccId && !watchedCurrency) {
      setValue("currencyCode", defaultCode);
    }
  }, [fetched, defaultCode]); // eslint-disable-line react-hooks/exhaustive-deps

  // Filter currencies to match selected account's currency (if an account is picked)
  const selectedAccount = accounts.find((a) => a.id === selectedAccId);
  const allCurrencies = selectedAccount
    ? [{ code: selectedAccount.currencyCode, name: selectedAccount.currencyCode, symbol: "" }]
    : [
        ...(defaultCode ? [{ code: defaultCode, name: settings?.currencyName ?? defaultCode, symbol: settings?.currencySymbol ?? "" }] : []),
        ...currencies.filter((c) => c.code !== defaultCode),
      ];

  // Auto-set currency when account changes
  const handleAccountChange = (accountId: string) => {
    setValue("accountId", accountId);
    const acc = accounts.find((a) => a.id === accountId);
    if (acc) setValue("currencyCode", acc.currencyCode);
  };

  const handleTypeCreated = (type: { id: string; name: string }) => {
    setValue("source", type.name);
    setShowTypeModal(false);
  };

  return (
    <>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">

        {/* ── Missing source type banner ──────────────────────────────── */}
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

        {/* ── Bank Account (shown when accounts exist) ─────────────────── */}
        {accounts.length > 0 && (
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium flex items-center gap-1.5">
                <Landmark className="w-3.5 h-3.5 text-muted-foreground" /> Bank Account
              </label>
              <Link href="/accounts" className="text-xs text-primary hover:underline">
                Manage accounts
              </Link>
            </div>
            <select
              value={selectedAccId ?? ""}
              onChange={(e) => handleAccountChange(e.target.value)}
              className={inp}
            >
              <option value="">No account (legacy)</option>
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.icon ?? "🏦"} {a.name} [{a.currencyCode}]
                </option>
              ))}
            </select>
            <input type="hidden" {...register("accountId")} />
            <p className="text-xs text-muted-foreground">
              Linking to an account enables per-account balance tracking.
            </p>
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
            <select {...register("currencyCode")} className={inp}
              disabled={!!selectedAccount} /* locked to account's currency */>
              {allCurrencies.map((c) => (
                <option key={c.code} value={c.code}>{c.code}{c.name !== c.code ? ` – ${c.name}` : ""}</option>
              ))}
            </select>
            {selectedAccount && (
              <p className="text-xs text-muted-foreground">
                Currency locked to account ({selectedAccount.currencyCode})
              </p>
            )}
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

