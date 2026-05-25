"use client";

// Floating task notifier — polls /api/tasks and shows running + recently done.
// Persists across navigation since it lives in app layout.

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import {
  Sparkles,
  Loader2,
  CheckCircle2,
  AlertCircle,
  X,
  ChevronDown,
  ChevronUp,
  Clock,
  ArrowRight,
} from "lucide-react";
import type { BackgroundTask } from "@/lib/tasks/types";
import { TASK_TYPE_LABELS } from "@/lib/tasks/types";

const POLL_INTERVAL = 2000; // 2s while open or task running
const SLOW_POLL = 8000; // 8s when idle

export function TaskNotifier() {
  const [tasks, setTasks] = useState<BackgroundTask[]>([]);
  const [expanded, setExpanded] = useState(false);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const [seenIds, setSeenIds] = useState<Set<string>>(new Set());
  const lastDoneRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    let alive = true;
    let timer: ReturnType<typeof setTimeout>;

    async function tick() {
      try {
        const res = await fetch("/api/tasks");
        const j = await res.json();
        if (!alive) return;
        const ts: BackgroundTask[] = j.data ?? [];
        setTasks(ts);

        // Detect newly completed tasks → show notification + browser title flash
        const justDone = ts.filter(
          (t) =>
            (t.status === "DONE" || t.status === "ERROR") &&
            !lastDoneRef.current.has(t.id) &&
            seenIds.has(t.id) // only show if we saw it running
        );
        if (justDone.length > 0) {
          for (const t of justDone) lastDoneRef.current.add(t.id);
          setExpanded(true); // auto-open panel
        }

        // Update seen set with currently running tasks
        const running = ts.filter((t) => t.status === "RUNNING" || t.status === "QUEUED");
        if (running.length > 0) {
          setSeenIds((prev) => {
            const next = new Set(prev);
            running.forEach((t) => next.add(t.id));
            return next;
          });
        }

        // Adaptive polling
        const hasActive = running.length > 0;
        timer = setTimeout(tick, hasActive ? POLL_INTERVAL : SLOW_POLL);
      } catch {
        timer = setTimeout(tick, SLOW_POLL);
      }
    }

    tick();
    return () => {
      alive = false;
      clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const visible = tasks.filter((t) => !dismissed.has(t.id));
  const running = visible.filter((t) => t.status === "RUNNING" || t.status === "QUEUED");
  const done = visible.filter((t) => t.status === "DONE");
  const errored = visible.filter((t) => t.status === "ERROR");
  const total = visible.length;

  if (total === 0) return null;

  function dismissAll() {
    setDismissed((prev) => {
      const next = new Set(prev);
      visible.forEach((t) => next.add(t.id));
      return next;
    });
    setExpanded(false);
  }

  function dismiss(id: string) {
    setDismissed((prev) => {
      const next = new Set(prev);
      next.add(id);
      return next;
    });
  }

  return (
    <div
      className="fixed bottom-4 right-4 z-50 w-80 max-w-[calc(100vw-2rem)]"
      suppressHydrationWarning
    >
      {/* Collapsed badge */}
      {!expanded && (
        <button
          type="button"
          suppressHydrationWarning
          onClick={() => setExpanded(true)}
          className="w-full inline-flex items-center gap-2 rounded-sm border-2 border-[#1e3a5f] bg-white dark:bg-slate-900 shadow-lg px-3 py-2.5 hover:shadow-xl transition-shadow"
        >
          {running.length > 0 ? (
            <>
              <Loader2 className="h-4 w-4 text-blue-600 animate-spin shrink-0" />
              <span className="text-sm font-bold text-slate-900 dark:text-slate-100">
                AI กำลังทำงาน
              </span>
              <span className="bg-blue-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-sm">
                {running.length}
              </span>
            </>
          ) : (
            <>
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
              <span className="text-sm font-bold text-slate-900 dark:text-slate-100">
                งาน AI เสร็จแล้ว
              </span>
              <span className="bg-emerald-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-sm">
                {done.length}
              </span>
            </>
          )}
          <ChevronUp className="h-3 w-3 text-slate-400 ml-auto" />
        </button>
      )}

      {/* Expanded panel */}
      {expanded && (
        <div className="rounded-sm border-2 border-[#1e3a5f] bg-white dark:bg-slate-900 shadow-xl overflow-hidden">
          <div className="bg-[#1e3a5f] px-3 py-2 flex items-center gap-2 text-white">
            <Sparkles className="h-4 w-4 text-[#d4a017]" />
            <span className="text-sm font-bold">งาน AI เบื้องหลัง</span>
            <span className="text-[10px] text-[#d4a017] ml-auto">
              {running.length} running · {done.length} done
            </span>
            <button
              type="button"
              suppressHydrationWarning
              onClick={() => setExpanded(false)}
              className="text-white/70 hover:text-white p-0.5"
              aria-label="ย่อ"
            >
              <ChevronDown className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="max-h-96 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
            {[...running, ...done, ...errored].map((t) => (
              <TaskRow key={t.id} task={t} onDismiss={() => dismiss(t.id)} />
            ))}
          </div>

          {total > 0 && (
            <div className="border-t border-slate-100 dark:border-slate-800 px-3 py-2 text-right">
              <button
                type="button"
                suppressHydrationWarning
                onClick={dismissAll}
                className="text-[11px] text-slate-500 hover:text-slate-900 dark:hover:text-slate-100"
              >
                ปิดทั้งหมด
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function TaskRow({ task, onDismiss }: { task: BackgroundTask; onDismiss: () => void }) {
  const isRunning = task.status === "RUNNING" || task.status === "QUEUED";
  const isDone = task.status === "DONE";
  const isError = task.status === "ERROR";

  return (
    <div className="px-3 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-800/40">
      <div className="flex items-start gap-2">
        <div className="mt-0.5 shrink-0">
          {isRunning && <Loader2 className="h-4 w-4 text-blue-600 animate-spin" />}
          {isDone && <CheckCircle2 className="h-4 w-4 text-emerald-600" />}
          {isError && <AlertCircle className="h-4 w-4 text-red-600" />}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
              {TASK_TYPE_LABELS[task.type]}
            </span>
            {isRunning && (
              <span className="text-[10px] text-blue-600 font-semibold animate-pulse">
                กำลังทำ...
              </span>
            )}
            {isDone && (
              <span className="text-[10px] text-emerald-600 font-semibold">เสร็จ</span>
            )}
            {isError && (
              <span className="text-[10px] text-red-600 font-semibold">ผิดพลาด</span>
            )}
          </div>
          <div className="text-xs font-semibold text-slate-800 dark:text-slate-200 line-clamp-2 mt-0.5">
            {task.title}
          </div>

          {/* Progress bar for running tasks */}
          {isRunning && task.progress && (
            <div className="mt-1.5">
              <div className="flex items-center justify-between text-[10px] text-slate-500 mb-0.5">
                <span className="truncate">{task.progress.label}</span>
                <span className="tabular-nums">
                  {task.progress.step}/{task.progress.totalSteps}
                </span>
              </div>
              <div className="h-1 rounded-sm bg-slate-100 dark:bg-slate-700 overflow-hidden">
                <div
                  className="h-full bg-blue-500 transition-all"
                  style={{
                    width: `${(task.progress.step / task.progress.totalSteps) * 100}%`,
                  }}
                />
              </div>
            </div>
          )}

          {/* Error message */}
          {isError && task.error && (
            <div className="text-[11px] text-red-600 dark:text-red-400 mt-1 leading-tight">
              {task.error}
            </div>
          )}

          {/* Action row */}
          <div className="flex items-center gap-2 mt-1.5">
            {task.durationMs && (
              <span className="inline-flex items-center gap-0.5 text-[10px] text-slate-400">
                <Clock className="h-2.5 w-2.5" />
                {(task.durationMs / 1000).toFixed(1)}s
              </span>
            )}
            {isDone && task.resultHref && (
              <Link
                href={task.resultHref}
                className="ml-auto inline-flex items-center gap-0.5 text-[11px] font-semibold text-[#1e3a5f] dark:text-amber-400 hover:underline"
              >
                ดูผล
                <ArrowRight className="h-3 w-3" />
              </Link>
            )}
            {!isRunning && (
              <button
                type="button"
                suppressHydrationWarning
                onClick={onDismiss}
                className="text-slate-300 hover:text-slate-600 p-0.5"
                aria-label="ปิด"
              >
                <X className="h-2.5 w-2.5" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
