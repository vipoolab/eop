// GET /api/tasks — list current persona's tasks (last 60 min)

import { NextResponse } from "next/server";
import { listTasks, gcTasks } from "@/lib/tasks/store";
import { getActivePersona } from "@/lib/police-org/store";

export const dynamic = "force-dynamic";

export async function GET() {
  // Opportunistic GC on each list call
  gcTasks();

  const persona = getActivePersona();
  const tasks = listTasks({ personaId: persona.id, withinMinutes: 60 });

  return NextResponse.json({
    success: true,
    data: tasks,
    counts: {
      running: tasks.filter((t) => t.status === "RUNNING" || t.status === "QUEUED").length,
      done: tasks.filter((t) => t.status === "DONE").length,
      error: tasks.filter((t) => t.status === "ERROR").length,
    },
  });
}
