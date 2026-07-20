"use client";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { expenseTypeSchema, ExpenseTypeSchema } from "@/lib/validations/expense-type";
import { Modal } from "./modal";
import { CategoryForm } from "./category-form";
import { useAuthStore } from "@/stores/auth.store";
import { useExpenseTypeStore } from "@/stores/expense-type.store";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onCreated?: (type: { id: string; name: string }) => void;
  level?: 1 | 2 | 3;
}

export function AddExpenseCategoryModal({ isOpen, onClose, onCreated, level = 1 }: Props) {
  const { user } = useAuthStore();
  const { addExpenseType } = useExpenseTypeStore();
  const [color, setColor] = useState("#6b7280");

  const form = useForm<ExpenseTypeSchema>({
    resolver: zodResolver(expenseTypeSchema),
    defaultValues: { isActive: true, icon: "📦" },
  });

  const handleSubmit = async (data: ExpenseTypeSchema) => {
    if (!user) return;
    const id = await addExpenseType(user.uid, { ...data, color });
    onCreated?.({ id, name: data.name });
    form.reset({ isActive: true, icon: "📦" });
    setColor("#6b7280");
    onClose();
  };

  const handleClose = () => {
    form.reset({ isActive: true, icon: "📦" });
    setColor("#6b7280");
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose}
      title="Add Expense Category"
      description="Create a new category for expenses"
      level={level}>
      <CategoryForm
        form={form}
        color={color}
        onColorChange={setColor}
        onSubmit={handleSubmit}
        onCancel={handleClose}
        submitLabel="Add Category"
      />
    </Modal>
  );
}
