"use client";
import { useAnalytics } from "@/hooks/use-analytics";
import { useIncome } from "@/hooks/use-income";
import { useExpenses } from "@/hooks/use-expenses";
import { useSpentBy } from "@/hooks/use-spent-by";
import { useTags } from "@/hooks/use-tags";
import { useExpenseTypes } from "@/hooks/use-expense-types";
import { useCurrency } from "@/hooks/use-currency";
import { CurrencyDisplay } from "@/components/shared/currency-display";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, Legend, AreaChart, Area,
} from "recharts";
import { TrendingUp, TrendingDown, Wallet, Tag } from "lucide-react";
import { getInitials } from "@/lib/utils/helpers";

export function AnalyticsClient() {
  useIncome(); useExpenses(); useSpentBy(); useTags(); useExpenseTypes();
  const { totalIncome, totalExpenses, totalBalance, categoryBreakdown, spendingByPerson, monthlyTrend, tagAnalytics, topSpender, topCategory } = useAnalytics();
  const { format } = useCurrency();

  const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ name: string; value: number; color?: string }>; label?: string }) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="bg-white border border-border rounded-xl shadow-card px-3 py-2 text-sm space-y-1">
        {label && <div className="font-medium text-foreground mb-1.5">{label}</div>}
        {payload.map((p, i) => (
          <div key={i} className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: p.color }} />
            <span className="text-muted-foreground">{p.name}:</span>
            <span className="font-semibold amount-display">{format(p.value)}</span>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-2xl font-bold text-foreground tracking-tight">Analytics</h2>
        <p className="text-muted-foreground text-sm mt-1">Deep insights into your financial activity</p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: "Total Income", value: totalIncome, icon: TrendingUp, gradient: "gradient-income" },
          { label: "Total Expenses", value: totalExpenses, icon: TrendingDown, gradient: "gradient-expense" },
          { label: "Net Balance", value: totalBalance, icon: Wallet, gradient: "gradient-balance" },
        ].map((card) => (
          <div key={card.label} className={`${card.gradient} rounded-xl p-5 text-white`}>
            <div className="flex items-center gap-2 mb-2 opacity-80">
              <card.icon className="w-4 h-4" />
              <span className="text-sm font-medium">{card.label}</span>
            </div>
            <div className="amount-display text-2xl font-bold">{format(card.value)}</div>
          </div>
        ))}
      </div>

      {/* Monthly Trend */}
      <div className="bg-white rounded-xl border border-border shadow-card p-5">
        <h3 className="font-semibold text-foreground mb-4">Income vs Expenses (12 months)</h3>
        <ResponsiveContainer width="100%" height={260}>
          <AreaChart data={monthlyTrend}>
            <defs>
              <linearGradient id="incomeGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.15} />
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="expGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#ef4444" stopOpacity={0.15} />
                <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
            <XAxis dataKey="month" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} tickLine={false} axisLine={false} />
            <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} tickLine={false} axisLine={false} tickFormatter={(v) => format(v)} width={72} />
            <Tooltip content={<CustomTooltip />} />
            <Legend iconType="circle" iconSize={8} formatter={(v) => <span className="text-xs text-muted-foreground capitalize">{v}</span>} />
            <Area type="monotone" dataKey="income" stroke="#3b82f6" strokeWidth={2} fill="url(#incomeGrad)" name="Income" />
            <Area type="monotone" dataKey="expenses" stroke="#ef4444" strokeWidth={2} fill="url(#expGrad)" name="Expenses" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Breakdown */}
        <div className="bg-white rounded-xl border border-border shadow-card p-5">
          <h3 className="font-semibold text-foreground mb-4">Spending by Category</h3>
          {categoryBreakdown.length === 0 ? <p className="text-sm text-muted-foreground py-8 text-center">No expense data yet</p> : (
            <div className="space-y-3">
              {categoryBreakdown.map((cat) => (
                <div key={cat.categoryId} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium text-foreground">{cat.categoryName}</span>
                    <div className="flex items-center gap-3">
                      <span className="text-muted-foreground">{cat.count} txns</span>
                      <span className="amount-display font-semibold" style={{ color: cat.color }}>{format(cat.amount)}</span>
                    </div>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-500" style={{ width: `${cat.percentage}%`, backgroundColor: cat.color }} />
                  </div>
                  <div className="text-xs text-right text-muted-foreground">{cat.percentage.toFixed(1)}%</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Spending by Person */}
        <div className="bg-white rounded-xl border border-border shadow-card p-5">
          <h3 className="font-semibold text-foreground mb-4">Spending by Person</h3>
          {spendingByPerson.length === 0 ? <p className="text-sm text-muted-foreground py-8 text-center">No data yet</p> : (
            <div className="space-y-3">
              {spendingByPerson.slice(0, 8).map((person) => {
                const maxAmount = spendingByPerson[0]?.amount ?? 1;
                const pct = (person.amount / maxAmount) * 100;
                return (
                  <div key={person.id} className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0" style={{ backgroundColor: person.color }}>
                      {getInitials(person.name)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between text-sm mb-1">
                        <span className="font-medium text-foreground truncate">{person.name}</span>
                        <span className="amount-display font-semibold text-foreground ml-2 shrink-0">{format(person.amount)}</span>
                      </div>
                      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                        <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, backgroundColor: person.color }} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Tag Analytics */}
      {tagAnalytics.length > 0 && (
        <div className="bg-white rounded-xl border border-border shadow-card p-5">
          <h3 className="font-semibold text-foreground mb-4">Tag Usage Analytics</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {tagAnalytics.map((tag) => (
              <div key={tag.tagId} className="p-3 rounded-xl border border-border hover:shadow-sm transition-all">
                <span className="badge-tag mb-2 block w-fit" style={{ backgroundColor: tag.color + "22", color: tag.color, border: `1px solid ${tag.color}44` }}>
                  <Tag className="w-3 h-3" />{tag.tagName}
                </span>
                <div className="text-xs text-muted-foreground space-y-1">
                  <div>{tag.incomeCount} income · {tag.expenseCount} expenses</div>
                  <div className="amount-display font-semibold text-foreground">{format(tag.totalAmount)}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
