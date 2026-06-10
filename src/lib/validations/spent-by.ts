import { z } from "zod";

export const spentBySchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  phone: z.string().max(20).optional(),
  notes: z.string().max(300).optional(),
  avatarColor: z.string().optional(),
  isActive: z.boolean().default(true),
});

export type SpentBySchema = z.infer<typeof spentBySchema>;
