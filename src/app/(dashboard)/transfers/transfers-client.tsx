"use client";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { transferSchema, TransferSchema } from "@/lib/validations/transfer";
import { useTransfers } from "@/hooks/use-transfers";
import { useIncome } from "@/hooks/use-income";
import { useAuthStore } from "@/stores/auth.store";
import { useTransferStore } from "@/stores/transfer.store";
import { useCurrency } from "@/hooks/use-currency";
import { useToast } from "@/components/ui/toaster";
import { EmptyState } from "@/components/shared/empty-state";
import { TableSkeleton } from "@/components/shared/loading-skeleton";
import { formatDate } from "@/lib/utils/date";
import { ArrowLeftRight, Plus, ArrowRight, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const inp = "w-full px-3.5 py-2.5 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all";

export function TransfersPageClient() {
  const { user } = useAuthStore();
  const { transfers, loading } = useTransfers();
  const { incomes } = useIncome();
  const { addTransfer } = useTransferStore();
  const { format } = useCurrency();
  const { toast } = useToast();
  const [showForm, setShowForm] = useState(false);

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<TransferSchema>({
    resolver: zodResolver(transferSchema),
  });

  const onSubmit = async (data: TransferSchema) => {
    if (!user) return;
    try {
      await addTransfer(user.uid, data);
      toast("Transfer completed!", "success");
      reset(); setShowForm(false);
    } catch (e: unknown) {
      toast((e as Error).message, "error");
    }
  };

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="page-header">
        <div>
          <h2 className="text-2xl font-bold text-foreground tracking-tight">Transfers</h2>
          <p className="text-muted-foreground text-sm mt-1">Move money between income sources</p>
        </div>
        <button onClick={() => setShowForm(true)} className="flex items-center gap-2 bg-primary text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-primary/90 transition-all shadow-sm shadow-primary/25">
          <Plus className="w-4 h-4" /> New Transfer
        </button>
      </div>

      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
            className="bg-white rounded-xl border border-border shadow-card p-6">
            <h3 className="font-semibold mb-4">New Transfer</h3>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
                <div className="space-y-1">
                  <label className="text-sm font-medium">From *</label>
                  <select {...register("fromIncomeId")} className={inp}>
                    <option value="">Select source…</option>
                    {incomes.map((i) => <option key={i.id} value={i.id}>{i.name} ({format(i.balance)})</option>)}
                  </select>
                  {errors.fromIncomeId && <p className="text-xs text-destructive">{errors.fromIncomeId.message}</p>}
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium">To *</label>
                  <select {...register("toIncomeId")} className={inp}>
                    <option value="">Select destination…</option>
                    {incomes.map((i) => <option key={i.id} value={i.id}>{i.name}</option>)}
                  </select>
                  {errors.toIncomeId && <p className="text-xs text-destructive">{errors.toIncomeId.message}</p>}
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium">Amount *</label>
                  <input {...register("amount")} type="number" step="0.001" min="0.001" placeholder="0.000" className={inp} />
                  {errors.amount && <p className="text-xs text-destructive">{errors.amount.message}</p>}
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">Note</label>
                <input {...register("note")} placeholder="Optional note…" className={inp} />
              </div>
              <div className="flex gap-3">
                <button type="button" onClick={() => { setShowForm(false); reset(); }} className="flex-1 px-4 py-2.5 rounded-lg border border-border text-sm font-medium hover:bg-muted transition-colors">Cancel</button>
                <button type="submit" disabled={isSubmitting} className="flex-1 flex items-center justify-center gap-2 bg-primary text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-primary/90 disabled:opacity-60 transition-all">
                  {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />} Transfer
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {loading ? <TableSkeleton rows={4} /> : transfers.length === 0 ? (
        <EmptyState icon={ArrowLeftRight} title="No transfers yet" description="Transfer money between income sources to reallocate funds." />
      ) : (
        <div className="bg-white rounded-xl border border-border shadow-card overflow-hidden">
          <div className="divide-y divide-border">
            {transfers.map((t) => {
              const from = incomes.find((i) => i.id === t.fromIncomeId);
              const to = incomes.find((i) => i.id === t.toIncomeId);
              return (
                <div key={t.id} className="flex items-center gap-4 px-5 py-4">
                  <div className="w-9 h-9 rounded-lg bg-amber-50 flex items-center justify-center shrink-0">
                    <ArrowLeftRight className="w-4 h-4 text-amber-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                      <span className="truncate">{from?.name ?? "Unknown"}</span>
                      <ArrowRight className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                      <span className="truncate">{to?.name ?? "Unknown"}</span>
                    </div>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      {t.note && <span>{t.note} · </span>}
                      {formatDate(t.createdAt)}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="amount-display text-sm font-semibold text-amber-600">{format(t.amount)}</div>
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
