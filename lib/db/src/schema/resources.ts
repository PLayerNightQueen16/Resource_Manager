import { pgTable, text, serial, timestamp, boolean, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const resourcesTable = pgTable("resources", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  type: text("type").notNull(),
  url: text("url"),
  description: text("description"),
  tags: text("tags"),
  colorLabel: text("color_label"),
  collectionId: integer("collection_id"),
  pinned: boolean("pinned").notNull().default(false),
  sortOrder: integer("sort_order").notNull().default(0),
  author: text("author"),
  coverUrl: text("cover_url"),
  content: text("content"),
  filePath: text("file_path"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertResourceSchema = createInsertSchema(resourcesTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertResource = z.infer<typeof insertResourceSchema>;
export type Resource = typeof resourcesTable.$inferSelect;
