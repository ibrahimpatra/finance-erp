import { z } from "zod";

export const expenseTypeSchema = z.object({
  name: z.string().min(1, "Name is required").max(50),
  icon: z.string().max(5).optional(),
  color: z.string().optional(),
  isActive: z.boolean().default(true),
});

export type ExpenseTypeSchema = z.infer<typeof expenseTypeSchema>;
