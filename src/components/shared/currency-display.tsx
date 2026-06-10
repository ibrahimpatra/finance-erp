"use client";
import { useCurrency } from "@/hooks/use-currency";
import { cn } from "@/lib/utils/helpers";

interface CurrencyDisplayProps {
  amount: number;
  className?: string;
  compact?: boolean;
  colored?: boolean;
}

export function CurrencyDisplay({ amount, className, compact = false, colored = false }: CurrencyDisplayProps) {
  const { format, compact: formatCompact } = useCurrency();
  const formatted = compact ? formatCompact(amount) : format(amount);

  return (
    <span className={cn(
      "amount-display",
      colored && amount > 0 ? "text-emerald-600" : colored ? "text-red-500" : "",
      className
    )}>
      {formatted}
    </span>
  );
}
