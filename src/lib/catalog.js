// Region types the structure step can identify, and the material catalog.
// Rates are indicative Indian market figures (₹) and are editable in the app.

export const REGION_TYPES = {
  wall: { label: 'Main wall', hue: 250 },
  window: { label: 'Window', hue: 200, opening: true },
  gate: { label: 'Gate / door', hue: 30, opening: true },
  balcony: { label: 'Balcony railing', hue: 145 },
  slab: { label: 'Balcony slab / fascia', hue: 170 },
  pillar: { label: 'Pillar', hue: 310 },
  parapet: { label: 'Parapet wall', hue: 85 },
  roofedge: { label: 'Roof edge', hue: 0 },
};

// Surfaces whose finish can be changed. Windows are openings and are only used
// to subtract area from walls; gates are openings too but can take a finish.
export const isFinishable = (type) => !REGION_TYPES[type].opening || type === 'gate';

// Surfaces for which a running length is meaningful (railings, bands, edges).
export const hasLength = (type) => ['balcony', 'slab', 'parapet', 'roofedge'].includes(type);

export const MATERIALS = {
  paint: {
    name: 'Exterior paint', unit: 'L', basis: 'sqft', rate: 380, labor: 18, wastage: 10, coverage: 120, coats: 2,
    durability: '5–7 years', maintenance: 'Repaint every 5–7 yrs; wash yearly', bestFor: 'Any plastered surface; lowest cost',
    applies: ['wall', 'parapet', 'pillar', 'roofedge', 'gate', 'slab'],
    variants: [{ n: 'Chalk white', c: '#ece8df' }, { n: 'Sand beige', c: '#d9c3a0' }, { n: 'Sage', c: '#a3b198' }, { n: 'Slate blue', c: '#71859a' }, { n: 'Terracotta', c: '#b86a4b' }, { n: 'Charcoal', c: '#4b4b4b' }],
  },
  texture: {
    name: 'Texture finish', unit: 'kg', basis: 'sqft', rate: 140, labor: 30, wastage: 10, consumption: 0.11,
    durability: '8–10 years', maintenance: 'Hides hairline cracks; dust settles in grain', bestFor: 'Feature walls, parapets',
    applies: ['wall', 'parapet', 'pillar', 'slab'],
    variants: [{ n: 'Stucco ivory', c: '#e6dccb' }, { n: 'Rustic ochre', c: '#c9a26a' }, { n: 'Concrete grey', c: '#a6a49f' }],
  },
  stone: {
    name: 'Stone cladding', unit: 'sqft', basis: 'sqft', rate: 220, labor: 65, wastage: 12,
    durability: '25+ years', maintenance: 'Seal every 3–4 yrs; heavy, needs sound wall', bestFor: 'Pillars, feature walls, gate piers',
    applies: ['wall', 'pillar', 'parapet', 'gate'],
    variants: [{ n: 'Slate grey', c: '#77746f' }, { n: 'Sandstone', c: '#c7a77c' }, { n: 'Basalt', c: '#4a4745' }],
  },
  tiles: {
    name: 'Elevation tiles 2×1 ft', unit: 'tiles', basis: 'sqft', rate: 180, labor: 45, wastage: 8, tileSqft: 2,
    durability: '15–20 years', maintenance: 'Wipe clean; check grout periodically', bestFor: 'High-rain areas, feature bands',
    applies: ['wall', 'pillar', 'parapet', 'slab'],
    variants: [{ n: 'Brick red', c: '#9c4f3a' }, { n: 'Wood brown', c: '#8a6446' }, { n: 'Ivory matt', c: '#ddd3c2' }],
  },
  panels: {
    name: 'ACP panels 8×4 ft', unit: 'sheets', basis: 'sqft', rate: 4200, labor: 90, wastage: 10, sheetSqft: 32,
    durability: '15–20 years', maintenance: 'Low; inspect sealant joints', bestFor: 'Modern fascia, parapets, gates',
    applies: ['wall', 'parapet', 'roofedge', 'gate', 'slab'],
    variants: [{ n: 'Graphite', c: '#3f4449' }, { n: 'Champagne', c: '#b9a888' }, { n: 'Teak grain', c: '#7a5234' }],
  },
  glass: {
    name: 'Glass railing', unit: 'rft', basis: 'rft', rate: 2800, labor: 350, wastage: 0,
    durability: '20+ years', maintenance: 'Clean regularly; check spigot fixings', bestFor: 'Balconies with a view',
    applies: ['balcony'],
    variants: [{ n: 'Clear 12 mm', c: '#bcd9e6' }, { n: 'Frosted', c: '#e6eef0' }],
  },
  metal: {
    name: 'Metal railing (MS)', unit: 'rft', basis: 'rft', rate: 1200, labor: 250, wastage: 5,
    durability: '10–15 years', maintenance: 'Anti-rust repaint every 3–4 yrs', bestFor: 'Balconies, gates',
    applies: ['balcony', 'gate'],
    variants: [{ n: 'Matte black', c: '#2b2b2b' }, { n: 'Bronze', c: '#6b5236' }, { n: 'White', c: '#e8e6e1' }],
  },
};

