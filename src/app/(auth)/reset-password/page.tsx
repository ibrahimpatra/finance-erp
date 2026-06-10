import { Metadata } from "next";
import { ResetForm } from "@/components/auth/reset-form";

export const metadata: Metadata = { title: "Reset Password" };

export default function ResetPasswordPage() {
  return <ResetForm />;
}
