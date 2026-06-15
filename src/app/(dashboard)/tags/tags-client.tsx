"use client";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { tagSchema, TagSchema } from "@/lib/validations/tag";
import { useTags } from "@/hooks/use-tags";
import { useExpenses } from "@/hooks/use-expenses";
import { useIncome } from "@/hooks/use-income";
import { useCurrencies } from "@/hooks/use-currencies";
import { useAuthStore } from "@/stores/auth.store";
import { useTagStore } from "@/stores/tag.store";
import { useSettingsStore } from "@/stores/settings.store";
import { useCurrency } from "@/hooks/use-currency";
import { useToast } from "@/components/ui/toaster";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { EmptyState } from "@/components/shared/empty-state";
import { TableSkeleton } from "@/components/shared/loading-skeleton";
import { FormDrawer } from "@/components/shared/form-drawer";
import { TagForm } from "@/components/shared/tag-form";
import { GlobalCurrencyFilter, useCurrencyFilter } from "@/components/shared/global-currency-filter";
import { MultiCurrencyAmount, groupByCurrency } from "@/components/shared/multi-currency-amount";
import { TAG_COLORS, Tag } from "@/types";
import { Tag as TagIcon, Plus, Edit3, Trash2 } from "lucide-react";

export function TagsPageClient() {
  const { user }     = useAuthStore();
  const { tags, loading } = useTags();
  const { expenses } = useExpenses();
  const { incomes }  = useIncome();
  const { settings } = useSettingsStore();
  const defaultCode  = settings?.currencyCode ?? "KWD";
  useCurrencies();
  const { addTag, editTag, removeTag } = useTagStore();
  const { toast }      = useToast();
  const { matches: matchesCurrency } = useCurrencyFilter();

  const [showForm,     setShowForm]     = useState(false);
  const [editTarget,   setEditTarget]   = useState<Tag | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Tag | null>(null);
  const [deleting,     setDeleting]     = useState(false);
  const [selectedColor, setSelectedColor] = useState<string>(TAG_COLORS[0]);

  const tagForm = useForm<TagSchema>({
    resolver: zodResolver(tagSchema),
    defaultValues: { color: TAG_COLORS[0] },
  });
  const { reset, setValue, formState: { isSubmitting } } = tagForm;

  const handleColorChange = (c: string) => {
    setSelectedColor(c);
    setValue("color", c);
  };

  const onSubmit = async (data: TagSchema) => {
    if (!user) return;
    try {
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

  // Per-tag stats: per-currency groups so "All" shows KD 10 / USD 5 / INR 500
  const getTagStats = (tagId: string) => {
    const tagExpenses = expenses.filter(
      (e) => e.tagIds.includes(tagId) && matchesCurrency(e.currencyCode || defaultCode)
    );
    const tagIncomes  = incomes.filter(
      (i) => i.tagIds.includes(tagId) && matchesCurrency(i.currencyCode || defaultCode)
    );
    const currencyAmounts = groupByCurrency(
      tagExpenses,
      (e) => e.amount,
      (e) => e.currencyCode,
      defaultCode
    );
    return {
      expenseCount: tagExpenses.length,
      incomeCount:  tagIncomes.length,
      currencyAmounts,
    };
  };

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

      {/* ── Global currency filter ────────────────────────────── */}
      <GlobalCurrencyFilter />

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
                <div className="pt-3 border-t border-border space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">
                      {stats.incomeCount} income · {stats.expenseCount} expense{stats.expenseCount !== 1 ? "s" : ""}
                    </span>
                  </div>
                  {stats.currencyAmounts.length > 0 && (
                    <MultiCurrencyAmount
                      groups={stats.currencyAmounts}
                      amountClassName="text-sm font-bold text-foreground"
                      layout="stack"
                    />
                  )}
                  {stats.currencyAmounts.length === 0 && (
                    <span className="text-xs text-muted-foreground">No expenses</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Form drawer ──────────────────────────────────────── */}
      <FormDrawer isOpen={showForm} onClose={() => { setShowForm(false); setEditTarget(null); }}
        title={editTarget ? "Edit Tag" : "New Tag"}>
        <TagForm
          form={tagForm}
          selectedColor={selectedColor}
          onColorChange={handleColorChange}
          onSubmit={onSubmit}
          onCancel={() => { setShowForm(false); setEditTarget(null); }}
          submitLabel="Create Tag"
          isEdit={!!editTarget}
        />
      </FormDrawer>

      <ConfirmDialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete} loading={deleting} title="Delete Tag"
        description={`Delete "${deleteTarget?.name}"? It will be removed from all linked records.`}
        confirmLabel="Delete Tag" />
    </div>
  );
}
