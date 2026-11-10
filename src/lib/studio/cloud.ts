import { z } from "zod";
import { LIMITS } from "./limits";

export const cloudMessageSchema = z.object({
  id: z.string().min(1).max(40),
  role: z.enum(["user", "assistant", "system"]),
  content: z.string().max(200_000),
  ops: z
    .array(
      z.object({
        type: z.enum(["write", "delete"]),
        path: z.string().max(240),
        content: z.string().max(LIMITS.fileBytes).optional(),
      }),
    )
    .max(LIMITS.operations)
    .optional(),
  opsStatus: z.enum(["pending", "applied", "rejected"]).optional(),
  error: z.string().max(2000).optional(),
});

export const cloudProjectSchema = z.object({
  cloudId: z.string().uuid().optional(),
  name: z.string().trim().min(1).max(120),
  files: z.record(z.string().max(240), z.string().max(LIMITS.fileBytes)),
  messages: z.array(cloudMessageSchema).max(200),
});

export const publishSchema = z.object({
  cloudId: z.string().uuid(),
  slug: z
    .string()
    .regex(/^[a-z0-9][a-z0-9-]{2,59}$/, "3-60 Zeichen: Kleinbuchstaben, Ziffern, Bindestriche."),
  title: z.string().trim().min(1).max(120),
});

export const unpublishSchema = z.object({ cloudId: z.string().uuid() });
export const cloudIdSchema = z.object({ cloudId: z.string().uuid() });
export const slugSchema = z.object({ slug: z.string().regex(/^[a-z0-9][a-z0-9-]{2,59}$/) });

export type CloudMessage = z.infer<typeof cloudMessageSchema>;
export type CloudProject = z.infer<typeof cloudProjectSchema>;
