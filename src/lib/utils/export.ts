import { Expense, ExpenseWithRelations, Income, Transfer } from "@/types";
import { formatDate } from "./date";

export function exportToCSV(data: Record<string, unknown>[], filename: string): void {
  if (!data.length) return;
  const headers = Object.keys(data[0]);
  const rows = data.map((row) =>
    headers.map((h) => {
      const val = row[h];
      const str = val === null || val === undefined ? "" : String(val);
      return str.includes(",") || str.includes('"') ? `"${str.replace(/"/g, '""')}"` : str;
    }).join(",")
  );
  const csv = [headers.join(","), ...rows].join("\n");
  downloadFile(csv, `${filename}.csv`, "text/csv");
}

export function exportToJSON(data: unknown, filename: string): void {
  const json = JSON.stringify(data, null, 2);
  downloadFile(json, `${filename}.json`, "application/json");
}

export function expensesToExportData(expenses: ExpenseWithRelations[]) {
  return expenses.map((e) => ({
    Date: formatDate(e.createdAt),
    Reason: e.reason,
    Amount: e.amount,
    "Income Source": e.income?.name || "",
    "Spent By": e.spentBy?.name || "",
    Category: e.expenseType?.name || "",
    Tags: e.tags?.map((t) => t.name).join(", ") || "",
    Notes: e.notes || "",
  }));
}

export function incomesToExportData(incomes: Income[]) {
  return incomes.map((i) => ({
    Date: formatDate(i.createdAt),
    Name: i.name,
    Source: i.source,
    Amount: i.amount,
    Notes: i.notes || "",
  }));
}

function downloadFile(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