// Fallback façade layout (fractions of image width/height) used when AI
// detection is unavailable. It matches the built-in sample house.
export const TEMPLATE = [
  ['parapet', 0.14, 0.10, 0.72, 0.06], ['roofedge', 0.13, 0.16, 0.74, 0.025], ['wall', 0.16, 0.185, 0.68, 0.655],
  ['window', 0.22, 0.25, 0.12, 0.14], ['window', 0.66, 0.25, 0.12, 0.14], ['window', 0.22, 0.58, 0.12, 0.16], ['window', 0.66, 0.58, 0.12, 0.16],
  ['gate', 0.45, 0.55, 0.10, 0.29], ['balcony', 0.40, 0.35, 0.24, 0.08], ['slab', 0.40, 0.43, 0.24, 0.02],
  ['pillar', 0.13, 0.50, 0.035, 0.34], ['pillar', 0.835, 0.50, 0.035, 0.34],
];

export const PRESETS = [
  { name: 'Classic', map: { wall: ['paint', 0], parapet: ['paint', 4], roofedge: ['paint', 5], pillar: ['stone', 1], balcony: ['metal', 0], slab: ['paint', 4], gate: ['metal', 0] } },
  { name: 'Modern', map: { wall: ['texture', 2], parapet: ['panels', 0], roofedge: ['panels', 0], pillar: ['stone', 2], balcony: ['glass', 0], slab: ['panels', 0], gate: ['panels', 2] } },
  { name: 'Warm earth', map: { wall: ['paint', 1], parapet: ['texture', 1], roofedge: ['paint', 0], pillar: ['tiles', 0], balcony: ['glass', 1], slab: ['tiles', 1], gate: ['metal', 1] } },
];

export const SCALE_MODES = [
  { id: 'window', label: 'Window width', field: 'Average window width', def: 4 },
  { id: 'gate', label: 'Door / gate height', field: 'Door / gate height', def: 7 },
  { id: 'manual', label: 'Façade width', field: 'Measured façade width', def: 30 },
];

export const defaultRates = () =>
  Object.fromEntries(Object.entries(MATERIALS).map(([k, m]) => [k, { rate: m.rate, labor: m.labor, wastage: m.wastage }]));

let seq = 1;
export const uid = (p) => p + Date.now().toString(36) + (seq++).toString(36);

export const regionsFromTemplate = (W, H) =>
  TEMPLATE.map(([type, x, y, w, h]) => ({ id: uid('r'), type, x: x * W, y: y * H, w: w * W, h: h * H }));

export const defaultDesigns = (regions) =>
  PRESETS.map((p) => ({
    id: uid('d'),
    name: p.name,
    assign: Object.fromEntries(regions.filter((r) => p.map[r.type]).map((r) => [r.id, { m: p.map[r.type][0], v: p.map[r.type][1] }])),
  }));

// The material assigned to a region in a design, if it still suits the
// region's type (a region can be retyped after a material was applied).
export function assignmentFor(design, r) {
  const a = design && design.assign[r.id];
  return a && MATERIALS[a.m] && MATERIALS[a.m].applies.includes(r.type) ? a : null;
}
