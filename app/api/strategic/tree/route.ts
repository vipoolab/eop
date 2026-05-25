// GET /api/strategic/tree — return full plan hierarchy

import { NextResponse } from "next/server";
import { buildDocTree, getStats, listDocuments } from "@/lib/strategic/store";

export const dynamic = "force-dynamic";

export async function GET() {
  const tree = buildDocTree();
  const stats = getStats();
  const orphans = listDocuments().filter(
    (d) => d.level !== 1 && (d.parentDocId === null || (tree && !findInTree(tree.id, [tree])))
  );
  // Strictly: orphans = level 2/3 docs whose parentDocId no longer exists in tree
  const allDocs = listDocuments();
  const orphanDocs = allDocs.filter((d) => {
    if (d.level === 1) return false;
    if (!d.parentDocId) return true;
    return !allDocs.some((p) => p.id === d.parentDocId);
  });

  return NextResponse.json({
    success: true,
    data: {
      tree,
      stats,
      orphans: orphanDocs,
    },
  });
}

function findInTree(id: string, nodes: { id: string; childDocs?: { id: string }[] }[]): boolean {
  for (const n of nodes) {
    if (n.id === id) return true;
    if (n.childDocs?.length && findInTree(id, n.childDocs as any)) return true;
  }
  return false;
}
