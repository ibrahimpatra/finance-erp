"use client";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { loginUser } from "@/lib/firebase/auth";
import { Eye, EyeOff, LogIn, Loader2 } from "lucide-react";

const schema = z.object({
  email: z.string().email("Invalid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});
type FormData = z.infer<typeof schema>;

export function LoginForm() {
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    setError("");
    try {
      await loginUser(data.email, data.password);
      router.replace("/dashboard");
    } catch (e: unknown) {
      const msg = (e as { code?: string })?.code;
      if (msg === "auth/invalid-credential") setError("Invalid email or password.");
      else if (msg === "auth/too-many-requests") setError("Too many attempts. Try again later.");
      else setError("Login failed. Please try again.");
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <div>
        <h2 className="text-xl font-semibold text-foreground">Welcome back</h2>
        <p className="text-sm text-muted-foreground mt-1">Sign in to your account</p>
      </div>

      {error && (
        <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">{error}</div>
      )}

      <div className="space-y-1">
        <label className="text-sm font-medium text-foreground">Email</label>
        <input
          {...register("email")}
          type="email" placeholder="you@example.com" autoComplete="email"
          className="w-full px-3.5 py-2.5 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
        />
        {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
      </div>

      <div className="space-y-1">
        <label className="text-sm font-medium text-foreground">Password</label>
        <div className="relative">
          <input
            {...register("password")}
            type={showPass ? "text" : "password"} placeholder="••••••••" autoComplete="current-password"
            className="w-full px-3.5 py-2.5 pr-10 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
          />
          <button type="button" onClick={() => setShowPass(!showPass)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
            {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
        {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
      </div>

      <div className="flex items-center justify-end">
        <Link href="/reset-password" className="text-xs text-primary hover:underline">Forgot password?</Link>
      </div>

      <button type="submit" disabled={isSubmitting}
        className="w-full flex items-center justify-center gap-2 bg-primary text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-primary/90 disabled:opacity-60 transition-all shadow-sm shadow-primary/25">
        {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogIn className="w-4 h-4" />}
        {isSubmitting ? "Signing in…" : "Sign in"}
      </button>

      <p className="text-center text-sm text-muted-foreground">
        No account?{" "}
        <Link href="/register" className="text-primary font-medium hover:underline">Create one</Link>
      </p>
    </form>
  );
}
