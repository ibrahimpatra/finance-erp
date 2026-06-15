"use client";
import { useEffect } from "react";
import { UseFormReturn } from "react-hook-form";
import { TagSchema } from "@/lib/validations/tag";
import { ColorPickerInput } from "@/components/shared/color-picker-input";
import { TAG_COLORS } from "@/types";
import { Tag as TagIcon, Loader2 } from "lucide-react";

const inp = "w-full px-3.5 py-2.5 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary transition-all";

interface TagFormProps {
  form: UseFormReturn<TagSchema>;
  selectedColor: string;
  onColorChange: (color: string) => void;
  onSubmit: (data: TagSchema) => Promise<void>;
  onCancel: () => void;
  submitLabel?: string;
  isEdit?: boolean;
}

export function TagForm({
  form, selectedColor, onColorChange, onSubmit, onCancel,
  submitLabel = "Create Tag", isEdit = false,
}: TagFormProps) {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = form;

  return (
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

      {/* react-colorful picker */}
      <ColorPickerInput label="Color" value={selectedColor} onChange={onColorChange} />

      {/* Quick preset swatches */}
      <div className="space-y-1.5">
        <label className="text-sm font-medium text-muted-foreground">Quick colors</label>
        <div className="flex flex-wrap gap-2">
          {TAG_COLORS.map((color) => (
            <button key={color} type="button" onClick={() => onColorChange(color)}
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
            style={{
              backgroundColor: selectedColor + "22",
              color: selectedColor,
              border: `1px solid ${selectedColor}44`,
            }}>
            <TagIcon className="w-3 h-3" /> Sample Tag
          </span>
        </div>
      )}

      <div className="flex gap-3 pt-1">
        <button type="button" onClick={onCancel}
          className="flex-1 px-4 py-2.5 rounded-lg border border-border text-sm font-medium hover:bg-muted transition-colors">
          Cancel
        </button>
        <button type="submit" disabled={isSubmitting}
          className="flex-1 flex items-center justify-center gap-2 bg-primary text-white px-4 py-2.5 rounded-lg text-sm font-semibold hover:bg-primary/90 disabled:opacity-60 transition-all">
          {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
          {isEdit ? "Save Changes" : submitLabel}
        </button>
      </div>
    </form>
  );
}
