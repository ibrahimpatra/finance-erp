"use client";
import { useState, useMemo }   from "react";
import { useRouter }           from "next/navigation";
import { useBankAccounts }     from "@/hooks/use-bank-accounts";
import { useIncome }           from "@/hooks/use-income";
import { useExpenses }         from "@/hooks/use-expenses";
import { useCurrency }         from "@/hooks/use-currency";
import { useAuthStore }        from "@/stores/auth.store";
import { ACCOUNT_TYPES }       from "@/types";
import {
  ArrowLeft, Plus, TrendingUp, TrendingDown, ArrowRightLeft,
  Loader2, Edit2,
} from "lucide-react";
import Link from "next/link";
import { FormDrawer } from "@/components/shared/form-drawer";
import { AccountForm } from "@/components/bank-accounts/account-form";
import { BankAccountSchema } from "@/lib/validations/bank-account";
import { BankAccountFormData } from "@/types";
import { useToast } from "@/components/ui/toaster";
import { cn } from "@/lib/utils/helpers";

type TxFilter = "all" | "income" | "expense";

interface AccountDetailClientProps {
  accountId: string;
}

export function AccountDetailClient({ accountId }: AccountDetailClientProps) {
  const router             = useRouter();
  const { user }           = useAuthStore();
  const { toast }          = useToast();
  const { formatFor }      = useCurrency();
  const { accountsWithBalance, editAccount } = useBankAccounts();
  const { incomes }        = useIncome();
  const { expenses }       = useExpenses();

  const [filter,   setFilter]   = useState<TxFilter>("all");
  const [editOpen, setEditOpen] = useState(false);

  const account = accountsWithBalance.find((a) => a.id === accountId);

  // Incomes linked to this account
  const accountIncomes = useMemo(
    () => incomes.filter((i) => i.accountId === accountId),
    [incomes, accountId]
  );

  // Expenses linked to this account
  const accountExpenses = useMemo(
    () => expenses.filter((e) => e.accountId === accountId),
    [expenses, accountId]
  );

  // Unified timeline
  const timeline = useMemo(() => {
    const items: Array<{
      id:       string;
      type:     "income" | "expense";
      amount:   number;
      label:    string;
      sub?:     string;
      date:     Date;
    }> = [];

    if (filter === "all" || filter === "income") {
      accountIncomes.forEach((i) =>
        items.push({
          id:     i.id,
          type:   "income",
          amount: i.amount,
          label:  i.name,
          sub:    i.source,
          date:   i.createdAt?.toDate?.() ?? new Date(0),
        })
      );
    }

    if (filter === "all" || filter === "expense") {
      accountExpenses.forEach((e) =>
        items.push({
          id:     e.id,
          type:   "expense",
          amount: e.amount,
          label:  e.reason,
          date:   e.createdAt?.toDate?.() ?? new Date(0),
        })
      );
    }

    return items.sort((a, b) => b.date.getTime() - a.date.getTime());
  }, [accountIncomes, accountExpenses, filter]);

  const handleEdit = async (data: BankAccountSchema) => {
    if (!user || !account) return;
    try {
      const { currencyCode: _dropped, ...rest } = data;
      await editAccount(user.uid, accountId, rest as Partial<BankAccountFormData>, account);
      toast("Account updated!", "success");
      setEditOpen(false);
    } catch (e: unknown) {
      toast((e as Error).message ?? "Failed to update", "error");
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
            <button
              onClick={() => setEditOpen(true)}
              className="ml-auto p-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground"
            >
              <Edit2 className="w-4 h-4" />
            </button>
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

      {/* Quick actions */}
      <div className="flex items-center gap-3">
        <Link
          href={`/income?account=${accountId}`}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 text-sm font-medium hover:bg-emerald-100 transition-colors"
        >
          <Plus className="w-4 h-4" /> Add Income
        </Link>
        <Link
          href={`/expenses?account=${accountId}`}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-50 text-red-700 border border-red-200 text-sm font-medium hover:bg-red-100 transition-colors"
        >
          <Plus className="w-4 h-4" /> Add Expense
        </Link>
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

      {/* Edit Drawer */}
      <FormDrawer
        isOpen={editOpen}
        onClose={() => setEditOpen(false)}
        title="Edit Account"
        description="Currency cannot be changed after creation."
      >
        <AccountForm
          defaultValues={{
            name:           account.name,
            bankName:       account.bankName,
            accountType:    account.accountType,
            lastFourDigits: account.lastFourDigits,
            currencyCode:   account.currencyCode,
            color:          account.color,
            icon:           account.icon,
            isActive:       account.isActive,
            isDefault:      account.isDefault,
            notes:          account.notes,
          }}
          currencyLocked
          onSubmit={handleEdit}
          onCancel={() => setEditOpen(false)}
          submitLabel="Save Changes"
        />
      </FormDrawer>
    </div>
  );
}
