"use client";
import Link from "next/link";
import { BankAccountWithBalance, ACCOUNT_TYPES } from "@/types";
import { useCurrency } from "@/hooks/use-currency";
import { Edit2, Trash2, ArrowRight } from "lucide-react";

interface AccountCardProps {
  account:  BankAccountWithBalance;
  onEdit:   () => void;
  onDelete: () => void;
}

export function AccountCard({ account, onEdit, onDelete }: AccountCardProps) {
  const { formatFor } = useCurrency();

  const typeInfo = ACCOUNT_TYPES.find((t) => t.value === account.accountType);
  const icon     = account.icon || typeInfo?.icon || "🏦";
  const bal      = account.balance;
  const isNeg    = bal < 0;

  return (
    <div className="group relative bg-white rounded-2xl border border-border shadow-card hover:shadow-card-hover transition-all overflow-hidden">
      {/* Top color strip */}
      <div className="h-1.5 w-full" style={{ backgroundColor: account.color }} />

      <div className="p-5">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0"
              style={{ backgroundColor: `${account.color}20` }}
            >
              {icon}
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-foreground text-sm truncate">{account.name}</p>
              <p className="text-xs text-muted-foreground truncate">
                {account.bankName ? `${account.bankName}` : (typeInfo?.label ?? "Account")}
                {account.lastFourDigits ? ` ••${account.lastFourDigits}` : ""}
              </p>
            </div>
          </div>
          <span className="shrink-0 text-[11px] font-bold px-2 py-0.5 rounded-full border"
            style={{ borderColor: account.color, color: account.color, backgroundColor: `${account.color}15` }}>
            {account.currencyCode}
          </span>
        </div>

        {/* Balance */}
        <div className="mt-4">
          <p className="text-xs text-muted-foreground mb-0.5">Balance</p>
          <p className={`amount-display text-2xl font-bold ${isNeg ? "text-red-600" : "text-foreground"}`}>
            {formatFor(bal, account.currencyCode)}
          </p>
        </div>

        {/* Income vs Expenses */}
        <div className="flex gap-4 mt-3 text-xs text-muted-foreground">
          <div>
            <span className="font-medium text-emerald-600">+{formatFor(account.totalIncome, account.currencyCode)}</span>
            <span className="ml-1">income</span>
          </div>
          <div>
            <span className="font-medium text-red-500">−{formatFor(account.totalExpenses, account.currencyCode)}</span>
            <span className="ml-1">spent</span>
          </div>
        </div>

        {/* Attribution bar */}
        <div className="mt-4">
          <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
            <span>{account.incomeCount} income entr{account.incomeCount === 1 ? "y" : "ies"}</span>
            <span>{Math.round(account.attributionRate)}% attributed</span>
          </div>
          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all"
              style={{
                width:           `${account.attributionRate}%`,
                backgroundColor: account.color,
              }}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
          <div className="flex items-center gap-2">
            <button
              onClick={onEdit}
              className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              title="Edit account"
            >
              <Edit2 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={onDelete}
              className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
              title="Delete account"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
          <Link
            href={`/accounts/${account.id}`}
            className="flex items-center gap-1.5 text-xs font-medium text-primary hover:text-primary/80 transition-colors"
          >
            View details <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
