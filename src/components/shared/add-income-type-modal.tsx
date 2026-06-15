"use client";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { expenseTypeSchema, ExpenseTypeSchema } from "@/lib/validations/expense-type";
import { Modal } from "./modal";
import { IncomeTypeForm } from "./income-type-form";
import { useAuthStore } from "@/stores/auth.store";
import { useIncomeSourceTypeStore } from "@/stores/income-source-type.store";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onCreated?: (type: { id: string; name: string }) => void;
  level?: 1 | 2 | 3;
}

export function AddIncomeTypeModal({ isOpen, onClose, onCreated, level = 1 }: Props) {
  const { user } = useAuthStore();
  const { addSourceType } = useIncomeSourceTypeStore();
  const [color, setColor] = useState("#3b82f6");

  const form = useForm<ExpenseTypeSchema>({
    resolver: zodResolver(expenseTypeSchema),
    defaultValues: { isActive: true, icon: "💼" },
  });

  const handleSubmit = async (data: ExpenseTypeSchema) => {
    if (!user) return;
    const id = await addSourceType(user.uid, {
      name: data.name,
      icon: data.icon,
      color,
      isActive: true,
    });
    onCreated?.({ id, name: data.name });
    form.reset({ isActive: true, icon: "💼" });
    setColor("#3b82f6");
    onClose();
  };

  const handleClose = () => {
    form.reset({ isActive: true, icon: "💼" });
    setColor("#3b82f6");
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose}
      title="Add Income Type"
      description="Create a new income source type (e.g. Salary, Freelance)"
      level={level}>
      <IncomeTypeForm
        form={form}
        color={color}
        onColorChange={setColor}
        onSubmit={handleSubmit}
        onCancel={handleClose}
        submitLabel="Add Type"
      />
    </Modal>
  );
}
