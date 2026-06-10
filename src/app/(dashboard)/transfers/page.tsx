import { Metadata } from "next";
import { TransfersPageClient } from "./transfers-client";
export const metadata: Metadata = { title: "Transfers" };
export default function TransfersPage() { return <TransfersPageClient />; }
