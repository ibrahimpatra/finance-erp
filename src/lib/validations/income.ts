import { z } from "zod";

export const incomeSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  source: z.string().min(1, "Source is required"),
  amount: z.coerce.number().positive("Amount must be positive"),
  notes: z.string().max(500).optional(),
  tagIds: z.array(z.string()).default([]),
  currencyCode: z.string().optional(),
});

export type IncomeSchema = z.infer<typeof incomeSchema>;
