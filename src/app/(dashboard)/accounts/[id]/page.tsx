"use client";
import { use } from "react";
import { AccountDetailClient } from "./account-detail-client";

export default function AccountDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return <AccountDetailClient accountId={id} />;
}
