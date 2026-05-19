// Zod validators for Command CRUD
// Used by API routes + server actions

import { z } from "zod";

const PRIORITIES = ["LOW", "NORMAL", "HIGH", "URGENT", "CRITICAL"] as const;

export const createCommandSchema = z.object({
  subject: z
    .string()
    .min(5, "หัวเรื่องต้องมีอย่างน้อย 5 ตัวอักษร")
    .max(200, "หัวเรื่องยาวเกินไป"),
  recipient: z
    .string()
    .min(1, "ต้องระบุผู้รับคำสั่ง")
    .max(500),
  reference: z.string().max(500).optional().nullable(),
  objective: z.string().max(1000).optional().nullable(),
  body: z
    .string()
    .min(20, "เนื้อหาต้องมีอย่างน้อย 20 ตัวอักษร")
    .max(10000),
  priority: z.enum(PRIORITIES).default("NORMAL"),
  missionId: z.string().cuid().optional().nullable(),
  /** หน่วยงานที่รับคำสั่ง (Unit IDs) */
  targetUnitIds: z
    .array(z.string().cuid())
    .min(1, "ต้องเลือกหน่วยรับอย่างน้อย 1 หน่วย")
    .max(20, "เลือกหน่วยรับได้ไม่เกิน 20 หน่วย"),
  /** AI generated draft */
  aiAssisted: z.boolean().default(false),
  aiPromptUsed: z.string().optional().nullable(),
});

export type CreateCommandInput = z.infer<typeof createCommandSchema>;

export const updateCommandSchema = createCommandSchema.partial().extend({
  id: z.string().cuid(),
});

export type UpdateCommandInput = z.infer<typeof updateCommandSchema>;

export const transitionSchema = z.object({
  action: z.enum([
    "submit",
    "approve",
    "reject",
    "publish",
    "acknowledge",
    "start",
    "report",
    "audit",
    "close",
  ]),
  note: z.string().max(1000).optional(),
});

export type TransitionInput = z.infer<typeof transitionSchema>;

export const listCommandsSchema = z.object({
  status: z
    .enum([
      "DRAFT",
      "SUBMITTED",
      "APPROVED",
      "PUBLISHED",
      "ACKNOWLEDGED",
      "IN_PROGRESS",
      "REPORTED",
      "AUDITED",
      "CLOSED",
    ])
    .optional(),
  priority: z.enum(PRIORITIES).optional(),
  creatorId: z.string().optional(),
  search: z.string().max(200).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

export type ListCommandsInput = z.infer<typeof listCommandsSchema>;
