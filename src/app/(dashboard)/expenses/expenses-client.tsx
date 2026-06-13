"use client";
import { useState, useMemo } from "react";
import { useExpenses } from "@/hooks/use-expenses";
import { useIncome } from "@/hooks/use-income";
import { useSpentBy } from "@/hooks/use-spent-by";
import { useExpenseTypes } from "@/hooks/use-expense-types";
import { useTags } from "@/hooks/use-tags";
import { useCurrencies } from "@/hooks/use-currencies";
import { useAuthStore } from "@/stores/auth.store";
import { useUIStore } from "@/stores/ui.store";
import { useSettingsStore } from "@/stores/settings.store";
import { useCurrency } from "@/hooks/use-currency";
import { useToast } from "@/components/ui/toaster";
import { EmptyState } from "@/components/shared/empty-state";
import { TableSkeleton } from "@/components/shared/loading-skeleton";
import { ExpenseForm } from "@/components/expenses/expense-form";
import { FormDrawer } from "@/components/shared/form-drawer";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { formatDate, formatRelative } from "@/lib/utils/date";
import { getInitials } from "@/lib/utils/helpers";
import { exportToCSV } from "@/lib/utils/export";
import Link from "next/link";
import { Receipt, Plus, Download, Search, Trash2, Edit3, SlidersHorizontal, X } from "lucide-react";
import { ExpenseSchema } from "@/lib/validations/expense";
import { Expense } from "@/types";

