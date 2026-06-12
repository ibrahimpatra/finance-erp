"use client";
import { useState } from "react";
import { useIncome } from "@/hooks/use-income";
import { useAuthStore } from "@/stores/auth.store";
import { useSettingsStore } from "@/stores/settings.store";
import { useCurrency } from "@/hooks/use-currency";
import { useCurrencies } from "@/hooks/use-currencies";
import { IncomeCard } from "@/components/income/income-card";
import { IncomeForm } from "@/components/income/income-form";
import { FormDrawer } from "@/components/shared/form-drawer";
import { EmptyState } from "@/components/shared/empty-state";
import { useToast } from "@/components/ui/toaster";
import { TrendingUp, Plus, Wallet, ArrowUpRight } from "lucide-react";
import { IncomeSchema } from "@/lib/validations/income";

export function IncomePageClient() {
  const { user }    = useAuthStore();
  const { incomes, loading, addIncome } = useIncome();
  const { settings } = useSettingsStore();
  const { formatFor } = useCurrency();
  useCurrencies();

  const { toast } = useToast();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const defaultCode = settings?.currencyCode ?? "KWD";

  // Group incomes by currency
  const byCurrency = incomes.reduce<Record<string, typeof incomes>>((acc, i) => {
    const c = i.currencyCode || defaultCode;
    (acc[c] = acc[c] || []).push(i);
    return acc;
  }, {});

  const handleAdd = async (data: IncomeSchema) => {
    if (!user) return;
    await addIncome(user.uid, data);
    toast("Income source added!", "success");
    setDrawerOpen(false);
  };

  const totalByCurrency = Object.entries(byCurrency).map(([code, list]) => ({
    code,
    total:   list.reduce((s, i) => s + i.amount,   0),
    balance: list.reduce((s, i) => s + i.balance,   0),
    count:   list.length,
  }));

  return (
    <div className="space-y-6 animate-fade-in">
      {/* ── Header ────────────────────────────────── */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">Income Sources</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {incomes.length} source{incomes.length !== 1 ? "s" : ""} · across {Object.keys(byCurrency).length} {Object.keys(byCurrency).length === 1 ? "currency" : "currencies"}
          </p>
        </div>
        <button onClick={() => setDrawerOpen(true)}
          className="flex items-center gap-2 bg-primary text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-primary/90 active:scale-95 transition-all shadow-sm shadow-primary/30">
          <Plus className="w-4 h-4" /> Add Income
        </button>
      </div>

      {/* ── Currency summary pills ─────────────────── */}
      {totalByCurrency.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {totalByCurrency.map(({ code, balance, total, count }) => (
            <div key={code}
              className="flex items-center gap-2.5 bg-white border border-border rounded-xl px-4 py-2.5 shadow-sm">
              <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
                <Wallet className="w-4 h-4 text-blue-500" />
              </div>
              <div>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-base font-bold text-foreground amount-display">{formatFor(balance, code)}</span>
                  <span className="text-xs font-semibold text-muted-foreground">{code}</span>
                </div>
                <div className="text-[11px] text-muted-foreground">
                  of {formatFor(total, code)} · {count} source{count !== 1 ? "s" : ""}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Cards ──────────────────────────────────── */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1,2,3].map(i => (
            <div key={i} className="h-40 rounded-xl bg-muted animate-pulse" />
          ))}
        </div>
      ) : incomes.length === 0 ? (
        <EmptyState
          icon={TrendingUp}
          title="No income sources yet"
          description="Add your first income source — salary, freelance, business income, or anything else."
          action={
            <button onClick={() => setDrawerOpen(true)}
              className="flex items-center gap-2 bg-primary text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-primary/90 transition-all">
              <Plus className="w-4 h-4" /> Add first income
            </button>
          }
        />
      ) : (
        /* Group by currency if multiple */
        Object.keys(byCurrency).length > 1
          ? Object.entries(byCurrency).map(([code, list]) => (
              <div key={code} className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="h-px flex-1 bg-border" />
                  <span className="text-xs font-bold text-muted-foreground px-2">{code}</span>
                  <div className="h-px flex-1 bg-border" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {list.map((income) => <IncomeCard key={income.id} income={income} />)}
                </div>
              </div>
            ))
          : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {incomes.map((income) => <IncomeCard key={income.id} income={income} />)}
            </div>
          )
      )}

      {/* ── Form Drawer ────────────────────────────── */}
      <FormDrawer
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title="New Income Source"
        description="Track a new income — salary, freelance, gift, or any source."
      >
        <IncomeForm
          onSubmit={handleAdd}
          onCancel={() => setDrawerOpen(false)}
          submitLabel="Add Income Source"
        />
      </FormDrawer>
    </div>
  );
}
