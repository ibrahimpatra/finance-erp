"use client";
import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Lock, Eye, EyeOff, AlertCircle, Loader2 } from "lucide-react";
import { DEVHUB_PASSWORD, DEVHUB_STORAGE_KEY, PUBLIC_SLUGS } from "./docs-config";

interface DocsPasswordGateProps {
  slug: string;
  children: React.ReactNode;
}

function hashSimple(str: string): string {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (Math.imul(31, h) + str.charCodeAt(i)) | 0;
  }
  return Math.abs(h).toString(36);
}

const STORED_HASH = hashSimple(DEVHUB_PASSWORD);

export function DocsPasswordGate({ slug, children }: DocsPasswordGateProps) {
  const [authenticated, setAuthenticated] = useState<boolean | null>(null); // null = checking
  const [password, setPassword]           = useState("");
  const [showPw, setShowPw]               = useState(false);
  const [error, setError]                 = useState("");
  const [checking, setChecking]           = useState(false);

  // Public slugs need no auth check at all
  const isPublic = PUBLIC_SLUGS.has(slug);

  useEffect(() => {
    if (isPublic) {
      setAuthenticated(true);
      return;
    }
    try {
      const stored = localStorage.getItem(DEVHUB_STORAGE_KEY);
      setAuthenticated(stored === STORED_HASH);
    } catch {
      setAuthenticated(false);
    }
  }, [isPublic]);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      setChecking(true);
      // Small delay so the button doesn't flash instantly
      setTimeout(() => {
        if (password === DEVHUB_PASSWORD) {
          try {
            localStorage.setItem(DEVHUB_STORAGE_KEY, STORED_HASH);
          } catch {
            // Private browsing — auth will reset on next visit, that's fine
          }
          setAuthenticated(true);
        } else {
          setError("Incorrect password. Ask a dev team member.");
          setPassword("");
        }
        setChecking(false);
      }, 300);
    },
    [password]
  );

  // Still checking localStorage on mount
  if (authenticated === null) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
      </div>
    );
  }

  if (!authenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
        <div className="w-full max-w-sm">
          {/* Card */}
          <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-lg">
            {/* Header */}
            <div className="border-b border-gray-100 bg-gray-50 px-6 py-5">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gray-900">
                  <Lock className="h-4 w-4 text-white" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900">Developer Docs</p>
                  <p className="text-xs text-gray-500">Finance ERP — Internal</p>
                </div>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
              <p className="text-sm text-gray-600 leading-relaxed">
                This area is restricted to the development team.
                Enter the developer password to continue.
              </p>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-gray-600">
                  Password
                </label>
                <div className="relative">
                  <input
                    autoFocus
                    type={showPw ? "text" : "password"}
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); setError(""); }}
                    placeholder="Enter developer password…"
                    className="w-full rounded-lg border border-gray-300 bg-white px-3.5 py-2.5 pr-10 text-sm
                               focus:border-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900/10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw((s) => !s)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPw
                      ? <EyeOff className="h-4 w-4" />
                      : <Eye className="h-4 w-4" />
                    }
                  </button>
                </div>
              </div>

              {error && (
                <div className="flex items-center gap-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={!password || checking}
                className="w-full rounded-lg bg-gray-900 py-2.5 text-sm font-semibold text-white
                           hover:bg-gray-700 disabled:opacity-40 transition-colors
                           flex items-center justify-center gap-2"
              >
                {checking && <Loader2 className="h-4 w-4 animate-spin" />}
                {checking ? "Verifying…" : "Access Docs"}
              </button>
            </form>
          </div>

          {/* Public link */}
          <p className="mt-4 text-center text-xs text-gray-400">
            Looking for the{" "}
            <Link href="/devhub/user-guide" className="text-gray-600 underline hover:text-gray-900">
              User Guide
            </Link>
            ? That&apos;s publicly accessible.
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
