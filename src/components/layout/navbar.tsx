"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils/helpers";
import { useAuthStore } from "@/stores/auth.store";
import { useUIStore } from "@/stores/ui.store";
import { useCurrency } from "@/hooks/use-currency";
import { logoutUser } from "@/lib/firebase/auth";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard, TrendingUp, Receipt, ArrowLeftRight,
  Users, Tag, BarChart3, Clock, Search, Settings,
  LogOut, Menu, X, ChevronDown, User, Layers,
} from "lucide-react";

const NAV_ITEMS = [
  { label: "Dashboard",  href: "/dashboard",  icon: LayoutDashboard, color: "bg-blue-500" },
  { label: "Income",     href: "/income",      icon: TrendingUp,      color: "bg-emerald-500" },
  { label: "Expenses",   href: "/expenses",    icon: Receipt,         color: "bg-red-500" },
  { label: "Transfers",  href: "/transfers",   icon: ArrowLeftRight,  color: "bg-amber-500" },
  { label: "Spent By",   href: "/spent-by",    icon: Users,           color: "bg-purple-500" },
  { label: "Tags",       href: "/tags",        icon: Tag,             color: "bg-pink-500" },
  { label: "Analytics",  href: "/analytics",   icon: BarChart3,       color: "bg-indigo-500" },
  { label: "Timeline",   href: "/timeline",    icon: Clock,           color: "bg-cyan-500" },
  { label: "Search",     href: "/search",      icon: Search,          color: "bg-slate-500" },
  { label: "Settings",   href: "/settings",    icon: Settings,        color: "bg-gray-500" },
];

const PRIMARY  = NAV_ITEMS.slice(0, 4);

