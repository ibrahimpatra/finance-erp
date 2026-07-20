"use client";
import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useBankAccounts } from "@/hooks/use-bank-accounts";
import { useIncome } from "@/hooks/use-income";
import { useExpenses } from "@/hooks/use-expenses";
import { useCurrency } from "@/hooks/use-currency";
import { useAuthStore } from "@/stores/auth.store";
import { useIncomeStore } from "@/stores/income.store";
import { useExpenseStore } from "@/stores/expense.store";
import { ACCOUNT_TYPES, IncomeFormData, ExpenseFormData } from "@/types";
import {
  ArrowLeft, Plus, TrendingUp, TrendingDown, ArrowRightLeft,
  Loader2, Edit3, AlertTriangle, RefreshCw,
} from "lucide-react";
import { FormDrawer } from "@/components/shared/form-drawer";
import { AccountForm } from "@/components/bank-accounts/account-form";
import { IncomeForm } from "@/components/income/income-form";
import { ExpenseForm } from "@/components/expenses/expense-form";
import { BankAccountSchema } from "@/lib/validations/bank-account";
import { IncomeSchema } from "@/lib/validations/income";
import { ExpenseSchema } from "@/lib/validations/expense";
import { useToast } from "@/components/ui/toaster";
import { cn } from "@/lib/utils/helpers";
import { getOutstandingShortfalls, OutstandingShortfall } from "@/services/shortfall.service";

type TxFilter = "all" | "income" | "expense";

interface AccountDetailClientProps {
  accountId: string;
}

