# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.

## Luminary App

**Luminary** is a full-stack resource organizer with a dreamy, ethereal UI.

### Features
- Add/edit/delete resources of 6 types: Video, Website, Book, PDF, Note, Image
- Each resource has: title, type, tags, description, date, color label, collection assignment, pin/favorite
- Collections/folders to group resources
- Search bar filters by title, tags, description
- Left sidebar filters by resource type and tags
- Pin/favorite resources to float them to the top
- Click a resource card to expand details in a modal
- Stats summary in sidebar (total, pinned count, by-type counts)

### UI Aesthetic
- Deep navy/midnight dark background (#0a0a1a)
- Animated floating orbs (aurora borealis effect)
- Frosted glass cards with backdrop-filter blur
- Playfair Display headings, DM Sans body
- Per-type accent colors: Video=coral, Website=sky blue, Book=amber, PDF=rose, Note=mint, Image=lavender
- Framer Motion entrance animations
- Floating "+" FAB for adding resources

### Architecture
- **Frontend**: `artifacts/luminary` (React + Vite + Tailwind)
- **Backend**: `artifacts/api-server` (Express 5)
- **Database**: PostgreSQL via Drizzle ORM
- **Schema**: `lib/db/src/schema/` — resources.ts, collections.ts
- **API routes**: `artifacts/api-server/src/routes/` — resources.ts, collections.ts, stats.ts
- **API spec**: `lib/api-spec/openapi.yaml`
- **Generated hooks**: `lib/api-client-react/src/generated/`

### Important Notes
- After any OpenAPI spec change, run `pnpm --filter @workspace/api-spec run codegen` then fix `lib/api-zod/src/index.ts` to only export `./generated/api` (not types too, they overlap)
- Seed data: 3 collections (Inspiration, Learning, Research) + 6 resources covering all types
