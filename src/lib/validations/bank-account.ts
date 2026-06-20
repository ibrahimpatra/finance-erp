import { z } from "zod";

export const bankAccountSchema = z.object({
  name:           z.string().min(1, "Account name is required").max(100),
  bankName:       z.string().optional(),
  accountType:    z.enum(["checking", "savings", "cash", "wallet", "credit"]),
  lastFourDigits: z
    .string()
    .regex(/^\d{4}$/, "Must be exactly 4 digits")
    .optional()
    .or(z.literal("")),
  currencyCode:   z.string().min(1, "Currency is required"),
  color:          z.string().default("#3b82f6"),
  icon:           z.string().optional(),
  isActive:       z.boolean().default(true),
  isDefault:      z.boolean().default(false),
  notes:          z.string().max(300).optional(),
});

export type BankAccountSchema = z.infer<typeof bankAccountSchema>;
