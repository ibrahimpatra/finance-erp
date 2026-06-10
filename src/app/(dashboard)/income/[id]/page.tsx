"use client";
import { use, useState } from "react";
import { useIncomeStore } from "@/stores/income.store";
import { useExpenseStore } from "@/stores/expense.store";
import { useAuthStore } from "@/stores/auth.store";
import { useSpentByStore } from "@/stores/spent-by.store";
import { useExpenseTypeStore } from "@/stores/expense-type.store";
import { useCurrency } from "@/hooks/use-currency";
import { useTags } from "@/hooks/use-tags";
import { useToast } from "@/components/ui/toaster";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { IncomeForm } from "@/components/income/income-form";
import { EmptyState } from "@/components/shared/empty-state";
import { CurrencyDisplay } from "@/components/shared/currency-display";
import { formatDate, formatRelative } from "@/lib/utils/date";
import { getInitials } from "@/lib/utils/helpers";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Edit3, Trash2, Receipt, TrendingUp, Tag } from "lucide-react";
import { IncomeSchema } from "@/lib/validations/income";
import { motion, AnimatePresence } from "framer-motion";

export default function IncomeDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { user } = useAuthStore();
  const { incomes, editIncome, removeIncome } = useIncomeStore();
  const { expenses } = useExpenseStore();
  const { spentBys } = useSpentByStore();
  const { expenseTypes } = useExpenseTypeStore();
  const { tags } = useTags();
  const { format } = useCurrency();
  const { toast } = useToast();
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const income = incomes.find((i) => i.id === id);
  const linkedExpenses = expenses.filter((e) => e.incomeSourceId === id);
  const incomeTags = tags.filter((t) => income?.tagIds?.includes(t.id));

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
      <div className="flex items-center gap-4">
        <Link href="/income" className="p-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div className="flex-1">
          <h2 className="text-xl font-bold text-foreground">{income.name}</h2>
          <p className="text-sm text-muted-foreground">{income.source} · Added {formatDate(income.createdAt)}</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setEditing(!editing)} className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border text-sm font-medium hover:bg-muted transition-colors">
            <Edit3 className="w-4 h-4" /> Edit
          </button>
          <button onClick={() => setConfirmDelete(true)} className="flex items-center gap-2 px-3 py-2 rounded-lg border border-red-200 text-destructive text-sm font-medium hover:bg-destructive/5 transition-colors">
            <Trash2 className="w-4 h-4" /> Delete
          </button>
        </div>
      </div>

      <AnimatePresence>
        {editing && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="bg-white rounded-xl border border-border shadow-card p-6">
            <h3 className="font-semibold mb-4">Edit Income Source</h3>
            <IncomeForm defaultValues={{ name: income.name, source: income.source, amount: income.amount, notes: income.notes, tagIds: income.tagIds }}
              onSubmit={handleEdit} onCancel={() => setEditing(false)} submitLabel="Save Changes" />
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: "Original Amount", value: format(income.amount), color: "text-blue-600" },
          { label: "Total Spent", value: format(income.totalDebits), color: "text-red-500" },
          { label: "Remaining Balance", value: format(income.balance), color: income.balance >= 0 ? "text-emerald-600" : "text-red-500" },
        ].map((stat) => (
          <div key={stat.label} className="stat-card">
            <div className={`amount-display text-2xl font-bold ${stat.color} mb-1`}>{stat.value}</div>
            <div className="text-sm text-muted-foreground">{stat.label}</div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-border shadow-card p-5 space-y-3">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">{income.percentageUsed}% used</span>
          <span className="font-medium">{format(income.totalDebits)} / {format(income.amount)}</span>
        </div>
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <div className="progress-gradient h-full" style={{ width: `${income.percentageUsed}%` }} />
        </div>
      </div>

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

      <div className="bg-white rounded-xl border border-border shadow-card overflow-hidden">
        <div className="px-5 py-4 border-b border-border flex items-center justify-between">
          <h3 className="font-semibold text-foreground">Linked Expenses ({linkedExpenses.length})</h3>
        </div>
        {linkedExpenses.length === 0 ? (
          <EmptyState icon={Receipt} title="No expenses yet" description="Expenses charged to this income source will appear here." />
        ) : (
          <div className="divide-y divide-border">
            {linkedExpenses.map((e) => {
              const person = spentBys.find((s) => s.id === e.spentById);
              const cat = expenseTypes.find((t) => t.id === e.expenseTypeId);
              return (
                <Link key={e.id} href={`/expenses/${e.id}`}
                  className="flex items-center gap-3 px-5 py-3.5 hover:bg-muted/40 transition-colors">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
                    style={{ backgroundColor: person?.avatarColor ?? "#6b7280" }}>
                    {person ? getInitials(person.name) : "?"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{e.reason}</div>
                    <div className="text-xs text-muted-foreground">{person?.name} · {cat?.name} · {formatDate(e.createdAt)}</div>
                  </div>
                  <div className="amount-display text-sm font-semibold text-red-500">-{format(e.amount)}</div>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      <ConfirmDialog open={confirmDelete} onClose={() => setConfirmDelete(false)} onConfirm={handleDelete}
        loading={deleting} title="Delete Income Source"
        description={linkedExpenses.length > 0
          ? `This income has ${linkedExpenses.length} linked expense(s). Reassign them before deleting.`
          : "This action cannot be undone. Are you sure?"}
        confirmLabel="Delete" />
    </div>
  );
}
