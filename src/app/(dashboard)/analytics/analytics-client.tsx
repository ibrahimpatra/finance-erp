"use client";
import { useEffect }           from "react";
import { useAnalytics }        from "@/hooks/use-analytics";
import { useIncome }           from "@/hooks/use-income";
import { useExpenses }         from "@/hooks/use-expenses";
import { useSpentBy }          from "@/hooks/use-spent-by";
import { useTags }             from "@/hooks/use-tags";
import { useExpenseTypes }     from "@/hooks/use-expense-types";
import { useCurrencies }       from "@/hooks/use-currencies";
import { useCurrency }         from "@/hooks/use-currency";
import { usePerCurrencyData }  from "@/hooks/use-per-currency-data";
import { useUIStore }          from "@/stores/ui.store";
import { useSettingsStore }    from "@/stores/settings.store";
import { GlobalCurrencyFilter }    from "@/components/shared/global-currency-filter";
import { ChartCurrencySelector }   from "@/components/shared/chart-currency-selector";
import { MultiCurrencyAmount }     from "@/components/shared/multi-currency-amount";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend, PieChart, Pie, Cell,
} from "recharts";
import { TrendingUp, TrendingDown, Wallet, Tag } from "lucide-react";
import { getInitials } from "@/lib/utils/helpers";

