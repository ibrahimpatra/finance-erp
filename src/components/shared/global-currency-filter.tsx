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
  const { settings, fetched }   = useSettingsStore();
  const { currencies } = useCurrencyStore();
  const { incomes }    = useIncomeStore();
  const { expenses }   = useExpenseStore();
  const { globalCurrency, setGlobalCurrency } = useUIStore();

  // FIX: don't render at all until settings are fetched. Previously this used
  // settings?.currencyCode ?? "KWD" — during the loading window (settings=null),
  // that "KWD" got added to the chip list as if KWD were the user's real base
  // currency. Once settings loaded with e.g. "USD", the filter had ["KWD","USD"]
  // and the active selection was the stale KWD. Now we wait for fetched=true.
  const defaultCode = settings?.currencyCode ?? "";

  const allCodes = useMemo(() => {
    if (!fetched || !defaultCode) return [];
    const set = new Set<string>();
    set.add(defaultCode);
    currencies.forEach((c) => set.add(c.code));
    incomes.forEach((i) => { if (i.currencyCode) set.add(i.currencyCode); });
    expenses.forEach((e) => { if (e.currencyCode) set.add(e.currencyCode); });
    return Array.from(set).sort();
  }, [fetched, defaultCode, currencies, incomes, expenses]);

  // Don't render: settings not loaded yet, or only one currency in use
  if (!fetched || allCodes.length <= 1) return null;

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
  const { settings, fetched } = useSettingsStore();
  const defaultCode = settings?.currencyCode ?? "";

  // "All" when:
  //  - user explicitly clicked All
  //  - settings not loaded yet (don't hide anything during load)
  //  - settings loaded but no currency configured yet (new user pre-banner)
  const isAll = globalCurrency === "all" || !fetched || !defaultCode;

  const resolvedCode = (globalCurrency && globalCurrency !== "all")
    ? globalCurrency
    : defaultCode;

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

