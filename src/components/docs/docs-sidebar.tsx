"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { DOCS, PUBLIC_SLUGS } from "./docs-config";
import { Globe, Lock, BookOpen, LogOut } from "lucide-react";

function clearAuth() {
  try { localStorage.removeItem("devhub_access_v1"); } catch { /* ok */ }
  window.location.reload();
}

export function DocsSidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex h-screen w-64 shrink-0 flex-col border-r border-gray-200 bg-white">
      {/* Logo / title */}
      <div className="flex items-center gap-2.5 border-b border-gray-100 px-5 py-4">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-900">
          <BookOpen className="h-4 w-4 text-white" />
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-gray-900">Developer Docs</p>
          <p className="text-[11px] text-gray-400">Finance ERP</p>
        </div>
      </div>

      {/* Nav links */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
        {DOCS.map((doc) => {
          const href      = `/devhub/${doc.slug === "index" ? "" : doc.slug}`.replace(/\/$/, "") || "/devhub";
          const isActive  = pathname === href || (doc.slug === "index" && pathname === "/devhub");
          const isPublic  = PUBLIC_SLUGS.has(doc.slug);

          return (
            <Link
              key={doc.slug}
              href={href}
              className={`flex items-center gap-3 rounded-lg px-3 py-2 transition-colors group ${
                isActive
                  ? "bg-gray-900 text-white"
                  : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
              }`}
            >
              <span className="shrink-0 text-base leading-none">{doc.icon}</span>
              <span className="flex-1 truncate text-sm font-medium">{doc.title}</span>
              {isPublic ? (
                <Globe className={`h-3 w-3 shrink-0 ${isActive ? "text-white/60" : "text-gray-400"}`} />
              ) : (
                <Lock className={`h-3 w-3 shrink-0 ${isActive ? "text-white/40" : "text-gray-300"}`} />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="border-t border-gray-100 px-5 py-3 space-y-2">
        <p className="text-[11px] text-gray-400 leading-relaxed">
          Edit any <code className="bg-gray-100 px-1 rounded text-[10px]">.md</code> file
          in <code className="bg-gray-100 px-1 rounded text-[10px]">/docs</code> — changes
          show instantly on next deploy.
        </p>
        <button
          onClick={clearAuth}
          className="flex items-center gap-1.5 text-[11px] text-gray-400 hover:text-red-500 transition-colors"
        >
          <LogOut className="h-3 w-3" /> Lock docs
        </button>
      </div>
    </aside>
  );
}
