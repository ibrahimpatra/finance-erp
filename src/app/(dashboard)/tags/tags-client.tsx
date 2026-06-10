"use client";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { tagSchema, TagSchema } from "@/lib/validations/tag";
import { useTags } from "@/hooks/use-tags";
import { useExpenses } from "@/hooks/use-expenses";
import { useIncome } from "@/hooks/use-income";
import { useAuthStore } from "@/stores/auth.store";
import { useTagStore } from "@/stores/tag.store";
import { useCurrency } from "@/hooks/use-currency";
import { useToast } from "@/components/ui/toaster";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { EmptyState } from "@/components/shared/empty-state";
import { TableSkeleton } from "@/components/shared/loading-skeleton";
import { TAG_COLORS, Tag } from "@/types";
import { Tag as TagIcon, Plus, Loader2, Edit3, Trash2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const inp = "w-full px-3.5 py-2.5 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all";

export function TagsPageClient() {
  const { user } = useAuthStore();
  const { tags, loading } = useTags();
  const { expenses } = useExpenses();
  const { incomes } = useIncome();
  const { addTag, editTag, removeTag } = useTagStore();
  const { format } = useCurrency();
  const { toast } = useToast();
  const [showForm, setShowForm] = useState(false);
  const [editTarget, setEditTarget] = useState<Tag | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Tag | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [selectedColor, setSelectedColor] = useState<string>(TAG_COLORS[0]);

  const { register, handleSubmit, reset, setValue, formState: { errors, isSubmitting } } = useForm<TagSchema>({
    resolver: zodResolver(tagSchema),
  });

  const onSubmit = async (data: TagSchema) => {
    if (!user) return;
    const payload = { ...data, color: selectedColor };
    if (editTarget) {
      await editTag(user.uid, editTarget.id, payload, editTarget);
      toast("Tag updated!", "success");
    } else {
      await addTag(user.uid, payload);
      toast("Tag created!", "success");
    }
    reset(); setShowForm(false); setEditTarget(null); setSelectedColor(TAG_COLORS[0]);
  };

  const startEdit = (tag: Tag) => {
    setEditTarget(tag); setValue("name", tag.name); setValue("description", tag.description ?? ""); setSelectedColor(tag.color); setShowForm(true);
  };

  const handleDelete = async () => {
    if (!user || !deleteTarget) return;
    setDeleting(true);
    await removeTag(user.uid, deleteTarget.id);
    toast("Tag deleted.", "success");
    setDeleting(false); setDeleteTarget(null);
  };

  const getTagStats = (tagId: string) => ({
    expenses: expenses.filter((e) => e.tagIds.includes(tagId)).length,
    incomes: incomes.filter((i) => i.tagIds.includes(tagId)).length,
    totalAmount: expenses.filter((e) => e.tagIds.includes(tagId)).reduce((a, e) => a + e.amount, 0),
  });

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="page-header">
        <div>
          <h2 className="text-2xl font-bold text-foreground tracking-tight">Tags</h2>
          <p className="text-muted-foreground text-sm mt-1">{tags.length} tags created</p>
        </div>
        <button onClick={() => { setShowForm(true); setEditTarget(null); reset(); setSelectedColor(TAG_COLORS[0]); }}
          className="flex items-center gap-2 bg-primary text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-primary/90 transition-all shadow-sm shadow-primary/25">
          <Plus className="w-4 h-4" /> New Tag
        </button>
      </div>

      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
            className="bg-white rounded-xl border border-border shadow-card p-6">
            <h3 className="font-semibold mb-4">{editTarget ? "Edit Tag" : "New Tag"}</h3>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Tag Color</label>
                <div className="flex flex-wrap gap-2">
                  {TAG_COLORS.map((color) => (
                    <button key={color} type="button" onClick={() => setSelectedColor(color)}
                      className={`w-7 h-7 rounded-full transition-all ${selectedColor === color ? "ring-2 ring-offset-2 ring-primary scale-110" : "hover:scale-105"}`}
                      style={{ backgroundColor: color }} />
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-sm font-medium">Name *</label>
                  <input {...register("name")} placeholder="e.g. Groceries" className={inp} />
                  {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium">Description</label>
                  <input {...register("description")} placeholder="Optional description…" className={inp} />
                </div>
              </div>
              {selectedColor && (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Preview:</span>
                  <span className="badge-tag px-3 py-1" style={{ backgroundColor: selectedColor + "22", color: selectedColor, border: `1px solid ${selectedColor}44` }}>
                    <TagIcon className="w-3 h-3" /> Sample Tag
                  </span>
                </div>
              )}
              <div className="flex gap-3">
                <button type="button" onClick={() => { setShowForm(false); reset(); setEditTarget(null); }} className="flex-1 px-4 py-2.5 rounded-lg border border-border text-sm font-medium hover:bg-muted transition-colors">Cancel</button>
                <button type="submit" disabled={isSubmitting} className="flex-1 flex items-center justify-center gap-2 bg-primary text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-primary/90 disabled:opacity-60 transition-all">
                  {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  {editTarget ? "Save Changes" : "Create Tag"}
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {loading ? <TableSkeleton rows={4} /> : tags.length === 0 ? (
        <EmptyState icon={TagIcon} title="No tags yet"
          description="Create tags to organize and filter your income and expenses."
          action={<button onClick={() => setShowForm(true)} className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/90 transition-all"><Plus className="w-4 h-4" />Create first tag</button>} />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {tags.map((tag) => {
            const stats = getTagStats(tag.id);
            return (
              <div key={tag.id} className="stat-card group hover:shadow-card-hover transition-all">
                <div className="flex items-start justify-between mb-3">
                  <span className="badge-tag px-3 py-1.5 text-sm font-semibold"
                    style={{ backgroundColor: tag.color + "22", color: tag.color, border: `1px solid ${tag.color}44` }}>
                    <TagIcon className="w-3.5 h-3.5" />{tag.name}
                  </span>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => startEdit(tag)} className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground"><Edit3 className="w-3.5 h-3.5" /></button>
                    <button onClick={() => setDeleteTarget(tag)} className="p-1.5 rounded-lg hover:bg-destructive/10 transition-colors text-muted-foreground hover:text-destructive"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                </div>
                {tag.description && <p className="text-xs text-muted-foreground mb-3">{tag.description}</p>}
                <div className="grid grid-cols-3 gap-2 pt-3 border-t border-border">
                  <div className="text-center">
                    <div className="font-bold text-foreground">{stats.incomes}</div>
                    <div className="text-xs text-muted-foreground">Income</div>
                  </div>
                  <div className="text-center">
                    <div className="font-bold text-foreground">{stats.expenses}</div>
                    <div className="text-xs text-muted-foreground">Expenses</div>
                  </div>
                  <div className="text-center">
                    <div className="amount-display font-bold text-foreground text-xs">{format(stats.totalAmount)}</div>
                    <div className="text-xs text-muted-foreground">Amount</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
      <ConfirmDialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete}
        loading={deleting} title="Delete Tag" description={`Delete "${deleteTarget?.name}"? It will be removed from all linked records.`} confirmLabel="Delete Tag" />
    </div>
  );
}
