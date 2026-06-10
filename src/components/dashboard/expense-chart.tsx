"use client";
import { useAnalytics } from "@/hooks/use-analytics";
import { useCurrency } from "@/hooks/use-currency";
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from "recharts";

const CustomTooltip = ({ active, payload, format }: { active?: boolean; payload?: Array<{ name: string; value: number; color?: string }>; format: (n: number) => string }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-border rounded-xl shadow-card-hover px-3 py-2 text-sm">
      <div className="font-medium text-foreground">{payload[0].name}</div>
      <div className="amount-display font-semibold" style={{ color: payload[0].color }}>{format(payload[0].value)}</div>
    </div>
  );
};

export function ExpensePieChart() {
  const { categoryBreakdown } = useAnalytics();
  const { format } = useCurrency();
  if (!categoryBreakdown.length) return null;
  return (
    <div className="bg-white rounded-xl border border-border shadow-card p-5">
      <h3 className="font-semibold text-foreground mb-4">Expenses by Category</h3>
      <ResponsiveContainer width="100%" height={220}>
        <PieChart>
          <Pie data={categoryBreakdown} dataKey="amount" nameKey="categoryName" cx="50%" cy="50%" outerRadius={80} innerRadius={50}>
            {categoryBreakdown.map((entry, i) => (
              <Cell key={i} fill={entry.color} strokeWidth={0} />
            ))}
          </Pie>
          <Tooltip content={({ active, payload }) => <CustomTooltip active={active} payload={payload?.map(p => ({ name: p.name as string, value: p.value as number, color: p.payload?.color }))} format={format} />} />
          <Legend iconType="circle" iconSize={8} formatter={(v) => <span className="text-xs text-muted-foreground">{v}</span>} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

export function MonthlyTrendChart() {
  const { monthlyTrend } = useAnalytics();
  const { format } = useCurrency();
  return (
    <div className="bg-white rounded-xl border border-border shadow-card p-5">
      <h3 className="font-semibold text-foreground mb-4">Monthly Trend (12 months)</h3>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={monthlyTrend} barGap={2} barCategoryGap="30%">
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
          <XAxis dataKey="month" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} tickLine={false} axisLine={false} />
          <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} tickLine={false} axisLine={false} tickFormatter={(v) => format(v)} width={72} />
          <Tooltip content={({ active, payload, label }) => {
            if (!active || !payload?.length) return null;
            return (
              <div className="bg-white border border-border rounded-xl shadow-card-hover px-3 py-2 space-y-1 text-sm">
                <div className="font-medium text-foreground">{label}</div>
                {payload.map((p) => (
                  <div key={p.dataKey as string} className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
                    <span className="text-muted-foreground capitalize">{p.dataKey as string}:</span>
                    <span className="font-semibold amount-display">{format(p.value as number)}</span>
                  </div>
                ))}
              </div>
            );
          }} />
          <Bar dataKey="income" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Income" />
          <Bar dataKey="expenses" fill="#ef4444" radius={[4, 4, 0, 0]} name="Expenses" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function SpendingByPersonChart() {
  const { spendingByPerson } = useAnalytics();
  const { format } = useCurrency();
  if (!spendingByPerson.length) return null;
  const top5 = spendingByPerson.slice(0, 6);
  return (
    <div className="bg-white rounded-xl border border-border shadow-card p-5">
      <h3 className="font-semibold text-foreground mb-4">Spending by Person</h3>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={top5} layout="vertical" barCategoryGap="25%">
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
          <XAxis type="number" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} tickLine={false} axisLine={false} tickFormatter={(v) => format(v)} />
          <YAxis type="category" dataKey="name" tick={{ fontSize: 12, fill: "hsl(var(--foreground))" }} tickLine={false} axisLine={false} width={80} />
          <Tooltip content={({ active, payload }) => <CustomTooltip active={active} payload={payload?.map(p => ({ name: p.name as string, value: p.value as number, color: "#3b82f6" }))} format={format} />} />
          <Bar dataKey="amount" radius={[0, 4, 4, 0]}>
            {top5.map((entry, i) => <Cell key={i} fill={entry.color ?? "#3b82f6"} />)}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
