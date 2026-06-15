"use client";
import { useUIStore } from "@/stores/ui.store";
import { useSettingsStore } from "@/stores/settings.store";
import { useCurrencyStore } from "@/stores/currency.store";
import { cn } from "@/lib/utils/helpers";

interface GlobalCurrencyFilterProps {
  /** Show a label before the chips. Default: "Currency:" */
  label?: string;
  /** Extra className on the wrapper */
  className?: string;
}

export function GlobalCurrencyFilter({ label = "Currency:", className }: GlobalCurrencyFilterProps) {
  const { settings }   = useSettingsStore();
  const { currencies } = useCurrencyStore();
  const { globalCurrencies, toggleGlobalCurrency, clearGlobalCurrencies } = useUIStore();

  const defaultCode = settings?.currencyCode ?? "KWD";

  // Only user-configured currencies: default + extras from currencies store
  const configuredCodes = Array.from(
    new Set([defaultCode, ...currencies.map((c) => c.code)])
  );

  // Single currency → no filter needed
  if (configuredCodes.length <= 1) return null;

  const isAll = globalCurrencies.length === 0;

  return (
    <div className={cn("flex items-center gap-2 flex-wrap", className)}>
      {label && (
        <span className="text-xs text-muted-foreground shrink-0">{label}</span>
      )}

      {/* "All" chip */}
      <button
        onClick={clearGlobalCurrencies}
        className={cn(
          "px-3 py-1.5 rounded-full text-xs font-semibold border transition-all",
          isAll
            ? "bg-primary text-white border-primary shadow-sm shadow-primary/20"
            : "border-border text-muted-foreground hover:bg-muted hover:text-foreground"
        )}
      >
        All
      </button>

      {/* One chip per configured currency */}
      {configuredCodes.map((code) => {
        const active = globalCurrencies.includes(code);
        return (
          <button
            key={code}
            onClick={() => toggleGlobalCurrency(code)}
            className={cn(
              "px-3 py-1.5 rounded-full text-xs font-semibold border transition-all",
              active
                ? "bg-primary text-white border-primary shadow-sm shadow-primary/20"
                : "border-border text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            {code}
          </button>
        );
      })}
    </div>
  );
}

/** Helper — returns true if `currencyCode` passes the current global filter */
export function useCurrencyFilter() {
  const { globalCurrencies } = useUIStore();
  const { settings }         = useSettingsStore();
  const defaultCode = settings?.currencyCode ?? "KWD";

  const matches = (code?: string | null) => {
    const resolved = code || defaultCode;
    if (globalCurrencies.length === 0) return true; // All
    return globalCurrencies.includes(resolved);
  };

  return { matches, active: globalCurrencies, isAll: globalCurrencies.length === 0 };
}