export function Navbar() {
  const pathname = usePathname();
  const router   = useRouter();
  const { user } = useAuthStore();
  const { navMobileOpen, toggleNavMobile, closeNavMobile, toggleCommand } = useUIStore();
  const { symbol, name: curName } = useCurrency();

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + "/");

  const handleLogout = async () => { await logoutUser(); router.replace("/login"); };

  const initials = (user?.displayName || user?.email || "?")
    .split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase();

  return (
    <>
      {/* ── Top bar ──────────────────────────────────────────── */}
      <header className="fixed top-0 left-0 right-0 z-[50] h-[var(--navbar-height)] bg-white/95 backdrop-blur-md border-b border-border flex items-center px-3 sm:px-4 gap-2 shadow-sm">

        {/* Logo */}
        <Link href="/dashboard" onClick={closeNavMobile}
          className="flex items-center gap-2 shrink-0 mr-1">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center shadow-sm shadow-primary/25">
            <Layers className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-[15px] text-foreground hidden sm:block leading-none">
            Finance<span className="text-primary">ERP</span>
          </span>
        </Link>

        {/* Desktop primary nav */}
        <nav className="hidden md:flex items-center gap-0.5 flex-1">
          {PRIMARY.map(({ label, href, icon: Icon }) => (
            <Link key={href} href={href}
              className={cn("nav-item", isActive(href) && "active")}>
              <Icon className="w-4 h-4 shrink-0" />
              {label}
            </Link>
          ))}

          {/* Odoo-style app grid dropdown */}
          <div className="relative group">
            <button className={cn(
              "nav-item select-none cursor-pointer",
              NAV_ITEMS.slice(4).some((n) => isActive(n.href)) && "active"
            )}>
              More
              <ChevronDown className="w-3.5 h-3.5 opacity-60 transition-transform duration-200 group-hover:rotate-180" />
            </button>

            {/* App grid panel */}
            <div className="absolute left-0 top-full mt-1.5 w-72 bg-white rounded-xl border border-border shadow-xl shadow-black/10
                            opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto
                            translate-y-1 group-hover:translate-y-0 transition-all duration-150 z-[55]">
              <div className="p-3 grid grid-cols-3 gap-1">
                {NAV_ITEMS.slice(4).map(({ label, href, icon: Icon, color }) => (
                  <Link key={href} href={href}
                    className={cn(
                      "flex flex-col items-center gap-2 p-3 rounded-xl transition-colors hover:bg-muted/70 group/item",
                      isActive(href) && "bg-primary/5"
                    )}>
                    <div className={`w-10 h-10 ${color} rounded-xl flex items-center justify-center shadow-sm`}>
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                    <span className={cn(
                      "text-xs font-medium text-center leading-tight",
                      isActive(href) ? "text-primary" : "text-muted-foreground group-hover/item:text-foreground"
                    )}>{label}</span>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </nav>

        <div className="flex-1 md:flex-none" />

        {/* Right actions */}
        <div className="flex items-center gap-1.5">
          {/* Currency */}
          <div className="hidden sm:flex items-center gap-1.5 bg-muted/70 rounded-lg px-2.5 py-1.5 text-xs text-muted-foreground">
            <span className="font-bold text-foreground">{symbol}</span>
            <span className="hidden lg:inline">{curName}</span>
          </div>

          {/* Search */}
          <button onClick={toggleCommand}
            className="flex items-center gap-1.5 bg-muted/60 hover:bg-muted rounded-lg px-2.5 py-1.5 text-xs text-muted-foreground transition-colors">
            <Search className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Search</span>
            <kbd className="hidden sm:inline text-[10px] bg-white border border-border rounded px-1 py-0.5">⌘K</kbd>
          </button>

          {/* User avatar dropdown */}
          <div className="relative group">
            <button className="flex items-center gap-1.5 rounded-lg p-1 hover:bg-muted transition-colors">
              <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-xs font-bold text-white shadow-sm">
                {initials}
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-muted-foreground hidden sm:block transition-transform duration-200 group-hover:rotate-180" />
            </button>
            <div className="absolute right-0 top-full mt-1.5 w-52 bg-white rounded-xl border border-border shadow-lg
                            opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto
                            translate-y-1 group-hover:translate-y-0 transition-all duration-150 z-[55]">
              <div className="px-4 py-3 border-b border-border">
                <p className="text-sm font-semibold text-foreground truncate">{user?.displayName || "User"}</p>
                <p className="text-xs text-muted-foreground truncate mt-0.5">{user?.email}</p>
              </div>
              <div className="p-1.5 space-y-0.5">
                <Link href="/settings"
                  className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-muted/70 transition-colors">
                  <Settings className="w-4 h-4" /> Settings
                </Link>
                <Link href="/settings"
                  className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-muted/70 transition-colors">
                  <User className="w-4 h-4" /> Profile
                </Link>
                <div className="border-t border-border my-1" />
                <button onClick={handleLogout}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-destructive hover:bg-red-50 transition-colors">
                  <LogOut className="w-4 h-4" /> Sign out
                </button>
              </div>
            </div>
          </div>

          {/* Mobile hamburger */}
          <button onClick={toggleNavMobile}
            className="md:hidden p-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground">
            {navMobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </header>

      {/* ── Mobile menu ──────────────────────────────────────── */}
      <AnimatePresence>
        {navMobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="fixed inset-0 z-[48] bg-black/40 md:hidden"
              onClick={closeNavMobile}
            />
            <motion.div
              initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="fixed top-[var(--navbar-height)] left-0 right-0 z-[49] bg-white border-b border-border shadow-lg md:hidden overflow-y-auto"
              style={{ maxHeight: "calc(100dvh - var(--navbar-height))" }}
            >
              {/* Odoo-style 3-column app grid on mobile */}
              <div className="p-4 grid grid-cols-3 sm:grid-cols-5 gap-2">
                {NAV_ITEMS.map(({ label, href, icon: Icon, color }) => (
                  <Link key={href} href={href}
                    onClick={closeNavMobile}
                    className={cn(
                      "flex flex-col items-center gap-2 p-3 rounded-xl transition-colors",
                      isActive(href) ? "bg-primary/8 ring-1 ring-primary/20" : "hover:bg-muted/70"
                    )}>
                    <div className={`w-11 h-11 ${color} rounded-xl flex items-center justify-center shadow-sm`}>
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                    <span className={cn(
                      "text-xs font-medium text-center leading-tight",
                      isActive(href) ? "text-primary" : "text-muted-foreground"
                    )}>{label}</span>
                  </Link>
                ))}
              </div>

              {/* User section */}
              <div className="border-t border-border px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center text-sm font-bold text-white">
                    {initials}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">{user?.displayName || "User"}</p>
                    <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                  </div>
                </div>
                <button onClick={handleLogout}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-destructive hover:bg-red-50 transition-colors">
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
