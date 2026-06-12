"use client";
import { useState } from "react";
import { HexColorPicker } from "react-colorful";
import { Modal } from "./modal";
import { useAuthStore } from "@/stores/auth.store";
import { useIncomeSourceTypeStore } from "@/stores/income-source-type.store";
import { Loader2, Palette } from "lucide-react";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onCreated?: (type: { id: string; name: string }) => void;
  level?: 1 | 2 | 3;
}

const inp = "w-full px-4 py-3 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all";
const QUICK_ICONS = ["💼","🎁","🏢","💰","📈","💻","🏠","📦","💳","🌐","🎯","🔧","🛠️","🎓","🏆"];

export function AddIncomeTypeModal({ isOpen, onClose, onCreated, level = 1 }: Props) {
  const { user }          = useAuthStore();
  const { addSourceType } = useIncomeSourceTypeStore();

  const [name, setName]         = useState("");
  const [icon, setIcon]         = useState("💼");
  const [color, setColor]       = useState("#3b82f6");
  const [showPicker, setShowPicker] = useState(false);
  const [saving, setSaving]     = useState(false);
  const [error, setError]       = useState("");

  const reset = () => { setName(""); setIcon("💼"); setColor("#3b82f6"); setError(""); setShowPicker(false); };

  const handleSave = async () => {
    if (!user) return;
    if (!name.trim()) { setError("Name is required"); return; }
    setSaving(true); setError("");
    try {
      const id = await addSourceType(user.uid, { name: name.trim(), icon, color, isActive: true });
      onCreated?.({ id, name: name.trim() });
      reset(); onClose();
    } catch (e: unknown) { setError((e as Error).message); }
    finally { setSaving(false); }
  };

  return (
    <Modal isOpen={isOpen} onClose={() => { reset(); onClose(); }}
      title="Add Income Type" description="e.g. Salary, Freelance, Business"
      level={level} maxWidth="max-w-md">
      <div className="space-y-5">

        <div className="space-y-1.5">
          <label className="text-sm font-medium text-foreground">Type Name *</label>
          <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Salary"
            className={inp} autoFocus onKeyDown={e => e.key === "Enter" && handleSave()} />
          {error && <p className="text-xs text-destructive">{error}</p>}
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">Icon</label>
          <div className="flex flex-wrap gap-2">
            {QUICK_ICONS.map(ic => (
              <button key={ic} type="button" onClick={() => setIcon(ic)}
                className={`w-9 h-9 rounded-xl text-xl flex items-center justify-center transition-all ${
                  icon === ic ? "bg-primary/15 ring-2 ring-primary scale-110" : "bg-muted hover:scale-105"
                }`}>
                {ic}
              </button>
            ))}
          </div>
          <input value={icon} onChange={e => setIcon(e.target.value)}
            placeholder="Or paste any emoji" className={inp + " text-lg"} />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">Color</label>
          <button type="button" onClick={() => setShowPicker(v => !v)}
            className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl border border-input hover:bg-muted transition-colors">
            <div className="w-5 h-5 rounded-md shadow-sm" style={{ backgroundColor: color }} />
            <span className="text-sm font-mono">{color}</span>
            <Palette className="w-4 h-4 text-muted-foreground" />
          </button>
          {showPicker && (
            <div className="p-3 rounded-xl border border-border bg-white shadow-lg">
              <HexColorPicker color={color} onChange={setColor} style={{ width: "100%" }} />
              <input value={color} onChange={e => setColor(e.target.value)}
                className="mt-3 w-full px-3 py-2 rounded-lg border border-input text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary/30" />
            </div>
          )}
        </div>

        <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/50">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center text-xl"
            style={{ backgroundColor: color + "25" }}>{icon}</div>
          <div>
            <div className="text-sm font-semibold" style={{ color }}>{name || "Type name"}</div>
            <div className="text-xs text-muted-foreground">Preview</div>
          </div>
        </div>

        <div className="flex gap-3 pt-1">
          <button type="button" onClick={() => { reset(); onClose(); }}
            className="flex-1 px-4 py-3 rounded-xl border border-border text-sm font-medium hover:bg-muted transition-colors">
            Cancel
          </button>
          <button type="button" onClick={handleSave} disabled={saving || !name.trim()}
            className="flex-1 flex items-center justify-center gap-2 bg-primary text-white px-4 py-3 rounded-xl text-sm font-semibold hover:bg-primary/90 disabled:opacity-60 transition-all">
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            Add Type
          </button>
        </div>
      </div>
    </Modal>
  );
}
