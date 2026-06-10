import { format, formatDistance, startOfMonth, endOfMonth, subMonths } from "date-fns";
import { Timestamp } from "firebase/firestore";

export function toDate(ts: Timestamp | Date | undefined): Date {
  if (!ts) return new Date();
  if (ts instanceof Date) return ts;
  return (ts as Timestamp).toDate();
}

export function formatDate(ts: Timestamp | Date | undefined, pattern = "MMM d, yyyy"): string {
  return format(toDate(ts), pattern);
}

export function formatRelative(ts: Timestamp | Date | undefined): string {
  return formatDistance(toDate(ts), new Date(), { addSuffix: true });
}

export function formatDateTime(ts: Timestamp | Date | undefined): string {
  return format(toDate(ts), "MMM d, yyyy · h:mm a");
}

export function getMonthRange(monthsAgo = 0): { start: Date; end: Date } {
  const date = subMonths(new Date(), monthsAgo);
  return { start: startOfMonth(date), end: endOfMonth(date) };
}

export function getMonthLabel(date: Date): string {
  return format(date, "MMM yyyy");
}

export function getLast12Months(): Array<{ start: Date; end: Date; label: string }> {
  return Array.from({ length: 12 }, (_, i) => {
    const { start, end } = getMonthRange(11 - i);
    return { start, end, label: getMonthLabel(start) };
  });
}
