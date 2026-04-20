import { Router, type IRouter } from "express";
import { db, resourcesTable, collectionsTable } from "@workspace/db";
import { eq, sql } from "drizzle-orm";

const router: IRouter = Router();

router.get("/stats/summary", async (_req, res): Promise<void> => {
  const [totals] = await db
    .select({
      total: sql<number>`COUNT(*)::int`,
      pinned: sql<number>`SUM(CASE WHEN ${resourcesTable.pinned} THEN 1 ELSE 0 END)::int`,
    })
    .from(resourcesTable);

  const typeCounts = await db
    .select({
      type: resourcesTable.type,
      count: sql<number>`COUNT(*)::int`,
    })
    .from(resourcesTable)
    .groupBy(resourcesTable.type);

  const [collectionCount] = await db
    .select({ count: sql<number>`COUNT(*)::int` })
    .from(collectionsTable);

  const byType: Record<string, number> = {};
  for (const row of typeCounts) {
    byType[row.type] = row.count;
  }

  res.json({
    total: totals?.total ?? 0,
    pinned: totals?.pinned ?? 0,
    byType,
    collections: collectionCount?.count ?? 0,
  });
});

router.get("/stats/tags", async (_req, res): Promise<void> => {
  const resources = await db
    .select({ tags: resourcesTable.tags })
    .from(resourcesTable);

  const tagCounts = new Map<string, number>();
  for (const row of resources) {
    if (row.tags) {
      for (const tag of row.tags.split(",").map((t) => t.trim()).filter(Boolean)) {
        tagCounts.set(tag, (tagCounts.get(tag) ?? 0) + 1);
      }
    }
  }

  const result = Array.from(tagCounts.entries())
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count);

  res.json(result);
});

export default router;
