// Zod validators for AI features

import { z } from "zod";

export const draftCommandSchema = z.object({
  subject: z
    .string()
    .min(3, "หัวเรื่องสั้นเกินไป")
    .max(200, "หัวเรื่องยาวเกินไป"),
  objective: z
    .string()
    .min(5, "วัตถุประสงค์สั้นเกินไป")
    .max(500),
  recipient: z.string().min(1).max(300),
  timeframe: z.string().max(200).optional(),
  context: z.string().max(2000).optional(),
  priority: z
    .enum(["LOW", "NORMAL", "HIGH", "URGENT", "CRITICAL"])
    .default("NORMAL"),
  /** Optional: ผูกกับภารกิจ — AI ใช้ goals/scope/KPIs เป็น context (TOR ๒.๑.๑) */
  missionId: z.string().nullable().optional(),
});

export type DraftCommandInput = z.infer<typeof draftCommandSchema>;
