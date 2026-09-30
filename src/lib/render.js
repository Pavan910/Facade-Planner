// Redesign renderer. Each finishable region is clipped out of the photo and
// filled with a procedural material pattern multiplied over the photo's own
// shading, which preserves edges, shadows and the building's structure.
import { MATERIALS, REGION_TYPES, assignmentFor } from './catalog.js';
import { intersect } from './estimate.js';
import { rng } from './image.js';

const DRAW_ORDER = ['wall', 'parapet', 'roofedge', 'pillar', 'slab', 'gate', 'balcony'];

function mix(hex, amt) {
  const n = parseInt(hex.slice(1), 16);
  let r = n >> 16, g = (n >> 8) & 255, b = n & 255;
  const t = amt > 0 ? 255 : 0, p = Math.abs(amt);
  r = Math.round(r + (t - r) * p); g = Math.round(g + (t - g) * p); b = Math.round(b + (t - b) * p);
  return `rgb(${r},${g},${b})`;
}

function rgba(hex, a) {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${n >> 16},${(n >> 8) & 255},${n & 255},${a})`;
}

export class Renderer {
  constructor(img, shade) {
    this.img = img;
    this.shade = shade;
    this.cache = {};
  }

  // Patterns are sized in real feet (via ppf) so a 2×1 ft tile looks 2×1 ft.
  pattern(ctx, id, vi, ppf) {
    const m = MATERIALS[id], c = (m.variants[vi] || m.variants[0]).c;
    if (id === 'paint') return c;
    const key = id + vi + '_' + Math.round(ppf);
    if (this.cache[key]) return this.cache[key];
    const rnd = rng(vi * 97 + id.length * 13 + 5), cv = document.createElement('canvas'), g = cv.getContext('2d');
    if (id === 'texture') {
      cv.width = cv.height = 256;
      g.fillStyle = c; g.fillRect(0, 0, 256, 256);
      for (let i = 0; i < 3000; i++) {
        g.fillStyle = rnd() < 0.5 ? `rgba(255,255,255,${0.05 + rnd() * 0.12})` : `rgba(0,0,0,${0.04 + rnd() * 0.1})`;
        g.beginPath(); g.arc(rnd() * 256, rnd() * 256, 0.5 + rnd() * 2.2, 0, 7); g.fill();
      }
    } else if (id === 'stone') {
      const W = Math.max(60, Math.round(6 * ppf)), H = Math.max(24, Math.round(2 * ppf));
      cv.width = W; cv.height = H;
      g.fillStyle = '#2d2b29'; g.fillRect(0, 0, W, H);
      let y = 0;
      while (y < H) {
        const rh = Math.min(H - y, Math.max(4, ppf * (0.2 + rnd() * 0.18)));
        let x = -rnd() * ppf;
        while (x < W) {
          const sw = Math.max(8, ppf * (0.7 + rnd() * 1.6));
          g.fillStyle = mix(c, (rnd() - 0.5) * 0.45); g.fillRect(x + 1, y + 1, sw - 2, rh - 2);
          g.fillStyle = 'rgba(255,255,255,.08)'; g.fillRect(x + 1, y + 1, sw - 2, 1.5);
          x += sw;
        }
        y += rh;
      }
    } else if (id === 'tiles') {
      const tw = Math.max(12, Math.round(2 * ppf)), th = Math.max(6, Math.round(ppf));
      cv.width = tw * 4; cv.height = th * 4;
      g.fillStyle = '#d4cec3'; g.fillRect(0, 0, cv.width, cv.height);
      for (let row = 0; row < 4; row++) {
        for (let col = -1; col < 5; col++) {
          const x = col * tw + (row % 2 ? tw / 2 : 0);
          g.fillStyle = mix(c, (rnd() - 0.5) * 0.18); g.fillRect(x + 1, row * th + 1, tw - 2, th - 2);
        }
      }
    } else if (id === 'panels') {
      const pw = Math.max(20, Math.round(4 * ppf)), ph = Math.max(10, Math.round(2 * ppf));
      cv.width = pw; cv.height = ph;
      const gr = g.createLinearGradient(0, 0, 0, ph);
      gr.addColorStop(0, mix(c, 0.1)); gr.addColorStop(1, mix(c, -0.08));
      g.fillStyle = gr; g.fillRect(0, 0, pw, ph);
      if (vi === 2) {
        for (let i = 0; i < 40; i++) {
          g.strokeStyle = `rgba(40,20,5,${0.08 + rnd() * 0.15})`; g.lineWidth = 0.5 + rnd();
          const y = rnd() * ph;
          g.beginPath(); g.moveTo(0, y);
          g.bezierCurveTo(pw * 0.3, y + (rnd() - 0.5) * 6, pw * 0.7, y + (rnd() - 0.5) * 6, pw, y); g.stroke();
        }
      }
      g.fillStyle = 'rgba(0,0,0,.55)'; g.fillRect(pw - 2, 0, 2, ph); g.fillRect(0, ph - 2, pw, 2);
    }
    return (this.cache[key] = ctx.createPattern(cv, 'repeat'));
  }

  drawSurface(ctx, r, a, ppf, regions) {
    ctx.save();
    ctx.beginPath();
    ctx.rect(r.x, r.y, r.w, r.h);
    // Cut windows and doors out of walls so they stay as in the photo.
    if (r.type === 'wall') {
      regions.forEach((o) => {
        if (!REGION_TYPES[o.type].opening) return;
        const i = intersect(r, o);
        if (i) ctx.rect(i.x, i.y, i.w, i.h);
      });
    }
    ctx.clip('evenodd');
    ctx.drawImage(this.shade, 0, 0);
    ctx.globalCompositeOperation = 'multiply';
    ctx.fillStyle = this.pattern(ctx, a.m, a.v, ppf);
    ctx.fillRect(r.x, r.y, r.w, r.h);
    ctx.restore();
  }

  drawRailing(ctx, r, a, ppf, design, regions) {
    const m = MATERIALS[a.m], v = m.variants[a.v] || m.variants[0];
    ctx.save();
    ctx.beginPath(); ctx.rect(r.x, r.y, r.w, r.h); ctx.clip();
    if (r.type === 'balcony') {
      // Replace the old railing: repaint what sits behind it with the wall finish.
      const wall = regions.find((o) => o.type === 'wall' && assignmentFor(design, o) && intersect(o, r));
      ctx.drawImage(this.shade, 0, 0);
      ctx.globalCompositeOperation = 'multiply';
      ctx.fillStyle = wall ? this.pattern(ctx, design.assign[wall.id].m, design.assign[wall.id].v, ppf) : '#d6d1c7';
      ctx.fillRect(r.x, r.y, r.w, r.h);
      ctx.globalCompositeOperation = 'source-over';
    }
    const top = r.y, h = r.h, t = Math.max(3, ppf * 0.14);
    if (a.m === 'glass') {
      ctx.fillStyle = rgba(v.c, 0.55); ctx.fillRect(r.x, top + t, r.w, h - t);
      const gr = ctx.createLinearGradient(r.x, top, r.x + r.w, top + h);
      gr.addColorStop(0, 'rgba(255,255,255,.35)'); gr.addColorStop(0.4, 'rgba(255,255,255,0)');
      gr.addColorStop(0.6, 'rgba(255,255,255,.18)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = gr; ctx.fillRect(r.x, top + t, r.w, h - t);
      ctx.fillStyle = '#9aa3a8'; ctx.fillRect(r.x, top, r.w, t);
      const step = Math.max(20, ppf * 4);
      for (let x = r.x + step / 2; x < r.x + r.w; x += step) {
        ctx.fillStyle = 'rgba(255,255,255,.6)'; ctx.fillRect(x, top + t, 1, h - t);
        ctx.fillStyle = '#7d858a'; ctx.fillRect(x - 2, top + h - t * 1.4, 4, t * 1.4);
      }
    } else {
      ctx.fillStyle = v.c;
      ctx.fillRect(r.x, top, r.w, t); ctx.fillRect(r.x, top + h - t, r.w, t);
      const step = Math.max(6, ppf * 0.42), bw = Math.max(2, ppf * 0.06);
      for (let x = r.x + step / 2; x < r.x + r.w; x += step) ctx.fillRect(x, top, bw, h);
    }
    ctx.restore();
  }

  render(ctx, design, regions, ppf) {
    const { width: W, height: H } = this.img;
    ctx.globalCompositeOperation = 'source-over';
    ctx.drawImage(this.img, 0, 0, W, H);
    DRAW_ORDER.forEach((type) => {
      regions.filter((r) => r.type === type && assignmentFor(design, r)).forEach((r) => {
        const a = assignmentFor(design, r);
        if (MATERIALS[a.m].basis === 'rft') this.drawRailing(ctx, r, a, ppf, design, regions);
        else this.drawSurface(ctx, r, a, ppf, regions);
      });
    });
  }

  toDataURL(design, regions, ppf, width, quality = 0.88) {
    const full = document.createElement('canvas');
    full.width = this.img.width; full.height = this.img.height;
    this.render(full.getContext('2d'), design, regions, ppf);
    if (!width) return full.toDataURL('image/jpeg', quality);
    const t = document.createElement('canvas');
    t.width = width; t.height = Math.round((width * full.height) / full.width);
    t.getContext('2d').drawImage(full, 0, 0, t.width, t.height);
    return t.toDataURL('image/jpeg', quality);
  }
}
