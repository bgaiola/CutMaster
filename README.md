# NestBrain

**Cutting optimization platform for panel and sheet materials.**

NestBrain helps furniture makers, carpenters, and manufacturers minimize waste when cutting rectangular pieces from standard sheet materials (melamine, MDF, plywood, glass, ACM, etc.).

![Version](https://img.shields.io/badge/version-2.0.0-blue) ![License](https://img.shields.io/badge/license-MIT-green)

## Features

- **Smart Optimization** — 6 sorting strategies with guillotine and free-form (MaxRects) cutting modes. Advanced mode with iterated greedy + simulated annealing.
- **Grain Direction** — Respects grain orientation for both pieces and materials, ensuring proper visual alignment.
- **Cost Management** — Full cost breakdown: material, waste, cutting (per linear meter), and edge banding costs.
- **CSV Import/Export** — Import pieces, materials, and edge bands from CSV. Multi-language column headers supported.
- **Edge Banding** — Track edge bands for all four sides with supplementary dimension increase.
- **Visual Cutting Plans** — Interactive SVG visualization with color-coded pieces, scraps, and measurements.
- **Multiple Export Formats** — PDF reports, DXF for CNC machines, CSV cutting lists, SVG, and JSON.
- **Label Designer** — Generate barcode labels for workshop use with drag-and-drop template editor.
- **Reports** — Executive summary, material consumption, scrap analysis, and cost breakdown.
- **Multi-Language** — Available in Español, Português (BR), English, Français, and Italiano.
- **User Accounts** — Optional cloud storage with Supabase: save projects, materials library, and settings.
- **Offline First** — Works fully offline. Cloud sync is optional enhancement.

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

The app will be available at `http://localhost:5173`.

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
3. **Configure** — Set blade thickness, optimization mode, stacking, and rotation options.
4. **Optimize** — Click "Optimize" to generate cutting plans.
5. **Review Results** — Browse visual cutting plans, utilization stats, costs, and scrap areas.
6. **Export** — Download PDF reports, DXF files for CNC, CSV cutting lists, or print labels.

### Test Data

Sample CSV files are included in `test-data/`:
- `materiales.csv` — 12 sample materials
- `piezas.csv` — 82 pieces for a realistic furniture project
- `cantos.csv` — 5 edge band profiles

## Tech Stack

- **React 18** + **TypeScript** — UI with strict type safety
- **Vite 5** — Fast build tooling with Web Worker support
- **Tailwind CSS 3** — Utility-first styling
- **Zustand** — Lightweight state management
- **Supabase** — Auth + PostgreSQL (optional)
- **jsPDF** — PDF generation
- **Web Workers** — Non-blocking optimization

## Roadmap

- [ ] **Figures** — Group pieces for wood grain matching (cabinet fronts, drawer sets)
- [ ] **Subscription tiers** — Free, Pro, Enterprise plans
- [ ] **Collaboration** — Share projects between team members
- [ ] **Custom shapes** — L-shapes, triangles, and other non-rectangular pieces
- [ ] **Machine integration** — Direct CNC communication protocols

## License

MIT License — free for personal and commercial use.

---

Made with care for the woodworking community.