export function AccountDetailClient({ accountId }: AccountDetailClientProps) {
  const router             = useRouter();
  const { user }           = useAuthStore();
  const { toast }          = useToast();
  const { formatFor }      = useCurrency();
  const { accountsWithBalance, editAccount, resolveShortfall, recomputeAccount, fetchShortfallData } = useBankAccounts();
  const { incomes }        = useIncome();
  const { expenses }       = useExpenses();
  const { addIncome }      = useIncomeStore();
  const { addExpense }     = useExpenseStore();

  const [filter,        setFilter]        = useState<TxFilter>("all");
  const [editOpen,       setEditOpen]      = useState(false);
  // FIX (#6): these now open the existing FormDrawer instead of navigating
  // away to /income or /expenses — was the one place in the app still using
  // a full-page redirect instead of the side-drawer pattern used everywhere else.
  const [addIncomeOpen,  setAddIncomeOpen] = useState(false);
  const [addExpenseOpen, setAddExpenseOpen] = useState(false);
  const [recomputing,    setRecomputing]   = useState(false);

  // (#7) Shortfalls panel state
  const [shortfalls,        setShortfalls]        = useState<OutstandingShortfall[]>([]);
  const [shortfallsLoading, setShortfallsLoading]  = useState(false);
  const [reassignTarget,    setReassignTarget]     = useState<string | null>(null); // expenseId being reassigned
  const [reassignIncomeId,  setReassignIncomeId]   = useState("");
  const [reassigning,       setReassigning]        = useState(false);

  const account = accountsWithBalance.find((a) => a.id === accountId);

  const accountIncomes = useMemo(
    () => incomes.filter((i) => i.accountId === accountId),
    [incomes, accountId]
  );
  const accountExpenses = useMemo(
    () => expenses.filter((e) => e.accountId === accountId),
    [expenses, accountId]
  );

  // Incomes in this account with spare balance — valid manual-reassign targets
  const incomesWithBalanceForReassign = useMemo(
    () => accountIncomes.filter((i) => (i.balance ?? 0) > 0.0001),
    [accountIncomes]
  );

  const loadShortfalls = async () => {
    if (!user) return;
    setShortfallsLoading(true);
    try {
      const data = await getOutstandingShortfalls(user.uid, accountId);
      setShortfalls(data);
    } catch {
      // Non-critical — panel just shows empty/stale until next load
    } finally {
      setShortfallsLoading(false);
    }
  };

  useEffect(() => {
    loadShortfalls();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, accountId]);

  const timeline = useMemo(() => {
    const items: Array<{
      id: string; type: "income" | "expense"; amount: number;
      label: string; sub?: string; date: Date;
    }> = [];

    if (filter === "all" || filter === "income") {
      accountIncomes.forEach((i) =>
        items.push({
          id: i.id, type: "income", amount: i.amount, label: i.name,
          sub: i.source, date: i.createdAt?.toDate?.() ?? new Date(0),
        })
      );
    }
    if (filter === "all" || filter === "expense") {
      accountExpenses.forEach((e) =>
        items.push({
          id: e.id, type: "expense", amount: e.amount, label: e.reason,
          date: e.createdAt?.toDate?.() ?? new Date(0),
        })
      );
    }
    return items.sort((a, b) => b.date.getTime() - a.date.getTime());
  }, [accountIncomes, accountExpenses, filter]);

  const handleEdit = async (data: BankAccountSchema) => {
    if (!user || !account) return;
    try {
      const { currencyCode: _dropped, ...rest } = data;
      await editAccount(user.uid, accountId, rest, account);
      toast("Account updated!", "success");
      setEditOpen(false);
    } catch (e: unknown) {
      toast((e as Error).message ?? "Failed to update", "error");
    }
  };

  const handleAddIncome = async (data: IncomeSchema) => {
    if (!user) return;
    try {
      await addIncome(user.uid, data as IncomeFormData);
      toast("Income added!", "success");
      setAddIncomeOpen(false);
      loadShortfalls(); // a new income may have auto-resolved a shortfall
    } catch (e: unknown) {
      toast((e as Error).message ?? "Failed to add income", "error");
    }
  };

  const handleAddExpense = async (data: ExpenseSchema) => {
    if (!user) return;
    try {
      await addExpense(user.uid, data as ExpenseFormData);
      toast("Expense added!", "success");
      setAddExpenseOpen(false);
      loadShortfalls(); // a new expense may have created a shortfall
    } catch (e: unknown) {
      toast((e as Error).message ?? "Failed to add expense", "error");
    }
  };

  // (#7) Manual reassignment of one specific shortfall to a chosen income
  const handleReassignShortfall = async (shortfall: OutstandingShortfall) => {
    if (!user || !reassignIncomeId) return;
    setReassigning(true);
    try {
      const income = incomesWithBalanceForReassign.find((i) => i.id === reassignIncomeId);
      if (!income) throw new Error("Selected income not found.");
      await resolveShortfall(user.uid, accountId, reassignIncomeId, income.balance, shortfall.expenseId);
      toast("Shortfall reassigned!", "success");
      setReassignTarget(null);
      setReassignIncomeId("");
      loadShortfalls();
    } catch (e: unknown) {
      toast((e as Error).message ?? "Failed to reassign", "error");
    } finally {
      setReassigning(false);
    }
  };

  // (#7) "Recompute" — safe, additive-only catch-up reconciliation
  const handleRecompute = async () => {
    if (!user) return;
    setRecomputing(true);
    try {
      const incomeIds = accountIncomes.map((i) => i.id);
      const result = await recomputeAccount(user.uid, accountId, incomeIds);
      if (result.resolvedCount > 0) {
        toast(
          `Recompute complete: resolved ${result.resolvedCount} item${result.resolvedCount !== 1 ? "s" : ""}, ${formatFor(result.totalResolved, account?.currencyCode ?? "")} applied`,
          "success"
        );
      } else {
        toast("Recompute complete: everything was already up to date.", "success");
      }
      loadShortfalls();
    } catch (e: unknown) {
      toast((e as Error).message ?? "Recompute failed", "error");
    } finally {
      setRecomputing(false);
    }
  };

  if (!account) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        <p className="text-sm text-muted-foreground">Loading account…</p>
      </div>
    );
  }

  const typeInfo = ACCOUNT_TYPES.find((t) => t.value === account.accountType);
  const icon     = account.icon || typeInfo?.icon || "🏦";

  const FILTERS: { id: TxFilter; label: string }[] = [
    { id: "all",     label: "All" },
    { id: "income",  label: `Income (${accountIncomes.length})` },
    { id: "expense", label: `Expenses (${accountExpenses.length})` },
  ];

  return (
    <div className="space-y-6 animate-fade-in">

      {/* Back + Header */}
      <div className="flex items-start gap-4">
        <button
          onClick={() => router.back()}
          className="mt-1 p-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0"
              style={{ backgroundColor: `${account.color}20` }}
            >
              {icon}
            </div>
            <div className="min-w-0">
              <h1 className="text-xl font-bold text-foreground truncate">{account.name}</h1>
              <p className="text-xs text-muted-foreground">
                {account.bankName ?? typeInfo?.label}
                {account.lastFourDigits ? ` ••${account.lastFourDigits}` : ""}
                {" · "}
                <span className="font-semibold">{account.currencyCode}</span>
              </p>
            </div>
            <div className="ml-auto flex items-center gap-1.5">
              <button
                onClick={handleRecompute}
                disabled={recomputing}
                title="Recompute — safe, additive-only reconciliation pass"
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-border text-xs font-medium hover:bg-muted transition-colors disabled:opacity-50"
              >
                {recomputing
                  ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  : <RefreshCw className="w-3.5 h-3.5" />
                }
                Recompute
              </button>
              <button
                onClick={() => setEditOpen(true)}
                className="p-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground"
              >
                <Edit3 className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white rounded-xl border border-border p-4">
          <p className="text-xs text-muted-foreground">Balance</p>
          <p className={cn(
            "amount-display text-xl font-bold mt-0.5",
            account.balance < 0 ? "text-red-600" : "text-foreground"
          )}>
            {formatFor(account.balance, account.currencyCode)}
          </p>
        </div>
        <div className="bg-white rounded-xl border border-border p-4">
          <p className="text-xs text-muted-foreground">Total Income</p>
          <p className="amount-display text-xl font-bold mt-0.5 text-emerald-600">
            {formatFor(account.totalIncome, account.currencyCode)}
          </p>
        </div>
        <div className="bg-white rounded-xl border border-border p-4">
          <p className="text-xs text-muted-foreground">Total Spent</p>
          <p className="amount-display text-xl font-bold mt-0.5 text-red-500">
            {formatFor(account.totalExpenses, account.currencyCode)}
          </p>
        </div>
        <div className="bg-white rounded-xl border border-border p-4">
          <p className="text-xs text-muted-foreground">Attribution</p>
          <p className="text-xl font-bold mt-0.5 text-foreground">
            {Math.round(account.attributionRate)}%
          </p>
          <div className="h-1 bg-muted rounded-full mt-1.5 overflow-hidden">
            <div
              className="h-full rounded-full transition-all"
              style={{ width: `${account.attributionRate}%`, backgroundColor: account.color }}
            />
          </div>
        </div>
      </div>

      {/* (#7) Shortfalls panel — only renders when there's something outstanding */}
      {(account.outstandingShortfall > 0.0005 || shortfalls.length > 0) && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="w-4 h-4 text-amber-600" />
            <h3 className="text-sm font-semibold text-amber-900">
              Outstanding Shortfall — {formatFor(account.outstandingShortfall, account.currencyCode)}
            </h3>
          </div>
          <p className="text-xs text-amber-700 mb-3">
            One or more expenses exceeded their income's available balance. The
            uncovered amount is tracked here at the account level — every individual
            income stays at zero or above. This will resolve automatically when you
            add a new income to this account, or you can reassign it manually below.
          </p>

          {shortfallsLoading ? (
            <Loader2 className="w-4 h-4 animate-spin text-amber-600" />
          ) : (
            <div className="space-y-2">
              {shortfalls.map((s) => (
                <div key={s.expenseId} className="bg-white rounded-xl border border-amber-200 p-3.5">
                  <div className="flex items-center justify-between gap-3 flex-wrap">
                    <div className="min-w-0">
                      <p className="text-xs text-foreground">{s.description}</p>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        {s.totalResolved > 0
                          ? `${formatFor(s.totalResolved, account.currencyCode)} resolved · ${formatFor(s.remaining, account.currencyCode)} remaining`
                          : `${formatFor(s.remaining, account.currencyCode)} remaining`}
                      </p>
                    </div>
                    {reassignTarget === s.expenseId ? (
                      <div className="flex items-center gap-2">
                        <select
                          value={reassignIncomeId}
                          onChange={(e) => setReassignIncomeId(e.target.value)}
                          className="px-2 py-1.5 rounded-lg border border-input text-xs focus:outline-none focus:ring-2 focus:ring-primary/25"
                        >
                          <option value="">Select income…</option>
                          {incomesWithBalanceForReassign.map((i) => (
                            <option key={i.id} value={i.id}>
                              {i.name} ({formatFor(i.balance, account.currencyCode)})
                            </option>
                          ))}
                        </select>
                        <button
                          onClick={() => handleReassignShortfall(s)}
                          disabled={!reassignIncomeId || reassigning}
                          className="px-3 py-1.5 rounded-lg bg-amber-600 text-white text-xs font-semibold hover:bg-amber-700 disabled:opacity-50 transition-colors"
                        >
                          {reassigning ? "…" : "Confirm"}
                        </button>
                        <button
                          onClick={() => { setReassignTarget(null); setReassignIncomeId(""); }}
                          className="px-2 py-1.5 text-xs text-muted-foreground hover:text-foreground"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setReassignTarget(s.expenseId)}
                        disabled={incomesWithBalanceForReassign.length === 0}
                        className="px-3 py-1.5 rounded-lg border border-amber-300 text-amber-700 text-xs font-semibold hover:bg-amber-100 transition-colors disabled:opacity-40 shrink-0"
                      >
                        Reassign
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Quick actions — FIX (#6): now open FormDrawer instead of navigating away */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => setAddIncomeOpen(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 text-sm font-medium hover:bg-emerald-100 transition-colors"
        >
          <Plus className="w-4 h-4" /> Add Income
        </button>
        <button
          onClick={() => setAddExpenseOpen(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-50 text-red-700 border border-red-200 text-sm font-medium hover:bg-red-100 transition-colors"
        >
          <Plus className="w-4 h-4" /> Add Expense
        </button>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 border-b border-border pb-0">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            className={cn(
              "px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors",
              filter === f.id
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Timeline */}
      <div className="space-y-2">
        {timeline.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground text-sm">
            No transactions yet for this filter.
          </div>
        ) : (
          timeline.map((tx) => (
            <div
              key={`${tx.type}-${tx.id}`}
              className="flex items-center gap-3 p-4 bg-white rounded-xl border border-border hover:shadow-sm transition-all"
            >
              <div className={cn(
                "w-9 h-9 rounded-xl flex items-center justify-center shrink-0",
                tx.type === "income"
                  ? "bg-emerald-50 text-emerald-600"
                  : "bg-red-50 text-red-500"
              )}>
                {tx.type === "income"
                  ? <TrendingUp className="w-4 h-4" />
                  : <TrendingDown className="w-4 h-4" />
                }
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{tx.label}</p>
                <p className="text-xs text-muted-foreground">
                  {tx.sub && <span>{tx.sub} · </span>}
                  {tx.date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
                </p>
              </div>
              <div className="text-right shrink-0">
                <p className={cn(
                  "amount-display text-sm font-bold",
                  tx.type === "income" ? "text-emerald-600" : "text-red-500"
                )}>
                  {tx.type === "income" ? "+" : "−"}{formatFor(tx.amount, account.currencyCode)}
                </p>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Edit Account Drawer */}
      <FormDrawer
        isOpen={editOpen}
        onClose={() => setEditOpen(false)}
        title="Edit Account"
        description="Currency cannot be changed after creation."
      >
        <AccountForm
          defaultValues={{
            name: account.name, bankName: account.bankName, accountType: account.accountType,
            lastFourDigits: account.lastFourDigits, currencyCode: account.currencyCode,
            color: account.color, icon: account.icon, isActive: account.isActive,
            isDefault: account.isDefault, notes: account.notes,
          }}
          currencyLocked
          onSubmit={handleEdit}
          onCancel={() => setEditOpen(false)}
          submitLabel="Save Changes"
        />
      </FormDrawer>

      {/* Add Income Drawer — FIX (#6) */}
      <FormDrawer
        isOpen={addIncomeOpen}
        onClose={() => setAddIncomeOpen(false)}
        title="Add Income"
        description={`Linked to ${account.name}`}
      >
        <IncomeForm
          preselectedAccountId={accountId}
          onSubmit={handleAddIncome}
          onCancel={() => setAddIncomeOpen(false)}
          submitLabel="Add Income"
        />
      </FormDrawer>

      {/* Add Expense Drawer — FIX (#6) */}
      <FormDrawer
        isOpen={addExpenseOpen}
        onClose={() => setAddExpenseOpen(false)}
        title="Add Expense"
        description={`Linked to ${account.name}`}
      >
        <ExpenseForm
          preselectedAccountId={accountId}
          onSubmit={handleAddExpense}
          onCancel={() => setAddExpenseOpen(false)}
          submitLabel="Add Expense"
        />
      </FormDrawer>
    </div>
  );
}
