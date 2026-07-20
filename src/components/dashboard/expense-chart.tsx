"use client";
import { useAnalytics }           from "@/hooks/use-analytics";
import { useCurrency }            from "@/hooks/use-currency";
import { ChartCurrencySelector }  from "@/components/shared/chart-currency-selector";
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from "recharts";

// ── Shared tooltip ────────────────────────────────────────────────
// Accepts formatFn so every chart can pass formatFor(n, activeCurrency)
// instead of the global format() which always uses the base currency.
const Tip = ({
  active, payload, formatFn,
}: {
  active?:  boolean;
  payload?: Array<{ name: string; value: number; color?: string }>;
  formatFn: (n: number) => string;
}) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-border rounded-lg shadow-md px-2.5 py-1.5 text-xs">
      <div className="font-medium text-foreground">{payload[0].name}</div>
      <div className="font-semibold amount-display" style={{ color: payload[0].color }}>
        {formatFn(payload[0].value)}
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────
export function ExpensePieChart() {
  const { categoryBreakdown, activeCurrency, isAllMode } = useAnalytics();
  const { formatFor } = useCurrency();
  // Always format with activeCurrency — never with the global base currency
  const fmt = (n: number) => formatFor(n, activeCurrency);

  if (!categoryBreakdown.length) return null;

  return (
    <div className="bg-white rounded-lg border border-border p-3.5">
      <div className="flex items-center justify-between mb-2.5 gap-2 flex-wrap">
        <p className="text-xs font-semibold text-foreground">By Category</p>
        <ChartCurrencySelector />
      </div>
      <ResponsiveContainer width="100%" height={170}>
        <PieChart>
          <Pie
            data={categoryBreakdown}
            dataKey="amount"
            nameKey="categoryName"
            cx="50%" cy="46%"
            outerRadius={62} innerRadius={38}
          >
            {categoryBreakdown.map((e, i) => (
              <Cell key={i} fill={e.color} strokeWidth={0} />
            ))}
          </Pie>
          <Tooltip
            content={({ active, payload }) =>
              <Tip
                active={active}
                formatFn={fmt}
                payload={payload?.map((p) => ({
                  name:  p.name as string,
                  value: p.value as number,
                  color: (p.payload as { color: string })?.color,
                }))}
              />
            }
          />
          <Legend
            iconType="circle"
            iconSize={7}
            formatter={(v) => <span className="text-[10px] text-muted-foreground">{v}</span>}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
export function MonthlyTrendChart() {
  const { monthlyTrend, activeCurrency, isAllMode } = useAnalytics();
  const { formatFor } = useCurrency();
  const fmt = (n: number) => formatFor(n, activeCurrency);

  return (
    <div className="bg-white rounded-lg border border-border p-3.5">
      <div className="flex items-center justify-between mb-2.5 gap-2 flex-wrap">
        <p className="text-xs font-semibold text-foreground">Monthly Trend</p>
        <ChartCurrencySelector />
      </div>
      <ResponsiveContainer width="100%" height={170}>
        <BarChart
          data={monthlyTrend}
          barGap={1}
          barCategoryGap="35%"
          margin={{ top: 2, right: 4, left: 0, bottom: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
          <XAxis
            dataKey="month"
            tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }}
            tickLine={false}
            axisLine={false}
            tickFormatter={fmt}
            width={60}
          />
          <Tooltip
            content={({ active, payload, label }) => {
              if (!active || !payload?.length) return null;
              return (
                <div className="bg-white border border-border rounded-lg shadow-md px-2.5 py-1.5 space-y-1 text-xs">
                  <div className="font-medium text-foreground">{label}</div>
                  {payload.map((p) => (
                    <div key={p.dataKey as string} className="flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
                      <span className="text-muted-foreground capitalize">{p.dataKey as string}:</span>
                      {/* ← was format(p.value) — used base currency regardless of selection */}
                      <span className="font-semibold amount-display">{fmt(p.value as number)}</span>
                    </div>
                  ))}
                </div>
              );
            }}
          />
          <Bar dataKey="income"   fill="#3b82f6" radius={[3, 3, 0, 0]} name="Income" />
          <Bar dataKey="expenses" fill="#ef4444" radius={[3, 3, 0, 0]} name="Expenses" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
export function SpendingByPersonChart() {
  const { spendingByPerson, activeCurrency, isAllMode } = useAnalytics();
  const { formatFor } = useCurrency();
  const fmt = (n: number) => formatFor(n, activeCurrency);

  if (!spendingByPerson.length) return null;
  const top6 = spendingByPerson.slice(0, 6);

  return (
    <div className="bg-white rounded-lg border border-border p-3.5">
      <div className="flex items-center justify-between mb-2.5 gap-2 flex-wrap">
        <p className="text-xs font-semibold text-foreground">By Person</p>
        <ChartCurrencySelector />
      </div>
      <ResponsiveContainer width="100%" height={170}>
        <BarChart
          data={top6}
          layout="vertical"
          barCategoryGap="28%"
          margin={{ top: 0, right: 8, left: 0, bottom: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
          <XAxis
            type="number"
            tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }}
            tickLine={false}
            axisLine={false}
            tickFormatter={fmt}
          />
          <YAxis
            type="category"
            dataKey="name"
            tick={{ fontSize: 10, fill: "hsl(var(--foreground))" }}
            tickLine={false}
            axisLine={false}
            width={65}
          />
          <Tooltip
            content={({ active, payload }) =>
              <Tip
                active={active}
                formatFn={fmt}
                payload={payload?.map((p) => ({
                  name:  p.name as string,
                  value: p.value as number,
                  color: "#3b82f6",
                }))}
              />
            }
          />
          <Bar dataKey="amount" radius={[0, 3, 3, 0]}>
            {top6.map((entry, i) => (
              <Cell key={i} fill={entry.color ?? "#3b82f6"} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
