import { Metadata } from "next";
import { ExpensesPageClient } from "./expenses-client";
export const metadata: Metadata = { title: "Expenses" };
export default function ExpensesPage() { return <ExpensesPageClient />; }
