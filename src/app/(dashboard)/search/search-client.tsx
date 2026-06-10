"use client";
import { useState } from "react";
import { useSearch } from "@/hooks/use-search";
import { useIncome } from "@/hooks/use-income";
import { useExpenses } from "@/hooks/use-expenses";
import { useSpentBy } from "@/hooks/use-spent-by";
import { useTags } from "@/hooks/use-tags";
import { useCurrency } from "@/hooks/use-currency";
import { formatRelative } from "@/lib/utils/date";
import Link from "next/link";
import { Search, TrendingUp, Receipt, Users, Tag, ArrowLeftRight } from "lucide-react";
import { SearchResult } from "@/types";

const TYPE_META: Record<string, { icon: typeof Search; color: string; href: string; label: string }> = {
  income: { icon: TrendingUp, color: "text-blue-500 bg-blue-50", href: "/income", label: "Income" },
  expense: { icon: Receipt, color: "text-red-500 bg-red-50", href: "/expenses", label: "Expense" },
  spentBy: { icon: Users, color: "text-purple-500 bg-purple-50", href: "/spent-by", label: "Person" },
  tag: { icon: Tag, color: "text-emerald-500 bg-emerald-50", href: "/tags", label: "Tag" },
  transfer: { icon: ArrowLeftRight, color: "text-amber-500 bg-amber-50", href: "/transfers", label: "Transfer" },
};

export function SearchClient() {
  useIncome(); useExpenses(); useSpentBy(); useTags();
  const [query, setQuery] = useState("");
  const results = useSearch(query);
  const { format } = useCurrency();

  const grouped = results.reduce((acc, r) => {
    if (!acc[r.type]) acc[r.type] = [];
    acc[r.type].push(r);
    return acc;
  }, {} as Record<string, SearchResult[]>);

  return (
    <div className="space-y-5 animate-fade-in max-w-2xl">
      <div>
        <h2 className="text-2xl font-bold text-foreground tracking-tight">Search</h2>
        <p className="text-muted-foreground text-sm mt-1">Find anything across your financial records</p>
      </div>

      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
        <input autoFocus value={query} onChange={(e) => setQuery(e.target.value)}
          placeholder="Search income, expenses, people, tags…"
          className="w-full pl-12 pr-4 py-3.5 rounded-xl border border-input bg-white text-sm shadow-card focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all" />
      </div>

      {query.length >= 2 && results.length === 0 && (
        <div className="text-center py-12">
          <Search className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">No results for <span className="font-medium text-foreground">"{query}"</span></p>
        </div>
      )}

      {Object.entries(grouped).map(([type, items]) => {
        const meta = TYPE_META[type];
        const Icon = meta?.icon ?? Search;
        return (
          <div key={type} className="bg-white rounded-xl border border-border shadow-card overflow-hidden">
            <div className="flex items-center gap-2 px-5 py-3 border-b border-border">
              <div className={`w-6 h-6 rounded-md flex items-center justify-center ${meta?.color}`}>
                <Icon className="w-3.5 h-3.5" />
              </div>
              <span className="text-sm font-semibold text-foreground">{meta?.label ?? type}</span>
              <span className="text-xs text-muted-foreground ml-auto">{items.length} result{items.length !== 1 ? "s" : ""}</span>
            </div>
            <div className="divide-y divide-border">
              {items.map((r) => (
                <Link key={r.id} href={`${meta.href}/${r.id}`}
                  className="flex items-center gap-3 px-5 py-3.5 hover:bg-muted/40 transition-colors">
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-foreground truncate">{r.title}</div>
                    {r.subtitle && <div className="text-xs text-muted-foreground truncate mt-0.5">{r.subtitle}</div>}
                    {r.date && <div className="text-xs text-muted-foreground/70">{formatRelative(r.date)}</div>}
                  </div>
                  {r.amount !== undefined && (
                    <div className="amount-display text-sm font-semibold text-foreground shrink-0">{format(r.amount)}</div>
                  )}
                </Link>
              ))}
            </div>
          </div>
        );
      })}

      {!query && (
        <div className="text-center py-16 space-y-3">
          <Search className="w-12 h-12 text-muted-foreground/30 mx-auto" />
          <p className="text-sm text-muted-foreground">Type at least 2 characters to search</p>
          <div className="flex flex-wrap justify-center gap-2 pt-2">
            {["salary", "groceries", "ahmed", "food"].map((s) => (
              <button key={s} onClick={() => setQuery(s)} className="text-xs px-3 py-1.5 bg-muted hover:bg-muted/80 rounded-full text-muted-foreground transition-colors">
                {s}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
