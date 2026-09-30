// In-app documentation: the deliverables from section 9 of the brief
// (architecture, workflow, how estimation works, limitations).

function ArchitectureDiagram() {
  const box = (x, y, w, h, title, sub, fill = '#fff') => (
    <g>
      <rect x={x} y={y} width={w} height={h} rx="6" fill={fill} stroke="#cfc9bf" />
      <text x={x + 12} y={y + (sub ? 19 : h / 2 + 5)} fontSize="13" fontWeight="600" fill="#1c1b19">{title}</text>
      {sub && <text x={x + 12} y={y + 35} fontSize="11" fill="#6b675f">{sub}</text>}
    </g>
  );
  const arrow = (x1, y1, x2, y2, label, dy = -8) => (
    <g>
      <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="#b5623a" strokeWidth="1.5" markerEnd="url(#ah)" />
      {label && <text x={(x1 + x2) / 2} y={(y1 + y2) / 2 + dy} fontSize="10" textAnchor="middle" fill="#6b675f">{label}</text>}
    </g>
  );
  return (
    <svg viewBox="0 0 960 450" role="img" aria-label="System architecture: browser app with local project storage, Vercel static hosting and a serverless detection function, and a Groq vision model">
      <defs>
        <marker id="ah" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill="#b5623a" /></marker>
      </defs>
      <rect x="10" y="10" width="360" height="430" rx="10" fill="#f4f2ee" />
      <text x="24" y="34" fontSize="11" fontFamily="JetBrains Mono, monospace" fill="#6b675f">BROWSER · React single-page app</text>
      {box(24, 48, 332, 48, 'Upload + quality check', 'resolution, exposure, sharpness → best view')}
      {box(24, 104, 332, 48, 'Region editor', 'review / move / resize / retype / add / delete')}
      {box(24, 160, 332, 48, 'Material catalog + variations', 'per-surface finishes, durability, upkeep')}
      {box(24, 216, 332, 48, 'Renderer (canvas)', 'textures × photo shading · before/after')}
      {box(24, 272, 332, 48, 'Estimation engine', 'scale → area → quantity → cost')}
      {box(24, 328, 332, 48, 'Report generator', 'HTML / print-to-PDF for contractors')}
      {box(24, 384, 332, 48, 'Project store', 'localStorage · save / reopen / delete')}

      <rect x="450" y="10" width="250" height="250" rx="10" fill="#f4f2ee" />
      <text x="464" y="34" fontSize="11" fontFamily="JetBrains Mono, monospace" fill="#6b675f">VERCEL</text>
      {box(464, 48, 222, 48, 'Static hosting / CDN', 'built app (Vite)')}
      {box(464, 150, 222, 60, 'POST /api/detect', 'serverless · validates, calls Groq,')}
      <text x="476" y="200" fontSize="11" fill="#6b675f">returns normalised boxes</text>

      {box(750, 150, 200, 60, 'Groq vision model', 'JSON mode · free tier', '#fbf5f1')}

      {arrow(464, 72, 370, 72, 'app')}
      {arrow(370, 166, 464, 166, 'photo')}
      {arrow(464, 196, 370, 196, 'boxes', 16)}
      {arrow(686, 180, 750, 180)}
    </svg>
  );
}

const WORKFLOW = [
  ['Upload', 'Add one or more photos. Each is scored; unusable ones are rejected with the reason and a tip. The best view is picked.'],
  ['Identify structure', 'AI vision marks walls, windows, gates, balconies, slabs, pillars, parapet and roof edge. Without AI, a standard layout is placed.'],
  ['Review regions', 'Confirm or correct each box: drag, resize from any corner, retype, add or delete.'],
  ['Apply materials', 'Choose paint, texture, stone, tiles, panels or railings per surface, with durability and upkeep shown. Build several variations.'],
  ['Compare', 'Slide between the original photo and the redesign; switch variations and compare their totals.'],
  ['Areas & quantities', 'Set the scale reference; optionally type tape-measured sizes. See net areas and material quantities with formulas.'],
  ['Cost', 'Edit material, labour and wastage rates; optional GST. Totals per category and grand total update live.'],
  ['Report & save', 'Download or print the report for contractors; save the project in the browser to re-edit later.'],
];

const TRACE = [
  ['5.1 Media upload', 'Multi-photo upload; resolution / exposure / Laplacian-sharpness checks; reject with reason and retake tips; best view auto-selected; AI flags non-house or unusable photos.'],
  ['5.2 Structure identification', 'A Groq-hosted vision model returns boxes for 8 component types; user reviews and corrects them on the photo.'],
  ['5.3 Design & material selection', '7 materials with finishes, durability, upkeep, suitability; applied per surface or per type; unlimited variations.'],
  ['5.4 Visualisation', 'Canvas renderer multiplies scaled textures over the photo’s own shading; before/after slider.'],
  ['5.5 Surface area', 'Reference-object scale (window, door or façade width), opening subtraction, multi-face pillars and parapets, optional measured overrides.'],
  ['5.6 Quantities', 'Paint litres (coats, coverage), texture kg, stone sqft, tile count, panel sheets, railing rft — all with wastage and shown formulas.'],
  ['5.7 Cost', 'Material + labour per line, per category and grand total; editable rates; optional GST; instant recalculation.'],
  ['5.8 Report', 'Standalone HTML report (print to PDF) with both images, materials, quantities, costs, rates and estimate basis.'],
  ['6 Non-functional', 'Guided six-step flow; images compressed client-side; AI step takes a few seconds with progress shown; projects saved and re-editable; static site plus a stateless function, with each user’s data kept in their own browser, so concurrent users never share state.'],
];

