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
import { FormDrawer } from "@/components/shared/form-drawer";
import { ColorPickerInput } from "@/components/shared/color-picker-input";
import { TAG_COLORS, Tag } from "@/types";
import { Tag as TagIcon, Plus, Loader2, Edit3, Trash2 } from "lucide-react";

const inp = "w-full px-3.5 py-2.5 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all";

export function TagsPageClient() {
  const { user }     = useAuthStore();
  const { tags, loading } = useTags();
  const { expenses } = useExpenses();
  const { incomes }  = useIncome();
  const { addTag, editTag, removeTag } = useTagStore();
  const { format }   = useCurrency();
  const { toast }    = useToast();

  const [showForm,     setShowForm]     = useState(false);
  const [editTarget,   setEditTarget]   = useState<Tag | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Tag | null>(null);
  const [deleting,     setDeleting]     = useState(false);
  const [selectedColor, setSelectedColor] = useState<string>(TAG_COLORS[0]);

  const { register, handleSubmit, reset, setValue, formState: { errors, isSubmitting } } =
    useForm<TagSchema>({
      resolver: zodResolver(tagSchema),
      defaultValues: { color: TAG_COLORS[0] },  // ← fix: provide default so zod validation passes
    });

  const handleColorChange = (c: string) => {
    setSelectedColor(c);
    setValue("color", c);          // ← fix: keep react-hook-form in sync
  };

  const onSubmit = async (data: TagSchema) => {
    if (!user) return;
    try {
      // color is already set via setValue, so data.color is correct
      if (editTarget) {
        await editTag(user.uid, editTarget.id, data, editTarget);
        toast("Tag updated!", "success");
      } else {
        await addTag(user.uid, data);
        toast("Tag created!", "success");
      }
      reset({ color: TAG_COLORS[0] });
      setSelectedColor(TAG_COLORS[0]);
      setShowForm(false);
      setEditTarget(null);
    } catch (e: unknown) {
      toast((e as Error).message || "Failed to save tag.", "error");
    }
  };

  const startEdit = (tag: Tag) => {
    setEditTarget(tag);
    setValue("name", tag.name);
    setValue("description", tag.description ?? "");
    setValue("color", tag.color);
    setSelectedColor(tag.color);
    setShowForm(true);
  };

  const handleDelete = async () => {
    if (!user || !deleteTarget) return;
    setDeleting(true);
    try {
      await removeTag(user.uid, deleteTarget.id);
      toast("Tag deleted.", "success");
    } catch (e: unknown) {
      toast((e as Error).message, "error");
    } finally {
      setDeleting(false); setDeleteTarget(null);
    }
  };

  const getTagStats = (tagId: string) => ({
    expenses: expenses.filter((e) => e.tagIds.includes(tagId)).length,
    incomes:  incomes.filter((i) => i.tagIds.includes(tagId)).length,
    totalAmount: expenses.filter((e) => e.tagIds.includes(tagId)).reduce((a, e) => a + e.amount, 0),
  });

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">Tags</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{tags.length} tags created</p>
        </div>
        <button
          onClick={() => { setShowForm(true); setEditTarget(null); reset({ color: TAG_COLORS[0] }); setSelectedColor(TAG_COLORS[0]); }}
          className="flex items-center gap-2 bg-primary text-white px-4 py-2.5 rounded-lg text-sm font-semibold hover:bg-primary/90 transition-all shadow-sm shadow-primary/25">
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">New Tag</span>
          <span className="sm:hidden">New</span>
        </button>
      </div>

      {loading ? <TableSkeleton rows={4} /> : tags.length === 0 ? (
        <EmptyState icon={TagIcon} title="No tags yet"
          description="Create tags to organise and filter your income and expenses."
          action={
            <button onClick={() => setShowForm(true)}
              className="flex items-center gap-2 bg-primary text-white px-4 py-2.5 rounded-lg text-sm font-semibold hover:bg-primary/90 transition-all">
              <Plus className="w-4 h-4" /> Create first tag
            </button>
          } />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {tags.map((tag) => {
            const stats = getTagStats(tag.id);
            return (
              <div key={tag.id} className="bg-white rounded-xl border border-border shadow-card p-4 group hover:shadow-card-hover transition-all">
                <div className="flex items-start justify-between mb-3">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold"
                    style={{ backgroundColor: tag.color + "22", color: tag.color, border: `1px solid ${tag.color}44` }}>
                    <TagIcon className="w-3.5 h-3.5" /> {tag.name}
                  </span>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => startEdit(tag)}
                      className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground">
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => setDeleteTarget(tag)}
                      className="p-1.5 rounded-lg hover:bg-destructive/10 transition-colors text-muted-foreground hover:text-destructive">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
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

      {/* Form drawer */}
      <FormDrawer
        isOpen={showForm}
        onClose={() => { setShowForm(false); setEditTarget(null); }}
        title={editTarget ? "Edit Tag" : "New Tag"}
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Name *</label>
            <input {...register("name")} placeholder="e.g. Groceries" className={inp} autoFocus />
            {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Description</label>
            <input {...register("description")} placeholder="Optional description…" className={inp} />
          </div>

          {/* Color picker with react-colorful — also syncs to form field */}
          <ColorPickerInput label="Color" value={selectedColor} onChange={handleColorChange} />

          {/* Preset swatches for quick pick */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-muted-foreground">Quick colors</label>
            <div className="flex flex-wrap gap-2">
              {TAG_COLORS.map((color) => (
                <button key={color} type="button" onClick={() => handleColorChange(color)}
                  className="w-7 h-7 rounded-full transition-all hover:scale-110"
                  style={{
                    backgroundColor: color,
                    outline: selectedColor === color ? `3px solid ${color}` : "none",
                    outlineOffset: "2px",
                  }} />
              ))}
            </div>
          </div>

          {selectedColor && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Preview:</span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium"
                style={{ backgroundColor: selectedColor + "22", color: selectedColor, border: `1px solid ${selectedColor}44` }}>
                <TagIcon className="w-3 h-3" /> Sample Tag
              </span>
            </div>
          )}

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={() => { setShowForm(false); setEditTarget(null); }}
              className="flex-1 px-4 py-2.5 rounded-lg border border-border text-sm font-medium hover:bg-muted transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={isSubmitting}
              className="flex-1 flex items-center justify-center gap-2 bg-primary text-white px-4 py-2.5 rounded-lg text-sm font-semibold hover:bg-primary/90 disabled:opacity-60 transition-all">
              {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
              {editTarget ? "Save Changes" : "Create Tag"}
            </button>
          </div>
        </form>
      </FormDrawer>

      <ConfirmDialog
        open={!!deleteTarget} onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete} loading={deleting}
        title="Delete Tag"
        description={`Delete "${deleteTarget?.name}"? It will be removed from all linked records.`}
        confirmLabel="Delete Tag" />
    </div>
  );
}
