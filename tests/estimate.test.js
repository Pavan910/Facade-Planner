import { describe, expect, it } from 'vitest';
import { defaultRates } from '../src/lib/catalog.js';
import { measure, pixelsPerFoot, quantity, totals } from '../src/lib/estimate.js';

// 10 px per ft: a 4 ft window is 40 px wide.
const wall = { id: 'w', type: 'wall', x: 0, y: 0, w: 300, h: 200 }; // 30 × 20 ft
const windows = [0, 1, 2, 3].map((i) => ({ id: 'win' + i, type: 'window', x: 20 + i * 60, y: 20, w: 40, h: 45 })); // 4 × 4.5 ft
const door = { id: 'd', type: 'gate', x: 250, y: 130, w: 35, h: 70 }; // 3.5 × 7 ft
const regions = [wall, ...windows, door];

describe('scale', () => {
  it('uses the average window width as reference', () => {
    expect(pixelsPerFoot(regions, 'window', 4)).toBe(10);
  });
  it('uses the door height as reference', () => {
    expect(pixelsPerFoot(regions, 'gate', 7)).toBe(10);
  });
  it('uses the measured façade width as reference', () => {
    expect(pixelsPerFoot(regions, 'manual', 30)).toBe(10);
  });
  it('falls back to a 40 ft frame when no reference exists', () => {
    expect(pixelsPerFoot([], 'window', 4, 1200)).toBe(30);
  });
});

describe('area', () => {
  it('subtracts windows and doors from wall area', () => {
    expect(measure(wall, regions, 10).area).toBeCloseTo(600 - 72 - 24.5);
  });
  it('counts exposed pillar faces and both parapet faces', () => {
    const pillar = { id: 'p', type: 'pillar', x: 0, y: 0, w: 10, h: 100 };
    const parapet = { id: 'pp', type: 'parapet', x: 0, y: 0, w: 300, h: 30 };
    expect(measure(pillar, [pillar], 10, 3).area).toBeCloseTo(30);
    expect(measure(parapet, [parapet], 10).area).toBeCloseTo(180);
  });
  it('prefers measured dimensions when given', () => {
    expect(measure({ ...wall, mw: 32, mh: 21 }, [wall], 10).area).toBeCloseTo(672);
  });
});

describe('quantities', () => {
  it('computes paint litres from coats, coverage and wastage', () => {
    expect(quantity('paint', 503.5, 0, 10).qty).toBeCloseTo((503.5 * 2 / 120) * 1.1);
  });
  it('rounds tiles and panel sheets up', () => {
    expect(quantity('tiles', 100, 0, 8).qty).toBe(54);
    expect(quantity('panels', 100, 0, 10).qty).toBe(4);
  });
  it('uses running length for railings', () => {
    expect(quantity('metal', 999, 20, 5).qty).toBeCloseTo(21);
  });
});

describe('cost', () => {
  const design = { id: 'x', name: 'Test', assign: { w: { m: 'paint', v: 0 } } };
  const ctx = { regions, rates: defaultRates(), ppf: 10, pillarFaces: 3 };

  it('matches the documented worked example', () => {
    const t = totals(design, ctx);
    expect(Math.round(t.mat)).toBe(3508);
    expect(Math.round(t.lab)).toBe(9063);
    expect(t.grand).toBeCloseTo(t.mat + t.lab);
  });
  it('recalculates when rates change and adds GST on request', () => {
    const rates = { ...ctx.rates, paint: { ...ctx.rates.paint, rate: 500 } };
    const t = totals(design, { ...ctx, rates }, true);
    expect(t.gst).toBeCloseTo((t.mat + t.lab) * 0.18);
    expect(t.mat).toBeGreaterThan(3508);
  });
  it('ignores a material that no longer suits a retyped region', () => {
    const bad = { ...design, assign: { w: { m: 'glass', v: 0 } } };
    expect(totals(bad, ctx).lines).toHaveLength(0);
  });
});
