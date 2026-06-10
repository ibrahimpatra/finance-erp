"use client";
import { useMemo } from "react";
import { useIncomeStore } from "@/stores/income.store";
import { useExpenseStore } from "@/stores/expense.store";
import { useSpentByStore } from "@/stores/spent-by.store";
import { useTagStore } from "@/stores/tag.store";
import { useTransferStore } from "@/stores/transfer.store";
import { SearchResult } from "@/types";

export function useSearch(query: string): SearchResult[] {
  const { incomes } = useIncomeStore();
  const { expenses } = useExpenseStore();
  const { spentBys } = useSpentByStore();
  const { tags } = useTagStore();
  const { transfers } = useTransferStore();

  return useMemo(() => {
    if (!query.trim() || query.length < 2) return [];
    const q = query.toLowerCase();
    const results: SearchResult[] = [];

    for (const i of incomes) {
      if (i.name.toLowerCase().includes(q) || i.source.toLowerCase().includes(q) || i.notes?.toLowerCase().includes(q)) {
        results.push({ type: "income", id: i.id, title: i.name, subtitle: i.source, amount: i.amount, date: i.createdAt });
      }
    }
    for (const e of expenses) {
      if (e.reason.toLowerCase().includes(q) || e.notes?.toLowerCase().includes(q)) {
        results.push({ type: "expense", id: e.id, title: e.reason, subtitle: e.notes, amount: e.amount, date: e.createdAt });
      }
    }
    for (const s of spentBys) {
      if (s.name.toLowerCase().includes(q) || s.notes?.toLowerCase().includes(q)) {
        results.push({ type: "spentBy", id: s.id, title: s.name, subtitle: s.phone });
      }
    }
    for (const t of tags) {
      if (t.name.toLowerCase().includes(q) || t.description?.toLowerCase().includes(q)) {
        results.push({ type: "tag", id: t.id, title: t.name, subtitle: t.description });
      }
    }
    return results.slice(0, 20);
  }, [query, incomes, expenses, spentBys, tags, transfers]);
}
