# NestBrain

**Cutting optimization platform for panel and sheet materials.**

NestBrain helps furniture makers, carpenters, and manufacturers minimize waste when cutting rectangular pieces from standard sheet materials (melamine, MDF, plywood, glass, ACM, etc.).

![Version](https://img.shields.io/badge/version-2.0.0-blue) ![License](https://img.shields.io/badge/license-MIT-green)

**Live demo:** [bgaiola.github.io/NestBrain](https://bgaiola.github.io/NestBrain/)

## Features

### Optimization Engine
- **Two cutting modes**: Guillotine (straight cuts only, suitable for panel saws) and Free Form / MaxRects (flexible placement, ideal for CNC)
- **6 sorting strategies** with best-result selection
- **Advanced mode**: iterated greedy + simulated annealing for maximum sheet utilization
- **Grain direction**: respects wood grain for both pieces and materials
- **Stacking**: deduplicates identical layouts and calculates machine loads

### Figures (Grain Matching)
- Select 2+ pieces in the pieces list and click **"Create Figure"**
- Opens a visual drag-and-drop editor to position pieces as a furniture element (e.g., drawer fronts stacked vertically)
- Configurable gap between pieces (defaults to blade thickness)
- Auto-arrange: stack vertical or horizontal with one click
- The optimizer treats the figure as a single super-piece, ensuring all parts are cut from the same sheet for continuous wood grain

### Cost Management
- Full cost breakdown: material, waste, cutting (per linear meter), and edge banding
- Per-plan and per-material cost analysis
- Cost per piece and cost per m2 calculations

### Exports
- **PDF**: full reports with cutting plans, material consumption, and cost breakdown
- **DXF**: R12 ASCII format for CNC machines, with layers (PIECES, CUTS, SCRAPS, SHEET_BORDER)
- **CSV**: cut lists and material summary
- **SVG / JSON**: raw data export

### User Accounts & Projects
- Optional Supabase integration for cloud storage
- Save/load projects locally (IndexedDB) or in the cloud
- Works fully offline without an account

### REST API
- `POST /functions/v1/optimize` — send pieces + materials, get optimization results
- Authentication via Supabase JWT or custom API keys
- Auto-saves results as projects in the user's account
- Rate limited (10 req/min per user)

### Other
- **Edge banding** for all four sides with supplementary dimension increase
- **Interactive SVG visualization** with color-coded pieces, scraps, and measurements
- **Label designer** with barcode generation for workshop use
- **Reports**: executive summary, material consumption, scrap analysis
- **5 languages**: Espanol, Portugues (BR), English, Francais, Italiano
- **CSV import/export** with multi-language column headers

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) 18+
- npm

### Installation

```bash
git clone https://github.com/bgaiola/NestBrain.git
cd NestBrain
npm install
npm run dev
```

The app will be available at `http://localhost:5173/NestBrain/`.

### Environment Variables (optional)

For cloud features (user accounts, project sync), create a `.env` file:

```bash
cp .env.example .env
# Fill in your Supabase credentials
```

The app works fully without these — all features run locally in the browser.

### Build for Production

```bash
npm run build
npm run preview
```

## Usage

1. **Add Materials** — Define sheet materials (dimensions, grain, trim margins, costs) or import from CSV.
2. **Add Pieces** — Enter pieces to cut (dimensions, quantity, grain, edge bands) or import from CSV.
3. **Configure** — Set blade thickness, optimization mode (Guillotine / Free Form), stacking, and rotation.
4. **Figures** *(optional)* — Select 2+ pieces, click "Create Figure", arrange them for grain matching.
5. **Optimize** — Click "Optimize" to generate cutting plans.
6. **Review Results** — Browse visual cutting plans, utilization stats, costs, and scrap areas.
7. **Export** — Download PDF reports, DXF files for CNC, CSV cutting lists, or print labels.

### Test Data

Sample CSV files are included in `test-data/`:
- `materiales.csv` — 12 sample materials
- `piezas.csv` — 82 pieces for a realistic furniture project
- `cantos.csv` — 5 edge band profiles

## Tech Stack

- **React 18** + **TypeScript** — UI with strict type safety
- **Vite 5** — fast build with code splitting and Web Worker support
- **Tailwind CSS 3** — utility-first styling
- **Zustand** — lightweight state management (6 stores)
- **Supabase** — auth + PostgreSQL + Edge Functions (optional)
- **jsPDF 4** — PDF generation
- **Web Workers** — non-blocking optimization

## Architecture

```
src/
  components/       # React components (layout, tabs, auth, projects, figures, ui)
  stores/           # Zustand stores (app, pieces, materials, edgeBands, auth, figures)
  engine/           # Optimizer (Web Worker + pure function core)
  utils/            # Cost calculator, validation, PDF/DXF/CSV exporters
  lib/              # Supabase client, storage adapters (IndexedDB + Supabase)
  i18n/             # Translations (5 languages)
  types/            # TypeScript interfaces
supabase/
  functions/        # Edge Functions (optimize API, API key management)
  migrations/       # PostgreSQL schema (profiles, projects, api_keys)
```

## API

External systems can integrate with NestBrain via the REST API:

```bash
curl -X POST \
  ${SUPABASE_URL}/functions/v1/optimize \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "pieces": [...],
    "materials": [...],
    "config": { "bladeThickness": 4, "mode": "guillotine", ... },
    "costEnabled": true,
    "saveProject": true
  }'
```

See [CLAUDE.md](CLAUDE.md) for full API documentation.

## Roadmap

- [x] ~~Figures for grain matching~~
- [x] ~~REST API with API key auth~~
- [x] ~~PDF/DXF/CSV export modules~~
- [x] ~~User accounts and project persistence~~
- [ ] Custom shapes (L-shapes, triangles, polygons)
- [ ] Subscription tiers (Free, Pro, Enterprise)
- [ ] Collaboration (share projects between team members)
- [ ] Direct CNC machine communication
- [ ] PWA with offline service worker

## License

MIT License — free for personal and commercial use.

---

Made with care for the woodworking community.
