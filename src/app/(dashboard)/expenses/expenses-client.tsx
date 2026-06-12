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
import { ExpenseForm } from "@/components/expenses/expense-form";
import { FormDrawer } from "@/components/shared/form-drawer";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { formatRelative } from "@/lib/utils/date";
import { formatDate } from "@/lib/utils/date";
import { getInitials } from "@/lib/utils/helpers";
import { exportToCSV } from "@/lib/utils/export";
import Link from "next/link";
import { Receipt, Plus, Download, Search, Trash2, Edit3, Filter, X } from "lucide-react";
import { ExpenseSchema } from "@/lib/validations/expense";
import { Expense } from "@/types";

const inp = "w-full px-3.5 py-2.5 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all";

export function ExpensesPageClient() {
  const { user }                         = useAuthStore();
  const { expenses, loading, addExpense, removeExpense } = useExpenses();
  const { incomes }                      = useIncome();
  const { spentBys }                     = useSpentBy();
  const { expenseTypes }                 = useExpenseTypes();
  const { tags }                         = useTags();
  useCurrencies();
  const { formatFor }                    = useCurrency();
  const { settings }                     = useSettingsStore();
  const defaultCode                      = settings?.currencyCode ?? "KWD";
  const { toast }                        = useToast();
  const { openQuickAdd }                 = useUIStore();

  const [drawerOpen, setDrawerOpen]         = useState(false);
  const [filtersOpen, setFiltersOpen]       = useState(false);
  const [searchQ, setSearchQ]               = useState("");
  const [filterIncome, setFilterIncome]     = useState("");
  const [filterPerson, setFilterPerson]     = useState("");
  const [filterType, setFilterType]         = useState("");
  const [filterCurrency, setFilterCurrency] = useState("");
  const [deleteTarget, setDeleteTarget]     = useState<Expense | null>(null);
  const [deleting, setDeleting]             = useState(false);

  const anyFilter = !!(searchQ || filterIncome || filterPerson || filterType || filterCurrency);

  const filtered = useMemo(() => {
    let list = expenses;
    if (searchQ)        list = list.filter(e => e.reason.toLowerCase().includes(searchQ.toLowerCase()) || e.notes?.toLowerCase().includes(searchQ.toLowerCase()));
    if (filterIncome)   list = list.filter(e => e.incomeSourceId === filterIncome);
    if (filterPerson)   list = list.filter(e => e.spentById === filterPerson);
    if (filterType)     list = list.filter(e => e.expenseTypeId === filterType);
    if (filterCurrency) list = list.filter(e => (e.currencyCode || defaultCode) === filterCurrency);
    return list;
  }, [expenses, searchQ, filterIncome, filterPerson, filterType, filterCurrency, defaultCode]);

  const usedCurrencies = useMemo(
    () => Array.from(new Set(expenses.map(e => e.currencyCode || defaultCode))),
    [expenses, defaultCode]
  );

  const totalFiltered = useMemo(() => filtered.reduce((a, e) => a + e.amount, 0), [filtered]);

  const handleAdd = async (data: ExpenseSchema) => {
    if (!user) return;
    await addExpense(user.uid, data);
    toast("Expense added!", "success");
    setDrawerOpen(false);
  };

  const handleDelete = async () => {
    if (!user || !deleteTarget) return;
    setDeleting(true);
    await removeExpense(user.uid, deleteTarget.id, deleteTarget);
    toast("Expense deleted.", "success");
    setDeleting(false);
    setDeleteTarget(null);
  };

  const clearFilters = () => {
    setSearchQ(""); setFilterIncome(""); setFilterPerson(""); setFilterType(""); setFilterCurrency("");
  };

  const handleExport = () => {
    const data = filtered.map(e => ({
      Date: formatDate(e.createdAt),
      Reason: e.reason,
      Amount: e.amount,
      Currency: e.currencyCode || defaultCode,
      "Income Source": incomes.find(i => i.id === e.incomeSourceId)?.name ?? "",
      "Spent By": spentBys.find(s => s.id === e.spentById)?.name ?? "",
      Category: expenseTypes.find(t => t.id === e.expenseTypeId)?.name ?? "",
      Notes: e.notes ?? "",
    }));
    exportToCSV(data, "expenses");
    toast("Exported!", "success");
  };

  return (
    <div className="space-y-5 animate-fade-in">
      {/* ── Page header ─────────────────────────────── */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">Expenses</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {expenses.length} total
            {anyFilter && ` · ${filtered.length} shown`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handleExport}
            className="p-2.5 rounded-xl border border-border hover:bg-muted transition-colors text-muted-foreground" title="Export CSV">
            <Download className="w-4 h-4" />
          </button>
          <button onClick={() => setFiltersOpen(v => !v)}
            className={`p-2.5 rounded-xl border transition-colors ${anyFilter ? "border-primary bg-primary/10 text-primary" : "border-border hover:bg-muted text-muted-foreground"}`}
            title="Filters">
            <Filter className="w-4 h-4" />
          </button>
          <button onClick={() => setDrawerOpen(true)}
            className="flex items-center gap-2 bg-primary text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-primary/90 active:scale-95 transition-all shadow-sm shadow-primary/30">
            <Plus className="w-4 h-4" />
            <span className="hidden sm:block">Add Expense</span>
            <span className="sm:hidden">Add</span>
          </button>
        </div>
      </div>

      {/* ── Search bar (always visible) ─────────────── */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input value={searchQ} onChange={e => setSearchQ(e.target.value)}
          placeholder="Search by reason or notes…"
          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-input bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all shadow-sm" />
        {searchQ && (
          <button onClick={() => setSearchQ("")} className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded hover:bg-muted transition-colors">
            <X className="w-3.5 h-3.5 text-muted-foreground" />
          </button>
        )}
      </div>

      {/* ── Collapsible filter row ───────────────────── */}
      {filtersOpen && (
        <div className="bg-white border border-border rounded-xl p-4 space-y-3 shadow-sm">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <select value={filterIncome} onChange={e => setFilterIncome(e.target.value)} className={inp}>
              <option value="">All Income Sources</option>
              {incomes.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
            </select>
            <select value={filterPerson} onChange={e => setFilterPerson(e.target.value)} className={inp}>
              <option value="">All People</option>
              {spentBys.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
            <select value={filterType} onChange={e => setFilterType(e.target.value)} className={inp}>
              <option value="">All Categories</option>
              {expenseTypes.map(t => <option key={t.id} value={t.id}>{t.icon} {t.name}</option>)}
            </select>
            {usedCurrencies.length > 1 && (
              <select value={filterCurrency} onChange={e => setFilterCurrency(e.target.value)} className={inp}>
                <option value="">All Currencies</option>
                {usedCurrencies.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            )}
          </div>
          {anyFilter && (
            <div className="flex items-center justify-between pt-1">
              <span className="text-sm text-muted-foreground">
                {filtered.length} result{filtered.length !== 1 ? "s" : ""} ·{" "}
                <span className="font-semibold amount-display text-foreground">
                  {formatFor(totalFiltered, filterCurrency || undefined)}
                </span>
              </span>
              <button onClick={clearFilters} className="text-xs text-primary hover:underline">Clear all</button>
            </div>
          )}
        </div>
      )}

      {/* ── Expense list ──────────────────────────────── */}
      {loading ? (
        <div className="space-y-2">
          {[1,2,3,4,5].map(i => <div key={i} className="h-[72px] rounded-xl bg-muted animate-pulse" />)}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Receipt}
          title={anyFilter ? "No results" : "No expenses yet"}
          description={anyFilter ? "Try adjusting your filters." : "Tap the Add button to record your first expense."}
          action={!anyFilter ? (
            <button onClick={() => setDrawerOpen(true)}
              className="flex items-center gap-2 bg-primary text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-primary/90 transition-all">
              <Plus className="w-4 h-4" /> Add first expense
            </button>
          ) : undefined}
        />
      ) : (
        <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
          <div className="divide-y divide-border/60">
            {filtered.map((expense) => {
              const person   = spentBys.find(s => s.id === expense.spentById);
              const income   = incomes.find(i => i.id === expense.incomeSourceId);
              const cat      = expenseTypes.find(t => t.id === expense.expenseTypeId);
              const expTags  = tags.filter(t => expense.tagIds?.includes(t.id));
              const cur      = expense.currencyCode || defaultCode;
              return (
                <div key={expense.id}
                  className="flex items-center gap-3 px-4 py-3.5 hover:bg-muted/30 transition-colors group">
                  {/* Avatar */}
                  <div className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
                    style={{ backgroundColor: person?.avatarColor ?? "#6b7280" }}>
                    {person ? getInitials(person.name) : "?"}
                  </div>

                  {/* Main info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Link href={`/expenses/${expense.id}`}
                        className="text-sm font-semibold text-foreground hover:text-primary truncate max-w-[200px]">
                        {expense.reason}
                      </Link>
                      {cat && (
                        <span className="hidden sm:inline-flex text-xs px-2 py-0.5 rounded-full font-medium"
                          style={{ backgroundColor: (cat.color ?? "#6b7280") + "20", color: cat.color ?? "#6b7280" }}>
                          {cat.icon} {cat.name}
                        </span>
                      )}
                      {cur !== defaultCode && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-blue-50 text-blue-600 font-bold">{cur}</span>
                      )}
                      {expTags.slice(0, 1).map(tag => (
                        <span key={tag.id} className="hidden sm:inline-flex text-[10px] px-1.5 py-0.5 rounded-full font-medium"
                          style={{ backgroundColor: tag.color + "20", color: tag.color }}>
                          {tag.name}
                        </span>
                      ))}
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-0.5">
                      {person && <span>{person.name}</span>}
                      {income && <><span>·</span><span className="truncate">{income.name}</span></>}
                      <span>·</span>
                      <span>{formatRelative(expense.createdAt)}</span>
                    </div>
                  </div>

                  {/* Amount + actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    <div className="text-right">
                      <div className="amount-display text-sm font-bold text-red-500">
                        -{formatFor(expense.amount, cur)}
                      </div>
                    </div>
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                      <Link href={`/expenses/${expense.id}`}
                        className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground">
                        <Edit3 className="w-3.5 h-3.5" />
                      </Link>
                      <button onClick={() => setDeleteTarget(expense)}
                        className="p-1.5 rounded-lg hover:bg-red-50 transition-colors text-muted-foreground hover:text-red-500">
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

      {/* ── Form Drawer ───────────────────────────────── */}
      <FormDrawer
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title="New Expense"
        description="Record a spending transaction against an income source."
      >
        <ExpenseForm
          onSubmit={handleAdd}
          onCancel={() => setDrawerOpen(false)}
          submitLabel="Add Expense"
        />
      </FormDrawer>

      <ConfirmDialog
        open={!!deleteTarget} onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete} loading={deleting}
        title="Delete Expense"
        description={`Delete "${deleteTarget?.reason}"? This will restore the balance to the income source.`}
        confirmLabel="Delete Expense"
      />
    </div>
  );
}
