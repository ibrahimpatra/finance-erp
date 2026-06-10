import { Metadata } from "next";
import { IncomePageClient } from "./income-client";
export const metadata: Metadata = { title: "Income Sources" };
export default function IncomePage() { return <IncomePageClient />; }
