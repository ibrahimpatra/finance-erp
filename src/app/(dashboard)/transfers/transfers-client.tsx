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
import { formatDate } from "@/lib/utils/date";
import { ArrowLeftRight, Plus, ArrowRight, Loader2, AlertCircle, RefreshCcw } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const inp = "w-full px-3.5 py-2.5 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all";

export function TransfersPageClient() {
  const { user } = useAuthStore();
  const { transfers, loading } = useTransfers();
  const { incomes } = useIncome();
  const { addTransfer } = useTransferStore();
  const { settings } = useSettingsStore();
  const { formatFor } = useCurrency();
  const { toast } = useToast();
  const defaultCode = settings?.currencyCode ?? "KWD";

  const [showForm, setShowForm] = useState(false);

  const {
    register, handleSubmit, watch, reset, setValue,
    formState: { errors, isSubmitting },
  } = useForm<TransferSchema>({ resolver: zodResolver(transferSchema) });

  const fromId = watch("fromIncomeId");
  const toId   = watch("toIncomeId");

  const fromIncome = useMemo(() => incomes.find((i) => i.id === fromId), [incomes, fromId]);
  const toIncome   = useMemo(() => incomes.find((i) => i.id === toId),   [incomes, toId]);

  const fromCurrency = fromIncome?.currencyCode || defaultCode;
  const toCurrency   = toIncome?.currencyCode   || defaultCode;
  const isCross      = !!fromIncome && !!toIncome && fromCurrency !== toCurrency;

  // Exchange rate hint
  const toAmountVal   = parseFloat(watch("toAmount" as "amount") as unknown as string) || 0;
  const fromAmountVal = parseFloat(watch("amount") as unknown as string) || 0;
  const exchangeRate  = isCross && fromAmountVal > 0 && toAmountVal > 0
    ? (toAmountVal / fromAmountVal).toFixed(4)
    : null;

  const onSubmit = async (data: TransferSchema) => {
    if (!user) return;
    try {
      const payload = {
        ...data,
        fromCurrencyCode: fromCurrency,
        toCurrencyCode: toCurrency,
        toAmount: isCross ? (data.toAmount ?? data.amount) : data.amount,
      };
      await addTransfer(user.uid, payload);
      toast("Transfer completed!", "success");
      reset();
      setShowForm(false);
    } catch (e: unknown) {
      toast((e as Error).message, "error");
    }
  };

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="page-header">
        <div>
          <h2 className="text-2xl font-bold text-foreground tracking-tight">Transfers</h2>
          <p className="text-muted-foreground text-sm mt-1">Move funds between income sources · cross-currency supported</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 bg-primary text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-primary/90 transition-all shadow-sm shadow-primary/25">
          <Plus className="w-4 h-4" /> New Transfer
        </button>
      </div>

      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
            className="bg-white rounded-xl border border-border shadow-card p-6">
            <h3 className="font-semibold mb-1">New Transfer</h3>
            <p className="text-xs text-muted-foreground mb-5">
              Transfers between different currencies require you to enter both amounts manually.
            </p>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">

              {/* From / To */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
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
                      Available: <span className="font-medium">{formatFor(fromIncome.balance, fromCurrency)}</span>
                      {" "}<span className="font-semibold text-foreground">[{fromCurrency}]</span>
                    </p>
                  )}
                </div>

                <div className="space-y-1">
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
                      Current: <span className="font-medium">{formatFor(toIncome.balance, toCurrency)}</span>
                      {" "}<span className="font-semibold text-foreground">[{toCurrency}]</span>
                    </p>
                  )}
                </div>
              </div>

              {/* Cross-currency warning */}
              {isCross && (
                <div className="flex items-start gap-2.5 px-4 py-3 rounded-xl bg-amber-50 border border-amber-200">
                  <AlertCircle className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
                  <div className="text-sm text-amber-700">
                    <span className="font-medium">Cross-currency transfer: </span>
                    Enter the amount you're sending in <strong>{fromCurrency}</strong> and the amount
                    that will arrive in <strong>{toCurrency}</strong>. You set the exchange rate.
                  </div>
                </div>
              )}

              {/* Amount fields — single or dual */}
              {!isCross ? (
                <div className="space-y-1">
                  <label className="text-sm font-medium">
                    Amount {fromIncome && `(${fromCurrency})`} *
                  </label>
                  <input {...register("amount")} type="number" step="0.001" min="0.001"
                    placeholder="0.000" className={inp} />
                  {errors.amount && <p className="text-xs text-destructive">{errors.amount.message}</p>}
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-sm font-medium">Amount Sent ({fromCurrency}) *</label>
                    <input {...register("amount")} type="number" step="0.001" min="0.001"
                      placeholder="0.000" className={inp} />
                    {errors.amount && <p className="text-xs text-destructive">{errors.amount.message}</p>}
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-medium">Amount Received ({toCurrency}) *</label>
                    <input {...register("toAmount")} type="number" step="0.001" min="0.001"
                      placeholder="0.000" className={inp} />
                    {errors.toAmount && <p className="text-xs text-destructive">{errors.toAmount.message}</p>}
                  </div>
                  {exchangeRate && (
                    <div className="col-span-2 flex items-center gap-2 text-xs text-muted-foreground">
                      <RefreshCcw className="w-3.5 h-3.5" />
                      Exchange rate: <span className="font-semibold text-foreground">
                        1 {fromCurrency} = {exchangeRate} {toCurrency}
                      </span>
                    </div>
                  )}
                </div>
              )}

              <div className="space-y-1">
                <label className="text-sm font-medium">Note</label>
                <input {...register("note")} placeholder="Optional note…" className={inp} />
              </div>

              <div className="flex gap-3">
                <button type="button" onClick={() => { setShowForm(false); reset(); }}
                  className="flex-1 px-4 py-2.5 rounded-lg border border-border text-sm font-medium hover:bg-muted transition-colors">
                  Cancel
                </button>
                <button type="submit" disabled={isSubmitting}
                  className="flex-1 flex items-center justify-center gap-2 bg-primary text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-primary/90 disabled:opacity-60 transition-all">
                  {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  {isCross ? "Transfer (Cross-Currency)" : "Transfer"}
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {loading ? <TableSkeleton rows={4} /> : transfers.length === 0 ? (
        <EmptyState icon={ArrowLeftRight} title="No transfers yet"
          description="Transfer money between income sources. Supports different currencies." />
      ) : (
        <div className="bg-white rounded-xl border border-border shadow-card overflow-hidden">
          <div className="divide-y divide-border">
            {transfers.map((t) => {
              const from = incomes.find((i) => i.id === t.fromIncomeId);
              const to   = incomes.find((i) => i.id === t.toIncomeId);
              const fCur = t.fromCurrencyCode || from?.currencyCode || defaultCode;
              const tCur = t.toCurrencyCode   || to?.currencyCode   || defaultCode;
              const cross = fCur !== tCur;
              return (
                <div key={t.id} className="flex items-center gap-4 px-5 py-4">
                  <div className="w-9 h-9 rounded-lg bg-amber-50 flex items-center justify-center shrink-0">
                    <ArrowLeftRight className="w-4 h-4 text-amber-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 text-sm font-medium text-foreground flex-wrap">
                      <span className="truncate">{from?.name ?? "Unknown"}</span>
                      <ArrowRight className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                      <span className="truncate">{to?.name ?? "Unknown"}</span>
                      {cross && (
                        <span className="text-xs px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700 font-medium shrink-0">
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
                      <div className="amount-display text-xs text-emerald-600">
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
    </div>
  );
}
