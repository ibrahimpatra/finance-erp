"use client";
import { useEffect, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuthStore } from "@/stores/auth.store";
import { logoutUser } from "@/lib/firebase/auth";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard, TrendingUp, Receipt, ArrowLeftRight,
  Users, Tag, BarChart2, Search, Settings, LogOut,
  Clock, X, Wallet,
} from "lucide-react";

const NAV_ITEMS = [
  { href: "/dashboard",  label: "Dashboard",  icon: LayoutDashboard, color: "text-blue-500",   bg: "bg-blue-50"   },
  { href: "/income",     label: "Income",      icon: TrendingUp,       color: "text-emerald-500", bg: "bg-emerald-50" },
  { href: "/expenses",   label: "Expenses",    icon: Receipt,          color: "text-red-500",    bg: "bg-red-50"    },
  { href: "/transfers",  label: "Transfers",   icon: ArrowLeftRight,   color: "text-amber-500",  bg: "bg-amber-50"  },
  { href: "/spent-by",   label: "People",      icon: Users,            color: "text-purple-500", bg: "bg-purple-50" },
  { href: "/tags",       label: "Tags",        icon: Tag,              color: "text-pink-500",   bg: "bg-pink-50"   },
  { href: "/analytics",  label: "Analytics",   icon: BarChart2,        color: "text-indigo-500", bg: "bg-indigo-50" },
  { href: "/timeline",   label: "Timeline",    icon: Clock,            color: "text-cyan-500",   bg: "bg-cyan-50"   },
  { href: "/search",     label: "Search",      icon: Search,           color: "text-slate-500",  bg: "bg-slate-50"  },
];

interface NavPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export function NavPanel({ isOpen, onClose }: NavPanelProps) {
  const router   = useRouter();
  const pathname = usePathname();
  const { user } = useAuthStore();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    const esc = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    setTimeout(() => document.addEventListener("mousedown", handler), 0);
    document.addEventListener("keydown", esc);
    return () => { document.removeEventListener("mousedown", handler); document.removeEventListener("keydown", esc); };
  }, [isOpen, onClose]);

  const go = (href: string) => { router.push(href); onClose(); };

  const initials = user?.displayName
    ? user.displayName.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()
    : user?.email?.[0].toUpperCase() ?? "U";

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/30 backdrop-blur-[2px] z-[48]"
            onClick={onClose}
          />

          {/* Panel — right-side drawer on desktop, full bottom sheet on mobile */}
          <motion.div
            key="panel"
            ref={ref}
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 40 }}
            transition={{ type: "spring", damping: 30, stiffness: 350 }}
            className="fixed top-0 right-0 h-full w-full sm:w-[340px] bg-white z-[49] shadow-2xl flex flex-col"
          >
            {/* User header */}
            <div className="flex items-center gap-3 px-5 py-5 border-b border-border bg-gradient-to-br from-primary/5 to-transparent">
              <div className="w-11 h-11 rounded-xl bg-primary flex items-center justify-center text-white font-bold text-sm shrink-0">
                {initials}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-foreground text-sm truncate">
                  {user?.displayName ?? "Welcome back"}
                </div>
                <div className="text-xs text-muted-foreground truncate">{user?.email}</div>
              </div>
              <button onClick={onClose}
                className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground shrink-0">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Nav grid */}
            <div className="flex-1 overflow-y-auto p-4">
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-3 px-1">
                Navigation
              </p>
              <div className="grid grid-cols-3 gap-2">
                {NAV_ITEMS.map((item) => {
                  const active = pathname.startsWith(item.href);
                  return (
                    <button key={item.href} onClick={() => go(item.href)}
                      className={`flex flex-col items-center gap-2 p-3 rounded-xl transition-all text-center group ${
                        active
                          ? "bg-primary/10 ring-2 ring-primary/30"
                          : "hover:bg-muted/70"
                      }`}>
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${item.bg}`}>
                        <item.icon className={`w-5 h-5 ${item.color}`} />
                      </div>
                      <span className={`text-[11px] font-medium leading-tight ${active ? "text-primary" : "text-foreground/80"}`}>
                        {item.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Footer actions */}
            <div className="border-t border-border p-4 space-y-1">
              <button onClick={() => go("/settings")}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-muted transition-colors text-left">
                <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center">
                  <Settings className="w-4 h-4 text-slate-500" />
                </div>
                <span className="text-sm font-medium text-foreground">Settings</span>
              </button>
              <button onClick={async () => { await logoutUser(); onClose(); router.push("/auth/login"); }}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-red-50 transition-colors text-left">
                <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center">
                  <LogOut className="w-4 h-4 text-red-500" />
                </div>
                <span className="text-sm font-medium text-red-500">Sign out</span>
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
