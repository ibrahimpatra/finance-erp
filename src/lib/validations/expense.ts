import { z } from "zod";

// incomeSourceId is required when no accountId is set (legacy flow).
// When accountId IS set, the form resolves incomeSourceId via FIFO before submitting,
// so it is guaranteed to be present at the service level regardless.
export const expenseSchema = z.object({
  incomeSourceId: z.string().optional(),
  accountId:      z.string().optional(), // NEW — which bank account is debited
  spentById:      z.string().min(1, "Spent by is required"),
  amount:         z.coerce.number().positive("Amount must be positive"),
  reason:         z.string().min(1, "Reason is required").max(200),
  notes:          z.string().max(500).optional(),
  expenseTypeId:  z.string().min(1, "Category is required"),
  tagIds:         z.array(z.string()).default([]),
  currencyCode:   z.string().optional(),
}).superRefine((data, ctx) => {
  // Must have either an account (FIFO resolves income) or an explicit income source
  if (!data.accountId && !data.incomeSourceId) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Income source is required",
      path: ["incomeSourceId"],
    });
  }
});

export type ExpenseSchema = z.infer<typeof expenseSchema>;

export const refundSchema = z.object({
  expenseId: z.string().min(1),
  amount:    z.coerce.number().positive(),
  reason:    z.string().min(1, "Reason is required"),
});
