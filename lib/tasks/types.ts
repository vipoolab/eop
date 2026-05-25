// Background task system — tracks long-running AI jobs across navigation

export type TaskType =
  | "draft"          // AI command drafter
  | "classify"       // single doc classification
  | "classify-batch" // multi-file batch classification
  | "ocr";           // OCR single file

export type TaskStatus = "QUEUED" | "RUNNING" | "DONE" | "ERROR";

export interface TaskProgress {
  step: number;          // current step index
  totalSteps: number;
  label: string;         // current step label
  percent?: number;      // 0-100 estimate
}

export interface BackgroundTask<TInput = unknown, TResult = unknown> {
  id: string;
  type: TaskType;
  title: string;        // human-readable, shown in notifier
  status: TaskStatus;
  input: TInput;
  result?: TResult;
  error?: string;
  progress?: TaskProgress;
  createdBy: string;    // persona id
  startedAt: string;
  completedAt?: string;
  durationMs?: number;
  /** Optional href to view the result */
  resultHref?: string;
}

export const TASK_TYPE_LABELS: Record<TaskType, string> = {
  draft: "ร่างหนังสือสั่งการ",
  classify: "จำแนกเอกสาร",
  "classify-batch": "จำแนกเอกสาร (Batch)",
  ocr: "OCR เอกสาร",
};
