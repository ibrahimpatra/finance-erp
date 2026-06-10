"use client";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Link from "next/link";
import { resetPassword } from "@/lib/firebase/auth";
import { Mail, Loader2, CheckCircle2 } from "lucide-react";

const schema = z.object({ email: z.string().email("Invalid email") });
type FormData = z.infer<typeof schema>;

export function ResetForm() {
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    try {
      await resetPassword(data.email);
      setSent(true);
    } catch {
      setError("Failed to send reset email. Check the address and try again.");
    }
  };

  if (sent) return (
    <div className="text-center space-y-3">
      <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto" />
      <h2 className="text-lg font-semibold">Check your inbox</h2>
      <p className="text-sm text-muted-foreground">A reset link has been sent. Check your email.</p>
      <Link href="/login" className="text-primary text-sm font-medium hover:underline">Back to sign in</Link>
    </div>
  );

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <div>
        <h2 className="text-xl font-semibold">Reset password</h2>
        <p className="text-sm text-muted-foreground mt-1">Enter your email to receive a reset link</p>
      </div>
      {error && <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">{error}</div>}
      <div className="space-y-1">
        <label className="text-sm font-medium">Email</label>
        <input {...register("email")} type="email" placeholder="you@example.com"
          className="w-full px-3.5 py-2.5 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all" />
        {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
      </div>
      <button type="submit" disabled={isSubmitting}
        className="w-full flex items-center justify-center gap-2 bg-primary text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-primary/90 disabled:opacity-60 transition-all">
        {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
        {isSubmitting ? "Sending…" : "Send reset link"}
      </button>
      <p className="text-center text-sm text-muted-foreground">
        <Link href="/login" className="text-primary font-medium hover:underline">Back to sign in</Link>
      </p>
    </form>
  );
}
