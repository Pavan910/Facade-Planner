# Facade Planner

**AI-based exterior house renovation and cost estimation.** Upload a photo of a house. The app identifies the walls, windows, balconies, pillars, parapet, gate and roof edge. You then try materials on your own house and get the quantities and a transparent cost breakdown as a report to take to contractors.

## What it does

1. **Upload.** Photos are checked for resolution, lighting and sharpness. Unusable ones are rejected with a reason and a tip, and the best view is picked.
2. **Identify structure.** A vision model on Groq (free tier) marks the building's components. The user reviews and corrects the boxes.
3. **Apply materials.** Paint, texture, stone cladding, tiles, ACP panels, glass or metal railings can be applied per surface. Each material shows durability and upkeep, and you can build several variations.
4. **See the redesign.** The chosen materials are rendered onto the photo's own shading, with a before/after slider.
5. **Areas and quantities.** Areas are scaled from a reference of known size (window, door or façade width), with optional tape-measured overrides.
6. **Cost.** Material, labour, per-category and grand totals, with editable rates, wastage and optional GST.
7. **Report and save.** Download or print a contractor-ready report. Save projects in the browser and reopen them later.

## Documentation

| | |
|---|---|
| [Architecture](docs/ARCHITECTURE.md) | Components, detection API, storage, scaling |
| [User workflow](docs/WORKFLOW.md) | Step-by-step flow with diagram |
| [How estimation works](docs/ESTIMATION.md) | Scale → area → quantity → cost, with a worked example |
| [Limitations](docs/LIMITATIONS.md) | Known limits and next steps |
| [Requirement coverage](docs/REQUIREMENTS.md) | Each requirement in the brief mapped to the code |

The same material is in the app's **Documentation** tab.

## Run locally

```bash
npm install
cp .env.example .env.local   # add a free GROQ_API_KEY for AI detection (optional)
npm run dev                  # http://localhost:5173, /api/* included
npm test                     # unit tests for estimation and detection parsing
```

Every step works without a key. If AI detection isn't configured, the app places a standard façade layout for the user to fit. There is no database: projects are saved in the browser.

## Deploy to Vercel

1. Push this folder to a GitHub repository.
2. In Vercel, choose **Add New → Project** and import the repository. The framework (Vite) is detected automatically.
3. Get a free key at [console.groq.com/keys](https://console.groq.com/keys). Under **Settings → Environment Variables**, add it as `GROQ_API_KEY`.
4. Deploy, or redeploy after adding the variable.

Or from the command line: `npx vercel` for a preview, then `npx vercel --prod`.

## Project structure

```
api/
  detect.js          Groq vision model → component boxes (serverless)
src/
  App.jsx            state and step flow
  components/        Stage (photo + editor + before/after), steps, docs, projects modal
  lib/
    catalog.js       region types, materials, rates, presets
    image.js         upload, quality check, shading, sample house
    detect.js        client for /api/detect with fallback
    render.js        texture rendering on the photo
    estimate.js      scale, area, quantity, cost (pure, tested)
    report.js        HTML report
    storage.js       project storage (localStorage)
tests/               Vitest unit tests
docs/                deliverable documentation
```

## Tech

React 18 and Vite; the canvas 2D API for rendering; one Vercel serverless function; Groq API (`qwen/qwen3.8-27b` vision model, JSON mode).
