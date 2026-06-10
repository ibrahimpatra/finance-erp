"use client";
import { useState, useEffect, createContext, useContext, useCallback, useRef } from "react";
import { CheckCircle2, XCircle, AlertCircle, Info, X } from "lucide-react";
import { cn } from "@/lib/utils/helpers";

type ToastType = "success" | "error" | "warning" | "info";
interface Toast { id: string; message: string; type: ToastType; }
interface ToastContextValue { toast: (msg: string, type?: ToastType) => void; }

const ToastContext = createContext<ToastContextValue>({ toast: () => {} });
export const useToast = () => useContext(ToastContext);

const ICONS = { success: CheckCircle2, error: XCircle, warning: AlertCircle, info: Info };
const COLORS: Record<ToastType, string> = {
  success: "bg-emerald-50 border-emerald-200 text-emerald-800",
  error: "bg-red-50 border-red-200 text-red-800",
  warning: "bg-amber-50 border-amber-200 text-amber-800",
  info: "bg-blue-50 border-blue-200 text-blue-800",
};

function ToastItem({ item, onRemove }: { item: Toast; onRemove: (id: string) => void }) {
  const Icon = ICONS[item.type];
  useEffect(() => {
    const t = setTimeout(() => onRemove(item.id), 4500);
    return () => clearTimeout(t);
  }, [item.id, onRemove]);

  return (
    <div className={cn("flex items-start gap-3 px-4 py-3 rounded-xl border shadow-lg max-w-sm text-sm font-medium animate-fade-in", COLORS[item.type])}>
      <Icon className="w-4 h-4 shrink-0 mt-0.5" />
      <span className="flex-1 leading-snug">{item.message}</span>
      <button onClick={() => onRemove(item.id)} className="opacity-60 hover:opacity-100 transition-opacity shrink-0">
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}

// Global singleton so useToast works without needing to be inside Provider
let _globalToast: ((msg: string, type?: ToastType) => void) | null = null;
export const globalToast = (msg: string, type: ToastType = "info") => _globalToast?.(msg, type);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const remove = useCallback((id: string) => {
    setToasts((t) => t.filter((x) => x.id !== id));
  }, []);

  const toast = useCallback((message: string, type: ToastType = "info") => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    setToasts((t) => [...t.slice(-4), { id, message, type }]); // max 5
  }, []);

  // Register global accessor
  useEffect(() => { _globalToast = toast; return () => { _globalToast = null; }; }, [toast]);

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-2 pointer-events-none">
        {toasts.map((t) => (
          <div key={t.id} className="pointer-events-auto">
            <ToastItem item={t} onRemove={remove} />
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

// Keep Toaster as alias for backwards compat
export { ToastProvider as Toaster };
