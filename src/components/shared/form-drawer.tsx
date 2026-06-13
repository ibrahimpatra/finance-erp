"use client";
import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { useUIStore } from "@/stores/ui.store";

interface FormDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  width?: string;
}

export function FormDrawer({
  isOpen, onClose, title, description, children, width = "max-w-lg",
}: FormDrawerProps) {
  const { openDrawer, closeDrawer } = useUIStore();

  /* Track open drawers so FAB can hide itself */
  useEffect(() => {
    if (isOpen) { openDrawer(); }
    return () => { if (isOpen) closeDrawer(); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  /* Lock body scroll */
  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  /* Escape key */
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === "Escape" && isOpen) onClose(); };
    document.addEventListener("keydown", h);
    return () => document.removeEventListener("keydown", h);
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-[2px]"
            onClick={onClose}
          />

          {/* ── Mobile: bottom sheet ─────────────────────────── */}
          <motion.div
            initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 32, stiffness: 320 }}
            className="fixed bottom-0 left-0 right-0 z-[61] bg-white rounded-t-2xl shadow-2xl flex flex-col md:hidden"
            style={{ maxHeight: "94dvh" }}
          >
            <div className="flex justify-center pt-3 pb-1 shrink-0">
              <div className="w-10 h-1.5 rounded-full bg-border" />
            </div>
            <div className="flex items-start justify-between px-5 pt-2 pb-4 border-b border-border shrink-0">
              <div>
                <h2 className="text-base font-semibold text-foreground leading-tight">{title}</h2>
                {description && <p className="text-xs text-muted-foreground mt-0.5">{description}</p>}
              </div>
              <button onClick={onClose}
                className="p-1.5 -mr-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="overflow-y-auto flex-1 px-5 py-4" style={{ WebkitOverflowScrolling: "touch" }}>
              {children}
              {/* Bottom safe-area padding */}
              <div className="h-6" />
            </div>
          </motion.div>

          {/* ── Desktop: right side panel ────────────────────── */}
          <motion.div
            initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 280 }}
            className={`hidden md:flex fixed right-0 top-0 bottom-0 z-[61] bg-white shadow-[−8px_0_32px_rgba(0,0,0,0.12)] flex-col w-full ${width}`}
          >
            <div className="flex items-start justify-between px-6 pt-5 pb-4 border-b border-border shrink-0">
              <div>
                <h2 className="text-base font-semibold text-foreground leading-tight">{title}</h2>
                {description && <p className="text-xs text-muted-foreground mt-1">{description}</p>}
              </div>
              <button onClick={onClose}
                className="p-1.5 -mr-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground mt-0.5">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="overflow-y-auto flex-1 px-6 py-5">
              {children}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
