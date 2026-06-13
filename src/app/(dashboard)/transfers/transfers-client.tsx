"use client";
import { useState, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { transferSchema, TransferSchema } from "@/lib/validations/transfer";
import { useTransfers } from "@/hooks/use-transfers";
import { useIncome } from "@/hooks/use-income";
import { useAuthStore } from "@/stores/auth.store";
import { useTransferStore } from "@/stores/transfer.store";
import { useSettingsStore } from "@/stores/settings.store";
import { useCurrency } from "@/hooks/use-currency";
import { useToast } from "@/components/ui/toaster";
import { EmptyState } from "@/components/shared/empty-state";
import { TableSkeleton } from "@/components/shared/loading-skeleton";
import { FormDrawer } from "@/components/shared/form-drawer";
import { formatDate } from "@/lib/utils/date";
import { ArrowLeftRight, Plus, ArrowRight, Loader2, AlertCircle, RefreshCcw } from "lucide-react";

const inp = "form-input";

export function TransfersPageClient() {
  const { user }       = useAuthStore();
  const { transfers, loading } = useTransfers();
  const { incomes }    = useIncome();
  const { addTransfer } = useTransferStore();
  const { settings }   = useSettingsStore();
  const { formatFor }  = useCurrency();
  const { toast }      = useToast();
  const defaultCode    = settings?.currencyCode ?? "KWD";
  const [showForm, setShowForm] = useState(false);

  const {
    register, handleSubmit, watch, reset, formState: { errors, isSubmitting },
  } = useForm<TransferSchema>({ resolver: zodResolver(transferSchema) });

  const fromId = watch("fromIncomeId");
  const toId   = watch("toIncomeId");

  const fromIncome = useMemo(() => incomes.find((i) => i.id === fromId), [incomes, fromId]);
  const toIncome   = useMemo(() => incomes.find((i) => i.id === toId),   [incomes, toId]);

  const fromCurrency = fromIncome?.currencyCode || defaultCode;
  const toCurrency   = toIncome?.currencyCode   || defaultCode;
  const isCross      = !!fromIncome && !!toIncome && fromCurrency !== toCurrency;

  const toAmountVal   = parseFloat(watch("toAmount" as "amount") as unknown as string) || 0;
  const fromAmountVal = parseFloat(watch("amount") as unknown as string) || 0;
  const exchangeRate  = isCross && fromAmountVal > 0 && toAmountVal > 0
    ? (toAmountVal / fromAmountVal).toFixed(4) : null;

  const onSubmit = async (data: TransferSchema) => {
    if (!user) return;
    try {
      await addTransfer(user.uid, {
        ...data,
        fromCurrencyCode: fromCurrency,
        toCurrencyCode:   toCurrency,
        toAmount: isCross ? (data.toAmount ?? data.amount) : data.amount,
      });
      toast("Transfer completed!", "success");
      reset();
      setShowForm(false);
    } catch (e: unknown) {
      toast((e as Error).message, "error");
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">

      {/* ── Header ───────────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">Transfers</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Move funds between income sources · cross-currency supported
          </p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-2 bg-primary text-white px-4 py-2.5 rounded-lg text-sm font-semibold hover:bg-primary/90 transition-all shadow-sm shadow-primary/20">
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">New Transfer</span>
          <span className="sm:hidden">New</span>
        </button>
      </div>

      {/* ── List ─────────────────────────────────────────────── */}
      {loading ? (
        <TableSkeleton rows={4} />
      ) : transfers.length === 0 ? (
        <EmptyState icon={ArrowLeftRight} title="No transfers yet"
          description="Transfer money between income sources. Supports different currencies."
          action={
            <button onClick={() => setShowForm(true)}
              className="flex items-center gap-2 bg-primary text-white px-4 py-2.5 rounded-lg text-sm font-semibold hover:bg-primary/90 transition-all">
              <Plus className="w-4 h-4" /> New Transfer
            </button>
          }
        />
      ) : (
        <div className="bg-white rounded-xl border border-border shadow-card overflow-hidden">
          <div className="divide-y divide-border">
            {transfers.map((t) => {
              const from  = incomes.find((i) => i.id === t.fromIncomeId);
              const to    = incomes.find((i) => i.id === t.toIncomeId);
              const fCur  = t.fromCurrencyCode || from?.currencyCode || defaultCode;
              const tCur  = t.toCurrencyCode   || to?.currencyCode   || defaultCode;
              const cross = fCur !== tCur;
              return (
                <div key={t.id} className="flex items-center gap-4 px-4 sm:px-5 py-4 hover:bg-muted/20 transition-colors">
                  <div className="w-9 h-9 rounded-lg bg-amber-50 flex items-center justify-center shrink-0">
                    <ArrowLeftRight className="w-4 h-4 text-amber-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 text-sm font-medium text-foreground flex-wrap">
                      <span className="truncate max-w-[100px] sm:max-w-none">{from?.name ?? "Unknown"}</span>
                      <ArrowRight className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                      <span className="truncate max-w-[100px] sm:max-w-none">{to?.name ?? "Unknown"}</span>
                      {cross && (
                        <span className="text-[11px] px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700 font-semibold shrink-0">
                          {fCur}→{tCur}
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      {t.note && <span>{t.note} · </span>}
                      {formatDate(t.createdAt)}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="amount-display text-sm font-semibold text-amber-600">
                      {formatFor(t.amount, fCur)}
                    </div>
                    {cross && t.toAmount && (
                      <div className="amount-display text-xs text-emerald-600 mt-0.5">
                        → {formatFor(t.toAmount, tCur)}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Transfer form drawer ──────────────────────────────── */}
      <FormDrawer
        isOpen={showForm}
        onClose={() => { setShowForm(false); reset(); }}
        title="New Transfer"
        description="Move funds between income sources. Cross-currency supported."
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">

          {/* From / To */}
          <div className="grid grid-cols-1 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">From *</label>
              <select {...register("fromIncomeId")} className={inp}>
                <option value="">Select source…</option>
                {incomes.map((i) => {
                  const cur = i.currencyCode || defaultCode;
                  return (
                    <option key={i.id} value={i.id}>
                      {i.name} · {formatFor(i.balance, cur)} [{cur}]
                    </option>
                  );
                })}
              </select>
              {errors.fromIncomeId && <p className="text-xs text-destructive">{errors.fromIncomeId.message}</p>}
              {fromIncome && (
                <p className="text-xs text-muted-foreground">
                  Available: <span className="font-semibold text-foreground">{formatFor(fromIncome.balance, fromCurrency)}</span>{" "}
                  <span className="font-bold text-primary">[{fromCurrency}]</span>
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium">To *</label>
              <select {...register("toIncomeId")} className={inp}>
                <option value="">Select destination…</option>
                {incomes.map((i) => {
                  const cur = i.currencyCode || defaultCode;
                  return (
                    <option key={i.id} value={i.id}>
                      {i.name} [{cur}]
                    </option>
                  );
                })}
              </select>
              {errors.toIncomeId && <p className="text-xs text-destructive">{errors.toIncomeId.message}</p>}
              {toIncome && (
                <p className="text-xs text-muted-foreground">
                  Current: <span className="font-semibold text-foreground">{formatFor(toIncome.balance, toCurrency)}</span>{" "}
                  <span className="font-bold text-primary">[{toCurrency}]</span>
                </p>
              )}
            </div>
          </div>

          {/* Cross-currency notice */}
          {isCross && (
            <div className="flex items-start gap-2.5 px-4 py-3 rounded-xl bg-amber-50 border border-amber-200">
              <AlertCircle className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
              <p className="text-sm text-amber-700">
                <span className="font-semibold">Cross-currency transfer:</span>{" "}
                Enter the amount sent in <strong>{fromCurrency}</strong> and the amount that will arrive in <strong>{toCurrency}</strong>.
              </p>
            </div>
          )}

          {/* Amount(s) */}
          {!isCross ? (
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Amount {fromIncome && `(${fromCurrency})`} *</label>
              <input {...register("amount")} type="number" step="0.001" min="0.001" placeholder="0.000" className={inp} />
              {errors.amount && <p className="text-xs text-destructive">{errors.amount.message}</p>}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Amount Sent ({fromCurrency}) *</label>
                <input {...register("amount")} type="number" step="0.001" min="0.001" placeholder="0.000" className={inp} />
                {errors.amount && <p className="text-xs text-destructive">{errors.amount.message}</p>}
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Amount Received ({toCurrency}) *</label>
                <input {...register("toAmount")} type="number" step="0.001" min="0.001" placeholder="0.000" className={inp} />
                {errors.toAmount && <p className="text-xs text-destructive">{errors.toAmount.message}</p>}
              </div>
              {exchangeRate && (
                <div className="col-span-2 flex items-center gap-2 text-xs text-muted-foreground bg-muted/60 rounded-lg px-3 py-2">
                  <RefreshCcw className="w-3.5 h-3.5" />
                  Rate: <span className="font-semibold text-foreground ml-1">1 {fromCurrency} = {exchangeRate} {toCurrency}</span>
                </div>
              )}
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-sm font-medium">Note</label>
            <input {...register("note")} placeholder="Optional note…" className={inp} />
          </div>

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={() => { setShowForm(false); reset(); }}
              className="flex-1 px-4 py-2.5 rounded-lg border border-border text-sm font-medium hover:bg-muted transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={isSubmitting}
              className="flex-1 flex items-center justify-center gap-2 bg-primary text-white px-4 py-2.5 rounded-lg text-sm font-semibold hover:bg-primary/90 disabled:opacity-60 transition-all">
              {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
              {isCross ? "Transfer (Cross-Currency)" : "Transfer"}
            </button>
          </div>
        </form>
      </FormDrawer>
    </div>
  );
}
