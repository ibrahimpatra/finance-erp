"use client";
import { useMemo } from "react";
import { useIncomeStore } from "@/stores/income.store";
import { useExpenseStore } from "@/stores/expense.store";
import { useTransferStore } from "@/stores/transfer.store";

export interface TimelineEvent {
  id: string;
  type: "income" | "expense" | "transfer";
  title: string;
  subtitle: string;
  amount: number;
  date: Date;
  metadata?: Record<string, unknown>;
}

export function useTimeline() {
  const { incomes } = useIncomeStore();
  const { expenses } = useExpenseStore();
  const { transfers } = useTransferStore();

  return useMemo((): TimelineEvent[] => {
    const events: TimelineEvent[] = [];

    for (const i of incomes) {
      events.push({
        id: i.id, type: "income",
        title: `Income: ${i.name}`, subtitle: i.source,
        amount: i.amount, date: i.createdAt.toDate(),
      });
    }
    for (const e of expenses) {
      events.push({
        id: e.id, type: "expense",
        title: e.reason, subtitle: "",
        amount: e.amount, date: e.createdAt.toDate(),
      });
    }
    for (const t of transfers) {
      events.push({
        id: t.id, type: "transfer",
        title: "Transfer", subtitle: t.note ?? "",
        amount: t.amount, date: t.createdAt.toDate(),
      });
    }

    return events.sort((a, b) => b.date.getTime() - a.date.getTime());
  }, [incomes, expenses, transfers]);
}
