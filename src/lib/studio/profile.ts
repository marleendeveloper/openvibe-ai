import { z } from "zod";
export const profileSchema = z
  .object({ display_name: z.string().trim().max(80), bio: z.string().trim().max(500) })
  .strict();
