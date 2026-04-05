# NestBrain — Development Guide

## Quick Reference

```bash
npm run dev      # Start dev server (http://localhost:5173/NestBrain/)
npm run build    # TypeScript compile + Vite build (code-split output)
npm run preview  # Preview production build
npm run lint     # ESLint
```

## Architecture

### Tech Stack
- **React 18** + **TypeScript** (strict mode)
- **Vite 5** — build tool, dev server, Web Worker support, code splitting
- **Zustand** — state management (6 independent stores)
- **Tailwind CSS 3** — utility-first styling with custom theme
- **jsPDF 4** + **jspdf-autotable 5** — PDF generation
- **Supabase** — auth + PostgreSQL + Edge Functions (optional, app works offline)
- **idb** — IndexedDB wrapper for offline persistence

### Directory Structure

```
src/
  components/
    layout/       # Toolbar, TabBar
    tabs/         # PiecesTab, MaterialsTab, EdgeBandsTab, ResultsTab,
                  # LabelsTab, ReportsTab, CostsTab
    results/      # ResultsDashboard, CuttingPlanViewer
    pieces/       # PiecePreview
    figures/      # FigureEditor (grain matching visual editor)
    ui/           # OptimizationOverlay, Notifications, ExportMenu
    auth/         # AuthModal (login/register)
    projects/     # ProjectManager (save/load/delete)
    settings/     # ApiKeysPanel (API key management)
  stores/
    appStore.ts        # UI state, locale, config, results, project metadata
    piecesStore.ts     # Pieces CRUD + undo/redo (50-entry history)
    materialsStore.ts  # Materials CRUD
    edgeBandsStore.ts  # Edge bands CRUD
    authStore.ts       # Auth state (user, signIn, signOut)
    figuresStore.ts    # Figures for grain matching
  engine/
    optimizer.ts          # Web Worker wrapper + re-exports runOptimizationCore
    optimizer.worker.ts   # Core nesting algorithms (~900 lines)
                          # Exports: runOptimizationCore() — pure function for API use
                          # Includes: applyFigures() / explodeFigures() for super-piece logic
  utils/
    helpers.ts            # UUID, CSV parsing, color palette, downloadBlob
    costCalculator.ts     # Cost enrichment (material, waste, cutting, edge bands)
    validation.ts         # Input validation (CSV file size, dimensions, costs)
    pdfExporter.ts        # Full PDF report + cutting plan pages (jsPDF)
    dxfExporter.ts        # DXF R12 ASCII export for CNC (no external deps)
    csvExporter.ts        # CSV cut list + material summary export
  lib/
    supabase.ts              # Supabase client (null when env vars absent)
    storage.ts               # StorageAdapter interface + ProjectData/ProjectSummary types
    localStorageAdapter.ts   # IndexedDB persistence (offline)
    supabaseStorageAdapter.ts # Supabase persistence (cloud)
  i18n/                   # Translations: es (canonical), pt-BR, en, fr, it
  types/index.ts          # All TypeScript interfaces
  hooks/                  # useKeyboardShortcuts

supabase/
  functions/
    _shared/
      cors.ts             # CORS headers helper
      auth.ts             # Auth: JWT + API key validation, hashKey()
    optimize/index.ts     # POST /functions/v1/optimize — optimization API
    api-keys/index.ts     # CRUD for API keys (POST/GET/DELETE)
  migrations/
    001_initial.sql       # profiles, projects, materials_library, edge_bands_library (with RLS)
    002_api_keys.sql      # api_keys table (hashed keys, permissions, rate limits)
```

### State Management

6 Zustand stores — no Redux, no Context:

| Store | Purpose |
|-------|---------|
| `appStore` | UI state, locale, config, results, projectId, isDirty |
| `piecesStore` | Pieces CRUD + undo/redo (50-entry history) |
| `materialsStore` | Materials CRUD |
| `edgeBandsStore` | Edge bands CRUD |
| `authStore` | Supabase auth (user, signIn, signUp, signOut) |
| `figuresStore` | Figures for grain matching (addFigure, updateLayout, removeFigure) |

### Optimization Engine

Runs in a **Web Worker** to avoid UI blocking. The core is also exported as `runOptimizationCore()` — a pure function usable in Edge Functions and tests.

- **Guillotine mode**: shelf-based packing with strip filling and sub-strip gap filling
- **Freeform mode**: MaxRects with 6 heuristics (BSSF, BLSF, BAF, BLTC, BL, CP)
- **Advanced mode**: exhaustive strategy x heuristic combinations + iterated greedy with simulated annealing + per-sheet re-optimization + sheet reduction + last-sheet optimization
- **Stacking**: identical layouts are deduplicated with `stackCount`
- **Grain direction**: respects both piece and material grain constraints
- **Figures**: `applyFigures()` converts figure groups into super-pieces before optimization; `explodeFigures()` restores individual pieces with correct positions after optimization

Worker message protocol: `{ type: 'run', pieces, materials, edgeBands, config, figures? }`
Output messages: `progress | result | error`

### Figures (Grain Matching)

Figures group pieces that should be cut from the same sheet for wood grain continuity.

**Data flow:**
1. User selects 2+ pieces in PiecesTab → clicks "Create Figure"
2. FigureEditor opens: drag-and-drop positioning, gap control, auto-arrange
3. Figure saved to `figuresStore` with `boundingWidth` / `boundingHeight`
4. On optimize: `applyFigures()` replaces grouped pieces with a single super-piece (bounding box)
5. Optimizer places super-piece normally on a sheet
6. `explodeFigures()` replaces super-piece with individual pieces at correct offsets
7. All figure pieces end up on the same sheet with grain continuity

