"use client";
import { useEffect } from "react";
import { X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// z-index ladder: each level sits 10 units above the previous
const BACKDROP_Z: Record<number, string> = { 1: "z-[58]", 2: "z-[68]", 3: "z-[78]" };
const PANEL_Z:    Record<number, string> = { 1: "z-[59]", 2: "z-[69]", 3: "z-[79]" };

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  level?: 1 | 2 | 3;
  maxWidth?: string;
}

export function Modal({
  isOpen, onClose, title, description, children,
  level = 1, maxWidth = "max-w-md",
}: ModalProps) {
  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className={`fixed inset-0 bg-black/50 backdrop-blur-sm ${BACKDROP_Z[level]}`}
            onClick={onClose}
          />
          {/* Panel */}
          <div className={`fixed inset-0 flex items-center justify-center p-4 ${PANEL_Z[level]} pointer-events-none`}>
            <motion.div
              key="panel"
              initial={{ opacity: 0, scale: 0.96, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 12 }}
              transition={{ type: "spring", damping: 28, stiffness: 380 }}
              className={`relative bg-white rounded-2xl shadow-2xl border border-border w-full ${maxWidth} pointer-events-auto`}
            >
              {/* Header */}
              <div className="flex items-start justify-between px-6 pt-5 pb-4 border-b border-border">
                <div>
                  <h2 className="text-base font-semibold text-foreground">{title}</h2>
                  {description && (
                    <p className="text-sm text-muted-foreground mt-0.5">{description}</p>
                  )}
                </div>
                <button
                  onClick={onClose}
                  className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground -mt-0.5 -mr-1.5 shrink-0 ml-4"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Body */}
              <div className="px-6 py-5">
                {children}
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
