"use client";
import { useState, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useUIStore } from "@/stores/ui.store";
import { useAuthStore } from "@/stores/auth.store";
import { useExpenseStore } from "@/stores/expense.store";
import { useIncomeStore } from "@/stores/income.store";
import { useTagStore } from "@/stores/tag.store";
import { useExpenseTypeStore } from "@/stores/expense-type.store";
import { useIncomeSourceTypeStore } from "@/stores/income-source-type.store";
import { useTransferStore } from "@/stores/transfer.store";
import { useBankAccountStore } from "@/stores/bank-account.store";
import { useIncome } from "@/hooks/use-income";
import { useBankAccounts } from "@/hooks/use-bank-accounts";
import { useSettingsStore } from "@/stores/settings.store";
import { useCurrency } from "@/hooks/use-currency";
import { useToast } from "@/components/ui/toaster";
import { ExpenseForm } from "./expense-form";
import { IncomeForm } from "@/components/income/income-form";
import { CategoryForm } from "@/components/shared/category-form";
import { IncomeTypeForm } from "@/components/shared/income-type-form";
import { TagForm } from "@/components/shared/tag-form";
import { AccountForm } from "@/components/bank-accounts/account-form";
import { FormDrawer } from "@/components/shared/form-drawer";
import { ExpenseSchema } from "@/lib/validations/expense";
import { IncomeSchema } from "@/lib/validations/income";
import { tagSchema, TagSchema } from "@/lib/validations/tag";
import { expenseTypeSchema, ExpenseTypeSchema } from "@/lib/validations/expense-type";
import { transferSchema, TransferSchema } from "@/lib/validations/transfer";
import { BankAccountSchema } from "@/lib/validations/bank-account";
import { TAG_COLORS, BankAccountFormData } from "@/types";
import {
  Plus, Receipt, TrendingUp, ArrowLeftRight,
  Tag, Layers, Briefcase, Loader2, Landmark,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const inp = "w-full px-3.5 py-2.5 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary transition-all";

const ACTIONS = [
  { id: "expense",    label: "Expense",      icon: Receipt,        bg: "bg-red-500",     ring: "ring-red-500/30" },
  { id: "income",     label: "Income",       icon: TrendingUp,     bg: "bg-emerald-500", ring: "ring-emerald-500/30" },
  { id: "account",    label: "Account",      icon: Landmark,       bg: "bg-teal-500",    ring: "ring-teal-500/30" },
  { id: "transfer",   label: "Transfer",     icon: ArrowLeftRight, bg: "bg-amber-500",   ring: "ring-amber-500/30" },
  { id: "tag",        label: "Tag",          icon: Tag,            bg: "bg-purple-500",  ring: "ring-purple-500/30" },
  { id: "category",   label: "Category",     icon: Layers,         bg: "bg-indigo-500",  ring: "ring-indigo-500/30" },
  { id: "incometype", label: "Income Type",  icon: Briefcase,      bg: "bg-blue-500",    ring: "ring-blue-500/30" },
] as const;

type ActionId = typeof ACTIONS[number]["id"];

export function QuickAddFAB() {
  const { drawerCount, smartDefaults } = useUIStore();
  const { user }         = useAuthStore();
  const { addExpense }   = useExpenseStore();
  const { addIncome }    = useIncomeStore();
  const { addTransfer }  = useTransferStore();
  const { addTag }       = useTagStore();
  const { addExpenseType }  = useExpenseTypeStore();
  const { addSourceType }   = useIncomeSourceTypeStore();
  const { addAccount }      = useBankAccountStore();
  const { accounts }        = useBankAccounts();
  const { settings }     = useSettingsStore();
  const { incomes }      = useIncome();
  const { formatFor }    = useCurrency();
  const { toast }        = useToast();
  const defaultCode      = settings?.currencyCode ?? "";

  // ── Form stack: supports back-navigation between forms ────────
  const [formStack, setFormStack] = useState<ActionId[]>([]);
  const [menuOpen,  setMenuOpen]  = useState(false);

  const activeForm = formStack[formStack.length - 1] ?? null;

  const openForm = useCallback((id: ActionId) => {
    setMenuOpen(false);
    setFormStack((s) => (s.includes(id) ? s : [...s, id]));
  }, []);

  // FIX (Phase 3.3): if bank accounts exist, the expense form resolves its
  // income source via FIFO from the selected account — a stale
  // smartDefaults.incomeSourceId from before account migration would
  // otherwise pre-fill an income that doesn't belong to the chosen account,
  // leaving the dropdown empty/confusing. Clear it specifically when opening
  // the expense form in account mode; every other smart default is untouched.
  const openExpenseForm = useCallback(() => {
    if (accounts.length > 0 && smartDefaults.incomeSourceId) {
      useUIStore.getState().setSmartDefaults({ ...smartDefaults, incomeSourceId: undefined });
    }
    openForm("expense");
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accounts.length, smartDefaults, openForm]);

  // Pop the top form — reveals the one below if any
  const closeTop = useCallback(() => {
    setFormStack((s) => s.slice(0, -1));
  }, []);

  // ── All form hooks at top level (state preserved across open/close) ──

  // Tag form
  const [tagColor, setTagColor] = useState<string>(TAG_COLORS[0]);
  const tagForm = useForm<TagSchema>({
    resolver: zodResolver(tagSchema),
    defaultValues: { color: TAG_COLORS[0] },
  });

  // Category form
  const [catColor, setCatColor] = useState<string>("#6b7280");
  const catForm = useForm<ExpenseTypeSchema>({
    resolver: zodResolver(expenseTypeSchema),
    defaultValues: { isActive: true, icon: "📦" },
  });

  // Income type form
  const [itColor, setItColor] = useState<string>("#3b82f6");
  const itForm = useForm<ExpenseTypeSchema>({
    resolver: zodResolver(expenseTypeSchema),
    defaultValues: { isActive: true, icon: "💼" },
  });

  // Transfer form
  const trForm = useForm<TransferSchema>({ resolver: zodResolver(transferSchema) });
  const fromId  = trForm.watch("fromIncomeId");
  const fromInc = incomes.find((i) => i.id === fromId);
  const fromCur = fromInc?.currencyCode || defaultCode;

  // ── Handlers ─────────────────────────────────────────────────
  const onExpense = async (data: ExpenseSchema) => {
    if (!user) return;
    try { await addExpense(user.uid, data); toast("Expense added!", "success"); closeTop(); }
    catch (e: unknown) { toast((e as Error).message, "error"); }
  };

  const onIncome = async (data: IncomeSchema) => {
    if (!user) return;
    try { await addIncome(user.uid, data); toast("Income added!", "success"); closeTop(); }
    catch (e: unknown) { toast((e as Error).message, "error"); }
  };

  const onTransfer = async (data: TransferSchema) => {
    if (!user) return;
    try {
      await addTransfer(user.uid, {
        ...data,
        fromCurrencyCode: fromCur,
        toCurrencyCode: fromCur,
        toAmount: data.amount,
      });
      toast("Transfer done!", "success"); trForm.reset(); closeTop();
    } catch (e: unknown) { toast((e as Error).message, "error"); }
  };

  const onTag = async (data: TagSchema) => {
    if (!user) return;
    try {
      await addTag(user.uid, { ...data, color: tagColor });
      toast("Tag created!", "success");
      tagForm.reset({ color: TAG_COLORS[0] }); setTagColor(TAG_COLORS[0]); closeTop();
    } catch (e: unknown) { toast((e as Error).message, "error"); }
  };

  const onCategory = async (data: ExpenseTypeSchema) => {
    if (!user) return;
    try {
      await addExpenseType(user.uid, { ...data, color: catColor });
      toast("Category added!", "success");
      catForm.reset({ isActive: true, icon: "📦" }); setCatColor("#6b7280"); closeTop();
    } catch (e: unknown) { toast((e as Error).message, "error"); }
  };

  const onIncomeType = async (data: ExpenseTypeSchema) => {
    if (!user) return;
    try {
      await addSourceType(user.uid, { name: data.name, icon: data.icon, color: itColor, isActive: true });
      toast("Income type added!", "success");
      itForm.reset({ isActive: true, icon: "💼" }); setItColor("#3b82f6"); closeTop();
    } catch (e: unknown) { toast((e as Error).message, "error"); }
  };

  const onAccount = async (data: BankAccountSchema) => {
    if (!user) return;
    try {
      await addAccount(user.uid, data as BankAccountFormData);
      toast("Account created!", "success");
      closeTop();
    } catch (e: unknown) { toast((e as Error).message, "error"); }
  };

  return (
    <>
      {/* Speed-dial + button: only when no drawer is open */}
      {drawerCount === 0 && (
        <>
          <AnimatePresence>
            {menuOpen && (
              <>
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="fixed inset-0 z-[54]" onClick={() => setMenuOpen(false)} />
                <motion.div
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  transition={{ duration: 0.15 }}
                  className="fixed bottom-24 right-4 z-[55] flex flex-col-reverse gap-2.5">
                  {ACTIONS.map(({ id, label, icon: Icon, bg, ring }, i) => (
                    <motion.button key={id}
                      initial={{ opacity: 0, y: 10, scale: 0.9 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.9 }}
                      transition={{ delay: i * 0.04, type: "spring", damping: 20 }}
                      onClick={() => id === "expense" ? openExpenseForm() : openForm(id)}
                      className="flex items-center gap-3 self-end">
                      <span className="bg-white text-xs font-semibold text-foreground px-3 py-1.5 rounded-full shadow-md border border-border">
                        {label}
                      </span>
                      <div className={`w-12 h-12 ${bg} rounded-full flex items-center justify-center shadow-lg ring-4 ${ring} hover:scale-105 transition-transform`}>
                        <Icon className="w-5 h-5 text-white" />
                      </div>
                    </motion.button>
                  ))}
                </motion.div>
              </>
            )}
          </AnimatePresence>

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

      {/* ── Form drawers: always mounted, form state preserved ── */}

      <FormDrawer isOpen={activeForm === "expense"} onClose={closeTop} title="Quick Add Expense">
        <ExpenseForm
          defaultValues={{
            incomeSourceId: smartDefaults.incomeSourceId,
            spentById: smartDefaults.spentById,
            expenseTypeId: smartDefaults.expenseTypeId,
            tagIds: smartDefaults.tagIds ?? [],
          }}
          onSubmit={onExpense}
          onCancel={closeTop}
          submitLabel="Add Expense"
        />
      </FormDrawer>

      <FormDrawer isOpen={activeForm === "income"} onClose={closeTop} title="Add Income Source">
        <IncomeForm onSubmit={onIncome} onCancel={closeTop} submitLabel="Add Income" />
      </FormDrawer>

      {/* Account — NEW (Phase 8) */}
      <FormDrawer isOpen={activeForm === "account"} onClose={closeTop} title="New Bank Account">
        <AccountForm onSubmit={onAccount} onCancel={closeTop} submitLabel="Create Account" />
      </FormDrawer>

      <FormDrawer isOpen={activeForm === "transfer"} onClose={closeTop} title="New Transfer">
        <form onSubmit={trForm.handleSubmit(onTransfer)} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium">From *</label>
            <select {...trForm.register("fromIncomeId")} className={inp}>
              <option value="">Select source…</option>
              {incomes.map((i) => {
                const c = i.currencyCode || defaultCode;
                return <option key={i.id} value={i.id}>{i.name} · {formatFor(i.balance, c)} [{c}]</option>;
              })}
            </select>
            {trForm.formState.errors.fromIncomeId && (
              <p className="text-xs text-destructive">{trForm.formState.errors.fromIncomeId.message}</p>
            )}
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">To *</label>
            <select {...trForm.register("toIncomeId")} className={inp}>
              <option value="">Select destination…</option>
              {incomes.map((i) => {
                const c = i.currencyCode || defaultCode;
                return <option key={i.id} value={i.id}>{i.name} [{c}]</option>;
              })}
            </select>
            {trForm.formState.errors.toIncomeId && (
              <p className="text-xs text-destructive">{trForm.formState.errors.toIncomeId.message}</p>
            )}
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Amount *</label>
            <input {...trForm.register("amount")} type="number" step="0.001" min="0.001" placeholder="0.000" className={inp} />
            {trForm.formState.errors.amount && (
              <p className="text-xs text-destructive">{trForm.formState.errors.amount.message}</p>
            )}
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Note</label>
            <input {...trForm.register("note")} placeholder="Optional…" className={inp} />
          </div>
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={closeTop}
              className="flex-1 px-4 py-2.5 rounded-lg border border-border text-sm font-medium hover:bg-muted transition-colors">Cancel</button>
            <button type="submit" disabled={trForm.formState.isSubmitting}
              className="flex-1 flex items-center justify-center gap-2 bg-primary text-white px-4 py-2.5 rounded-lg text-sm font-semibold hover:bg-primary/90 disabled:opacity-60 transition-all">
              {trForm.formState.isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />} Transfer
            </button>
          </div>
        </form>
      </FormDrawer>

      {/* Tag — uses shared TagForm */}
      <FormDrawer isOpen={activeForm === "tag"} onClose={closeTop} title="New Tag">
        <TagForm
          form={tagForm}
          selectedColor={tagColor}
          onColorChange={(c) => { setTagColor(c); tagForm.setValue("color", c); }}
          onSubmit={onTag}
          onCancel={closeTop}
          submitLabel="Create Tag"
        />
      </FormDrawer>

      {/* Category — uses shared CategoryForm */}
      <FormDrawer isOpen={activeForm === "category"} onClose={closeTop} title="New Expense Category">
        <CategoryForm
          form={catForm}
          color={catColor}
          onColorChange={setCatColor}
          onSubmit={onCategory}
          onCancel={closeTop}
          submitLabel="Add Category"
        />
      </FormDrawer>

      {/* Income Type — uses shared IncomeTypeForm */}
      <FormDrawer isOpen={activeForm === "incometype"} onClose={closeTop} title="New Income Type">
        <IncomeTypeForm
          form={itForm}
          color={itColor}
          onColorChange={setItColor}
          onSubmit={onIncomeType}
          onCancel={closeTop}
          submitLabel="Add Type"
        />
      </FormDrawer>
    </>
  );
}
