// In-memory background task store. Survives across HTTP requests as long as the
// Node.js process lives (perfect for demo / Railway long-running container).

import type { BackgroundTask, TaskProgress, TaskStatus, TaskType } from "./types";

interface Store {
  tasks: Map<string, BackgroundTask>;
}

declare global {
  // eslint-disable-next-line no-var
  var __taskStore: Store | undefined;
}

function getStore(): Store {
  if (!globalThis.__taskStore) {
    globalThis.__taskStore = { tasks: new Map() };
  }
  return globalThis.__taskStore;
}

export function genTaskId(): string {
  return `task-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function createTask<TInput, TResult>(opts: {
  type: TaskType;
  title: string;
  input: TInput;
  createdBy: string;
  resultHref?: string;
}): BackgroundTask<TInput, TResult> {
  const id = genTaskId();
  const task: BackgroundTask<TInput, TResult> = {
    id,
    type: opts.type,
    title: opts.title,
    status: "QUEUED",
    input: opts.input,
    createdBy: opts.createdBy,
    startedAt: new Date().toISOString(),
    resultHref: opts.resultHref,
  };
  getStore().tasks.set(id, task as BackgroundTask);
  return task;
}

export function getTask(id: string): BackgroundTask | null {
  return getStore().tasks.get(id) ?? null;
}

export function listTasks(filter?: {
  personaId?: string;
  status?: TaskStatus;
  /** include only tasks newer than this many minutes */
  withinMinutes?: number;
}): BackgroundTask[] {
  const all = Array.from(getStore().tasks.values());
  let filtered = all;
  if (filter?.personaId) {
    filtered = filtered.filter((t) => t.createdBy === filter.personaId);
  }
  if (filter?.status) {
    filtered = filtered.filter((t) => t.status === filter.status);
  }
  if (filter?.withinMinutes !== undefined) {
    const cutoff = Date.now() - filter.withinMinutes * 60 * 1000;
    filtered = filtered.filter((t) => new Date(t.startedAt).getTime() >= cutoff);
  }
  return filtered.sort((a, b) => b.startedAt.localeCompare(a.startedAt));
}

export function updateTask(
  id: string,
  patch: Partial<BackgroundTask>
): BackgroundTask | null {
  const task = getStore().tasks.get(id);
  if (!task) return null;
  Object.assign(task, patch);
  return task;
}

export function setTaskStatus(id: string, status: TaskStatus): void {
  updateTask(id, {
    status,
    ...(status === "DONE" || status === "ERROR"
      ? {
          completedAt: new Date().toISOString(),
          durationMs:
            Date.now() - new Date(getStore().tasks.get(id)?.startedAt ?? Date.now()).getTime(),
        }
      : {}),
  });
}

export function setTaskProgress(id: string, progress: TaskProgress): void {
  updateTask(id, { progress });
}

export function setTaskResult(id: string, result: unknown): void {
  const t = getStore().tasks.get(id);
  if (!t) return;
  t.result = result;
  t.status = "DONE";
  t.completedAt = new Date().toISOString();
  t.durationMs = Date.now() - new Date(t.startedAt).getTime();
}

export function setTaskError(id: string, error: string): void {
  const t = getStore().tasks.get(id);
  if (!t) return;
  t.error = error;
  t.status = "ERROR";
  t.completedAt = new Date().toISOString();
  t.durationMs = Date.now() - new Date(t.startedAt).getTime();
}

/**
 * Kick off async work without awaiting — fire-and-forget pattern.
 * The Node.js process keeps the task alive until completion.
 */
export function runInBackground(
  taskId: string,
  job: () => Promise<unknown>
): void {
  setTaskStatus(taskId, "RUNNING");
  // Use setImmediate to ensure the HTTP response is sent first
  setImmediate(async () => {
    try {
      const result = await job();
      setTaskResult(taskId, result);
    } catch (e) {
      setTaskError(taskId, (e as Error).message ?? "เกิดข้อผิดพลาด");
    }
  });
}

/**
 * Garbage collect old completed tasks to avoid unbounded memory growth.
 * Removes DONE/ERROR tasks older than 1 hour.
 */
export function gcTasks(): number {
  const store = getStore();
  const cutoff = Date.now() - 60 * 60 * 1000;
  let removed = 0;
  for (const [id, t] of store.tasks.entries()) {
    if (
      (t.status === "DONE" || t.status === "ERROR") &&
      t.completedAt &&
      new Date(t.completedAt).getTime() < cutoff
    ) {
      store.tasks.delete(id);
      removed++;
    }
  }
  return removed;
}
