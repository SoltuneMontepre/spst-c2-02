import { z } from "zod";

export const createSessionSchema = z.object({
  totalRounds: z.union([z.literal(2), z.literal(3), z.literal(4)]).default(4),
  maxPlayers: z.number().int().min(4).max(16).default(16),
  autoAssignRoles: z.boolean().default(true),
  guidanceEnabled: z.boolean().default(true),
  autoHost: z.boolean().optional().default(true),
});

export type CreateSessionInput = z.infer<typeof createSessionSchema>;
