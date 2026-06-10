"use client";
import { useState } from "react";
import { useIncome } from "@/hooks/use-income";
import { useAuthStore } from "@/stores/auth.store";
import { IncomeCard } from "@/components/income/income-card";
import { IncomeForm } from "@/components/income/income-form";
import { EmptyState } from "@/components/shared/empty-state";
import { TableSkeleton } from "@/components/shared/loading-skeleton";
import { useToast } from "@/components/ui/toaster";
import { TrendingUp, Plus } from "lucide-react";
import { IncomeSchema } from "@/lib/validations/income";
import { motion, AnimatePresence } from "framer-motion";

export function IncomePageClient() {
  const { user } = useAuthStore();
  const { incomes, loading, addIncome, totalIncome, totalBalance } = useIncome();
  const { toast } = useToast();
  const [showForm, setShowForm] = useState(false);

  const handleAdd = async (data: IncomeSchema) => {
    if (!user) return;
    await addIncome(user.uid, data);
    toast("Income source added successfully!", "success");
    setShowForm(false);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="page-header">
        <div>
          <h2 className="text-2xl font-bold text-foreground tracking-tight">Income Sources</h2>
          <p className="text-muted-foreground text-sm mt-1">{incomes.length} source{incomes.length !== 1 ? "s" : ""} tracked</p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-2 bg-primary text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-primary/90 transition-all shadow-sm shadow-primary/25">
          <Plus className="w-4 h-4" /> Add Income
        </button>
      </div>

      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
            className="bg-white rounded-xl border border-border shadow-card p-6">
            <h3 className="font-semibold text-foreground mb-4">New Income Source</h3>
            <IncomeForm onSubmit={handleAdd} onCancel={() => setShowForm(false)} submitLabel="Add Income" />
          </motion.div>
        )}
      </AnimatePresence>

      {loading ? <TableSkeleton rows={4} /> : incomes.length === 0 ? (
        <EmptyState icon={TrendingUp} title="No income sources yet"
          description="Add your first income source — salary, gift, freelance, or any other source."
          action={<button onClick={() => setShowForm(true)} className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/90 transition-all"><Plus className="w-4 h-4" />Add your first income</button>} />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {incomes.map((income) => <IncomeCard key={income.id} income={income} />)}
        </div>
      )}
    </div>
  );
}
