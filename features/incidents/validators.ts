// Incident validators — TOR ๖.๔

import { z } from "zod";

export const createIncidentSchema = z.object({
  type: z.string().min(1).max(50),
  title: z.string().min(5).max(200),
  description: z.string().max(5000).nullable().optional(),
  location: z.string().max(200).nullable().optional(),
  lat: z.number().nullable().optional(),
  lng: z.number().nullable().optional(),
  severity: z.number().int().min(1).max(10).default(5),
  assignedUnitId: z.string().nullable().optional(),
  missionId: z.string().nullable().optional(),
  occurredAt: z.coerce.date().optional(),
  externalRef: z.string().nullable().optional(),
});

export const updateIncidentSchema = createIncidentSchema.partial();

export const assignIncidentSchema = z.object({
  unitId: z.string().min(1, "ต้องระบุหน่วยรับ"),
  note: z.string().max(2000).nullable().optional(),
});

export const respondIncidentSchema = z.object({
  note: z.string().max(2000).nullable().optional(),
});

export const linkIncidentSchema = z.object({
  missionId: z.string().nullable().optional(),
  commandId: z.string().nullable().optional(),
});

export const closeIncidentSchema = z.object({
  resolution: z.string().min(5).max(5000),
});

export type CreateIncidentInput = z.infer<typeof createIncidentSchema>;
export type UpdateIncidentInput = z.infer<typeof updateIncidentSchema>;
export type AssignIncidentInput = z.infer<typeof assignIncidentSchema>;
export type RespondIncidentInput = z.infer<typeof respondIncidentSchema>;
export type LinkIncidentInput = z.infer<typeof linkIncidentSchema>;
export type CloseIncidentInput = z.infer<typeof closeIncidentSchema>;