export default function DocsView() {
  return (
    <article className="docs">
      <div>
        <div className="kicker" style={{ color: 'var(--accent)' }}>DOCUMENTATION</div>
        <h1>AI-Based Exterior House Renovation &amp; Cost Estimation System</h1>
        <p>A pre-construction planning assistant. The homeowner uploads a photo of the house exterior, confirms the building components found on it, applies materials, sees their own house redesigned, and receives quantities and a transparent cost breakdown as a report to discuss with contractors.</p>
      </div>

      <section>
        <h2>1. System architecture</h2>
        <div className="diagram"><ArchitectureDiagram /></div>
        <div className="cards" style={{ marginTop: 12 }}>
          <div><span className="kicker">CLIENT</span><b>React app (Vite)</b>Runs the interactive work in the browser: quality checks, region editing, rendering, estimation and report generation. No round trip per edit, so it feels instant even on slow connections.</div>
          <div><span className="kicker">API</span><b>Vercel serverless function</b><code>/api/detect</code> keeps the AI key on the server and returns validated, normalised boxes. It is stateless, so many users can work at once.</div>
          <div><span className="kicker">AI</span><b>Groq vision model</b>Receives a 1024 px JPEG and returns JSON (JSON mode) with component boxes, whether the photo is a usable house exterior, and guidance for the user.</div>
          <div><span className="kicker">DATA</span><b>Catalog, rates, projects</b>Material catalog and default rates ship with the app. Projects (photo, regions, variations, rates, settings) are saved in the browser's localStorage, so the prototype needs no database.</div>
        </div>
      </section>

      <section>
        <h2>2. User workflow</h2>
        <div className="cards">
          {WORKFLOW.map(([t, d], i) => <div key={t}><span className="kicker">STEP {i + 1}</span><b>{t}</b>{d}</div>)}
        </div>
      </section>

      <section>
        <h2>3. How the estimation works</h2>
        <h3>Scale</h3>
        <p>A reference object of standard size gives pixels per foot: the average window width (default 4 ft), the door or gate height (default 7 ft), or a façade width the user measured. <span className="mono">ppf = reference px ÷ reference ft</span>. If no reference exists the photo is assumed to span 40 ft.</p>
        <h3>Surface area</h3>
        <p>Width and height in feet are the region's pixel size ÷ ppf, unless the user typed a measured value. Walls subtract every window and door that overlaps them. Pillars multiply by the number of exposed faces (default 3, adjustable); parapets count inner and outer faces. Railings, slabs, parapets and roof edges also report running length in rft.</p>
        <h3>Quantities</h3>
        <div className="formula">
          <span>Paint</span><span>L = area × 2 coats ÷ 120 sqft/L × (1 + waste)</span>
          <span>Texture finish</span><span>kg = area × 0.11 kg/sqft × (1 + waste)</span>
          <span>Stone cladding</span><span>sqft = area × (1 + waste)</span>
          <span>Tiles (2×1 ft)</span><span>tiles = ⌈area × (1 + waste) ÷ 2⌉</span>
          <span>ACP panels (8×4 ft)</span><span>sheets = ⌈area × (1 + waste) ÷ 32⌉</span>
          <span>Railings</span><span>rft = length × (1 + waste)</span>
        </div>
        <h3>Cost</h3>
        <p>Material cost = quantity × material rate. Labour cost = area (or running length for railings) × labour rate. Lines are grouped by material into categories; the grand total is their sum, with optional 18% GST. Every rate and wastage percentage is editable and all totals recalculate instantly.</p>
        <h3>Worked example</h3>
        <p>A 30 × 20 ft wall with four 4 × 4.5 ft windows and one 3.5 × 7 ft door has 600 − 72 − 24.5 = 503.5 sqft net. Paint: 503.5 × 2 ÷ 120 × 1.10 = 9.2 L → ₹3,508 material at ₹380/L, plus 503.5 × ₹18 = ₹9,063 labour.</p>
      </section>

      <section>
        <h2>4. Requirement coverage</h2>
        <div className="table-wrap">
          <table>
            <thead><tr><th>Requirement</th><th>How the prototype meets it</th></tr></thead>
            <tbody>{TRACE.map(([r, h]) => <tr key={r}><td style={{ whiteSpace: 'nowrap' }}><b>{r}</b></td><td>{h}</td></tr>)}</tbody>
          </table>
        </div>
      </section>

      <section>
        <h2>5. Limitations</h2>
        <ul>
          <li>Photos are 2D. Depth, recesses, side walls and the rear of the house are not measured unless photographed and estimated separately.</li>
          <li>Scale relies on the reference object being a standard size and roughly parallel to the camera. There is no perspective correction, so strongly angled photos skew areas. Expected error is around ±10–20%; typing a few tape-measured dimensions removes most of it.</li>
          <li>Regions are rectangles. Curved, sloped or angled surfaces are approximated by their bounding box.</li>
          <li>AI detection returns approximate boxes and can miss or merge small elements; the review step is required, not optional. Without an API key the app falls back to a standard layout the user positions by hand.</li>
          <li>Rendering maps procedural textures over the photo's own lighting. It preserves structure but is not photoreal for reflections, deep shadows or objects in front of the house (trees, cars).</li>
          <li>Rates are indicative Indian market figures and vary by city, brand and contractor. Surface preparation, crack repair, scaffolding and transport are excluded.</li>
          <li>Projects are saved in the browser, so they don't move between devices and are lost if browser data is cleared. Storage holds roughly 10–20 projects.</li>
          <li>Estimates are advisory and not legally binding. No structural checks are made (for example, the load of stone cladding).</li>
        </ul>
      </section>
    </article>
  );
}
