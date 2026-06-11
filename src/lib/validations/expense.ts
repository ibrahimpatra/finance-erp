import { z } from "zod";

export const expenseSchema = z.object({
  incomeSourceId: z.string().min(1, "Income source is required"),
  spentById: z.string().min(1, "Spent by is required"),
  amount: z.coerce.number().positive("Amount must be positive"),
  reason: z.string().min(1, "Reason is required").max(200),
  notes: z.string().max(500).optional(),
  expenseTypeId: z.string().min(1, "Category is required"),
  tagIds: z.array(z.string()).default([]),
  currencyCode: z.string().optional(),
});

export type ExpenseSchema = z.infer<typeof expenseSchema>;

export const refundSchema = z.object({
  expenseId: z.string().min(1),
  amount: z.coerce.number().positive(),
  reason: z.string().min(1, "Reason is required"),
});
