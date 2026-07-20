"use client";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { tagSchema, TagSchema } from "@/lib/validations/tag";
import { Modal } from "./modal";
import { TagForm } from "./tag-form";
import { useAuthStore } from "@/stores/auth.store";
import { useTagStore } from "@/stores/tag.store";
import { TAG_COLORS } from "@/types";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onCreated?: (tag: { id: string; name: string }) => void;
  level?: 1 | 2 | 3;
}

/**
 * Inline tag creation — lets a user create a new tag without leaving the
 * Income/Expense form they're currently filling out. Wired into TagSelector
 * directly, so both forms (and their edit modes, since they reuse the same
 * component) get this for free.
 */
export function AddTagModal({ isOpen, onClose, onCreated, level = 2 }: Props) {
  const { user } = useAuthStore();
  const { addTag } = useTagStore();
  const [color, setColor] = useState<string>(TAG_COLORS[0]);

  const form = useForm<TagSchema>({
    resolver: zodResolver(tagSchema),
    defaultValues: { color: TAG_COLORS[0] },
  });

  const handleSubmit = async (data: TagSchema) => {
    if (!user) return;
    const id = await addTag(user.uid, { ...data, color });
    onCreated?.({ id, name: data.name });
    form.reset({ color: TAG_COLORS[0] });
    setColor(TAG_COLORS[0]);
    onClose();
  };

  const handleClose = () => {
    form.reset({ color: TAG_COLORS[0] });
    setColor(TAG_COLORS[0]);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose}
      title="New Tag"
      description="Create a tag without losing what you've already filled in"
      level={level}>
      <TagForm
        form={form}
        selectedColor={color}
        onColorChange={(c) => { setColor(c); form.setValue("color", c); }}
        onSubmit={handleSubmit}
        onCancel={handleClose}
        submitLabel="Create Tag"
      />
    </Modal>
  );
}
