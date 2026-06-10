"use client";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { registerUser } from "@/lib/firebase/auth";
import { Eye, EyeOff, UserPlus, Loader2 } from "lucide-react";

const schema = z.object({
  displayName: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirm: z.string(),
}).refine((d) => d.password === d.confirm, { message: "Passwords don't match", path: ["confirm"] });
type FormData = z.infer<typeof schema>;

export function RegisterForm() {
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    setError("");
    try {
      await registerUser(data.email, data.password, data.displayName);
      router.replace("/dashboard");
    } catch (e: unknown) {
      const msg = (e as { code?: string })?.code;
      if (msg === "auth/email-already-in-use") setError("Email already in use.");
      else setError("Registration failed. Please try again.");
    }
  };

  const inputClass = "w-full px-3.5 py-2.5 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all";

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold text-foreground">Create account</h2>
        <p className="text-sm text-muted-foreground mt-1">Start tracking your money today</p>
      </div>
      {error && <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">{error}</div>}
      <div className="space-y-1">
        <label className="text-sm font-medium text-foreground">Full name</label>
        <input {...register("displayName")} placeholder="Ahmed Al-Rashid" className={inputClass} />
        {errors.displayName && <p className="text-xs text-destructive">{errors.displayName.message}</p>}
      </div>
      <div className="space-y-1">
        <label className="text-sm font-medium text-foreground">Email</label>
        <input {...register("email")} type="email" placeholder="you@example.com" className={inputClass} />
        {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
      </div>
      <div className="space-y-1">
        <label className="text-sm font-medium text-foreground">Password</label>
        <div className="relative">
          <input {...register("password")} type={showPass ? "text" : "password"} placeholder="••••••••" className={`${inputClass} pr-10`} />
          <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
            {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
        {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
      </div>
      <div className="space-y-1">
        <label className="text-sm font-medium text-foreground">Confirm password</label>
        <input {...register("confirm")} type="password" placeholder="••••••••" className={inputClass} />
        {errors.confirm && <p className="text-xs text-destructive">{errors.confirm.message}</p>}
      </div>
      <button type="submit" disabled={isSubmitting}
        className="w-full flex items-center justify-center gap-2 bg-primary text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-primary/90 disabled:opacity-60 transition-all shadow-sm shadow-primary/25 mt-2">
        {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
        {isSubmitting ? "Creating account…" : "Create account"}
      </button>
      <p className="text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link href="/login" className="text-primary font-medium hover:underline">Sign in</Link>
      </p>
    </form>
  );
}
