"use client";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { settingsSchema, SettingsSchema } from "@/lib/validations/settings";
import { expenseTypeSchema, ExpenseTypeSchema } from "@/lib/validations/expense-type";
import { useSettings } from "@/hooks/use-settings";
import { useExpenseTypes } from "@/hooks/use-expense-types";
import { useIncomeSourceTypes } from "@/hooks/use-income-source-types";
import { useCurrencies } from "@/hooks/use-currencies";
import { useAuthStore } from "@/stores/auth.store";
import { useSettingsStore } from "@/stores/settings.store";
import { useExpenseTypeStore } from "@/stores/expense-type.store";
import { useIncomeSourceTypeStore } from "@/stores/income-source-type.store";
import { useCurrencyStore } from "@/stores/currency.store";
import { useCurrency } from "@/hooks/use-currency";
import { useToast } from "@/components/ui/toaster";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { ColorPickerInput } from "@/components/shared/color-picker-input";
import { ExpenseType, IncomeSourceType, IncomeSourceTypeFormData, Currency, PRESET_CURRENCIES } from "@/types";
import {
  Loader2, Plus, Edit3, Trash2, Save, DollarSign, Layers, TrendingUp,
  Globe, Check, X,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const inp = "form-input";

export function SettingsClient() {
  const { user }       = useAuthStore();
  const { settings }   = useSettings();
  const { expenseTypes } = useExpenseTypes();
  const { sourceTypes }  = useIncomeSourceTypes();
  useCurrencies();
  const { currencies, addCurrency, removeCurrency, loading: curLoading } = useCurrencyStore();
  const { updateSettings }   = useSettingsStore();
  const { addExpenseType, editExpenseType, removeExpenseType } = useExpenseTypeStore();
  const { addSourceType, editSourceType, removeSourceType }    = useIncomeSourceTypeStore();
  const { format }    = useCurrency();
  const { toast }     = useToast();

  // ── Expense type state ────────────────────────────────────────────
  const [editTypeTarget, setEditTypeTarget]     = useState<ExpenseType | null>(null);
  const [deleteTypeTarget, setDeleteTypeTarget] = useState<ExpenseType | null>(null);
  const [showTypeForm, setShowTypeForm]         = useState(false);
  const [deletingType, setDeletingType]         = useState(false);
  const [typeColor, setTypeColor]               = useState("#6b7280");

  // ── Income source type state ──────────────────────────────────────
  const [editSrcTarget, setEditSrcTarget]     = useState<IncomeSourceType | null>(null);
  const [deleteSrcTarget, setDeleteSrcTarget] = useState<IncomeSourceType | null>(null);
  const [showSrcForm, setShowSrcForm]         = useState(false);
  const [deletingSrc, setDeletingSrc]         = useState(false);
  const [srcColor, setSrcColor]               = useState("#3b82f6");

  // ── Currency management state ─────────────────────────────────────
  const [showCurForm, setShowCurForm]       = useState(false);
  const [deleteCurTarget, setDeleteCurTarget] = useState<Currency | null>(null);
  const [deletingCur, setDeletingCur]       = useState(false);
  const [curName, setCurName]               = useState("");
  const [curCode, setCurCode]               = useState("");
  const [curSymbol, setCurSymbol]           = useState("");
  const [curSaving, setCurSaving]           = useState(false);

  // ── Forms ─────────────────────────────────────────────────────────
  const { register: regSettings, handleSubmit: handleSettings, setValue: setVal,
    formState: { isSubmitting: settingsSaving } } = useForm<SettingsSchema>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      currencyName:   settings?.currencyName   ?? "Kuwaiti Dinar",
      currencyCode:   settings?.currencyCode   ?? "KWD",
      currencySymbol: settings?.currencySymbol ?? "KD",
    },
  });

  const { register: regType, handleSubmit: handleType, reset: resetType, setValue: setTypeVal,
    formState: { errors: typeErrors, isSubmitting: typeSaving } } = useForm<ExpenseTypeSchema>({
    resolver: zodResolver(expenseTypeSchema), defaultValues: { isActive: true },
  });

  const { register: regSrc, handleSubmit: handleSrc, reset: resetSrc, setValue: setSrcVal,
    formState: { errors: srcErrors, isSubmitting: srcSaving } } = useForm<ExpenseTypeSchema>({
    resolver: zodResolver(expenseTypeSchema), defaultValues: { isActive: true },
  });

  // ── Handlers ──────────────────────────────────────────────────────
  const onSaveSettings = async (data: SettingsSchema) => {
    if (!user) return;
    await updateSettings(user.uid, data);
    toast("Currency settings saved!", "success");
  };

  const onSaveType = async (data: ExpenseTypeSchema) => {
    if (!user) return;
    const payload = { ...data, color: typeColor };
    if (editTypeTarget) {
      await editExpenseType(user.uid, editTypeTarget.id, payload);
      toast("Category updated!", "success");
    } else {
      await addExpenseType(user.uid, payload);
      toast("Category added!", "success");
    }
    resetType(); setShowTypeForm(false); setEditTypeTarget(null); setTypeColor("#6b7280");
  };

  const onSaveSrc = async (data: ExpenseTypeSchema) => {
    if (!user) return;
    const payload: IncomeSourceTypeFormData = {
      name: data.name, icon: data.icon, color: srcColor, isActive: data.isActive,
    };
    if (editSrcTarget) {
      await editSourceType(user.uid, editSrcTarget.id, payload);
      toast("Source type updated!", "success");
    } else {
      await addSourceType(user.uid, payload);
      toast("Source type added!", "success");
    }
    resetSrc(); setShowSrcForm(false); setEditSrcTarget(null); setSrcColor("#3b82f6");
  };

  const startEditType = (et: ExpenseType) => {
    setEditTypeTarget(et);
    setTypeVal("name", et.name); setTypeVal("icon", et.icon ?? "");
    const c = et.color ?? "#6b7280";
    setTypeColor(c); setTypeVal("color", c);
    setTypeVal("isActive", et.isActive); setShowTypeForm(true);
  };

  const startEditSrc = (st: IncomeSourceType) => {
    setEditSrcTarget(st);
    setSrcVal("name", st.name); setSrcVal("icon", st.icon ?? "");
    const c = st.color ?? "#3b82f6";
    setSrcColor(c); setSrcVal("color", c);
    setSrcVal("isActive", st.isActive); setShowSrcForm(true);
  };

  const handleDeleteType = async () => {
    if (!user || !deleteTypeTarget) return;
    setDeletingType(true);
    await removeExpenseType(user.uid, deleteTypeTarget.id);
    toast("Category deleted.", "success");
    setDeletingType(false); setDeleteTypeTarget(null);
  };

  const handleDeleteSrc = async () => {
    if (!user || !deleteSrcTarget) return;
    setDeletingSrc(true);
    await removeSourceType(user.uid, deleteSrcTarget.id);
    toast("Source type deleted.", "success");
    setDeletingSrc(false); setDeleteSrcTarget(null);
  };

  const handleAddCurrency = async () => {
    if (!user || !curName.trim() || !curCode.trim() || !curSymbol.trim()) return;
    if (currencies.some((c) => c.code.toUpperCase() === curCode.toUpperCase())) {
      toast(`Currency ${curCode.toUpperCase()} already exists.`, "error"); return;
    }
    setCurSaving(true);
    await addCurrency(user.uid, {
      name: curName.trim(), code: curCode.toUpperCase().trim(), symbol: curSymbol.trim(), isDefault: false,
    });
    toast(`${curCode.toUpperCase()} added!`, "success");
    setCurName(""); setCurCode(""); setCurSymbol(""); setShowCurForm(false); setCurSaving(false);
  };

  const handleDeleteCurrency = async () => {
    if (!user || !deleteCurTarget) return;
    setDeletingCur(true);
    await removeCurrency(user.uid, deleteCurTarget.id);
    toast("Currency removed.", "success");
    setDeletingCur(false); setDeleteCurTarget(null);
  };

  const applyPresetCurrency = (c: typeof PRESET_CURRENCIES[number]) => {
    setVal("currencyName", c.name); setVal("currencyCode", c.code); setVal("currencySymbol", c.symbol);
  };
  const fillCurForm = (c: typeof PRESET_CURRENCIES[number]) => {
    setCurName(c.name); setCurCode(c.code); setCurSymbol(c.symbol); setShowCurForm(true);
  };

  return (
    <div className="space-y-8 animate-fade-in max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-foreground tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Configure your Finance ERP preferences</p>
      </div>

      {/* ── Default Display Currency ──────────────────────────────────── */}
      <div className="bg-white rounded-xl border border-border shadow-card overflow-hidden">
        <div className="flex items-center gap-3 px-6 py-4 border-b border-border">
          <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
            <DollarSign className="w-4 h-4 text-blue-500" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">Default Display Currency</h3>
            <p className="text-xs text-muted-foreground">Controls how amounts display across the app</p>
          </div>
        </div>
        <div className="p-6 space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Quick Select</label>
            <div className="flex flex-wrap gap-2">
              {PRESET_CURRENCIES.map((c) => (
                <button key={c.code} type="button" onClick={() => applyPresetCurrency(c)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                    settings?.currencyCode === c.code
                      ? "bg-primary/10 border-primary text-primary"
                      : "border-border hover:bg-muted"
                  }`}>
                  {c.symbol} {c.code}
                </button>
              ))}
            </div>
          </div>
          <form onSubmit={handleSettings(onSaveSettings)} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Currency Name</label>
                <input {...regSettings("currencyName")} placeholder="Kuwaiti Dinar" className={inp} />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Currency Code</label>
                <input {...regSettings("currencyCode")} placeholder="KWD" className={inp} />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Symbol / Prefix</label>
                <input {...regSettings("currencySymbol")} placeholder="KD" className={inp} />
              </div>
            </div>
            <div className="flex items-center justify-between pt-1">
              <p className="text-sm text-muted-foreground">
                Preview: <span className="font-semibold text-foreground amount-display">{format(1234.567)}</span>
              </p>
              <button type="submit" disabled={settingsSaving}
                className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/90 disabled:opacity-60 transition-all">
                {settingsSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Save Currency
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* ── Multi-Currency Wallet ─────────────────────────────────────── */}
      <div className="bg-white rounded-xl border border-border shadow-card overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center">
              <Globe className="w-4 h-4 text-emerald-500" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">Multi-Currency Wallet</h3>
              <p className="text-xs text-muted-foreground">Add currencies you use for multi-currency tracking</p>
            </div>
          </div>
          <button onClick={() => setShowCurForm((v) => !v)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-border text-sm font-medium hover:bg-muted transition-colors">
            <Plus className="w-4 h-4" /> Add
          </button>
        </div>

        {/* Quick-add presets */}
        <div className="px-6 pt-4 pb-2">
          <p className="text-xs text-muted-foreground mb-2">Add from presets:</p>
          <div className="flex flex-wrap gap-2">
            {PRESET_CURRENCIES.filter((p) =>
              p.code !== (settings?.currencyCode ?? "KWD") && !currencies.some((c) => c.code === p.code)
            ).map((c) => (
              <button key={c.code} type="button" onClick={() => fillCurForm(c)}
                className="px-2.5 py-1 rounded-lg text-xs font-medium border border-border hover:bg-muted transition-all">
                {c.symbol} {c.code}
              </button>
            ))}
          </div>
        </div>

        <AnimatePresence>
          {showCurForm && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
              <div className="px-6 py-4 border-t border-border bg-muted/20 space-y-3">
                <p className="text-sm font-medium">New Currency</p>
                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium">Name *</label>
                    <input value={curName} onChange={(e) => setCurName(e.target.value)}
                      placeholder="US Dollar" className={inp} />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium">Code *</label>
                    <input value={curCode} onChange={(e) => setCurCode(e.target.value.toUpperCase())}
                      placeholder="USD" maxLength={5} className={inp + " font-mono uppercase"} />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium">Symbol *</label>
                    <input value={curSymbol} onChange={(e) => setCurSymbol(e.target.value)}
                      placeholder="$" className={inp} />
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <button type="button" onClick={handleAddCurrency}
                    disabled={curSaving || !curName || !curCode || !curSymbol}
                    className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/90 disabled:opacity-60 transition-all">
                    {curSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                    Add Currency
                  </button>
                  <button type="button" onClick={() => { setShowCurForm(false); setCurName(""); setCurCode(""); setCurSymbol(""); }}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-border text-sm font-medium hover:bg-muted transition-colors">
                    <X className="w-3.5 h-3.5" /> Cancel
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="divide-y divide-border">
          <div className="flex items-center gap-3 px-6 py-3.5 bg-blue-50/40">
            <div className="w-9 h-9 rounded-lg bg-blue-100 flex items-center justify-center text-sm font-bold text-blue-700 shrink-0">
              {settings?.currencySymbol ?? "KD"}
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-foreground">{settings?.currencyName ?? "Kuwaiti Dinar"}</p>
              <p className="text-xs text-muted-foreground">{settings?.currencyCode ?? "KWD"} · Default</p>
            </div>
            <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 font-medium">Default</span>
          </div>
          {curLoading ? (
            <div className="px-6 py-4 text-sm text-muted-foreground">Loading…</div>
          ) : currencies.length === 0 ? (
            <div className="px-6 py-6 text-center text-sm text-muted-foreground">
              No additional currencies yet.
            </div>
          ) : (
            currencies.map((c) => (
              <div key={c.id} className="flex items-center gap-3 px-6 py-3.5 group hover:bg-muted/30 transition-colors">
                <div className="w-9 h-9 rounded-lg bg-emerald-50 flex items-center justify-center text-sm font-bold text-emerald-700 shrink-0">
                  {c.symbol}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">{c.name}</p>
                  <p className="text-xs text-muted-foreground">{c.code}</p>
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => setDeleteCurTarget(c)}
                    className="p-1.5 rounded hover:bg-destructive/10 transition-colors text-muted-foreground hover:text-destructive">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* ── Income Source Types ───────────────────────────────────────── */}
      <div className="bg-white rounded-xl border border-border shadow-card overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-blue-500" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">Income Source Types</h3>
              <p className="text-xs text-muted-foreground">Manage source types (Salary, Gift, Business…)</p>
            </div>
          </div>
          <button onClick={() => { setShowSrcForm(true); setEditSrcTarget(null); resetSrc(); setSrcColor("#3b82f6"); }}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-border text-sm font-medium hover:bg-muted transition-colors">
            <Plus className="w-4 h-4" /> Add
          </button>
        </div>
        <AnimatePresence>
          {showSrcForm && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
              <form onSubmit={handleSrc(onSaveSrc)} className="p-6 space-y-4 border-b border-border bg-muted/20">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium">Name *</label>
                    <input {...regSrc("name")} placeholder="e.g. Salary" className={inp} />
                    {srcErrors.name && <p className="text-xs text-destructive">{srcErrors.name.message}</p>}
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium">Icon (emoji)</label>
                    <input {...regSrc("icon")} placeholder="💼" className={inp} />
                  </div>
                </div>
                {/* ── Color picker ── */}
                <ColorPickerInput
                  label="Color"
                  value={srcColor}
                  onChange={(c) => { setSrcColor(c); setSrcVal("color", c); }}
                />
                <div className="flex items-center gap-3 pt-1">
                  <button type="submit" disabled={srcSaving}
                    className="flex items-center gap-1.5 bg-primary text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/90 disabled:opacity-60 transition-all">
                    {srcSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                    {editSrcTarget ? "Update" : "Add"}
                  </button>
                  <button type="button" onClick={() => { setShowSrcForm(false); resetSrc(); setEditSrcTarget(null); }}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                    Cancel
                  </button>
                </div>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
        <div className="divide-y divide-border">
          {sourceTypes.map((st) => (
            <div key={st.id} className="flex items-center gap-3 px-6 py-3.5 group hover:bg-muted/30 transition-colors">
              <div className="w-9 h-9 rounded-lg flex items-center justify-center text-lg shrink-0"
                style={{ backgroundColor: (st.color ?? "#3b82f6") + "22" }}>
                {st.icon ?? "💰"}
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground">{st.name}</p>
                {!st.isActive && <span className="text-xs text-muted-foreground">Inactive</span>}
              </div>
              {st.color && <div className="w-4 h-4 rounded-full border border-white shadow-sm shrink-0" style={{ backgroundColor: st.color }} />}
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => startEditSrc(st)}
                  className="p-1.5 rounded hover:bg-muted transition-colors text-muted-foreground">
                  <Edit3 className="w-3.5 h-3.5" />
                </button>
                <button onClick={() => setDeleteSrcTarget(st)}
                  className="p-1.5 rounded hover:bg-destructive/10 transition-colors text-muted-foreground hover:text-destructive">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Expense Categories ────────────────────────────────────────── */}
      <div className="bg-white rounded-xl border border-border shadow-card overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center">
              <Layers className="w-4 h-4 text-purple-500" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">Expense Categories</h3>
              <p className="text-xs text-muted-foreground">{expenseTypes.length} categories configured</p>
            </div>
          </div>
          <button onClick={() => { setShowTypeForm(true); setEditTypeTarget(null); resetType(); setTypeColor("#6b7280"); }}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-border text-sm font-medium hover:bg-muted transition-colors">
            <Plus className="w-4 h-4" /> Add
          </button>
        </div>
        <AnimatePresence>
          {showTypeForm && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
              <form onSubmit={handleType(onSaveType)} className="p-6 space-y-4 border-b border-border bg-muted/20">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium">Name *</label>
                    <input {...regType("name")} placeholder="e.g. Food" className={inp} />
                    {typeErrors.name && <p className="text-xs text-destructive">{typeErrors.name.message}</p>}
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium">Icon (emoji)</label>
                    <input {...regType("icon")} placeholder="🍔" className={inp} />
                  </div>
                </div>
                {/* ── Color picker ── */}
                <ColorPickerInput
                  label="Color"
                  value={typeColor}
                  onChange={(c) => { setTypeColor(c); setTypeVal("color", c); }}
                />
                <div className="flex items-center gap-3 pt-1">
                  <button type="submit" disabled={typeSaving}
                    className="flex items-center gap-1.5 bg-primary text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/90 disabled:opacity-60 transition-all">
                    {typeSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                    {editTypeTarget ? "Update" : "Add"}
                  </button>
                  <button type="button" onClick={() => { setShowTypeForm(false); resetType(); setEditTypeTarget(null); }}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                    Cancel
                  </button>
                </div>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
        <div className="divide-y divide-border">
          {expenseTypes.map((et) => (
            <div key={et.id} className="flex items-center gap-3 px-6 py-3.5 group hover:bg-muted/30 transition-colors">
              <div className="w-9 h-9 rounded-lg flex items-center justify-center text-lg shrink-0"
                style={{ backgroundColor: (et.color ?? "#6b7280") + "22" }}>
                {et.icon ?? "📦"}
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground">{et.name}</p>
                {!et.isActive && <span className="text-xs text-muted-foreground">Inactive</span>}
              </div>
              {et.color && <div className="w-4 h-4 rounded-full border border-white shadow-sm shrink-0" style={{ backgroundColor: et.color }} />}
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => startEditType(et)}
                  className="p-1.5 rounded hover:bg-muted transition-colors text-muted-foreground">
                  <Edit3 className="w-3.5 h-3.5" />
                </button>
                <button onClick={() => setDeleteTypeTarget(et)}
                  className="p-1.5 rounded hover:bg-destructive/10 transition-colors text-muted-foreground hover:text-destructive">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Confirm dialogs ───────────────────────────────────────────── */}
      <ConfirmDialog open={!!deleteTypeTarget} onClose={() => setDeleteTypeTarget(null)}
        onConfirm={handleDeleteType} loading={deletingType} title="Delete Category"
        description={`Delete "${deleteTypeTarget?.name}"? Existing expenses will not be affected.`}
        confirmLabel="Delete" />
      <ConfirmDialog open={!!deleteSrcTarget} onClose={() => setDeleteSrcTarget(null)}
        onConfirm={handleDeleteSrc} loading={deletingSrc} title="Delete Source Type"
        description={`Delete "${deleteSrcTarget?.name}"? Existing incomes will not be affected.`}
        confirmLabel="Delete" />
      <ConfirmDialog open={!!deleteCurTarget} onClose={() => setDeleteCurTarget(null)}
        onConfirm={handleDeleteCurrency} loading={deletingCur} title="Remove Currency"
        description={`Remove ${deleteCurTarget?.code} (${deleteCurTarget?.name})? Existing records will keep their data.`}
        confirmLabel="Remove" variant="warning" />
    </div>
  );
}
