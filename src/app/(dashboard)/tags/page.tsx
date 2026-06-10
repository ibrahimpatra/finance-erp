import { Metadata } from "next";
import { TagsPageClient } from "./tags-client";
export const metadata: Metadata = { title: "Tags" };
export default function TagsPage() { return <TagsPageClient />; }
