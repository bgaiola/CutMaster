# NestBrain — Development Guide

## Quick Reference

```bash
npm run dev      # Start dev server (http://localhost:5173)
npm run build    # TypeScript compile + Vite build
npm run preview  # Preview production build
npm run lint     # ESLint
```

## Architecture

### Tech Stack
- **React 18** + **TypeScript** (strict mode)
- **Vite 5** — build tool, dev server, Web Worker support
- **Zustand** — state management (4 independent stores)
- **Tailwind CSS 3** — utility-first styling with custom theme
- **jsPDF 4** + **jspdf-autotable 5** — PDF generation
- **Supabase** — auth + PostgreSQL (optional, app works offline)

### Directory Structure

```
src/
  components/
    layout/       # Toolbar, TabBar
    tabs/         # PiecesTab, MaterialsTab, EdgeBandsTab, ResultsTab,
                  # LabelsTab, ReportsTab, CostsTab
    results/      # ResultsDashboard, CuttingPlanViewer
    pieces/       # PiecePreview
    ui/           # OptimizationOverlay, Notifications, ExportMenu
    auth/         # AuthModal
    projects/     # ProjectManager
  stores/         # Zustand stores (appStore, piecesStore, materialsStore,
                  #   edgeBandsStore, authStore)
  engine/
    optimizer.ts          # Web Worker wrapper
    optimizer.worker.ts   # Core nesting algorithms (~800 lines)
  utils/
    helpers.ts            # UUID, CSV parsing, color palette
    costCalculator.ts     # Cost enrichment for optimization results
    validation.ts         # Input validation (CSV, dimensions, costs)
    pdfExporter.ts        # PDF report generation
    dxfExporter.ts        # DXF export for CNC machines
    csvExporter.ts        # CSV cutting list export
  lib/
    supabase.ts           # Supabase client (null when offline)
    storage.ts            # StorageAdapter interface
    localStorageAdapter.ts   # IndexedDB persistence
    supabaseStorageAdapter.ts # Supabase persistence
  i18n/                   # Translations (es, pt-BR, en, fr, it)
  types/index.ts          # All TypeScript interfaces (incl. Figure, FigurePiecePlacement)
  hooks/                  # useKeyboardShortcuts
supabase/
  functions/
    _shared/              # CORS headers, auth helper (JWT + API key)
    optimize/index.ts     # POST /functions/v1/optimize — optimization API
    api-keys/index.ts     # CRUD for API keys
  migrations/
    001_initial.sql       # profiles, projects, materials_library, edge_bands_library
    002_api_keys.sql      # api_keys table
```

### State Management

4 Zustand stores — no Redux, no Context:

| Store | Purpose |
|-------|---------|
| `appStore` | UI state, locale, config, results, project metadata |
| `piecesStore` | Pieces CRUD + undo/redo (50-entry history) |
| `materialsStore` | Materials CRUD |
| `edgeBandsStore` | Edge bands CRUD |
| `authStore` | Auth state (user, signIn, signOut) |
| `figuresStore` | Figures for grain matching |

### Optimization Engine

Runs in a **Web Worker** to avoid UI blocking.

- **Guillotine mode**: shelf-based packing with strip filling
- **Freeform mode**: MaxRects with 6 heuristics (BSSF, BLSF, BAF, BLTC, BL, CP)
- **Advanced mode**: exhaustive strategy x heuristic combinations + iterated greedy with simulated annealing
- **Stacking**: identical layouts are deduplicated with `stackCount`
- **Grain direction**: respects both piece and material grain constraints

Message protocol: `{ type: 'run' | 'progress' | 'result' | 'error' }`

### Cost Calculation

`enrichResultWithCosts()` in `costCalculator.ts` computes per-plan costs:
- **Material**: sheet area (m2) x stackCount x pricePerM2
- **Waste**: waste area (m2) x stackCount x wasteCostPerM2
- **Cutting**: estimated cut length (linear m) x stackCount x cutCostPerLinearM
- **Edge bands**: sum of band lengths (linear m) x costPerLinearM x stackCount

Cut length is estimated from unique cut lines derived from placed piece positions.

### Persistence Model

Dual-adapter pattern:
- **Offline**: IndexedDB via `localStorageAdapter.ts`
- **Online**: Supabase via `supabaseStorageAdapter.ts`
- App works without Supabase env vars (graceful degradation)

## Conventions

- **Language**: TypeScript strict mode. No `any` unless unavoidable.
- **Components**: functional components with hooks. No class components.
- **Styling**: Tailwind utility classes. Custom theme in `tailwind.config.js`.
- **State**: Zustand stores with `create<T>()`. Selectors via `useStore(s => s.field)`.
- **Imports**: use `@/` path alias (maps to `src/`).
- **i18n**: all user-facing strings go through `useTranslation()`. Add to all 5 locale files.
- **IDs**: `crypto.randomUUID()` or `uuid` package.
- **Units**: all dimensions in mm internally. Convert to m2/linear m for display and costs.
- **CSV parsing**: use `csvToArray()` from helpers (handles `,`, `;`, `\t` delimiters with quote support).

## Adding Translations

1. Add the key to `src/i18n/es.ts` (canonical type source)
2. Add the same key to all other locale files: `pt-br.ts`, `en.ts`, `fr.ts`, `it.ts`
3. Use via `const { t } = useTranslation(); t.section.key`

## Environment Variables

```
VITE_SUPABASE_URL=        # Supabase project URL (optional)
VITE_SUPABASE_ANON_KEY=   # Supabase anon/public key (optional)
```

When both are absent, the app runs in offline-only mode.

## REST API

The optimization engine is exposed as a Supabase Edge Function at `POST /functions/v1/optimize`.

**Authentication**: Bearer token (Supabase JWT or custom API key from `api_keys` table).

**Request body**:
```json
{
  "pieces": [{ "material": "...", "width": 500, "height": 300, "quantity": 2, ... }],
  "materials": [{ "code": "...", "sheetWidth": 2750, "sheetHeight": 1830, ... }],
  "edgeBands": [],
  "config": { "bladeThickness": 4, "mode": "guillotine", ... },
  "costEnabled": true,
  "saveProject": true,
  "projectName": "My Project"
}
```

**Response**: `{ success: true, data: OptimizationResult, projectId?: string, computeTimeMs: number }`

The optimizer core is extracted as `runOptimizationCore()` from `optimizer.worker.ts` — a pure function usable in both Web Worker and Edge Function contexts.

## Figures (Grain Matching)

Figures group pieces that should be cut from the same sheet for wood grain continuity.
- Types: `Figure`, `FigurePiecePlacement` in `types/index.ts`
- Store: `figuresStore.ts`
- Editor: `components/figures/FigureEditor.tsx` — visual drag-and-drop positioning
- Access: Select 2+ pieces in PiecesTab, click "Create Figure"
