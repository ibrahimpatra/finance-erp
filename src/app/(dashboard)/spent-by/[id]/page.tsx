"use client";
import { use, useMemo, useState, useEffect } from "react";
import { useSpentByStore } from "@/stores/spent-by.store";
import { useExpenseStore } from "@/stores/expense.store";
import { useIncomeStore } from "@/stores/income.store";
import { useExpenseTypeStore } from "@/stores/expense-type.store";
import { useTagStore } from "@/stores/tag.store";
import { useCurrencyStore } from "@/stores/currency.store";
import { useSettingsStore } from "@/stores/settings.store";
import { useCurrency } from "@/hooks/use-currency";
import { formatDate } from "@/lib/utils/date";
import { getInitials } from "@/lib/utils/helpers";
import Link from "next/link";
import { ArrowLeft, Receipt, TrendingUp, BarChart2, Trophy, Tag } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { EmptyState } from "@/components/shared/empty-state";

export default function SpentByProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id }           = use(params);
  const { spentBys }     = useSpentByStore();
  const { expenses }     = useExpenseStore();
  const { incomes }      = useIncomeStore();
  const { expenseTypes } = useExpenseTypeStore();
  const { tags }         = useTagStore();
  const { currencies }   = useCurrencyStore();
  const { settings }     = useSettingsStore();
  const { formatFor }    = useCurrency();

  const defaultCode = settings?.currencyCode ?? "KWD";
  const [activeCurrency, setActiveCurrency] = useState(defaultCode);

  /* Collect all currencies used by this person's expenses */
  const usedCodes = useMemo(() => {
    const person = spentBys.find((s) => s.id === id);
    if (!person) return [defaultCode];
    const codes = Array.from(new Set([
      defaultCode,
      ...expenses.filter((e) => e.spentById === id).map((e) => e.currencyCode || defaultCode),
      ...currencies.map((c) => c.code),
    ]));
    return codes;
  }, [id, expenses, currencies, defaultCode, spentBys]);

  /* Sync to default on first mount */
  useEffect(() => { setActiveCurrency(defaultCode); }, [defaultCode]);

  const fmt = (n: number) => formatFor(n, activeCurrency);

  const person = spentBys.find((s) => s.id === id);

  /* Filter expenses by this person AND selected currency */
  const personExpenses = useMemo(() =>
    expenses.filter((e) =>
      e.spentById === id &&
      (e.currencyCode || defaultCode) === activeCurrency
    ),
  [expenses, id, activeCurrency, defaultCode]);

  const totalSpent  = useMemo(() => personExpenses.reduce((a, e) => a + e.amount, 0), [personExpenses]);
  const avgExpense  = personExpenses.length ? totalSpent / personExpenses.length : 0;
  const largestTx   = personExpenses.reduce((a, e) => Math.max(a, e.amount), 0);

  const categoryBreakdown = useMemo(() => {
    const map = new Map<string, number>();
    for (const e of personExpenses) map.set(e.expenseTypeId, (map.get(e.expenseTypeId) ?? 0) + e.amount);
    return Array.from(map.entries()).map(([typeId, amount]) => {
      const cat = expenseTypes.find((t) => t.id === typeId);
      return { name: cat?.name ?? "Unknown", value: amount, color: cat?.color ?? "#6b7280", icon: cat?.icon ?? "" };
    }).sort((a, b) => b.value - a.value);
  }, [personExpenses, expenseTypes]);

  const usedIncomes = useMemo(() => {
    const ids = [...new Set(personExpenses.map((e) => e.incomeSourceId))];
    return ids.map((iid) => incomes.find((i) => i.id === iid)).filter(Boolean);
  }, [personExpenses, incomes]);

  const usedTags = useMemo(() => {
    const tagIds = [...new Set(personExpenses.flatMap((e) => e.tagIds))];
    return tagIds.map((tid) => tags.find((t) => t.id === tid)).filter(Boolean);
  }, [personExpenses, tags]);

  if (!person) return (
    <div className="text-center py-16 text-muted-foreground">
      Person not found. <Link href="/spent-by" className="text-primary hover:underline">Go back</Link>
    </div>
  );

  return (
    <div className="space-y-6 animate-fade-in max-w-5xl">
      {/* Header */}
      <div className="flex items-start gap-4 flex-wrap">
        <Link href="/spent-by" className="p-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground mt-1">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div className="flex items-center gap-3 flex-1">
          <div className="w-14 h-14 rounded-full flex items-center justify-center text-lg font-bold text-white shadow-md"
            style={{ backgroundColor: person.avatarColor ?? "#6b7280" }}>
            {getInitials(person.name)}
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">{person.name}</h1>
            <p className="text-sm text-muted-foreground">
              {person.phone ?? "No phone"} ·{" "}
              {expenses.filter((e) => e.spentById === id).length} total transactions
            </p>
          </div>
        </div>
        {/* Currency selector */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-muted-foreground">Currency:</span>
          {usedCodes.map((code) => (
            <button key={code} onClick={() => setActiveCurrency(code)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                activeCurrency === code
                  ? "bg-primary text-white border-primary shadow-sm shadow-primary/20"
                  : "border-border text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}>{code}</button>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Total Spent",     value: fmt(totalSpent),  icon: TrendingUp, color: "text-red-500 bg-red-50" },
          { label: "Avg per Expense", value: fmt(avgExpense),  icon: BarChart2,  color: "text-blue-500 bg-blue-50" },
          { label: "Largest Expense", value: fmt(largestTx),   icon: Trophy,     color: "text-amber-500 bg-amber-50" },
          { label: "Transactions",    value: personExpenses.length.toString(), icon: Receipt, color: "text-purple-500 bg-purple-50" },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-xl border border-border shadow-card p-4">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center mb-2 ${s.color}`}>
              <s.icon className="w-4 h-4" />
            </div>
            <div className="amount-display text-lg font-bold text-foreground">{s.value}</div>
            <div className="text-xs text-muted-foreground mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      {personExpenses.length === 0 ? (
        <div className="bg-white rounded-xl border border-border shadow-card p-8 text-center">
          <p className="text-muted-foreground">No {activeCurrency} expenses for {person.name} yet.</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {categoryBreakdown.length > 0 && (
              <div className="bg-white rounded-xl border border-border shadow-card p-5">
                <h3 className="font-semibold mb-4">Spending by Category</h3>
                <ResponsiveContainer width="100%" height={180}>
                  <PieChart>
                    <Pie data={categoryBreakdown} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={75} innerRadius={45}>
                      {categoryBreakdown.map((entry, i) => <Cell key={i} fill={entry.color} strokeWidth={0} />)}
                    </Pie>
                    <Tooltip formatter={(v: number) => fmt(v)} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-1.5 mt-2">
                  {categoryBreakdown.slice(0, 5).map((cat) => (
                    <div key={cat.name} className="flex items-center gap-2 text-sm">
                      <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: cat.color }} />
                      <span className="flex-1 text-foreground truncate">{cat.icon} {cat.name}</span>
                      <span className="amount-display font-semibold text-muted-foreground shrink-0">{fmt(cat.value)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-4">
              <div className="bg-white rounded-xl border border-border shadow-card p-5">
                <h3 className="font-semibold mb-3">Income Sources Used</h3>
                {usedIncomes.length === 0
                  ? <p className="text-sm text-muted-foreground">None for {activeCurrency}</p>
                  : <div className="space-y-2">{usedIncomes.map((inc) => inc && (
                      <Link key={inc.id} href={`/income/${inc.id}`}
                        className="flex items-center gap-2 text-sm hover:text-primary transition-colors">
                        <TrendingUp className="w-3.5 h-3.5 text-blue-500 shrink-0" /> {inc.name}
                      </Link>
                    ))}</div>
                }
              </div>

              {usedTags.length > 0 && (
                <div className="bg-white rounded-xl border border-border shadow-card p-5">
                  <h3 className="font-semibold mb-3">Tags Used</h3>
                  <div className="flex flex-wrap gap-2">
                    {usedTags.map((tag) => tag && (
                      <span key={tag.id}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium"
                        style={{ backgroundColor: tag.color + "22", color: tag.color, border: `1px solid ${tag.color}44` }}>
                        <Tag className="w-3 h-3" /> {tag.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Recent activity */}
          <div className="bg-white rounded-xl border border-border shadow-card overflow-hidden">
            <div className="px-5 py-4 border-b border-border">
              <h3 className="font-semibold">Recent Activity <span className="text-sm font-normal text-muted-foreground">({activeCurrency})</span></h3>
            </div>
            <div className="divide-y divide-border">
              {personExpenses.slice(0, 20).map((e) => {
                const cat = expenseTypes.find((t) => t.id === e.expenseTypeId);
                const inc = incomes.find((i) => i.id === e.incomeSourceId);
                return (
                  <Link key={e.id} href={`/expenses/${e.id}`}
                    className="flex items-center gap-3 px-5 py-3.5 hover:bg-muted/40 transition-colors">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center text-base shrink-0"
                      style={{ backgroundColor: (cat?.color ?? "#6b7280") + "22" }}>
                      {cat?.icon ?? "📦"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">{e.reason}</div>
                      <div className="text-xs text-muted-foreground">{inc?.name} · {formatDate(e.createdAt)}</div>
                    </div>
                    <div className="amount-display text-sm font-semibold text-red-500 shrink-0">
                      -{fmt(e.amount)}
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
