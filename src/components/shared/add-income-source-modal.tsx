"use client";
import { useState, useEffect } from "react";
import { Modal } from "./modal";
import { AddIncomeTypeModal } from "./add-income-type-modal";
import { useAuthStore } from "@/stores/auth.store";
import { useIncomeStore } from "@/stores/income.store";
import { useIncomeSourceTypes } from "@/hooks/use-income-source-types";
import { useCurrencies } from "@/hooks/use-currencies";
import { useSettingsStore } from "@/stores/settings.store";
import { PRESET_CURRENCIES } from "@/types";
import { Loader2, AlertCircle, Plus } from "lucide-react";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onCreated?: (income: { id: string; name: string; currencyCode: string }) => void;
  level?: 1 | 2 | 3;
}

const inp = "w-full px-3.5 py-2.5 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all";

export function AddIncomeSourceModal({ isOpen, onClose, onCreated, level = 1 }: Props) {
  const { user } = useAuthStore();
  const { addIncome } = useIncomeStore();
  const { sourceTypes } = useIncomeSourceTypes();
  const { currencies } = useCurrencies();
  const { settings } = useSettingsStore();
  const defaultCode = settings?.currencyCode ?? "KWD";

  const [name, setName]           = useState("");
  const [source, setSource]       = useState("");
  const [amount, setAmount]       = useState("");
  const [currencyCode, setCurrency] = useState(defaultCode);
  const [notes, setNotes]         = useState("");
  const [saving, setSaving]       = useState(false);
  const [error, setError]         = useState("");
  const [showTypeModal, setShowTypeModal] = useState(false);

  // Reset when opened
  useEffect(() => {
    if (isOpen) {
      setName(""); setSource(""); setAmount(""); setCurrency(defaultCode);
      setNotes(""); setError("");
    }
  }, [isOpen, defaultCode]);

  const activeSources = sourceTypes.filter((s) => s.isActive);

  // All available currencies for the dropdown
  const allCurrencies = [
    { code: defaultCode, name: settings?.currencyName ?? "Default", symbol: settings?.currencySymbol ?? "KD" },
    ...currencies.filter((c) => c.code !== defaultCode),
    ...PRESET_CURRENCIES.filter(
      (p) => p.code !== defaultCode && !currencies.some((c) => c.code === p.code)
    ),
  ];

  const handleSave = async () => {
    if (!user) return;
    if (!name.trim()) { setError("Name is required"); return; }
    if (!source)      { setError("Source type is required"); return; }
    if (!amount || parseFloat(amount) <= 0) { setError("Amount must be positive"); return; }
    setSaving(true);
    setError("");
    try {
      const id = await addIncome(user.uid, {
        name: name.trim(), source, amount: parseFloat(amount),
        tagIds: [], currencyCode, notes: notes.trim() || undefined,
      });
      onCreated?.({ id, name: name.trim(), currencyCode });
      onClose();
    } catch (e: unknown) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const handleTypeCreated = (type: { id: string; name: string }) => {
    setSource(type.name); // auto-select the new type
    setShowTypeModal(false);
  };

  const typeLevel = Math.min(level + 1, 3) as 1 | 2 | 3;

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} title="Add Income Source"
        description="Create an income source to track funds" level={level} maxWidth="max-w-lg">
        <div className="space-y-4">
          {error && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-destructive/10 text-destructive text-sm">
              <AlertCircle className="w-4 h-4 shrink-0" /> {error}
            </div>
          )}

          {/* Name */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Income Name *</label>
            <input value={name} onChange={(e) => setName(e.target.value)}
              placeholder="e.g. January Salary" className={inp} autoFocus />
          </div>

          {/* Source type + quick-add button */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Source Type *</label>
              <button type="button" onClick={() => setShowTypeModal(true)}
                className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition-colors">
                <Plus className="w-3 h-3" /> Add type
              </button>
            </div>

            {activeSources.length === 0 ? (
              <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-3">
                <p className="text-sm text-amber-700 font-medium mb-1">No income types yet</p>
                <p className="text-xs text-amber-600 mb-2">You need at least one income type to continue.</p>
                <button type="button" onClick={() => setShowTypeModal(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500 text-white text-xs font-medium hover:bg-amber-600 transition-colors">
                  <Plus className="w-3 h-3" /> Add Income Type Now
                </button>
              </div>
            ) : (
              <select value={source} onChange={(e) => setSource(e.target.value)} className={inp}>
                <option value="">Select source type…</option>
                {activeSources.map((s) => (
                  <option key={s.id} value={s.name}>{s.icon} {s.name}</option>
                ))}
              </select>
            )}
          </div>

          {/* Amount + Currency side by side */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Amount *</label>
              <input value={amount} onChange={(e) => setAmount(e.target.value)}
                type="number" step="0.001" min="0.001" placeholder="0.000" className={inp} />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Currency *</label>
              <select value={currencyCode} onChange={(e) => setCurrency(e.target.value)} className={inp}>
                {allCurrencies.map((c) => (
                  <option key={c.code} value={c.code}>{c.code} – {c.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Notes</label>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)}
              placeholder="Optional notes…" rows={2}
              className={inp + " resize-none"} />
          </div>

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose}
              className="flex-1 px-4 py-2.5 rounded-lg border border-border text-sm font-medium hover:bg-muted transition-colors">
              Cancel
            </button>
            <button type="button" onClick={handleSave}
              disabled={saving || !name.trim() || !source || !amount || activeSources.length === 0}
              className="flex-1 flex items-center justify-center gap-2 bg-primary text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-primary/90 disabled:opacity-60 transition-all">
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              Add Income Source
            </button>
          </div>
        </div>
      </Modal>

      {/* Level+1 modal for adding an income type from within this modal */}
      <AddIncomeTypeModal isOpen={showTypeModal} onClose={() => setShowTypeModal(false)}
        onCreated={handleTypeCreated} level={typeLevel} />
    </>
  );
}
