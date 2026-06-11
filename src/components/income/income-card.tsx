"use client";
import Link from "next/link";
import { IncomeWithBalance } from "@/types";
import { useCurrency } from "@/hooks/use-currency";
import { useSettingsStore } from "@/stores/settings.store";
import { useTags } from "@/hooks/use-tags";
import { TrendingUp, ArrowRight } from "lucide-react";

interface IncomeCardProps { income: IncomeWithBalance; }

export function IncomeCard({ income }: IncomeCardProps) {
  const { formatFor } = useCurrency();
  const { settings } = useSettingsStore();
  const defaultCode   = settings?.currencyCode ?? "KWD";
  const { tags }      = useTags();
  const cur           = income.currencyCode || defaultCode;
  const incomeTags    = tags.filter((t) => income.tagIds.includes(t.id));

  const statusColor = income.percentageUsed >= 90 ? "text-red-500"
    : income.percentageUsed >= 70 ? "text-amber-500" : "text-emerald-500";
  const barColor = income.percentageUsed >= 90 ? "bg-red-500"
    : income.percentageUsed >= 70 ? "bg-amber-500" : undefined;

  return (
    <Link href={`/income/${income.id}`}
      className="stat-card group hover:shadow-card-hover cursor-pointer block transition-all duration-200">
      <div className="flex items-start justify-between mb-4">
        <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
          <TrendingUp className="w-5 h-5 text-blue-500" />
        </div>
        <div className="flex items-center gap-1.5">
          {/* Show currency badge when not default */}
          {cur !== defaultCode && (
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
              {cur}
            </span>
          )}
          <span className="text-xs font-medium px-2 py-1 rounded-full bg-muted text-muted-foreground">
            {income.source}
          </span>
        </div>
      </div>
      <div className="mb-1">
        <h3 className="font-semibold text-foreground text-base truncate">{income.name}</h3>
      </div>
      {/* Use formatFor so the symbol matches the income's actual currency */}
      <div className="amount-display text-2xl font-bold text-foreground mb-1">{formatFor(income.balance, cur)}</div>
      <div className="text-xs text-muted-foreground mb-3">of {formatFor(income.amount, cur)} total</div>
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">Used: {formatFor(income.totalDebits, cur)}</span>
          <span className={`font-semibold ${statusColor}`}>{income.percentageUsed}%</span>
        </div>
        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
          {barColor ? (
            <div className={`h-full rounded-full transition-all duration-500 ${barColor}`}
              style={{ width: `${income.percentageUsed}%` }} />
          ) : (
            <div className="progress-gradient h-full" style={{ width: `${income.percentageUsed}%` }} />
          )}
        </div>
      </div>
      {incomeTags.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-3">
          {incomeTags.slice(0, 3).map((tag) => (
            <span key={tag.id} className="badge-tag text-xs"
              style={{ backgroundColor: tag.color + "22", color: tag.color, border: `1px solid ${tag.color}44` }}>
              {tag.name}
            </span>
          ))}
        </div>
      )}
      <div className="flex items-center gap-1 text-xs text-primary mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
        View details <ArrowRight className="w-3 h-3" />
      </div>
    </Link>
  );
}
