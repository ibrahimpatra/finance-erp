"use client";
import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";

interface FormDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
}

export function FormDrawer({ isOpen, onClose, title, description, children }: FormDrawerProps) {
  useEffect(() => {
    if (!isOpen) return;
    const esc = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", esc);
    if (isOpen) document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", esc);
      document.body.style.overflow = "";
    };
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            key="fd-backdrop"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-[3px] z-[52]"
            onClick={onClose}
          />

          {/* Mobile: slides up full screen · Desktop: right drawer */}
          <motion.div
            key="fd-panel"
            className={[
              "fixed z-[53] bg-white flex flex-col",
              // Mobile: full screen bottom sheet
              "inset-x-0 bottom-0 max-h-[96vh] rounded-t-2xl",
              // Desktop override: right drawer full height
              "lg:inset-y-0 lg:right-0 lg:left-auto lg:w-[520px] lg:max-h-none lg:rounded-none lg:rounded-l-2xl lg:shadow-2xl",
            ].join(" ")}
            initial={{ y: "100%", opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: "100%", opacity: 0 }}
            transition={{ type: "spring", damping: 32, stiffness: 350 }}
            style={{
              // Desktop: slide from right instead
            }}
          >
            {/* Drag handle — mobile only */}
            <div className="flex justify-center pt-3 pb-1 lg:hidden">
              <div className="w-10 h-1 rounded-full bg-muted-foreground/20" />
            </div>

            {/* Header */}
            <div className="flex items-start justify-between px-6 pt-4 pb-4 border-b border-border shrink-0">
              <div>
                <h2 className="text-lg font-bold text-foreground leading-tight">{title}</h2>
                {description && (
                  <p className="text-sm text-muted-foreground mt-0.5">{description}</p>
                )}
              </div>
              <button onClick={onClose}
                className="p-2 rounded-xl hover:bg-muted transition-colors text-muted-foreground -mr-1 -mt-1 shrink-0">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable content */}
            <div className="flex-1 overflow-y-auto px-6 py-5 scrollbar-thin">
              {children}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