**Types:** `Figure`, `FigurePiecePlacement` in `types/index.ts`
**Store:** `figuresStore.ts` — `addFigure(pieceIds, gap)`, `updateLayout(id, layout, w, h)`, `removeFigure(id)`
**Editor:** `components/figures/FigureEditor.tsx` — SVG canvas with drag, auto-stack, gap control

### Cost Calculation

`enrichResultWithCosts()` in `costCalculator.ts` computes per-plan costs:
- **Material**: sheet area (m2) x stackCount x pricePerM2
- **Waste**: waste area (m2) x stackCount x wasteCostPerM2
- **Cutting**: estimated cut length (linear m) x stackCount x cutCostPerLinearM
- **Edge bands**: sum of band lengths (linear m) x costPerLinearM x stackCount

Cut length is estimated by collecting unique horizontal and vertical cut lines from placed piece edge positions within the usable sheet area.

### Persistence Model

Dual-adapter pattern:
- **Offline**: IndexedDB via `localStorageAdapter.ts` (always available)
- **Online**: Supabase via `supabaseStorageAdapter.ts` (when authenticated)
- App works without Supabase env vars (graceful degradation)
- `ProjectManager` component auto-selects adapter based on auth state

### Export Modules

| Module | File | Format | Notes |
|--------|------|--------|-------|
| PDF report | `pdfExporter.ts` | A4 landscape | Cover, cut list, material consumption, costs, per-plan visuals |
| DXF | `dxfExporter.ts` | DXF R12 ASCII | Layers: PIECES, CUTS, SCRAPS, SHEET_BORDER. No external deps. |
| CSV cut list | `csvExporter.ts` | UTF-8 BOM | Per-piece placement details. Also exports material summary. |
| ExportMenu | `ExportMenu.tsx` | — | Unified dropdown in Toolbar with all export options |

### REST API (Supabase Edge Functions)

**`POST /functions/v1/optimize`**
- Auth: Bearer token (Supabase JWT or custom API key)
- Body: `{ pieces, materials, edgeBands?, config, costEnabled?, saveProject?, projectName? }`
- Response: `{ success, data: OptimizationResult, projectId?, computeTimeMs }`
- Rate limited: 10 req/min per user (in-memory; upgrade to Redis for production)
- Validates: max 2000 pieces, max 100 materials

**`POST|GET|DELETE /functions/v1/api-keys`**
- Auth: Supabase JWT only (not API keys)
- POST: creates new key (returns raw key once, stores SHA-256 hash)
- GET: lists user's keys (id, name, created_at, last_used_at, revoked_at)
- DELETE: revokes key by id

API keys are prefixed with `nb_` and stored as SHA-256 hashes in `api_keys` table.

## Conventions

- **Language**: TypeScript strict mode. No `any` unless unavoidable.
- **Components**: functional components with hooks. No class components.
- **Styling**: Tailwind utility classes. Custom theme in `tailwind.config.js`.
- **State**: Zustand stores with `create<T>()`. Selectors via `useStore(s => s.field)`.
- **Imports**: use `@/` path alias (maps to `src/`).
- **i18n**: all user-facing strings go through `useTranslation()`. Add keys to all 5 locale files.
- **i18n canonical source**: `src/i18n/es.ts` defines the `Translations` type.
- **IDs**: `crypto.randomUUID()` or `uuid` package.
- **Units**: all dimensions in mm internally. Convert to m2/linear m for display and costs.
- **CSV parsing**: use `csvToArray()` from helpers (handles `,`, `;`, `\t` delimiters with quote support).
- **Piece selection**: checkboxes in PiecesTab toggle independently (no Shift required).

## Adding Translations

1. Add the key to `src/i18n/es.ts` (canonical type source)
2. Add the same key to all other locale files: `pt-br.ts`, `en.ts`, `fr.ts`, `it.ts`
3. Use via `const { t } = useTranslation(); t.section.key`

i18n sections: `common`, `toolbar`, `tabs`, `piecesTab`, `materialsTab`, `edgeBandsTab`, `resultsTab`, `labelsTab`, `reportsTab`, `costsTab`, `notifications`, `piecePreview`, `optimization`, `figures`, `auth`, `projects`, `apiKeys`, `exportMenu`

## Environment Variables

```
VITE_SUPABASE_URL=        # Supabase project URL (optional)
VITE_SUPABASE_ANON_KEY=   # Supabase anon/public key (optional)
```

When both are absent, the app runs in offline-only mode. All features except cloud sync and API work locally.

## Build Output

Code-split chunks (Vite rollup):
- `index` (~226 KB) — app code
- `vendor-react` (~145 KB) — React + Zustand
- `vendor-pdf` (~422 KB) — jsPDF + autotable (lazy-loaded on export)
- `vendor-utils` (~69 KB) — file-saver, papaparse, uuid, jsbarcode
- `vendor-supabase` — Supabase SDK (tree-shaken if unused)
- `optimizer.worker` (~14 KB) — Web Worker bundle

## Current Status & What's Next

### Implemented (v2.0.0)
- Optimization engine (guillotine + freeform + advanced)
- Figures / grain matching (super-piece approach)
- Cost calculation (material, waste, cutting, edge bands)
- PDF / DXF / CSV / SVG / JSON exports
- Supabase auth + project persistence (local + cloud)
- REST API with API key auth + rate limiting
- 5-language i18n
- Code splitting

### Not Yet Implemented
- Custom shapes (L-shapes, triangles, polygons) — types and rendering needed
- Supabase deployment (Edge Functions need `supabase functions deploy`)
- Stripe subscription tiers
- Collaboration / project sharing
- PWA / service worker for offline
- Automated tests (Vitest recommended)
- Optimizer core bundling for Edge Functions (currently needs manual copy)
