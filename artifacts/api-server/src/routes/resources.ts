import { Router, type IRouter } from "express";
import { eq, desc, asc, ilike, or, and, sql } from "drizzle-orm";
import { db, resourcesTable } from "@workspace/db";
import {
  ListResourcesQueryParams,
  CreateResourceBody,
  GetResourceParams,
  GetResourceResponse,
  UpdateResourceParams,
  UpdateResourceBody,
  DeleteResourceParams,
  TogglePinParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/resources", async (req, res): Promise<void> => {
  const query = ListResourcesQueryParams.safeParse(req.query);
  if (!query.success) {
    res.status(400).json({ error: query.error.message });
    return;
  }

  const { search, type, tags, collectionId, pinned } = query.data;

  const conditions = [];

  if (search) {
    conditions.push(
      or(
        ilike(resourcesTable.title, `%${search}%`),
        ilike(resourcesTable.tags, `%${search}%`),
        ilike(resourcesTable.description, `%${search}%`),
      ),
    );
  }

  if (type) {
    conditions.push(eq(resourcesTable.type, type));
  }

  if (tags) {
    conditions.push(ilike(resourcesTable.tags, `%${tags}%`));
  }

  if (collectionId !== undefined) {
    conditions.push(eq(resourcesTable.collectionId, collectionId));
  }

  if (pinned !== undefined) {
    conditions.push(eq(resourcesTable.pinned, pinned));
  }

  const resources = await db
    .select()
    .from(resourcesTable)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(resourcesTable.pinned), asc(resourcesTable.sortOrder), desc(resourcesTable.createdAt));

  res.json(resources);
});

router.post("/resources", async (req, res): Promise<void> => {
  const parsed = CreateResourceBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const maxOrder = await db
    .select({ max: sql<number>`COALESCE(MAX(${resourcesTable.sortOrder}), 0)` })
    .from(resourcesTable);

  const sortOrder = (maxOrder[0]?.max ?? 0) + 1;

  const [resource] = await db
    .insert(resourcesTable)
    .values({ ...parsed.data, sortOrder })
    .returning();

  res.status(201).json(resource);
});

router.get("/resources/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = GetResourceParams.safeParse({ id: parseInt(raw, 10) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [resource] = await db
    .select()
    .from(resourcesTable)
    .where(eq(resourcesTable.id, params.data.id));

  if (!resource) {
    res.status(404).json({ error: "Resource not found" });
    return;
  }

  res.json(GetResourceResponse.parse(resource));
});

router.patch("/resources/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = UpdateResourceParams.safeParse({ id: parseInt(raw, 10) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdateResourceBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [resource] = await db
    .update(resourcesTable)
    .set({ ...parsed.data, updatedAt: new Date() })
    .where(eq(resourcesTable.id, params.data.id))
    .returning();

  if (!resource) {
    res.status(404).json({ error: "Resource not found" });
    return;
  }

  res.json(resource);
});

router.delete("/resources/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = DeleteResourceParams.safeParse({ id: parseInt(raw, 10) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [deleted] = await db
    .delete(resourcesTable)
    .where(eq(resourcesTable.id, params.data.id))
    .returning();

  if (!deleted) {
    res.status(404).json({ error: "Resource not found" });
    return;
  }

  res.json({ success: true });
});

router.patch("/resources/:id/pin", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = TogglePinParams.safeParse({ id: parseInt(raw, 10) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [current] = await db
    .select()
    .from(resourcesTable)
    .where(eq(resourcesTable.id, params.data.id));

  if (!current) {
    res.status(404).json({ error: "Resource not found" });
    return;
  }

  const [resource] = await db
    .update(resourcesTable)
    .set({ pinned: !current.pinned, updatedAt: new Date() })
    .where(eq(resourcesTable.id, params.data.id))
    .returning();

  res.json(resource);
});

export default router;