export function AnalyticsClient() {
  useIncome(); useExpenses(); useSpentBy(); useTags(); useExpenseTypes(); useCurrencies();

  const { settings }  = useSettingsStore();
  const defaultCode   = settings?.currencyCode ?? "KWD";
  const { globalCurrency, setGlobalCurrency, setDashboardCurrencyFilter } = useUIStore();

  // ── Init default currency on first load ──────────────────────────
  useEffect(() => {
    if (!globalCurrency) {
      setGlobalCurrency(defaultCode);
    }
  }, [defaultCode]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Keep chart filter in sync with global selector ───────────────
  // FIX: when "all" is selected UIStore.setGlobalCurrency already resets
  // dashboardCurrencyFilter to "" (fixed in ui.store.ts). This effect
  // handles the case where defaultCode changes (e.g., settings update).
  useEffect(() => {
    if (globalCurrency && globalCurrency !== "all") {
      // Single currency mode — keep chart filter in sync
      setDashboardCurrencyFilter(globalCurrency);
    } else if (!globalCurrency) {
      // Not yet initialised — seed with base
      setDashboardCurrencyFilter(defaultCode);
    }
    // "all" mode: setGlobalCurrency already cleared dashboardCurrencyFilter,
    // ChartCurrencySelector lets the user switch per-chart currency.
  }, [globalCurrency, defaultCode]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Data ─────────────────────────────────────────────────────────
  const {
    totalIncome, totalExpenses, totalBalance,
    categoryBreakdown, spendingByPerson, monthlyTrend, tagAnalytics,
    activeCurrency,   // ← single source of truth for "what currency are charts showing"
    isAllMode,
  } = useAnalytics();

  const { formatFor }  = useCurrency();
  const { rows: perCurrencyRows, isMulti } = usePerCurrencyData();

  // fmt uses activeCurrency from the hook — never the stale local variable.
  // This is the fix for wrong currency labels in tooltips.
  const fmt = (n: number) => formatFor(n, activeCurrency);

  // ── Custom tooltip (reused across charts) ────────────────────────
  const CustomTooltip = ({
    active, payload, label,
  }: {
    active?:  boolean;
    payload?: Array<{ name: string; value: number; color?: string }>;
    label?:   string;
  }) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="bg-white border border-border rounded-xl shadow-card px-3 py-2 text-sm space-y-1">
        {label && <div className="font-medium text-foreground mb-1.5">{label}</div>}
        {payload.map((p, i) => (
          <div key={i} className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: p.color }} />
            <span className="text-muted-foreground">{p.name}:</span>
            <span className="font-semibold amount-display">{fmt(p.value)}</span>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6 animate-fade-in">

      {/* ── Header ───────────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">Analytics</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {isMulti
              ? `All currencies · charts showing ${activeCurrency}`
              : `Viewing ${activeCurrency}`}
          </p>
        </div>
        <GlobalCurrencyFilter />
      </div>

      {/* ── Summary cards ────────────────────────────────────────── */}
      {isMulti ? (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {([
            { label: "Total Income",   key: "totalIncome"   as const, icon: TrendingUp,   color: "bg-blue-500" },
            { label: "Total Expenses", key: "totalExpenses" as const, icon: TrendingDown, color: "bg-red-500" },
            { label: "Net Balance",    key: "totalBalance"  as const, icon: Wallet,       color: "bg-emerald-500" },
          ] as const).map((card) => (
            <div key={card.label} className="bg-white rounded-xl border border-border shadow-card p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className={`w-9 h-9 ${card.color} rounded-lg flex items-center justify-center`}>
                  <card.icon className="w-4 h-4 text-white" />
                </div>
                <span className="text-sm font-medium text-muted-foreground">{card.label}</span>
              </div>
              <div className="space-y-1.5 max-h-36 overflow-y-auto scrollbar-thin">
                {perCurrencyRows.map((row) => {
                  const val      = row[card.key];
                  const textColor =
                    card.key === "totalBalance"
                      ? (val >= 0 ? "text-emerald-600" : "text-red-600")
                      : card.key === "totalExpenses" ? "text-red-600" : "text-foreground";
                  return (
                    <div key={row.code} className="flex items-center justify-between">
                      <span className="text-[10px] font-bold bg-muted text-muted-foreground px-1.5 py-0.5 rounded shrink-0">
                        {row.code}
                      </span>
                      <span className={`amount-display text-sm font-bold ${textColor}`}>
                        {card.key === "totalExpenses" ? "−" : ""}{formatFor(Math.abs(val), row.code)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { label: "Total Income",   value: totalIncome,   icon: TrendingUp,   color: "bg-blue-500",     textColor: "text-foreground" },
            { label: "Total Expenses", value: totalExpenses, icon: TrendingDown, color: "bg-red-500",      textColor: "text-red-600" },
            { label: "Net Balance",    value: totalBalance,  icon: Wallet,
              color: totalBalance >= 0 ? "bg-emerald-500" : "bg-red-500",
              textColor: totalBalance >= 0 ? "text-emerald-600" : "text-red-600" },
          ].map((card) => (
            <div key={card.label} className="bg-white rounded-xl border border-border shadow-card p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className={`w-9 h-9 ${card.color} rounded-lg flex items-center justify-center`}>
                  <card.icon className="w-4 h-4 text-white" />
                </div>
                <span className="text-sm font-medium text-muted-foreground">{card.label}</span>
              </div>
              <div className={`amount-display text-2xl font-bold ${card.textColor}`}>{fmt(card.value)}</div>
              <div className="text-xs text-muted-foreground mt-1 font-medium">{activeCurrency}</div>
            </div>
          ))}
        </div>
      )}

      {/* ── Chart currency selector (only visible in "All" mode) ──── */}
      {isAllMode && (
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <p className="text-xs text-muted-foreground">
            Charts below display one currency at a time
          </p>
          <ChartCurrencySelector />
        </div>
      )}

      {/* ── Monthly trend ────────────────────────────────────────── */}
      <div className="bg-white rounded-xl border border-border shadow-card p-5">
        <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
          <h3 className="font-semibold text-foreground">Income vs Expenses (12 months)</h3>
          {isAllMode && (
            <span className="text-xs text-muted-foreground">
              Showing <span className="font-semibold text-foreground">{activeCurrency}</span>
            </span>
          )}
        </div>
        <ResponsiveContainer width="100%" height={260}>
          <AreaChart data={monthlyTrend}>
            <defs>
              <linearGradient id="incomeGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="#3b82f6" stopOpacity={0.15} />
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="expGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="#ef4444" stopOpacity={0.15} />
                <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
            <XAxis dataKey="month" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} tickLine={false} axisLine={false} />
            <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} tickLine={false} axisLine={false}
              tickFormatter={fmt} width={72} />
            <Tooltip content={<CustomTooltip />} />
            <Legend iconType="circle" iconSize={8}
              formatter={(v) => <span className="text-xs text-muted-foreground capitalize">{v}</span>} />
            <Area type="monotone" dataKey="income"   stroke="#3b82f6" strokeWidth={2} fill="url(#incomeGrad)" name="Income" />
            <Area type="monotone" dataKey="expenses" stroke="#ef4444" strokeWidth={2} fill="url(#expGrad)"    name="Expenses" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* ── Category + Person breakdown ───────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

        <div className="bg-white rounded-xl border border-border shadow-card p-5">
          <div className="flex items-center justify-between gap-2 mb-4 flex-wrap">
            <h3 className="font-semibold text-foreground">Spending by Category</h3>
            {isAllMode && <span className="text-xs text-muted-foreground font-medium">{activeCurrency}</span>}
          </div>
          {categoryBreakdown.length === 0
            ? <p className="text-sm text-muted-foreground py-8 text-center">No expense data for {activeCurrency}</p>
            : (
              <div className="space-y-3">
                {categoryBreakdown.map((cat) => (
                  <div key={cat.categoryId} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium text-foreground">{cat.categoryName}</span>
                      <div className="flex items-center gap-3">
                        <span className="text-muted-foreground">{cat.count} txns</span>
                        <span className="amount-display font-semibold" style={{ color: cat.color }}>
                          {fmt(cat.amount)}
                        </span>
                      </div>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-500"
                        style={{ width: `${cat.percentage}%`, backgroundColor: cat.color }} />
                    </div>
                    <div className="text-xs text-right text-muted-foreground">{cat.percentage.toFixed(1)}%</div>
                  </div>
                ))}
              </div>
            )}
        </div>

        <div className="bg-white rounded-xl border border-border shadow-card p-5">
          <div className="flex items-center justify-between gap-2 mb-4 flex-wrap">
            <h3 className="font-semibold text-foreground">Spending by Person</h3>
            {isAllMode && <span className="text-xs text-muted-foreground font-medium">{activeCurrency}</span>}
          </div>
          {spendingByPerson.length === 0
            ? <p className="text-sm text-muted-foreground py-8 text-center">No data for {activeCurrency}</p>
            : (
              <div className="space-y-3">
                {spendingByPerson.slice(0, 8).map((person) => {
                  const max = spendingByPerson[0]?.amount ?? 1;
                  return (
                    <div key={person.id} className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
                        style={{ backgroundColor: person.color }}>
                        {getInitials(person.name)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between text-sm mb-1">
                          <span className="font-medium text-foreground truncate">{person.name}</span>
                          <span className="amount-display font-semibold text-foreground ml-2 shrink-0">
                            {fmt(person.amount)}
                          </span>
                        </div>
                        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                          <div className="h-full rounded-full transition-all duration-500"
                            style={{ width: `${(person.amount / max) * 100}%`, backgroundColor: person.color }} />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
        </div>
      </div>

      {/* ── Category pie ─────────────────────────────────────────── */}
      {categoryBreakdown.length > 0 && (
        <div className="bg-white rounded-xl border border-border shadow-card p-5">
          <div className="flex items-center justify-between gap-2 mb-4 flex-wrap">
            <h3 className="font-semibold text-foreground">Category Distribution</h3>
            {isAllMode && <span className="text-xs text-muted-foreground font-medium">{activeCurrency}</span>}
          </div>
          <div className="flex flex-col md:flex-row items-center gap-6">
            <ResponsiveContainer width="100%" height={200} className="max-w-[220px] shrink-0">
              <PieChart>
                <Pie
                  data={categoryBreakdown}
                  dataKey="amount"
                  nameKey="categoryName"
                  cx="50%" cy="50%"
                  outerRadius={90} innerRadius={55}
                >
                  {categoryBreakdown.map((e, i) => <Cell key={i} fill={e.color} strokeWidth={0} />)}
                </Pie>
                {/* fmt uses activeCurrency — correct label in all modes */}
                <Tooltip formatter={(v: number) => fmt(v)} />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex-1 space-y-2 w-full">
              {categoryBreakdown.map((cat) => (
                <div key={cat.categoryId} className="flex items-center gap-2 text-sm">
                  <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: cat.color }} />
                  <span className="flex-1 text-foreground truncate">{cat.categoryName}</span>
                  <span className="amount-display font-semibold text-muted-foreground shrink-0">{fmt(cat.amount)}</span>
                  <span className="text-xs text-muted-foreground w-10 text-right shrink-0">{cat.percentage.toFixed(0)}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Tag analytics ────────────────────────────────────────── */}
      {tagAnalytics.length > 0 && (
        <div className="bg-white rounded-xl border border-border shadow-card p-5">
          <div className="flex items-center justify-between gap-2 mb-4 flex-wrap">
            <h3 className="font-semibold text-foreground">Tag Usage</h3>
            {isAllMode && <span className="text-xs text-muted-foreground font-medium">{activeCurrency}</span>}
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {tagAnalytics.map((tag) => (
              <div key={tag.tagId} className="p-3 rounded-xl border border-border hover:shadow-sm transition-all">
                <span
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium mb-2"
                  style={{ backgroundColor: tag.color + "22", color: tag.color, border: `1px solid ${tag.color}44` }}
                >
                  <Tag className="w-3 h-3" /> {tag.tagName}
                </span>
                <div className="text-xs text-muted-foreground space-y-0.5">
                  <div>{tag.incomeCount} income · {tag.expenseCount} expenses</div>
                  <div className="amount-display font-semibold text-foreground">{fmt(tag.totalAmount)}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
