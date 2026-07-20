"use client";
import { use, useState } from "react";
import { useExpenseStore } from "@/stores/expense.store";
import { useIncomeStore } from "@/stores/income.store";
import { useSpentByStore } from "@/stores/spent-by.store";
import { useExpenseTypeStore } from "@/stores/expense-type.store";
import { useAuthStore } from "@/stores/auth.store";
import { useTagStore } from "@/stores/tag.store";
import { useCurrency } from "@/hooks/use-currency";
import { useSettingsStore } from "@/stores/settings.store";
import { useToast } from "@/components/ui/toaster";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { ExpenseForm } from "@/components/expenses/expense-form";
import { formatDate, formatDateTime } from "@/lib/utils/date";
import { getInitials } from "@/lib/utils/helpers";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Edit3, Trash2, RotateCcw, Tag, TrendingUp, Users, Layers, AlertTriangle } from "lucide-react";
import { ExpenseSchema } from "@/lib/validations/expense";
import { motion, AnimatePresence } from "framer-motion";

export default function ExpenseDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { user } = useAuthStore();
  const { expenses, editExpense, removeExpense, refundExpense, reassign } = useExpenseStore();
  const { incomes } = useIncomeStore();
  const { spentBys } = useSpentByStore();
  const { expenseTypes } = useExpenseTypeStore();
  const { tags } = useTagStore();
  const { formatFor } = useCurrency();
  const { settings } = useSettingsStore();
  const { toast } = useToast();
  const router = useRouter();

  const expense = expenses.find((e) => e.id === id);
  const isSystem = expense?.isSystemGenerated === true;
  // FIX: was format() — always used base currency regardless of the
  // expense's own currency. Now resolves to the expense's actual currencyCode.
  const cur = expense?.currencyCode || settings?.currencyCode || "KWD";
  const fmt = (n: number) => formatFor(n, cur);

  const income = incomes.find((i) => i.id === expense?.incomeSourceId);
  const person = spentBys.find((s) => s.id === expense?.spentById);
  const category = expenseTypes.find((t) => t.id === expense?.expenseTypeId);
  const expTags = tags.filter((t) => expense?.tagIds?.includes(t.id));

  const [editing, setEditing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [showRefund, setShowRefund] = useState(false);
  const [showReassign, setShowReassign] = useState(false);
  const [refundAmount, setRefundAmount] = useState("");
  const [refundReason, setRefundReason] = useState("");
  const [reassignTarget, setReassignTarget] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [refunding, setRefunding] = useState(false);
  const [reassigning, setReassigning] = useState(false);

  if (!expense) return (
    <div className="text-center py-16 text-muted-foreground">
      Expense not found. <Link href="/expenses" className="text-primary hover:underline">Go back</Link>
    </div>
  );

  const handleEdit = async (data: ExpenseSchema) => {
    if (!user) return;
    try {
      await editExpense(user.uid, id, data, expense);
      toast("Expense updated!", "success");
      setEditing(false);
    } catch (e: unknown) {
      toast((e as Error).message || "Failed to update expense.", "error");
    }
  };

  // FIX (Phase 0): was missing try/catch — a failed delete (network blip,
  // Firestore timeout) left the button spinning forever with no error shown
  // and no way to retry. Now resets state and shows a clear message on failure.
  const handleDelete = async () => {
    if (!user) return;
    setDeleting(true);
    try {
      await removeExpense(user.uid, id, expense);
      toast("Expense deleted.", "success");
      router.push("/expenses");
    } catch (e: unknown) {
      toast((e as Error).message || "Failed to delete expense. Please try again.", "error");
      setDeleting(false);
      setConfirmDelete(false);
    }
  };

  const handleRefund = async () => {
    if (!user || !refundAmount) return;
    setRefunding(true);
    try {
      await refundExpense(user.uid, expense, parseFloat(refundAmount), refundReason);
      toast("Refund recorded!", "success");
      setShowRefund(false);
      setRefundAmount(""); setRefundReason("");
    } catch (e: unknown) {
      toast((e as Error).message || "Failed to record refund.", "error");
    } finally {
      setRefunding(false);
    }
  };

  const handleReassign = async () => {
    if (!user || !reassignTarget) return;
    setReassigning(true);
    try {
      await reassign(user.uid, expense, reassignTarget);
      toast("Expense reassigned!", "success");
      setShowReassign(false);
    } catch (e: unknown) {
      toast((e as Error).message || "Failed to reassign expense.", "error");
    } finally {
      setReassigning(false);
    }
  };

  const inp = "w-full px-3.5 py-2.5 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all";

  return (
    <div className="space-y-6 animate-fade-in max-w-3xl">
      <div className="flex items-center gap-3">
        <Link href="/expenses" className="p-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-xl font-bold text-foreground">{expense.reason}</h2>
            {isSystem && (
              <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 text-xs font-semibold border border-amber-200">
                System Adjustment
              </span>
            )}
          </div>
          <p className="text-sm text-muted-foreground">{formatDateTime(expense.createdAt)}</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setEditing(!editing)} className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-border text-sm font-medium hover:bg-muted transition-colors">
            <Edit3 className="w-4 h-4" /> Edit
          </button>
          {!isSystem && (
            <button onClick={() => setShowRefund(!showRefund)} className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-emerald-200 text-emerald-600 text-sm font-medium hover:bg-emerald-50 transition-colors">
              <RotateCcw className="w-4 h-4" /> Refund
            </button>
          )}
          {!isSystem && (
            <button onClick={() => setConfirmDelete(true)} className="p-2 rounded-lg border border-red-200 text-destructive hover:bg-destructive/5 transition-colors">
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {isSystem && (
        <div className="flex items-start gap-3 px-4 py-3 rounded-xl bg-amber-50 border border-amber-200 text-sm text-amber-800">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-amber-600" />
          <p>
            This expense was automatically created when a shortfall was resolved.
            It cannot be deleted — use <strong>Reassign</strong> below to move it to a different income source in the same account.
          </p>
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Amount", value: fmt(expense.amount), icon: Layers, color: "text-red-500 bg-red-50" },
          { label: "Spent By", value: person?.name ?? "Unknown", icon: Users, color: "text-purple-500 bg-purple-50" },
          { label: "Income Source", value: income?.name ?? "Unknown", icon: TrendingUp, color: "text-blue-500 bg-blue-50" },
          { label: "Category", value: `${category?.icon ?? ""} ${category?.name ?? "Unknown"}`, icon: Layers, color: "text-amber-500 bg-amber-50" },
        ].map((stat) => (
          <div key={stat.label} className="stat-card">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center mb-2 ${stat.color}`}>
              <stat.icon className="w-4 h-4" />
            </div>
            <div className="text-sm font-semibold text-foreground amount-display truncate">{stat.value}</div>
            <div className="text-xs text-muted-foreground">{stat.label}</div>
          </div>
        ))}
      </div>

      {expense.notes && (
        <div className="bg-muted/50 rounded-xl border border-border px-5 py-4">
          <div className="text-xs font-medium text-muted-foreground mb-1">Notes</div>
          <div className="text-sm text-foreground">{expense.notes}</div>
        </div>
      )}

      {expTags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {expTags.map((tag) => (
            <span key={tag.id} className="badge-tag px-3 py-1"
              style={{ backgroundColor: tag.color + "22", color: tag.color, border: `1px solid ${tag.color}44` }}>
              <Tag className="w-3 h-3" />{tag.name}
            </span>
          ))}
        </div>
      )}

      <div className="flex items-center gap-2">
        <button onClick={() => setShowReassign(!showReassign)}
          className="text-sm text-muted-foreground hover:text-foreground underline underline-offset-2 transition-colors">
          Reassign to different income source
        </button>
      </div>

      <AnimatePresence>
        {editing && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="bg-white rounded-xl border border-border shadow-card p-6">
            <h3 className="font-semibold mb-4">Edit Expense</h3>
            <ExpenseForm
              defaultValues={{ incomeSourceId: expense.incomeSourceId, accountId: expense.accountId, spentById: expense.spentById, amount: expense.amount, reason: expense.reason, notes: expense.notes, expenseTypeId: expense.expenseTypeId, tagIds: expense.tagIds, currencyCode: expense.currencyCode }}
              onSubmit={handleEdit} onCancel={() => setEditing(false)} submitLabel="Save Changes" />
          </motion.div>
        )}
        {showRefund && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="bg-emerald-50 rounded-xl border border-emerald-200 p-5 space-y-3">
            <h3 className="font-semibold text-emerald-800">Record Refund</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-medium text-emerald-700">Refund Amount</label>
                <input value={refundAmount} onChange={(e) => setRefundAmount(e.target.value)} type="number" step="0.001" max={expense.amount} placeholder="0.000" className={inp} />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-emerald-700">Reason</label>
                <input value={refundReason} onChange={(e) => setRefundReason(e.target.value)} placeholder="Reason for refund…" className={inp} />
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setShowRefund(false)} className="px-3 py-2 rounded-lg border border-emerald-200 text-sm text-emerald-700 hover:bg-emerald-100 transition-colors">Cancel</button>
              <button onClick={handleRefund} disabled={!refundAmount || refunding} className="px-4 py-2 rounded-lg bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700 disabled:opacity-50 transition-colors flex items-center gap-1.5">
                <RotateCcw className="w-3.5 h-3.5" /> {refunding ? "Recording…" : "Record Refund"}
              </button>
            </div>
          </motion.div>
        )}
        {showReassign && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="bg-white rounded-xl border border-border shadow-card p-5 space-y-3">
            <h3 className="font-semibold">Reassign to Income Source</h3>
            <select value={reassignTarget} onChange={(e) => setReassignTarget(e.target.value)} className={inp}>
              <option value="">Select new income source…</option>
              {incomes.filter((i) => i.id !== expense.incomeSourceId).map((i) => (
                <option key={i.id} value={i.id}>{i.name} (Balance: {formatFor(i.balance, i.currencyCode || cur)})</option>
              ))}
            </select>
            <div className="flex gap-2">
              <button onClick={() => setShowReassign(false)} className="px-3 py-2 rounded-lg border border-border text-sm hover:bg-muted transition-colors">Cancel</button>
              <button onClick={handleReassign} disabled={!reassignTarget || reassigning} className="px-4 py-2 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors">{reassigning ? "Reassigning…" : "Reassign"}</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <ConfirmDialog open={confirmDelete} onClose={() => setConfirmDelete(false)} onConfirm={handleDelete}
        loading={deleting} title="Delete Expense"
        description={`Delete "${expense.reason}" (${fmt(expense.amount)})? This will reverse the ledger debit and restore the income balance.`}
        confirmLabel="Delete Expense" />
    </div>
  );
}
