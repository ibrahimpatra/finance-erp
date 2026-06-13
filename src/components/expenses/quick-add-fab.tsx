"use client";
import { useState } from "react";
import { useUIStore } from "@/stores/ui.store";
import { useAuthStore } from "@/stores/auth.store";
import { useExpenseStore } from "@/stores/expense.store";
import { useIncomeStore } from "@/stores/income.store";
import { useTagStore } from "@/stores/tag.store";
import { useExpenseTypeStore } from "@/stores/expense-type.store";
import { useIncomeSourceTypeStore } from "@/stores/income-source-type.store";
import { useToast } from "@/components/ui/toaster";
import { ExpenseForm } from "./expense-form";
import { IncomeForm } from "@/components/income/income-form";
import { FormDrawer } from "@/components/shared/form-drawer";
import { ExpenseSchema } from "@/lib/validations/expense";
import { IncomeSchema } from "@/lib/validations/income";
import { TAG_COLORS } from "@/types";
import {
  Plus, X, Receipt, TrendingUp, ArrowLeftRight,
  Tag, Layers, Briefcase,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { transferSchema, TransferSchema } from "@/lib/validations/transfer";
import { useTransferStore } from "@/stores/transfer.store";
import { useIncome } from "@/hooks/use-income";
import { useSettingsStore } from "@/stores/settings.store";
import { useCurrency } from "@/hooks/use-currency";
import { Loader2 } from "lucide-react";
import { tagSchema, TagSchema } from "@/lib/validations/tag";
import { expenseTypeSchema, ExpenseTypeSchema } from "@/lib/validations/expense-type";
import { IncomeSourceTypeFormData } from "@/types";
import { ColorPickerInput } from "@/components/shared/color-picker-input";

const inp = "w-full px-3.5 py-2.5 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary transition-all";

const ACTIONS = [
  { id: "expense",      label: "Expense",       icon: Receipt,         bg: "bg-red-500",     ring: "ring-red-500/30" },
  { id: "income",       label: "Income",        icon: TrendingUp,      bg: "bg-emerald-500", ring: "ring-emerald-500/30" },
  { id: "transfer",     label: "Transfer",      icon: ArrowLeftRight,  bg: "bg-amber-500",   ring: "ring-amber-500/30" },
  { id: "tag",          label: "Tag",           icon: Tag,             bg: "bg-purple-500",  ring: "ring-purple-500/30" },
  { id: "category",     label: "Category",      icon: Layers,          bg: "bg-indigo-500",  ring: "ring-indigo-500/30" },
  { id: "incometype",   label: "Income Type",   icon: Briefcase,       bg: "bg-blue-500",    ring: "ring-blue-500/30" },
] as const;

type ActionId = typeof ACTIONS[number]["id"];

export function QuickAddFAB() {
  const { drawerCount, smartDefaults } = useUIStore();
  const { user }       = useAuthStore();
  const { addExpense } = useExpenseStore();
  const { addIncome }  = useIncomeStore();
  const { addTransfer }= useTransferStore();
  const { addTag }     = useTagStore();
  const { addExpenseType } = useExpenseTypeStore();
  const { addSourceType }  = useIncomeSourceTypeStore();
  const { settings }   = useSettingsStore();
  const { incomes }    = useIncome();
  const { formatFor }  = useCurrency();
  const { toast }      = useToast();

  const defaultCode = settings?.currencyCode ?? "KWD";

  const [menuOpen,   setMenuOpen]   = useState(false);
  const [activeForm, setActiveForm] = useState<ActionId | null>(null);

  /* ── Tag form ─────────────────────────────────────────────── */
  const [tagColor, setTagColor] = useState<string>(TAG_COLORS[0]);
  const { register: regTag, handleSubmit: hTag, reset: resetTag,
    setValue: setTagVal, formState: { errors: tagErr, isSubmitting: tagSaving } } =
    useForm<TagSchema>({ resolver: zodResolver(tagSchema), defaultValues: { color: TAG_COLORS[0] } });

  /* ── Expense category form ────────────────────────────────── */
  const [catColor, setCatColor] = useState("#6b7280");
  const { register: regCat, handleSubmit: hCat, reset: resetCat,
    setValue: setCatVal, formState: { errors: catErr, isSubmitting: catSaving } } =
    useForm<ExpenseTypeSchema>({ resolver: zodResolver(expenseTypeSchema), defaultValues: { isActive: true } });

  /* ── Income type form ─────────────────────────────────────── */
  const [itColor, setItColor] = useState("#3b82f6");
  const [itName, setItName] = useState(""); const [itIcon, setItIcon] = useState("💼"); const [itSaving, setItSaving] = useState(false);

  /* ── Transfer form ────────────────────────────────────────── */
  const { register: regTr, handleSubmit: hTr, reset: resetTr, watch: watchTr,
    formState: { errors: trErr, isSubmitting: trSaving } } =
    useForm<TransferSchema>({ resolver: zodResolver(transferSchema) });
  const fromId  = watchTr("fromIncomeId");
  const fromInc = incomes.find((i) => i.id === fromId);
  const fromCur = fromInc?.currencyCode || defaultCode;

  /* ── Helpers ──────────────────────────────────────────────── */
  const open  = (id: ActionId) => { setMenuOpen(false); setActiveForm(id); };
  const close = () => setActiveForm(null);


  /* ── Handlers ─────────────────────────────────────────────── */
  const onExpense = async (data: ExpenseSchema) => {
    if (!user) return;
    try { await addExpense(user.uid, data); toast("Expense added!", "success"); close(); }
    catch (e: unknown) { toast((e as Error).message, "error"); }
  };
  const onIncome = async (data: IncomeSchema) => {
    if (!user) return;
    try { await addIncome(user.uid, data); toast("Income added!", "success"); close(); }
    catch (e: unknown) { toast((e as Error).message, "error"); }
  };
  const onTransfer = async (data: TransferSchema) => {
    if (!user) return;
    try {
      await addTransfer(user.uid, { ...data, fromCurrencyCode: fromCur, toCurrencyCode: fromCur, toAmount: data.amount });
      toast("Transfer done!", "success"); resetTr(); close();
    } catch (e: unknown) { toast((e as Error).message, "error"); }
  };
  const onTag = async (data: TagSchema) => {
    if (!user) return;
    try { await addTag(user.uid, { ...data, color: tagColor }); toast("Tag created!", "success"); resetTag(); setTagColor(TAG_COLORS[0]); close(); }
    catch (e: unknown) { toast((e as Error).message, "error"); }
  };
  const onCategory = async (data: ExpenseTypeSchema) => {
    if (!user) return;
    try { await addExpenseType(user.uid, { ...data, color: catColor }); toast("Category added!", "success"); resetCat(); setCatColor("#6b7280"); close(); }
    catch (e: unknown) { toast((e as Error).message, "error"); }
  };
  const onIncomeType = async () => {
    if (!user || !itName.trim()) return;
    setItSaving(true);
    try { await addSourceType(user.uid, { name: itName.trim(), icon: itIcon, color: itColor, isActive: true } as IncomeSourceTypeFormData); toast("Income type added!", "success"); setItName(""); setItIcon("💼"); setItColor("#3b82f6"); close(); }
    catch (e: unknown) { toast((e as Error).message, "error"); }
    finally { setItSaving(false); }
  };

  return (
    <>
      {/* ── Speed-dial + FAB button: hidden when any drawer is open ── */}
      {drawerCount === 0 && (
        <>
      <AnimatePresence>
        {menuOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-[54]" onClick={() => setMenuOpen(false)} />
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="fixed bottom-24 right-4 z-[55] flex flex-col-reverse gap-2.5">
              {ACTIONS.map(({ id, label, icon: Icon, bg, ring }, i) => (
                <motion.button key={id}
                  initial={{ opacity: 0, y: 10, scale: 0.9 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.9 }}
                  transition={{ delay: i * 0.04, type: "spring", damping: 20 }}
                  onClick={() => open(id)}
                  className="flex items-center gap-3 self-end group">
                  <span className="bg-white text-xs font-semibold text-foreground px-3 py-1.5 rounded-full shadow-md border border-border opacity-0 group-hover:opacity-100 transition-opacity">
                    {label}
                  </span>
                  <div className={`w-12 h-12 ${bg} rounded-full flex items-center justify-center shadow-lg ring-4 ${ring} transition-transform hover:scale-105`}>
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                </motion.button>
              ))}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── FAB button ─────────────────────────────────────────── */}
      <motion.button
        onClick={() => setMenuOpen((v) => !v)}
        whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
        className="fixed bottom-5 right-5 z-[55] w-14 h-14 rounded-full bg-primary text-white shadow-lg shadow-primary/30 flex items-center justify-center hover:bg-primary/90 transition-colors">
        <motion.div animate={{ rotate: menuOpen ? 45 : 0 }} transition={{ duration: 0.2 }}>
          <Plus className="w-6 h-6" />
        </motion.div>
      </motion.button>
        </>
      )}

      {/* ── Form drawers: always mounted so they don't lose state ── */}

      {/* Expense */}
      <FormDrawer isOpen={activeForm === "expense"} onClose={close} title="Quick Add Expense">
        <ExpenseForm defaultValues={{ incomeSourceId: smartDefaults.incomeSourceId, spentById: smartDefaults.spentById, expenseTypeId: smartDefaults.expenseTypeId, tagIds: smartDefaults.tagIds ?? [] }}
          onSubmit={onExpense} onCancel={close} submitLabel="Add Expense" />
      </FormDrawer>

      {/* Income */}
      <FormDrawer isOpen={activeForm === "income"} onClose={close} title="Add Income Source">
        <IncomeForm onSubmit={onIncome} onCancel={close} submitLabel="Add Income" />
      </FormDrawer>

      {/* Transfer */}
      <FormDrawer isOpen={activeForm === "transfer"} onClose={close} title="New Transfer">
        <form onSubmit={hTr(onTransfer)} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium">From *</label>
            <select {...regTr("fromIncomeId")} className={inp}>
              <option value="">Select source…</option>
              {incomes.map((i) => { const c = i.currencyCode || defaultCode; return <option key={i.id} value={i.id}>{i.name} · {formatFor(i.balance, c)} [{c}]</option>; })}
            </select>
            {trErr.fromIncomeId && <p className="text-xs text-destructive">{trErr.fromIncomeId.message}</p>}
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">To *</label>
            <select {...regTr("toIncomeId")} className={inp}>
              <option value="">Select destination…</option>
              {incomes.map((i) => { const c = i.currencyCode || defaultCode; return <option key={i.id} value={i.id}>{i.name} [{c}]</option>; })}
            </select>
            {trErr.toIncomeId && <p className="text-xs text-destructive">{trErr.toIncomeId.message}</p>}
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Amount *</label>
            <input {...regTr("amount")} type="number" step="0.001" min="0.001" placeholder="0.000" className={inp} />
            {trErr.amount && <p className="text-xs text-destructive">{trErr.amount.message}</p>}
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Note</label>
            <input {...regTr("note")} placeholder="Optional…" className={inp} />
          </div>
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={close} className="flex-1 px-4 py-2.5 rounded-lg border border-border text-sm font-medium hover:bg-muted transition-colors">Cancel</button>
            <button type="submit" disabled={trSaving} className="flex-1 flex items-center justify-center gap-2 bg-primary text-white px-4 py-2.5 rounded-lg text-sm font-semibold hover:bg-primary/90 disabled:opacity-60 transition-all">
              {trSaving && <Loader2 className="w-4 h-4 animate-spin" />} Transfer
            </button>
          </div>
        </form>
      </FormDrawer>

      {/* Tag */}
      <FormDrawer isOpen={activeForm === "tag"} onClose={close} title="New Tag">
        <form onSubmit={hTag(onTag)} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Name *</label>
            <input {...regTag("name")} placeholder="e.g. Groceries" className={inp} autoFocus />
            {tagErr.name && <p className="text-xs text-destructive">{tagErr.name.message}</p>}
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Description</label>
            <input {...regTag("description")} placeholder="Optional…" className={inp} />
          </div>
          <ColorPickerInput label="Color" value={tagColor} onChange={(c) => { setTagColor(c); setTagVal("color", c); }} />
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={close} className="flex-1 px-4 py-2.5 rounded-lg border border-border text-sm font-medium hover:bg-muted transition-colors">Cancel</button>
            <button type="submit" disabled={tagSaving} className="flex-1 flex items-center justify-center gap-2 bg-primary text-white px-4 py-2.5 rounded-lg text-sm font-semibold hover:bg-primary/90 disabled:opacity-60 transition-all">
              {tagSaving && <Loader2 className="w-4 h-4 animate-spin" />} Create Tag
            </button>
          </div>
        </form>
      </FormDrawer>

      {/* Expense Category */}
      <FormDrawer isOpen={activeForm === "category"} onClose={close} title="New Expense Category">
        <form onSubmit={hCat(onCategory)} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Name *</label>
            <input {...regCat("name")} placeholder="e.g. Food" className={inp} autoFocus />
            {catErr.name && <p className="text-xs text-destructive">{catErr.name.message}</p>}
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Icon (emoji)</label>
            <input {...regCat("icon")} placeholder="🍔" className={inp} />
          </div>
          <ColorPickerInput label="Color" value={catColor} onChange={(c) => { setCatColor(c); setCatVal("color", c); }} />
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={close} className="flex-1 px-4 py-2.5 rounded-lg border border-border text-sm font-medium hover:bg-muted transition-colors">Cancel</button>
            <button type="submit" disabled={catSaving} className="flex-1 flex items-center justify-center gap-2 bg-primary text-white px-4 py-2.5 rounded-lg text-sm font-semibold hover:bg-primary/90 disabled:opacity-60 transition-all">
              {catSaving && <Loader2 className="w-4 h-4 animate-spin" />} Add Category
            </button>
          </div>
        </form>
      </FormDrawer>

      {/* Income Type */}
      <FormDrawer isOpen={activeForm === "incometype"} onClose={close} title="New Income Type">
        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Name *</label>
            <input value={itName} onChange={(e) => setItName(e.target.value)} placeholder="e.g. Salary" className={inp} autoFocus />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Icon (emoji)</label>
            <input value={itIcon} onChange={(e) => setItIcon(e.target.value)} placeholder="💼" className={inp} />
          </div>
          <ColorPickerInput label="Color" value={itColor} onChange={setItColor} />
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={close} className="flex-1 px-4 py-2.5 rounded-lg border border-border text-sm font-medium hover:bg-muted transition-colors">Cancel</button>
            <button type="button" onClick={onIncomeType} disabled={itSaving || !itName.trim()}
              className="flex-1 flex items-center justify-center gap-2 bg-primary text-white px-4 py-2.5 rounded-lg text-sm font-semibold hover:bg-primary/90 disabled:opacity-60 transition-all">
              {itSaving && <Loader2 className="w-4 h-4 animate-spin" />} Add Type
            </button>
          </div>
        </div>
      </FormDrawer>
    </>
  );
}
