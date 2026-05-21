// Compliance Validators — TOR 5.4.3

import { z } from "zod";

const standardEnum = z.enum(["GOR_POR_ROR", "ITA", "PMQA", "GOV4_0", "CUSTOM"]);

export const createTemplateSchema = z.object({
  standard: standardEnum,
  code: z.string().min(1).max(50),
  name: z.string().min(3).max(200),
  version: z.string().min(1).max(20),
  effectiveDate: z.coerce.date(),
});

export const updateTemplateSchema = createTemplateSchema.partial();

export const checklistItemSchema = z.object({
  code: z.string().min(1).max(50),
  category: z.string().min(1).max(100),
  question: z.string().min(5).max(2000),
  weight: z.number().min(0.1).max(10).default(1.0),
  order: z.number().int().min(0).default(0),
  evidenceRequired: z.boolean().default(false),
});

const dateInput = z.preprocess(
  (v) => (v === "" || v == null ? null : v),
  z.coerce.date().nullable().optional()
);

export const createReportSchema = z.object({
  templateId: z.string().min(1, "ต้องระบุ template"),
  unitId: z.string().nullable().optional(),
  period: z.string().min(1, "ต้องระบุช่วงเวลา"),
  dueDate: dateInput,
});

export const upsertAnswerSchema = z.object({
  itemId: z.string().min(1),
  answer: z.string().max(5000).nullable().optional(),
  selfScore: z.number().min(0).max(5).nullable().optional(),
  evidenceDocId: z.string().nullable().optional(),
  assignedUnitId: z.string().nullable().optional(),
});

export const reviewSchema = z.object({
  answers: z
    .array(
      z.object({
        itemId: z.string(),
        reviewerScore: z.number().min(0).max(5).nullable(),
        reviewerNote: z.string().max(2000).nullable().optional(),
      })
    )
    .min(1),
  overallNote: z.string().max(2000).nullable().optional(),
});

export const approveSchema = z.object({
  signatureData: z.string().min(10, "ต้องลงลายเซ็น"),
  certificateRef: z.string().nullable().optional(),
});

export type CreateTemplateInput = z.infer<typeof createTemplateSchema>;
export type UpdateTemplateInput = z.infer<typeof updateTemplateSchema>;
export type ChecklistItemInput = z.infer<typeof checklistItemSchema>;
export type CreateReportInput = z.infer<typeof createReportSchema>;
export type UpsertAnswerInput = z.infer<typeof upsertAnswerSchema>;
export type ReviewInput = z.infer<typeof reviewSchema>;
export type ApproveInputSchema = z.infer<typeof approveSchema>;
