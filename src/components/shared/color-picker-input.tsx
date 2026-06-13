"use client";
import { useState, useRef, useEffect, useCallback } from "react";
import { HexColorPicker } from "react-colorful";
import { createPortal } from "react-dom";

interface ColorPickerInputProps {
  value: string;
  onChange: (color: string) => void;
  label?: string;
}

export function ColorPickerInput({ value, onChange, label }: ColorPickerInputProps) {
  const [open, setOpen] = useState(false);
  const [hex, setHex]   = useState(value || "#3b82f6");
  const [pos, setPos]   = useState({ top: 0, left: 0 });
  const triggerRef      = useRef<HTMLButtonElement>(null);
  const popoverRef      = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (value && value !== hex) setHex(value);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  /* Position the portal relative to trigger */
  const calcPosition = useCallback(() => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const popH = 290; // approx popover height
    const spaceBelow = window.innerHeight - rect.bottom;
    const top = spaceBelow >= popH
      ? rect.bottom + 8
      : rect.top - popH - 8;
    setPos({ top, left: Math.min(rect.left, window.innerWidth - 236) });
  }, []);

  /* Close on outside click */
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (
        popoverRef.current && !popoverRef.current.contains(e.target as Node) &&
        triggerRef.current && !triggerRef.current.contains(e.target as Node)
      ) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const handleOpen = () => {
    calcPosition();
    setOpen((v) => !v);
  };

  const handleColorChange = useCallback((color: string) => {
    setHex(color);
    onChange(color);
  }, [onChange]);

  const handleHexInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    setHex(raw);
    if (/^#[0-9a-fA-F]{6}$/.test(raw)) onChange(raw);
  };

  const validColor = /^#[0-9a-fA-F]{6}$/.test(hex) ? hex : "#3b82f6";

  const popover = open && typeof document !== "undefined"
    ? createPortal(
        <div
          ref={popoverRef}
          style={{ position: "fixed", top: pos.top, left: pos.left, zIndex: 9999 }}
          className="w-[228px] p-3 bg-white rounded-xl border border-border shadow-xl"
        >
          <HexColorPicker color={validColor} onChange={handleColorChange} />
          <input
            type="text" value={hex} onChange={handleHexInput}
            placeholder="#3b82f6" maxLength={7}
            className="mt-2 w-full px-3 py-1.5 rounded-lg border border-input bg-background text-xs font-mono uppercase focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary"
          />
          <div className="mt-2 flex flex-wrap gap-1.5">
            {PRESET_COLORS.map((c) => (
              <button key={c} type="button" onClick={() => handleColorChange(c)}
                className="w-6 h-6 rounded-md border-2 transition-all hover:scale-110"
                style={{
                  backgroundColor: c,
                  borderColor: validColor === c ? c : "transparent",
                  outline: validColor === c ? `2px solid ${c}44` : "none",
                  outlineOffset: "2px",
                }} />
            ))}
          </div>
        </div>,
        document.body
      )
    : null;

  return (
    <div className="space-y-1.5">
      {label && <label className="text-sm font-medium">{label}</label>}
      <div className="flex items-center gap-2">
        <button
          ref={triggerRef}
          type="button"
          onClick={handleOpen}
          className="w-10 h-10 rounded-lg border-2 border-border shadow-sm transition-all hover:scale-105 hover:shadow-md shrink-0"
          style={{ backgroundColor: validColor }}
          aria-label="Open color picker"
        />
        <input
          type="text" value={hex} onChange={handleHexInput}
          placeholder="#3b82f6" maxLength={7}
          className="w-full px-3.5 py-2.5 rounded-lg border border-input bg-background text-sm font-mono uppercase focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary transition-all"
        />
      </div>
      {popover}
    </div>
  );
}

const PRESET_COLORS = [
  "#3b82f6","#6366f1","#8b5cf6","#a855f7","#ec4899",
  "#ef4444","#f97316","#f59e0b","#84cc16","#22c55e",
  "#10b981","#14b8a6","#06b6d4","#64748b","#374151",
];
