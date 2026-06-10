"use client";
import { useState } from "react";
import { useUIStore } from "@/stores/ui.store";
import { useAuthStore } from "@/stores/auth.store";
import { useExpenseStore } from "@/stores/expense.store";
import { useToast } from "@/components/ui/toaster";
import { ExpenseForm } from "./expense-form";
import { ExpenseSchema } from "@/lib/validations/expense";
import { Plus, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export function QuickAddFAB() {
  const { quickAddOpen, openQuickAdd, closeQuickAdd, smartDefaults } = useUIStore();
  const { user } = useAuthStore();
  const { addExpense } = useExpenseStore();
  const { toast } = useToast();

  const handleSubmit = async (data: ExpenseSchema) => {
    if (!user) return;
    await addExpense(user.uid, data);
    toast("Expense added!", "success");
    closeQuickAdd();
  };

  return (
    <>
      <AnimatePresence>
        {quickAddOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
            onClick={closeQuickAdd} />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {quickAddOpen && (
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.96 }}
            transition={{ type: "spring", damping: 28, stiffness: 400 }}
            className="fixed bottom-24 right-6 z-50 w-full max-w-md bg-white rounded-2xl shadow-2xl border border-border p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-semibold text-foreground">Quick Add Expense</h3>
                <p className="text-xs text-muted-foreground mt-0.5">Smart defaults applied from last entry</p>
              </div>
              <button onClick={closeQuickAdd} className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground">
                <X className="w-4 h-4" />
              </button>
            </div>
            <ExpenseForm
              defaultValues={{
                incomeSourceId: smartDefaults.incomeSourceId,
                spentById: smartDefaults.spentById,
                expenseTypeId: smartDefaults.expenseTypeId,
                tagIds: smartDefaults.tagIds ?? [],
              }}
              onSubmit={handleSubmit}
              onCancel={closeQuickAdd}
              submitLabel="Add Expense"
            />
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        onClick={quickAddOpen ? closeQuickAdd : openQuickAdd}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-primary text-white shadow-lg shadow-primary/30 flex items-center justify-center hover:bg-primary/90 transition-colors">
        <motion.div animate={{ rotate: quickAddOpen ? 45 : 0 }} transition={{ duration: 0.2 }}>
          <Plus className="w-6 h-6" />
        </motion.div>
      </motion.button>
    </>
  );
}
