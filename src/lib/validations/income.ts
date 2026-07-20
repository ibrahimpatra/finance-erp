import { z } from "zod";

export const incomeSchema = z.object({
  name:               z.string().min(1, "Name is required").max(100),
  source:             z.string().min(1, "Source is required"),
  amount:             z.coerce.number().positive("Amount must be positive"),
  notes:              z.string().max(500).optional(),
  tagIds:             z.array(z.string()).default([]),
  currencyCode:       z.string().optional(),
  accountId:          z.string().optional(), // NEW — links income to a bank account
  incomeSourceTypeId: z.string().optional(), // NEW — richer source categorisation
});

export type IncomeSchema = z.infer<typeof incomeSchema>;
