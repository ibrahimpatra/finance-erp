import { z } from "zod";

export const tagSchema = z.object({
  name: z.string().min(1, "Name is required").max(50),
  color: z.string().min(1, "Color is required"),
  description: z.string().max(200).optional(),
});

export type TagSchema = z.infer<typeof tagSchema>;
