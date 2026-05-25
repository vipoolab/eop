// /tasks/[id] — generic task result viewer (renders different UI per task type)

import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  CheckCircle2,
  Loader2,
  AlertCircle,
  Clock,
  Sparkles,
  FileText,
} from "lucide-react";
import { getTask } from "@/lib/tasks/store";
import { TASK_TYPE_LABELS } from "@/lib/tasks/types";
import { TaskResultViewer } from "./viewer";

export const dynamic = "force-dynamic";

export default async function TaskPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const task = getTask(id);
  if (!task) notFound();

  return (
    <div className="space-y-5">
      <Link
        href="/intelligence"
        className="inline-flex items-center gap-1 text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900"
      >
        <ArrowLeft className="h-4 w-4" />
        กลับ
      </Link>

      <section className="rounded-sm border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-5">
        <div className="flex items-center gap-3 flex-wrap">
          <div
            className={`h-12 w-12 rounded-sm flex items-center justify-center shrink-0 ${
              task.status === "DONE"
                ? "bg-emerald-600"
                : task.status === "ERROR"
                  ? "bg-red-600"
                  : "bg-blue-600"
            }`}
          >
            {task.status === "RUNNING" || task.status === "QUEUED" ? (
              <Loader2 className="h-6 w-6 text-white animate-spin" />
            ) : task.status === "DONE" ? (
              <CheckCircle2 className="h-6 w-6 text-white" />
            ) : (
              <AlertCircle className="h-6 w-6 text-white" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-widest text-[#b8860b]">
                {TASK_TYPE_LABELS[task.type]}
              </span>
              <span
                className={`text-[10px] font-bold px-1.5 py-0.5 rounded-sm ${
                  task.status === "DONE"
                    ? "bg-emerald-100 text-emerald-800"
                    : task.status === "ERROR"
                      ? "bg-red-100 text-red-800"
                      : "bg-blue-100 text-blue-800"
                }`}
              >
                {task.status}
              </span>
            </div>
            <h1 className="text-base font-bold text-slate-900 dark:text-slate-100 mt-0.5">
              {task.title}
            </h1>
            <div className="flex items-center gap-3 text-[11px] text-slate-500 mt-1">
              <span className="inline-flex items-center gap-1">
                <Sparkles className="h-3 w-3" />
                AI Engine
              </span>
              <span className="inline-flex items-center gap-1">
                <Clock className="h-3 w-3" />
                เริ่ม {new Date(task.startedAt).toLocaleString("th-TH")}
              </span>
              {task.durationMs && (
                <span className="text-slate-400">
                  · {(task.durationMs / 1000).toFixed(1)} วินาที
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Progress for running tasks */}
        {(task.status === "RUNNING" || task.status === "QUEUED") && task.progress && (
          <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
            <div className="flex items-center justify-between text-xs text-slate-600 mb-1">
              <span>{task.progress.label}</span>
              <span className="tabular-nums">
                {task.progress.step}/{task.progress.totalSteps}
              </span>
            </div>
            <div className="h-2 rounded-sm bg-slate-100 dark:bg-slate-800 overflow-hidden">
              <div
                className="h-full bg-blue-500 transition-all"
                style={{ width: `${(task.progress.step / task.progress.totalSteps) * 100}%` }}
              />
            </div>
          </div>
        )}

        {/* Error */}
        {task.status === "ERROR" && task.error && (
          <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 text-sm text-red-700 dark:text-red-400">
            <strong>เกิดข้อผิดพลาด:</strong> {task.error}
          </div>
        )}
      </section>

      {/* Result viewer (client component handles polling + per-type rendering) */}
      <TaskResultViewer taskId={task.id} initialTask={task} />
    </div>
  );
}
