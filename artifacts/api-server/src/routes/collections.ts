import { Router, type IRouter } from "express";
import { eq, desc, sql } from "drizzle-orm";
import { db, collectionsTable, resourcesTable } from "@workspace/db";
import {
  CreateCollectionBody,
  UpdateCollectionParams,
  UpdateCollectionBody,
  DeleteCollectionParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/collections", async (_req, res): Promise<void> => {
  const collections = await db.select().from(collectionsTable).orderBy(desc(collectionsTable.createdAt));

  const counts = await db
    .select({
      collectionId: resourcesTable.collectionId,
      count: sql<number>`COUNT(*)::int`,
    })
    .from(resourcesTable)
    .groupBy(resourcesTable.collectionId);

  const countMap = new Map(counts.map((c) => [c.collectionId, c.count]));

  const result = collections.map((c) => ({
    ...c,
    resourceCount: countMap.get(c.id) ?? 0,
  }));

  res.json(result);
});

router.post("/collections", async (req, res): Promise<void> => {
  const parsed = CreateCollectionBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [collection] = await db.insert(collectionsTable).values(parsed.data).returning();

  res.status(201).json({ ...collection, resourceCount: 0 });
});

router.patch("/collections/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = UpdateCollectionParams.safeParse({ id: parseInt(raw, 10) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdateCollectionBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [collection] = await db
    .update(collectionsTable)
    .set(parsed.data)
    .where(eq(collectionsTable.id, params.data.id))
    .returning();

  if (!collection) {
    res.status(404).json({ error: "Collection not found" });
    return;
  }

  const [countResult] = await db
    .select({ count: sql<number>`COUNT(*)::int` })
    .from(resourcesTable)
    .where(eq(resourcesTable.collectionId, collection.id));

  res.json({ ...collection, resourceCount: countResult?.count ?? 0 });
});

router.delete("/collections/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = DeleteCollectionParams.safeParse({ id: parseInt(raw, 10) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [deleted] = await db
    .delete(collectionsTable)
    .where(eq(collectionsTable.id, params.data.id))
    .returning();

  if (!deleted) {
    res.status(404).json({ error: "Collection not found" });
    return;
  }

  res.json({ success: true });
});

export default router;
