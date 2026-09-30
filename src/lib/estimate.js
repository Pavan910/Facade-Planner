// Estimation engine: scale → surface area → material quantity → cost.
// Pure functions so they can be unit-tested and reused by the report.
import { MATERIALS, REGION_TYPES, SCALE_MODES, assignmentFor } from './catalog.js';

export const GST_RATE = 0.18;

export function intersect(a, b) {
  const x1 = Math.max(a.x, b.x), y1 = Math.max(a.y, b.y);
  const x2 = Math.min(a.x + a.w, b.x + b.w), y2 = Math.min(a.y + a.h, b.y + b.h);
  return x2 > x1 && y2 > y1 ? { x: x1, y: y1, w: x2 - x1, h: y2 - y1 } : null;
}

// Pixels per foot, derived from a reference object of known real size.
export function pixelsPerFoot(regions, scaleMode, refFt, imgWidth = 1200) {
  const ft = Math.max(0.5, +refFt || 1);
  let px = 0;
  if (scaleMode === 'window') {
    const w = regions.filter((r) => r.type === 'window');
    if (w.length) px = w.reduce((s, r) => s + r.w, 0) / w.length;
  } else if (scaleMode === 'gate') {
    const g = regions.find((r) => r.type === 'gate');
    if (g) px = g.h;
  } else {
    const w = regions.filter((r) => r.type === 'wall');
    if (w.length) px = Math.max(...w.map((r) => r.w));
  }
  // No reference present: assume the photo spans ~40 ft.
  return px ? px / ft : imgWidth / 40;
}

export function scaleText(scaleMode, refFt) {
  const m = SCALE_MODES.find((s) => s.id === scaleMode) || SCALE_MODES[0];
  return `${m.field.toLowerCase()} = ${refFt} ft`;
}

// "Main wall 2", "Window 3"… numbered only when a type occurs more than once.
export function regionLabels(regions) {
  const tot = {}, cnt = {}, out = {};
  regions.forEach((r) => { tot[r.type] = (tot[r.type] || 0) + 1; });
  regions.forEach((r) => {
    cnt[r.type] = (cnt[r.type] || 0) + 1;
    out[r.id] = REGION_TYPES[r.type].label + (tot[r.type] > 1 ? ' ' + cnt[r.type] : '');
  });
  return out;
}

export function facesFor(type, pillarFaces) {
  if (type === 'pillar') return pillarFaces;
  if (type === 'parapet') return 2; // inner and outer face
  return 1;
}

// Net area (sqft) and running length (rft) of one region. A user-entered
// measurement (r.mw / r.mh, in ft) overrides the photo-derived dimension.
export function measure(r, regions, ppf, pillarFaces = 3) {
  const wFt = +r.mw > 0 ? +r.mw : r.w / ppf;
  const hFt = +r.mh > 0 ? +r.mh : r.h / ppf;
  let openFt2 = 0;
  if (r.type === 'wall') {
    regions.forEach((o) => {
      if (!REGION_TYPES[o.type].opening) return;
      const i = intersect(r, o);
      if (i) openFt2 += (i.w * i.h) / (ppf * ppf);
    });
  }
  return { wFt, hFt, area: Math.max(0, wFt * hFt - openFt2) * facesFor(r.type, pillarFaces), openFt2, len: wFt };
}

const fmt = (v, d = 1) => (+v).toLocaleString('en-IN', { maximumFractionDigits: d, minimumFractionDigits: d });

// Quantity of material for a given area/length, with the formula shown to the user.
export function quantity(materialId, area, len, wastagePct) {
  const m = MATERIALS[materialId], w = 1 + (+wastagePct || 0) / 100, A = fmt(area), wf = w.toFixed(2);
  switch (materialId) {
    case 'paint': return { qty: (area * m.coats / m.coverage) * w, formula: `${A} sqft × ${m.coats} coats ÷ ${m.coverage} sqft/L × ${wf}` };
    case 'texture': return { qty: area * m.consumption * w, formula: `${A} sqft × ${m.consumption} kg/sqft × ${wf}` };
    case 'stone': return { qty: area * w, formula: `${A} sqft × ${wf}` };
    case 'tiles': return { qty: Math.ceil((area * w) / m.tileSqft), formula: `⌈${A} sqft × ${wf} ÷ ${m.tileSqft} sqft/tile⌉` };
    case 'panels': return { qty: Math.ceil((area * w) / m.sheetSqft), formula: `⌈${A} sqft × ${wf} ÷ ${m.sheetSqft} sqft/sheet⌉` };
    default: return { qty: len * w, formula: `${fmt(len)} rft × ${wf}` };
  }
}

// One line per region that has a material in this design.
export function estimateLines(design, { regions, rates, ppf, pillarFaces = 3 }) {
  if (!design) return [];
  const labels = regionLabels(regions);
  return regions.filter((r) => assignmentFor(design, r)).map((r) => {
    const a = assignmentFor(design, r), m = MATERIALS[a.m], rt = rates[a.m];
    const { area, len } = measure(r, regions, ppf, pillarFaces);
    const { qty, formula } = quantity(a.m, area, len, rt.wastage);
    const basisQty = m.basis === 'rft' ? len : area;
    const matCost = qty * (+rt.rate || 0), labCost = basisQty * (+rt.labor || 0);
    return { region: r, assign: a, material: m, label: labels[r.id], area, len, qty, formula, matCost, labCost, total: matCost + labCost };
  });
}

export function byCategory(lines) {
  const g = {};
  lines.forEach((l) => {
    const k = l.assign.m;
    g[k] = g[k] || { id: k, name: l.material.name, unit: l.material.unit, qty: 0, mat: 0, lab: 0 };
    g[k].qty += l.qty; g[k].mat += l.matCost; g[k].lab += l.labCost;
  });
  return Object.values(g).map((c) => ({ ...c, total: c.mat + c.lab }));
}

export function totals(design, ctx, gst = false) {
  const lines = estimateLines(design, ctx);
  const mat = lines.reduce((s, l) => s + l.matCost, 0), lab = lines.reduce((s, l) => s + l.labCost, 0), sub = mat + lab;
  const tax = gst ? sub * GST_RATE : 0;
  return { lines, cats: byCategory(lines), mat, lab, sub, gst: tax, grand: sub + tax };
}

export const money = (v) => '₹' + Math.round(v).toLocaleString('en-IN');
export const num = (v, d = 0) => (+v).toLocaleString('en-IN', { maximumFractionDigits: d, minimumFractionDigits: d });
export const qtyText = (q, unit) => (unit === 'tiles' || unit === 'sheets' ? num(q) : num(q, 1)) + ' ' + unit;
