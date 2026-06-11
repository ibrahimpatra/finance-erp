"use client";
import { use, useState, useMemo } from "react";
import { useIncomeStore } from "@/stores/income.store";
import { useExpenseStore } from "@/stores/expense.store";
import { useTransferStore } from "@/stores/transfer.store";
import { useAuthStore } from "@/stores/auth.store";
import { useSpentByStore } from "@/stores/spent-by.store";
import { useExpenseTypeStore } from "@/stores/expense-type.store";
import { useCurrency } from "@/hooks/use-currency";
import { useTags } from "@/hooks/use-tags";
import { useSettingsStore } from "@/stores/settings.store";
import { useToast } from "@/components/ui/toaster";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { IncomeForm } from "@/components/income/income-form";
import { EmptyState } from "@/components/shared/empty-state";
import { formatDate, formatRelative } from "@/lib/utils/date";
import { getInitials } from "@/lib/utils/helpers";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Edit3, Trash2, Receipt, Tag, ArrowLeftRight, ArrowUpRight, ArrowDownLeft } from "lucide-react";
import { IncomeSchema } from "@/lib/validations/income";
import { Expense, Transfer, Income } from "@/types";
import { motion, AnimatePresence } from "framer-motion";

// ─── Unified activity item type ──────────────────────────────────────────────
type ActivityItem =
  | { kind: "expense";       date: Date; expense: Expense }
  | { kind: "transfer-out";  date: Date; transfer: Transfer; other: Income | undefined }
  | { kind: "transfer-in";   date: Date; transfer: Transfer; other: Income | undefined };