export function ExpensesPageClient() {
  const { user }    = useAuthStore();
  const { expenses, loading, addExpense, removeExpense } = useExpenses();
  const { incomes } = useIncome();
  const { spentBys } = useSpentBy();
  const { expenseTypes } = useExpenseTypes();
  const { tags } = useTags();
  useCurrencies();
  const { formatFor } = useCurrency();
  const { settings }  = useSettingsStore();
  const defaultCode   = settings?.currencyCode ?? "KWD";
  const { toast }     = useToast();
  const { openQuickAdd } = useUIStore();

  const [showForm, setShowForm]          = useState(false);
  const [showFilters, setShowFilters]    = useState(false);
  const [searchQ, setSearchQ]            = useState("");
  const [filterIncome, setFilterIncome]  = useState("");
  const [filterPerson, setFilterPerson]  = useState("");
  const [filterType, setFilterType]      = useState("");
  const [filterCurrency, setFilterCurrency] = useState("");
  const [deleteTarget, setDeleteTarget]  = useState<Expense | null>(null);
  const [deleting, setDeleting]          = useState(false);

  const hasFilters = !!(searchQ || filterIncome || filterPerson || filterType || filterCurrency);

  const filtered = useMemo(() => {
    let list = expenses;
    if (searchQ)        list = list.filter((e) => e.reason.toLowerCase().includes(searchQ.toLowerCase()) || e.notes?.toLowerCase().includes(searchQ.toLowerCase()));
    if (filterIncome)   list = list.filter((e) => e.incomeSourceId === filterIncome);
    if (filterPerson)   list = list.filter((e) => e.spentById === filterPerson);
    if (filterType)     list = list.filter((e) => e.expenseTypeId === filterType);
    if (filterCurrency) list = list.filter((e) => (e.currencyCode || defaultCode) === filterCurrency);
    return list;
  }, [expenses, searchQ, filterIncome, filterPerson, filterType, filterCurrency, defaultCode]);

  const totalFiltered = useMemo(() => filtered.reduce((a, e) => a + e.amount, 0), [filtered]);
  const usedCurrencies = useMemo(
    () => Array.from(new Set(expenses.map((e) => e.currencyCode || defaultCode))),
    [expenses, defaultCode]
  );

  const handleAdd = async (data: ExpenseSchema) => {
    if (!user) return;
    try {
      await addExpense(user.uid, data);
      toast("Expense added!", "success");
      setShowForm(false);
    } catch (e: unknown) {
      toast((e as Error).message || "Failed to save expense. Please try again.", "error");
    }
  };

  const handleDelete = async () => {
    if (!user || !deleteTarget) return;
    setDeleting(true);
    try {
      await removeExpense(user.uid, deleteTarget.id, deleteTarget);
      toast("Expense deleted.", "success");
    } catch (e: unknown) {
      toast((e as Error).message || "Failed to delete expense.", "error");
    } finally {
      setDeleting(false);
      setDeleteTarget(null);
    }
  };

  const handleExport = () => {
    const data = filtered.map((e) => ({
      Date: formatDate(e.createdAt),
      Reason: e.reason,
      Amount: e.amount,
      Currency: e.currencyCode || defaultCode,
      "Income Source": incomes.find((i) => i.id === e.incomeSourceId)?.name ?? "",
      "Spent By": spentBys.find((s) => s.id === e.spentById)?.name ?? "",
      Category: expenseTypes.find((t) => t.id === e.expenseTypeId)?.name ?? "",
      Notes: e.notes ?? "",
    }));
    exportToCSV(data, "expenses");
    toast("Exported to CSV!", "success");
  };

  const clearFilters = () => {
    setSearchQ(""); setFilterIncome(""); setFilterPerson(""); setFilterType(""); setFilterCurrency("");
  };

  return (
    <div className="space-y-5 animate-fade-in">

      {/* ── Page header ──────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">Expenses</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {expenses.length} total · {formatFor(expenses.reduce((a, e) => a + e.amount, 0))} spent
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowFilters((v) => !v)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg border text-sm font-medium transition-colors ${showFilters || hasFilters ? "border-primary text-primary bg-primary/5" : "border-border hover:bg-muted"}`}>
            <SlidersHorizontal className="w-4 h-4" />
            <span className="hidden sm:inline">Filters</span>
            {hasFilters && <span className="w-1.5 h-1.5 rounded-full bg-primary" />}
          </button>
          <button onClick={handleExport}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-border text-sm font-medium hover:bg-muted transition-colors">
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">Export</span>
          </button>
          <button onClick={() => setShowForm(true)}
            className="flex items-center gap-2 bg-primary text-white px-4 py-2.5 rounded-lg text-sm font-semibold hover:bg-primary/90 transition-all shadow-sm shadow-primary/20">
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Add Expense</span>
            <span className="sm:hidden">Add</span>
          </button>
        </div>
      </div>

      {/* ── Filters panel ────────────────────────────────────── */}
      {showFilters && (
        <div className="bg-white rounded-xl border border-border p-4 shadow-card">
          <div className="flex flex-wrap gap-2.5">
            <div className="relative flex-1 min-w-[180px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
              <input value={searchQ} onChange={(e) => setSearchQ(e.target.value)}
                placeholder="Search expenses…"
                className="form-input pl-9" />
            </div>
            <select value={filterIncome} onChange={(e) => setFilterIncome(e.target.value)} className="form-input flex-1 min-w-[160px]">
              <option value="">All Income Sources</option>
              {incomes.map((i) => <option key={i.id} value={i.id}>{i.name}</option>)}
            </select>
            <select value={filterPerson} onChange={(e) => setFilterPerson(e.target.value)} className="form-input flex-1 min-w-[140px]">
              <option value="">All People</option>
              {spentBys.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
            <select value={filterType} onChange={(e) => setFilterType(e.target.value)} className="form-input flex-1 min-w-[140px]">
              <option value="">All Categories</option>
              {expenseTypes.map((t) => <option key={t.id} value={t.id}>{t.icon} {t.name}</option>)}
            </select>
            {usedCurrencies.length > 1 && (
              <select value={filterCurrency} onChange={(e) => setFilterCurrency(e.target.value)} className="form-input flex-1 min-w-[120px]">
                <option value="">All Currencies</option>
                {usedCurrencies.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            )}
            {hasFilters && (
              <button onClick={clearFilters}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-destructive hover:bg-destructive/8 transition-colors border border-border">
                <X className="w-4 h-4" /> Clear
              </button>
            )}
          </div>
          {hasFilters && (
            <p className="text-xs text-muted-foreground mt-3">
              Showing {filtered.length} of {expenses.length} · Total: <span className="font-semibold text-foreground amount-display">{formatFor(totalFiltered, filterCurrency || undefined)}</span>
            </p>
          )}
        </div>
      )}

      {/* ── Expense list ─────────────────────────────────────── */}
      {loading ? (
        <TableSkeleton rows={6} />
      ) : filtered.length === 0 ? (
        <EmptyState icon={Receipt} title="No expenses found"
          description={hasFilters ? "Try different filters." : "Add your first expense using the button above."}
          action={!hasFilters ? (
            <button onClick={openQuickAdd}
              className="flex items-center gap-2 bg-primary text-white px-4 py-2.5 rounded-lg text-sm font-semibold hover:bg-primary/90 transition-all">
              <Plus className="w-4 h-4" /> Add expense
            </button>
          ) : undefined}
        />
      ) : (
        <div className="bg-white rounded-xl border border-border shadow-card overflow-hidden">
          <div className="divide-y divide-border">
            {filtered.map((expense) => {
              const person  = spentBys.find((s) => s.id === expense.spentById);
              const income  = incomes.find((i) => i.id === expense.incomeSourceId);
              const cat     = expenseTypes.find((t) => t.id === expense.expenseTypeId);
              const expTags = tags.filter((t) => expense.tagIds.includes(t.id));
              const cur     = expense.currencyCode || defaultCode;
              return (
                <div key={expense.id}
                  className="flex items-center gap-3 px-4 sm:px-5 py-3.5 hover:bg-muted/30 transition-colors group">
                  {/* Avatar */}
                  <div className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
                    style={{ backgroundColor: person?.avatarColor ?? "#6b7280" }}>
                    {person ? getInitials(person.name) : "?"}
                  </div>
                  {/* Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Link href={`/expenses/${expense.id}`}
                        className="text-sm font-medium text-foreground hover:text-primary truncate max-w-[200px] sm:max-w-none">
                        {expense.reason}
                      </Link>
                      {cat && (
                        <span className="text-[11px] px-2 py-0.5 rounded-full font-medium"
                          style={{ backgroundColor: (cat.color ?? "#6b7280") + "22", color: cat.color ?? "#6b7280" }}>
                          {cat.icon} {cat.name}
                        </span>
                      )}
                      {cur !== defaultCode && (
                        <span className="text-[11px] px-1.5 py-0.5 rounded-full bg-blue-50 text-blue-600 font-semibold">{cur}</span>
                      )}
                      {expTags.slice(0, 2).map((tag) => (
                        <span key={tag.id} className="text-[11px] px-1.5 py-0.5 rounded-full"
                          style={{ backgroundColor: tag.color + "22", color: tag.color }}>
                          {tag.name}
                        </span>
                      ))}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                      <span className="hidden sm:inline">{person?.name ?? "Unknown"}</span>
                      <span className="hidden sm:inline">·</span>
                      <span className="truncate max-w-[120px]">{income?.name ?? "Unknown source"}</span>
                      <span>·</span>
                      <span className="shrink-0">{formatRelative(expense.createdAt)}</span>
                    </div>
                  </div>
                  {/* Amount + actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="amount-display text-sm font-semibold text-red-500">
                      -{formatFor(expense.amount, cur)}
                    </span>
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-0.5">
                      <Link href={`/expenses/${expense.id}`}
                        className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground">
                        <Edit3 className="w-3.5 h-3.5" />
                      </Link>
                      <button onClick={() => setDeleteTarget(expense)}
                        className="p-1.5 rounded-lg hover:bg-destructive/10 transition-colors text-muted-foreground hover:text-destructive">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Form drawer ──────────────────────────────────────── */}
      <FormDrawer
        isOpen={showForm}
        onClose={() => setShowForm(false)}
        title="New Expense"
        description="Record a new expense transaction"
      >
        <ExpenseForm
          onSubmit={handleAdd}
          onCancel={() => setShowForm(false)}
          submitLabel="Add Expense"
        />
      </FormDrawer>

      <ConfirmDialog
        open={!!deleteTarget} onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete} loading={deleting}
        title="Delete Expense"
        description={`Delete "${deleteTarget?.reason}"? This will reverse the ledger entry and restore the balance.`}
        confirmLabel="Delete Expense"
      />
    </div>
  );
}
