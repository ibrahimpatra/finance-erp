"use client";
import { useAnalytics } from "@/hooks/use-analytics";
import { useUIStore }   from "@/stores/ui.store";
import { cn }           from "@/lib/utils/helpers";
import { BarChart2 }    from "lucide-react";

/**
 * Renders a row of currency tabs **only** when the global filter is set to "All"
 * AND there are at least 2 currencies with expense data.
 *
 * Tapping a tab calls setDashboardCurrencyFilter(code) which updates
 * useAnalytics.activeCurrency → all charts re-render for that currency.
 *
 * When there is only one currency, or when a single currency is selected
 * globally, this renders nothing (no layout shift for single-currency users).
 */
export function ChartCurrencySelector() {
  const { isAllMode, availableChartCurrencies, activeCurrency } = useAnalytics();
  const { setDashboardCurrencyFilter } = useUIStore();

  // Render nothing in single-currency mode or when only one currency exists
  if (!isAllMode || availableChartCurrencies.length <= 1) return null;

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground mr-1">
        <BarChart2 className="w-3.5 h-3.5" />
        <span>Charts showing:</span>
      </div>
      {availableChartCurrencies.map((code) => (
        <button
          key={code}
          type="button"
          onClick={() => setDashboardCurrencyFilter(code)}
          className={cn(
            "px-2.5 py-1 rounded-lg text-xs font-bold border transition-all",
            activeCurrency === code
              ? "bg-primary text-white border-primary shadow-sm"
              : "border-border text-muted-foreground hover:bg-muted hover:text-foreground"
          )}
        >
          {code}
        </button>
      ))}
    </div>
  );
}
