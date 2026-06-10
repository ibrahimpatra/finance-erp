"use client";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { spentBySchema, SpentBySchema } from "@/lib/validations/spent-by";
import { useSpentBy } from "@/hooks/use-spent-by";
import { useExpenses } from "@/hooks/use-expenses";
import { useAuthStore } from "@/stores/auth.store";
import { useSpentByStore } from "@/stores/spent-by.store";
import { useCurrency } from "@/hooks/use-currency";
import { useToast } from "@/components/ui/toaster";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { EmptyState } from "@/components/shared/empty-state";
import { TableSkeleton } from "@/components/shared/loading-skeleton";
import { AVATAR_COLORS, SpentBy } from "@/types";
import { getInitials } from "@/lib/utils/helpers";
import Link from "next/link";
import { Users, Plus, Loader2, Edit3, Trash2, Phone } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const inp = "w-full px-3.5 py-2.5 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all";

export function SpentByPageClient() {
  const { user } = useAuthStore();
  const { spentBys, loading } = useSpentBy();
  const { expenses } = useExpenses();
  const { addSpentBy, editSpentBy, removeSpentBy } = useSpentByStore();
  const { format } = useCurrency();
  const { toast } = useToast();
  const [showForm, setShowForm] = useState(false);
  const [editTarget, setEditTarget] = useState<SpentBy | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<SpentBy | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [selectedColor, setSelectedColor] = useState<string>(AVATAR_COLORS[0]);

  const { register, handleSubmit, reset, setValue, formState: { errors, isSubmitting } } = useForm<SpentBySchema>({
    resolver: zodResolver(spentBySchema),
    defaultValues: { isActive: true },
  });

  const onSubmit = async (data: SpentBySchema) => {
    if (!user) return;
    const payload = { ...data, avatarColor: selectedColor };
    if (editTarget) {
      await editSpentBy(user.uid, editTarget.id, payload, editTarget);
      toast("Updated!", "success");
    } else {
      await addSpentBy(user.uid, payload);
      toast("Person added!", "success");
    }
    reset(); setShowForm(false); setEditTarget(null); setSelectedColor(AVATAR_COLORS[0]);
  };

  const startEdit = (person: SpentBy) => {
    setEditTarget(person);
    setValue("name", person.name);
    setValue("phone", person.phone ?? "");
    setValue("notes", person.notes ?? "");
    setValue("isActive", person.isActive);
    setSelectedColor(person.avatarColor ?? AVATAR_COLORS[0]);
    setShowForm(true);
  };

  const handleDelete = async () => {
    if (!user || !deleteTarget) return;
    setDeleting(true);
    try {
      await removeSpentBy(user.uid, deleteTarget.id);
      toast("Person removed.", "success");
    } catch (e: unknown) {
      toast((e as Error).message, "error");
    }
    setDeleting(false); setDeleteTarget(null);
  };

  const getStats = (personId: string) => {
    const personExpenses = expenses.filter((e) => e.spentById === personId);
    return {
      count: personExpenses.length,
      total: personExpenses.reduce((a, e) => a + e.amount, 0),
    };
  };

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="page-header">
        <div>
          <h2 className="text-2xl font-bold text-foreground tracking-tight">Spent By</h2>
          <p className="text-muted-foreground text-sm mt-1">{spentBys.length} people tracked</p>
        </div>
        <button onClick={() => { setShowForm(true); setEditTarget(null); reset(); }}
          className="flex items-center gap-2 bg-primary text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-primary/90 transition-all shadow-sm shadow-primary/25">
          <Plus className="w-4 h-4" /> Add Person
        </button>
      </div>

      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
            className="bg-white rounded-xl border border-border shadow-card p-6">
            <h3 className="font-semibold mb-4">{editTarget ? "Edit Person" : "New Person"}</h3>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Avatar Color</label>
                <div className="flex flex-wrap gap-2">
                  {AVATAR_COLORS.map((color) => (
                    <button key={color} type="button" onClick={() => setSelectedColor(color)}
                      className={`w-8 h-8 rounded-full transition-all ${selectedColor === color ? "ring-2 ring-offset-2 ring-primary scale-110" : "hover:scale-105"}`}
                      style={{ backgroundColor: color }} />
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-sm font-medium">Name *</label>
                  <input {...register("name")} placeholder="e.g. Ahmed" className={inp} />
                  {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium">Phone</label>
                  <input {...register("phone")} placeholder="+965 xxxx xxxx" className={inp} />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">Notes</label>
                <input {...register("notes")} placeholder="Optional notes…" className={inp} />
              </div>
              <div className="flex gap-3">
                <button type="button" onClick={() => { setShowForm(false); reset(); setEditTarget(null); }} className="flex-1 px-4 py-2.5 rounded-lg border border-border text-sm font-medium hover:bg-muted transition-colors">Cancel</button>
                <button type="submit" disabled={isSubmitting} className="flex-1 flex items-center justify-center gap-2 bg-primary text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-primary/90 disabled:opacity-60 transition-all">
                  {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  {editTarget ? "Save Changes" : "Add Person"}
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {loading ? <TableSkeleton rows={4} /> : spentBys.length === 0 ? (
        <EmptyState icon={Users} title="No people added yet"
          description="Add people who spend money — family members, employees, or yourself."
          action={<button onClick={() => setShowForm(true)} className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/90 transition-all"><Plus className="w-4 h-4" />Add first person</button>} />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {spentBys.map((person) => {
            const stats = getStats(person.id);
            return (
              <div key={person.id} className="stat-card group hover:shadow-card-hover transition-all">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-full flex items-center justify-center text-sm font-bold text-white shrink-0"
                      style={{ backgroundColor: person.avatarColor ?? "#6b7280" }}>
                      {getInitials(person.name)}
                    </div>
                    <div>
                      <Link href={`/spent-by/${person.id}`} className="font-semibold text-foreground hover:text-primary transition-colors">{person.name}</Link>
                      {person.phone && <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5"><Phone className="w-3 h-3" />{person.phone}</div>}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => startEdit(person)} className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground"><Edit3 className="w-3.5 h-3.5" /></button>
                    <button onClick={() => setDeleteTarget(person)} className="p-1.5 rounded-lg hover:bg-destructive/10 transition-colors text-muted-foreground hover:text-destructive"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-border">
                  <div>
                    <div className="amount-display text-base font-bold text-foreground">{format(stats.total)}</div>
                    <div className="text-xs text-muted-foreground">Total spent</div>
                  </div>
                  <div>
                    <div className="text-base font-bold text-foreground">{stats.count}</div>
                    <div className="text-xs text-muted-foreground">Transactions</div>
                  </div>
                </div>
                {!person.isActive && (
                  <span className="text-xs px-2 py-0.5 bg-muted rounded-full text-muted-foreground mt-2 inline-block">Inactive</span>
                )}
              </div>
            );
          })}
        </div>
      )}

      <ConfirmDialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete}
        loading={deleting} title="Remove Person"
        description={`Remove "${deleteTarget?.name}"? This only works if they have no linked expenses.`}
        confirmLabel="Remove" />
    </div>
  );
}
