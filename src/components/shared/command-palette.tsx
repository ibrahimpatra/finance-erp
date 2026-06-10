"use client";
import { useEffect, useState } from "react";
import { useUIStore } from "@/stores/ui.store";
import { useSearch } from "@/hooks/use-search";
import { useRouter } from "next/navigation";
import { Search, TrendingUp, Receipt, Users, Tag, ArrowLeftRight, X } from "lucide-react";
import { SearchResult } from "@/types";
import { useCurrency } from "@/hooks/use-currency";

const TYPE_ICONS = {
  income: TrendingUp,
  expense: Receipt,
  spentBy: Users,
  tag: Tag,
  transfer: ArrowLeftRight,
};
const TYPE_COLORS = {
  income: "text-blue-500 bg-blue-50",
  expense: "text-red-500 bg-red-50",
  spentBy: "text-purple-500 bg-purple-50",
  tag: "text-emerald-500 bg-emerald-50",
  transfer: "text-amber-500 bg-amber-50",
};
const TYPE_HREF = {
  income: "/income",
  expense: "/expenses",
  spentBy: "/spent-by",
  tag: "/tags",
  transfer: "/transfers",
};

export function CommandPalette() {
  const { commandOpen, toggleCommand } = useUIStore();
  const [query, setQuery] = useState("");
  const results = useSearch(query);
  const router = useRouter();
  const { format } = useCurrency();

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") { e.preventDefault(); toggleCommand(); }
      if (e.key === "Escape" && commandOpen) toggleCommand();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [commandOpen, toggleCommand]);

  if (!commandOpen) return null;

  const handleSelect = (r: SearchResult) => {
    router.push(`${TYPE_HREF[r.type]}/${r.id}`);
    toggleCommand();
    setQuery("");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-24 px-4">
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={toggleCommand} />
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-border overflow-hidden animate-fade-in">
        <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
          <Search className="w-4 h-4 text-muted-foreground shrink-0" />
          <input
            autoFocus value={query} onChange={(e) => setQuery(e.target.value)}
            placeholder="Search income, expenses, people, tags…"
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
          {query && <button onClick={() => setQuery("")} className="text-muted-foreground hover:text-foreground"><X className="w-4 h-4" /></button>}
          <kbd className="text-xs bg-muted border border-border rounded px-1.5 py-0.5 text-muted-foreground">Esc</kbd>
        </div>
        {results.length > 0 ? (
          <ul className="max-h-80 overflow-y-auto py-2">
            {results.map((r) => {
              const Icon = TYPE_ICONS[r.type];
              const color = TYPE_COLORS[r.type];
              return (
                <li key={`${r.type}-${r.id}`}>
                  <button onClick={() => handleSelect(r)}
                    className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-muted/60 transition-colors text-left">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${color}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-foreground truncate">{r.title}</div>
                      {r.subtitle && <div className="text-xs text-muted-foreground truncate">{r.subtitle}</div>}
                    </div>
                    {r.amount !== undefined && (
                      <div className="text-sm font-semibold amount-display text-foreground shrink-0">{format(r.amount)}</div>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        ) : query.length >= 2 ? (
          <div className="py-10 text-center text-sm text-muted-foreground">No results for "{query}"</div>
        ) : (
          <div className="py-8 text-center text-sm text-muted-foreground">Start typing to search…</div>
        )}
      </div>
    </div>
  );
}
