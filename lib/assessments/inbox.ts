// Assessment inbox helpers — what assessments does the current persona need to submit?

import { listAssessments } from "./store";
import type { Assessment } from "./types";

export interface AssessmentInboxItem {
  assessment: Assessment;
  daysLeft: number;
  isOverdue: boolean;
}

/**
 * Returns PUBLISHED assessments where:
 *   - persona.unitId is in targetUnitIds
 *   - no submission with status SUBMITTED or REVIEWED exists for that unitId
 * Sorted: overdue first, then by daysLeft ascending
 */
export function buildAssessmentInbox(persona: {
  unitId: string;
}): AssessmentInboxItem[] {
  const published = listAssessments({ status: "PUBLISHED" });
  const now = Date.now();
  const items: AssessmentInboxItem[] = [];

  for (const a of published) {
    // Must be a target unit
    if (!a.targetUnitIds.includes(persona.unitId)) continue;

    // Check if this unit already submitted (SUBMITTED or REVIEWED counts as done)
    const existing = a.submissions.find(
      (s) =>
        s.unitId === persona.unitId &&
        (s.status === "SUBMITTED" || s.status === "REVIEWED")
    );
    if (existing) continue;

    const due = new Date(a.dueDate).getTime();
    const daysLeft = Math.ceil((due - now) / (24 * 60 * 60 * 1000));

    items.push({
      assessment: a,
      daysLeft,
      isOverdue: daysLeft < 0,
    });
  }

  // Sort: overdue first, then by daysLeft ascending (most urgent first)
  items.sort((a, b) => {
    if (a.isOverdue !== b.isOverdue) return a.isOverdue ? -1 : 1;
    return a.daysLeft - b.daysLeft;
  });

  return items;
}
