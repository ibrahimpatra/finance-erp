import { z } from "zod";

export const transferSchema = z.object({
  fromIncomeId: z.string().min(1, "Source is required"),
  toIncomeId: z.string().min(1, "Destination is required"),
  amount: z.coerce.number().positive("Amount sent must be positive"),
  toAmount: z.coerce.number().optional(),       // only for cross-currency
  fromCurrencyCode: z.string().optional(),
  toCurrencyCode: z.string().optional(),
  note: z.string().max(300).optional(),
}).refine((d) => d.fromIncomeId !== d.toIncomeId, {
  message: "Cannot transfer to the same source",
  path: ["toIncomeId"],
});

export type TransferSchema = z.infer<typeof transferSchema>;
