import { Metadata } from "next";
import { SpentByPageClient } from "./spent-by-client";
export const metadata: Metadata = { title: "Spent By" };
export default function SpentByPage() { return <SpentByPageClient />; }
