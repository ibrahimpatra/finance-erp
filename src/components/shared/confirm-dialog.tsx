"use client";
import { AlertTriangle, X, Loader2 } from "lucide-react";

interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title: string;
  description: string;
  confirmLabel?: string;
  variant?: "danger" | "warning";
  loading?: boolean;
}

export function ConfirmDialog({
  open, onClose, onConfirm, title, description,
  confirmLabel = "Confirm", variant = "danger", loading = false,
}: ConfirmDialogProps) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl border border-border p-6 max-w-sm w-full animate-fade-in">
        <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-4 ${variant === "danger" ? "bg-destructive/10" : "bg-amber-50"}`}>
          <AlertTriangle className={`w-6 h-6 ${variant === "danger" ? "text-destructive" : "text-amber-500"}`} />
        </div>
        <h3 className="text-base font-semibold text-foreground mb-2">{title}</h3>
        <p className="text-sm text-muted-foreground mb-6">{description}</p>
        <div className="flex gap-3">
          <button onClick={onClose} disabled={loading}
            className="flex-1 px-4 py-2 rounded-lg border border-border text-sm font-medium text-foreground hover:bg-muted transition-colors disabled:opacity-60">
            Cancel
          </button>
          <button onClick={onConfirm} disabled={loading}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white transition-colors disabled:opacity-60
              ${variant === "danger" ? "bg-destructive hover:bg-destructive/90" : "bg-amber-500 hover:bg-amber-600"}`}>
            {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
