"use client";
import { useState } from "react";
import { useIncome } from "@/hooks/use-income";
import { useAuthStore } from "@/stores/auth.store";
import { IncomeCard } from "@/components/income/income-card";
import { IncomeForm } from "@/components/income/income-form";
import { EmptyState } from "@/components/shared/empty-state";
import { TableSkeleton } from "@/components/shared/loading-skeleton";
import { FormDrawer } from "@/components/shared/form-drawer";
import { useToast } from "@/components/ui/toaster";
import { TrendingUp, Plus } from "lucide-react";
import { IncomeSchema } from "@/lib/validations/income";

export function IncomePageClient() {
  const { user }  = useAuthStore();
  const { incomes, loading, addIncome, totalIncome, totalBalance } = useIncome();
  const { toast } = useToast();
  const [showForm, setShowForm] = useState(false);

  // ── Bug fix: wrap in try/catch so errors display as toast, not unhandled ──
  const handleAdd = async (data: IncomeSchema) => {
    if (!user) return;
    try {
      await addIncome(user.uid, data);
      toast("Income source added successfully!", "success");
      setShowForm(false);
    } catch (e: unknown) {
      toast((e as Error).message || "Failed to save income. Please try again.", "error");
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">

      {/* ── Page header ──────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">Income Sources</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {incomes.length} source{incomes.length !== 1 ? "s" : ""} tracked
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 bg-primary text-white px-4 py-2.5 rounded-lg text-sm font-semibold hover:bg-primary/90 transition-all shadow-sm shadow-primary/20"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">Add Income</span>
          <span className="sm:hidden">Add</span>
        </button>
      </div>

      {/* ── Content ──────────────────────────────────────────── */}
      {loading ? (
        <TableSkeleton rows={4} />
      ) : incomes.length === 0 ? (
        <EmptyState
          icon={TrendingUp}
          title="No income sources yet"
          description="Add your first income source — salary, gift, freelance, or any other source."
          action={
            <button
              onClick={() => setShowForm(true)}
              className="flex items-center gap-2 bg-primary text-white px-4 py-2.5 rounded-lg text-sm font-semibold hover:bg-primary/90 transition-all"
            >
              <Plus className="w-4 h-4" /> Add your first income
            </button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {incomes.map((income) => (
            <IncomeCard key={income.id} income={income} />
          ))}
        </div>
      )}

      {/* ── Form drawer ──────────────────────────────────────── */}
      <FormDrawer
        isOpen={showForm}
        onClose={() => setShowForm(false)}
        title="New Income Source"
        description="Track a new income stream or fund"
      >
        <IncomeForm
          onSubmit={handleAdd}
          onCancel={() => setShowForm(false)}
          submitLabel="Add Income"
        />
      </FormDrawer>
    </div>
  );
}