export default function IncomeDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);

  const { user }         = useAuthStore();
  const { incomes, editIncome, removeIncome } = useIncomeStore();
  const { expenses }     = useExpenseStore();
  const { transfers }    = useTransferStore();
  const { spentBys }     = useSpentByStore();
  const { expenseTypes } = useExpenseTypeStore();
  const { tags }         = useTags();
  const { formatFor }    = useCurrency();         // ← use formatFor, not format
  const { settings }     = useSettingsStore();
  const { toast }        = useToast();
  const router           = useRouter();

  const defaultCode = settings?.currencyCode ?? "KWD";

  const [editing, setEditing]           = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting]         = useState(false);

  const income     = incomes.find((i) => i.id === id);
  // Currency this income is denominated in — critical for correct display
  const cur        = income?.currencyCode || defaultCode;
  const fmt        = (n: number) => formatFor(n, cur);

  const incomeTags      = tags.filter((t) => income?.tagIds?.includes(t.id));
  const linkedExpenses  = expenses.filter((e) => e.incomeSourceId === id);
  const transfersOut    = transfers.filter((t) => t.fromIncomeId === id);
  const transfersIn     = transfers.filter((t) => t.toIncomeId   === id);

  // ── Merge into chronological activity feed ────────────────────────────────
  const activity = useMemo((): ActivityItem[] => {
    const items: ActivityItem[] = [
      ...linkedExpenses.map((e) => ({
        kind:    "expense" as const,
        date:    e.createdAt?.toDate?.() ?? new Date(0),
        expense: e,
      })),
      ...transfersOut.map((t) => ({
        kind:     "transfer-out" as const,
        date:     t.createdAt?.toDate?.() ?? new Date(0),
        transfer: t,
        other:    incomes.find((i) => i.id === t.toIncomeId),
      })),
      ...transfersIn.map((t) => ({
        kind:     "transfer-in" as const,
        date:     t.createdAt?.toDate?.() ?? new Date(0),
        transfer: t,
        other:    incomes.find((i) => i.id === t.fromIncomeId),
      })),
    ];
    return items.sort((a, b) => b.date.getTime() - a.date.getTime());
  }, [linkedExpenses, transfersOut, transfersIn, incomes]);

  if (!income) return (
    <div className="text-center py-16 text-muted-foreground">
      Income source not found. <Link href="/income" className="text-primary hover:underline">Go back</Link>
    </div>
  );

  const handleEdit = async (data: IncomeSchema) => {
    if (!user) return;
    await editIncome(user.uid, id, data, income);
    toast("Income updated!", "success");
    setEditing(false);
  };

  const handleDelete = async () => {
    if (!user) return;
    setDeleting(true);
    try {
      await removeIncome(user.uid, id);
      toast("Income deleted.", "success");
      router.push("/income");
    } catch (e: unknown) {
      toast((e as Error).message, "error");
      setDeleting(false);
      setConfirmDelete(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-5xl">

      {/* ── Header ────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-4">
        <Link href="/income" className="p-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-foreground">{income.name}</h2>
            {/* Currency badge — always visible, especially important for non-default currencies */}
            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
              cur === defaultCode
                ? "bg-muted text-muted-foreground"
                : "bg-blue-100 text-blue-700"
            }`}>
              {cur}
            </span>
          </div>
          <p className="text-sm text-muted-foreground">{income.source} · Added {formatDate(income.createdAt)}</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setEditing(!editing)}
            className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border text-sm font-medium hover:bg-muted transition-colors">
            <Edit3 className="w-4 h-4" /> Edit
          </button>
          <button onClick={() => setConfirmDelete(true)}
            className="flex items-center gap-2 px-3 py-2 rounded-lg border border-red-200 text-destructive text-sm font-medium hover:bg-destructive/5 transition-colors">
            <Trash2 className="w-4 h-4" /> Delete
          </button>
        </div>
      </div>

      {/* ── Edit form ─────────────────────────────────────────────────── */}
      <AnimatePresence>
        {editing && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="bg-white rounded-xl border border-border shadow-card p-6">
            <h3 className="font-semibold mb-4">Edit Income Source</h3>
            <IncomeForm
              defaultValues={{ name: income.name, source: income.source, amount: income.amount, notes: income.notes, tagIds: income.tagIds, currencyCode: income.currencyCode }}
              onSubmit={handleEdit} onCancel={() => setEditing(false)} submitLabel="Save Changes" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Stats — all formatted in THIS income's currency ───────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: "Original Amount",   value: fmt(income.amount),      color: "text-blue-600" },
          { label: "Total Spent",        value: fmt(income.totalDebits), color: "text-red-500" },
          { label: "Remaining Balance",  value: fmt(income.balance),     color: income.balance >= 0 ? "text-emerald-600" : "text-red-500" },
        ].map((stat) => (
          <div key={stat.label} className="stat-card">
            <div className={`amount-display text-2xl font-bold ${stat.color} mb-1`}>{stat.value}</div>
            <div className="text-sm text-muted-foreground">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* ── Progress bar ──────────────────────────────────────────────── */}
      <div className="bg-white rounded-xl border border-border shadow-card p-5 space-y-3">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">{income.percentageUsed}% used</span>
          <span className="font-medium amount-display">
            {fmt(income.totalDebits)} / {fmt(income.amount)} <span className="text-xs text-muted-foreground ml-1">{cur}</span>
          </span>
        </div>
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <div className="progress-gradient h-full" style={{ width: `${income.percentageUsed}%` }} />
        </div>
      </div>

      {/* ── Tags ──────────────────────────────────────────────────────── */}
      {incomeTags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {incomeTags.map((tag) => (
            <span key={tag.id} className="badge-tag px-3 py-1"
              style={{ backgroundColor: tag.color + "22", color: tag.color, border: `1px solid ${tag.color}44` }}>
              <Tag className="w-3 h-3" />{tag.name}
            </span>
          ))}
        </div>
      )}

      {/* ── Unified activity feed ─────────────────────────────────────── */}
      <div className="bg-white rounded-xl border border-border shadow-card overflow-hidden">
        <div className="px-5 py-4 border-b border-border">
          <h3 className="font-semibold text-foreground">
            Activity
            <span className="ml-2 text-xs font-normal text-muted-foreground">
              {linkedExpenses.length} expense{linkedExpenses.length !== 1 ? "s" : ""}
              {(transfersOut.length + transfersIn.length) > 0 && (
                <> · {transfersOut.length + transfersIn.length} transfer{(transfersOut.length + transfersIn.length) !== 1 ? "s" : ""}</>
              )}
            </span>
          </h3>
        </div>

        {activity.length === 0 ? (
          <EmptyState icon={Receipt} title="No activity yet"
            description="Expenses and transfers for this income source will appear here." />
        ) : (
          <div className="divide-y divide-border">
            {activity.map((item, idx) => {

              /* ── Expense row ── */
              if (item.kind === "expense") {
                const e      = item.expense;
                const person = spentBys.find((s) => s.id === e.spentById);
                const cat    = expenseTypes.find((t) => t.id === e.expenseTypeId);
                const eCur   = e.currencyCode || defaultCode;
                return (
                  <Link key={`e-${e.id}`} href={`/expenses/${e.id}`}
                    className="flex items-center gap-3 px-5 py-3.5 hover:bg-muted/40 transition-colors">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
                      style={{ backgroundColor: person?.avatarColor ?? "#6b7280" }}>
                      {person ? getInitials(person.name) : "?"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">{e.reason}</div>
                      <div className="text-xs text-muted-foreground">
                        {person?.name} · {cat?.icon} {cat?.name} · {formatRelative(e.createdAt)}
                      </div>
                    </div>
                    <div className="amount-display text-sm font-semibold text-red-500 shrink-0">
                      -{formatFor(e.amount, eCur)}
                    </div>
                  </Link>
                );
              }

              /* ── Transfer OUT row ── */
              if (item.kind === "transfer-out") {
                const t      = item.transfer;
                const other  = item.other;
                const otherCur = other?.currencyCode || defaultCode;
                const isCross  = cur !== otherCur;
                return (
                  <div key={`to-${t.id}-${idx}`}
                    className="flex items-center gap-3 px-5 py-3.5 bg-amber-50/40 hover:bg-amber-50/70 transition-colors">
                    <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
                      <ArrowUpRight className="w-4 h-4 text-amber-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-foreground">
                        Transfer → <span className="text-amber-700">{other?.name ?? "Unknown"}</span>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {isCross && <span className="font-medium text-amber-600">{cur}→{otherCur} · </span>}
                        {t.note && <span>{t.note} · </span>}
                        {formatRelative(t.createdAt)}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="amount-display text-sm font-semibold text-amber-600">
                        -{formatFor(t.amount, cur)}
                      </div>
                      {isCross && t.toAmount && (
                        <div className="text-xs text-muted-foreground">
                          → {formatFor(t.toAmount, otherCur)}
                        </div>
                      )}
                    </div>
                  </div>
                );
              }

              /* ── Transfer IN row ── */
              if (item.kind === "transfer-in") {
                const t      = item.transfer;
                const other  = item.other;
                const otherCur = other?.currencyCode || defaultCode;
                const isCross  = cur !== otherCur;
                const received = isCross ? (t.toAmount ?? t.amount) : t.amount;
                return (
                  <div key={`ti-${t.id}-${idx}`}
                    className="flex items-center gap-3 px-5 py-3.5 bg-emerald-50/40 hover:bg-emerald-50/70 transition-colors">
                    <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                      <ArrowDownLeft className="w-4 h-4 text-emerald-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-foreground">
                        Transfer ← <span className="text-emerald-700">{other?.name ?? "Unknown"}</span>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {isCross && <span className="font-medium text-emerald-600">{otherCur}→{cur} · </span>}
                        {t.note && <span>{t.note} · </span>}
                        {formatRelative(t.createdAt)}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="amount-display text-sm font-semibold text-emerald-600">
                        +{formatFor(received, cur)}
                      </div>
                      {isCross && (
                        <div className="text-xs text-muted-foreground">
                          sent {formatFor(t.amount, otherCur)}
                        </div>
                      )}
                    </div>
                  </div>
                );
              }

              return null;
            })}
          </div>
        )}
      </div>

      <ConfirmDialog
        open={confirmDelete} onClose={() => setConfirmDelete(false)}
        onConfirm={handleDelete} loading={deleting}
        title="Delete Income Source"
        description={linkedExpenses.length > 0
          ? `This income has ${linkedExpenses.length} linked expense(s). Reassign them before deleting.`
          : "This action cannot be undone. Are you sure?"}
        confirmLabel="Delete" />
    </div>
  );
}
