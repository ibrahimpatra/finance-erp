"use client";
import { useMemo }           from "react";
import { useUIStore }        from "@/stores/ui.store";
import { useSettingsStore }  from "@/stores/settings.store";
import { useCurrencyStore }  from "@/stores/currency.store";
import { useIncomeStore }    from "@/stores/income.store";
import { useExpenseStore }   from "@/stores/expense.store";
import { cn }                from "@/lib/utils/helpers";

interface GlobalCurrencyFilterProps {
  label?:     string;
  className?: string;
}

export function GlobalCurrencyFilter({ label = "Currency:", className }: GlobalCurrencyFilterProps) {
  const { settings }   = useSettingsStore();
  const { currencies } = useCurrencyStore();
  const { incomes }    = useIncomeStore();
  const { expenses }   = useExpenseStore();
  const { globalCurrency, setGlobalCurrency } = useUIStore();

  const defaultCode = settings?.currencyCode ?? "KWD";

  /**
   * FIX (point 12): Previously only used configuredCodes (settings + currencies store).
   * Users who had expenses/incomes in currencies they never explicitly configured
   * would see the filter hidden (length <= 1) and their transactions invisible in "All" mode.
   *
   * Now: allCodes = union of configured codes + codes actually present in data.
   * This ensures the filter appears and shows all relevant currencies regardless of
   * whether the user has gone to Settings → Currencies to add them explicitly.
   */
  const allCodes = useMemo(() => {
    const set = new Set<string>();
    set.add(defaultCode);
    currencies.forEach((c) => set.add(c.code));
    // Scan actual transaction data for additional currencies
    incomes.forEach((i) => { if (i.currencyCode) set.add(i.currencyCode); });
    expenses.forEach((e) => { if (e.currencyCode) set.add(e.currencyCode); });
    return Array.from(set).sort();
  }, [defaultCode, currencies, incomes, expenses]);

  // Only render when there are multiple currencies (configured or in data)
  if (allCodes.length <= 1) return null;

  const isAll      = globalCurrency === "all";
  const activeCode = isAll ? null : (globalCurrency || defaultCode);

  return (
    <div className={cn("flex items-center gap-2 flex-wrap", className)}>
      {label && (
        <span className="text-xs text-muted-foreground shrink-0">{label}</span>
      )}

      {/* All chip */}
      <button
        onClick={() => setGlobalCurrency("all")}
        className={cn(
          "px-3 py-1.5 rounded-full text-xs font-semibold border transition-all",
          isAll
            ? "bg-primary text-white border-primary shadow-sm shadow-primary/20"
            : "border-border text-muted-foreground hover:bg-muted hover:text-foreground"
        )}
      >
        All
      </button>

      {/* One chip per code — configured OR present in data */}
      {allCodes.map((code) => (
        <button
          key={code}
          onClick={() => setGlobalCurrency(code)}
          className={cn(
            "px-3 py-1.5 rounded-full text-xs font-semibold border transition-all",
            activeCode === code
              ? "bg-primary text-white border-primary shadow-sm shadow-primary/20"
              : "border-border text-muted-foreground hover:bg-muted hover:text-foreground"
          )}
        >
          {code}
        </button>
      ))}
    </div>
  );
}

/**
 * Hook — returns whether a given currency code passes the current global filter.
 * "" or missing → treated as base currency.
 * "all"         → everything passes.
 * specific code → only matching transactions pass.
 */
export function useCurrencyFilter() {
  const { globalCurrency } = useUIStore();
  const { settings }       = useSettingsStore();
  const defaultCode        = settings?.currencyCode ?? "KWD";

  const resolvedCode = (globalCurrency && globalCurrency !== "all")
    ? globalCurrency
    : defaultCode;

  const isAll = globalCurrency === "all";

  const matches = (code?: string | null) => {
    if (isAll) return true;
    return (code || defaultCode) === resolvedCode;
  };

  return {
    matches,
    isAll,
    activeCode: isAll ? null : resolvedCode,
  };
}

interface GlobalCurrencyFilterProps {
  label?: string;
  className?: string;
}

