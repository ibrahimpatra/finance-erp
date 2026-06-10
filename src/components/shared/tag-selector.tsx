"use client";
import { useState } from "react";
import { useTags } from "@/hooks/use-tags";
import { Tag, X } from "lucide-react";

interface TagSelectorProps {
  selectedIds: string[];
  onChange: (ids: string[]) => void;
}

export function TagSelector({ selectedIds, onChange }: TagSelectorProps) {
  const { tags } = useTags();
  const [open, setOpen] = useState(false);

  const toggle = (id: string) => {
    onChange(selectedIds.includes(id) ? selectedIds.filter((i) => i !== id) : [...selectedIds, id]);
  };

  const selected = tags.filter((t) => selectedIds.includes(t.id));

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-1.5 min-h-[32px]">
        {selected.map((tag) => (
          <span key={tag.id} className="badge-tag text-white gap-1.5"
            style={{ backgroundColor: tag.color + "22", color: tag.color, border: `1px solid ${tag.color}44` }}>
            {tag.name}
            <button type="button" onClick={() => toggle(tag.id)} className="hover:opacity-70">
              <X className="w-3 h-3" />
            </button>
          </span>
        ))}
        <button type="button" onClick={() => setOpen(!open)}
          className="badge-tag bg-muted text-muted-foreground hover:bg-muted/80 transition-colors">
          <Tag className="w-3 h-3" />
          Add tag
        </button>
      </div>
      {open && (
        <div className="flex flex-wrap gap-1.5 p-3 bg-muted/40 rounded-lg border border-border">
          {tags.length === 0 ? (
            <p className="text-xs text-muted-foreground w-full text-center">No tags yet. Create one in Tags page.</p>
          ) : tags.map((tag) => (
            <button key={tag.id} type="button" onClick={() => toggle(tag.id)}
              className={`badge-tag transition-all ${selectedIds.includes(tag.id) ? "ring-2 ring-offset-1" : "opacity-70 hover:opacity-100"}`}
              style={{ backgroundColor: tag.color + "22", color: tag.color, border: `1px solid ${tag.color}44`,
                ...(selectedIds.includes(tag.id) && { ringColor: tag.color }) }}>
              {tag.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
