// Contractor-ready report as a standalone HTML document (printable to PDF).
import { MATERIALS, SCALE_MODES } from './catalog.js';
import { money, num, qtyText, scaleText } from './estimate.js';

const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (x) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[x]));

const CSS = `body{font:13px/1.5 system-ui,sans-serif;color:#1c1b19;max-width:960px;margin:32px auto;padding:0 24px}
h1{font-size:24px;margin:0}h2{font-size:15px;margin:28px 0 8px;text-transform:uppercase;letter-spacing:.04em;color:#6b675f}
.imgs{display:grid;grid-template-columns:1fr 1fr;gap:12px}.imgs img{width:100%;border-radius:4px}.cap{font-size:11px;color:#6b675f;margin-top:4px}
table{width:100%;border-collapse:collapse}td,th{text-align:left;padding:6px 8px;border-bottom:1px solid #e3dfd8;vertical-align:top}
th{font-weight:600;color:#6b675f;font-size:11px}.n{text-align:right;white-space:nowrap}.f{font:11px ui-monospace,monospace;color:#6b675f}
.tot{margin-top:12px;background:#f4f2ee;padding:12px 16px;border-radius:6px}.tot div{display:flex;justify-content:space-between}
.g{font-size:20px;font-weight:700;border-top:1px solid #ccc;margin-top:6px;padding-top:6px}.note{font-size:11px;color:#6b675f;margin-top:24px}
.sw{display:inline-block;width:10px;height:10px;border-radius:2px;border:1px solid rgba(0,0,0,.2);margin-right:6px;vertical-align:-1px}
@media print{body{margin:0}h2{break-after:avoid}table,.imgs{break-inside:avoid}}`;

/**
 * @param {object} p
 * @param {string} p.projectName
 * @param {string} p.original       data URL of the original photo
 * @param {string} p.redesigned     data URL of the redesigned render
 * @param {object} p.design         active design
 * @param {object} p.t              totals() for the active design
 * @param {Array}  p.variations     [{ name, grand }] for every design
 * @param {object} p.rates
 * @param {object} p.settings       { scaleMode, refFt, ppf, gst, pillarFaces, detection }
 */
export function reportHtml({ projectName, original, redesigned, design, t, variations, rates, settings }) {
  const rows = t.lines.map((l) => {
    const v = l.material.variants[l.assign.v] || {};
    return `<tr><td>${esc(l.label)}</td><td>${esc(l.material.name)}</td><td><span class=sw style="background:${v.c}"></span>${esc(v.n)}</td>
<td class=n>${num(l.area, 1)}</td><td class=n>${num(l.len, 1)}</td><td class=n>${qtyText(l.qty, l.material.unit)}</td><td class=f>${esc(l.formula)}</td>
<td class=n>${money(l.matCost)}</td><td class=n>${money(l.labCost)}</td></tr>`;
  }).join('');
  const cats = t.cats.map((c) => `<tr><td>${esc(c.name)}</td><td class=n>${qtyText(c.qty, c.unit)}</td><td class=n>${money(c.mat)}</td><td class=n>${money(c.lab)}</td><td class=n><b>${money(c.total)}</b></td></tr>`).join('');
  const rateRows = Object.entries(rates).map(([k, r]) => `<tr><td>${esc(MATERIALS[k].name)}</td><td class=n>₹${esc(r.rate)}/${MATERIALS[k].unit}</td><td class=n>₹${esc(r.labor)}/${MATERIALS[k].basis}</td><td class=n>${esc(r.wastage)}%</td></tr>`).join('');
  const varRows = variations.map((v) => `<tr><td>${esc(v.name)}${v.name === design.name ? ' <b>(this report)</b>' : ''}</td><td class=n>${money(v.grand)}</td></tr>`).join('');
  const scaleLabel = (SCALE_MODES.find((s) => s.id === settings.scaleMode) || {}).label;

  return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(projectName)} – Renovation report</title><style>${CSS}</style></head><body>
<h1>${esc(projectName)}</h1>
<div style="color:#6b675f">Exterior renovation report · Variation: ${esc(design.name)} · ${new Date().toLocaleDateString('en-IN', { dateStyle: 'long' })}</div>
<h2>Original and redesign</h2>
<div class=imgs><div><img src="${original}" alt="Original"><div class=cap>Original photo</div></div><div><img src="${redesigned}" alt="Redesign"><div class=cap>Redesigned – ${esc(design.name)}</div></div></div>
<h2>Selected materials and quantities</h2>
<table><tr><th>Surface</th><th>Material</th><th>Finish</th><th class=n>Area sqft</th><th class=n>Length rft</th><th class=n>Quantity</th><th>Calculation</th><th class=n>Material</th><th class=n>Labour</th></tr>${rows}</table>
<h2>Cost breakdown by category</h2>
<table><tr><th>Category</th><th class=n>Quantity</th><th class=n>Material</th><th class=n>Labour</th><th class=n>Total</th></tr>${cats}</table>
<div class=tot><div><span>Material</span><span>${money(t.mat)}</span></div><div><span>Labour</span><span>${money(t.lab)}</span></div>${settings.gst ? `<div><span>GST 18%</span><span>${money(t.gst)}</span></div>` : ''}<div class=g><span>Grand total</span><span>${money(t.grand)}</span></div></div>
${variations.length > 1 ? `<h2>Other variations considered</h2><table><tr><th>Variation</th><th class=n>Grand total</th></tr>${varRows}</table>` : ''}
<h2>Rates used</h2>
<table><tr><th>Material</th><th class=n>Material rate</th><th class=n>Labour rate</th><th class=n>Wastage</th></tr>${rateRows}</table>
<h2>Basis of estimate</h2>
<table>
<tr><td>Structure detection</td><td>${settings.detection === 'ai' ? 'AI vision, reviewed and corrected by the homeowner' : 'Standard layout, placed and corrected by the homeowner'}</td></tr>
<tr><td>Scale reference</td><td>${esc(scaleLabel)}: ${esc(scaleText(settings.scaleMode, settings.refFt))} (${num(settings.ppf, 1)} px per ft)</td></tr>
<tr><td>Pillar faces counted</td><td>${settings.pillarFaces}</td></tr>
<tr><td>Parapet faces counted</td><td>2 (inner and outer)</td></tr>
</table>
<p class=note>Areas are estimated from a single photo and are approximate (typically ±10–20%). Please verify key dimensions on site. This estimate is advisory and not a binding quotation; surface preparation, crack repair, scaffolding and transport are excluded.</p>
</body></html>`;
}
