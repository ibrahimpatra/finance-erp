"use client";
import { useState } from "react";
import { Modal } from "./modal";
import { useAuthStore } from "@/stores/auth.store";
import { useIncomeSourceTypeStore } from "@/stores/income-source-type.store";
import { ColorPickerInput } from "./color-picker-input";
import { Loader2 } from "lucide-react";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onCreated?: (type: { id: string; name: string }) => void;
  level?: 1 | 2 | 3;
}

const inp = "w-full px-3.5 py-2.5 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary transition-all";
const QUICK_ICONS = ["💼","🎁","🏢","💰","📈","💻","🏠","📦","💳","🌐","🎯","🔧"];

export function AddIncomeTypeModal({ isOpen, onClose, onCreated, level = 1 }: Props) {
  const { user } = useAuthStore();
  const { addSourceType } = useIncomeSourceTypeStore();

  const [name,   setName]   = useState("");
  const [icon,   setIcon]   = useState("💼");
  const [color,  setColor]  = useState("#3b82f6");
  const [saving, setSaving] = useState(false);
  const [error,  setError]  = useState("");

  const reset = () => { setName(""); setIcon("💼"); setColor("#3b82f6"); setError(""); };

  const handleSave = async () => {
    if (!user) return;
    if (!name.trim()) { setError("Name is required"); return; }
    setSaving(true); setError("");
    try {
      const id = await addSourceType(user.uid, { name: name.trim(), icon, color, isActive: true });
      onCreated?.({ id, name: name.trim() });
      reset(); onClose();
    } catch (e: unknown) {
      setError((e as Error).message);
    } finally { setSaving(false); }
  };

  const handleClose = () => { reset(); onClose(); };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Add Income Type"
      description="Create a new income source type (e.g. Salary, Freelance)" level={level}>
      <div className="space-y-4">
        <div className="space-y-1.5">
          <label className="text-sm font-medium">Name *</label>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Salary"
            className={inp} onKeyDown={(e) => e.key === "Enter" && handleSave()} autoFocus />
          {error && <p className="text-xs text-destructive">{error}</p>}
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium">Icon</label>
          <div className="flex flex-wrap gap-2 mb-2">
            {QUICK_ICONS.map((ic) => (
              <button key={ic} type="button" onClick={() => setIcon(ic)}
                className={`w-9 h-9 rounded-lg text-lg flex items-center justify-center transition-all ${icon === ic ? "bg-primary/15 ring-2 ring-primary" : "bg-muted hover:bg-muted/80"}`}>
                {ic}
              </button>
            ))}
          </div>
          <input value={icon} onChange={(e) => setIcon(e.target.value)} placeholder="Or type any emoji"
            className={inp + " text-lg"} />
        </div>

        {/* ── react-colorful color picker ── */}
        <ColorPickerInput label="Color" value={color} onChange={setColor} />

        <div className="flex gap-3 pt-1">
          <button type="button" onClick={handleClose}
            className="flex-1 px-4 py-2.5 rounded-lg border border-border text-sm font-medium hover:bg-muted transition-colors">
            Cancel
          </button>
          <button type="button" onClick={handleSave} disabled={saving || !name.trim()}
            className="flex-1 flex items-center justify-center gap-2 bg-primary text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-primary/90 disabled:opacity-60 transition-all">
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            Add Type
          </button>
        </div>
      </div>
    </Modal>
  );
}
