"use client";
import { Modal } from "./modal";
import { IncomeForm } from "@/components/income/income-form";
import { useAuthStore } from "@/stores/auth.store";
import { useIncomeStore } from "@/stores/income.store";
import { useToast } from "@/components/ui/toaster";
import { IncomeSchema } from "@/lib/validations/income";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onCreated?: (income: { id: string; name: string; currencyCode: string }) => void;
  level?: 1 | 2 | 3;
}

export function AddIncomeSourceModal({ isOpen, onClose, onCreated, level = 1 }: Props) {
  const { user }      = useAuthStore();
  const { addIncome } = useIncomeStore();
  const { toast }     = useToast();

  const handleSubmit = async (data: IncomeSchema) => {
    if (!user) return;
    const id = await addIncome(user.uid, data);
    toast("Income source added!", "success");
    onCreated?.({ id, name: data.name, currencyCode: data.currencyCode ?? "" });
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}
      title="Add Income Source"
      description="Add a new income source to fund expenses"
      level={level}>
      {/* Reuse the same IncomeForm used everywhere else */}
      <IncomeForm
        onSubmit={handleSubmit}
        onCancel={onClose}
        submitLabel="Add Income Source"
        modalLevel={level}
      />
    </Modal>
  );
}
