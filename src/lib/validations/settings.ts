import { z } from "zod";

export const settingsSchema = z.object({
  currencyName: z.string().min(1, "Currency name is required"),
  currencyCode: z.string().min(2).max(5).toUpperCase(),
  currencySymbol: z.string().min(1, "Symbol is required").max(5),
});

export type SettingsSchema = z.infer<typeof settingsSchema>;
