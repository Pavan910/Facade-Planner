// Image intake: decoding, resizing, quality checks and the built-in sample house.

export function loadImg(src) {
  return new Promise((resolve, reject) => {
    const i = new Image();
    i.onload = () => resolve(i);
    i.onerror = reject;
    i.src = src;
  });
}

export function readFile(file) {
  return new Promise((resolve, reject) => {
    const fr = new FileReader();
    fr.onload = () => resolve(fr.result);
    fr.onerror = reject;
    fr.readAsDataURL(file);
  });
}

// Re-encode as JPEG with the long edge capped at `max` px.
export async function resize(src, max = 1400, quality = 0.9) {
  const img = await loadImg(src);
  const s = Math.min(1, max / Math.max(img.width, img.height));
  const c = document.createElement('canvas');
  c.width = Math.round(img.width * s);
  c.height = Math.round(img.height * s);
  c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
  return { src: c.toDataURL('image/jpeg', quality), ow: img.width, oh: img.height, img };
}

// Seeded PRNG so textures and the sample house are stable between renders.
export function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Quality gate: resolution, exposure (mean luminance) and sharpness
// (variance of the Laplacian). Returns Good / Usable / Rejected with guidance.
export function analyze(img, ow, oh) {
  const s = Math.min(1, 320 / Math.max(img.width, img.height));
  const w = Math.max(3, Math.round(img.width * s)), h = Math.max(3, Math.round(img.height * s));
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const g = c.getContext('2d');
  g.drawImage(img, 0, 0, w, h);
  const d = g.getImageData(0, 0, w, h).data, gray = new Float32Array(w * h);
  let sum = 0;
  for (let i = 0; i < w * h; i++) {
    const v = 0.299 * d[i * 4] + 0.587 * d[i * 4 + 1] + 0.114 * d[i * 4 + 2];
    gray[i] = v; sum += v;
  }
  const mean = sum / (w * h);
  let ls = 0, lq = 0, n = 0;
  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      const i = y * w + x;
      const L = 4 * gray[i] - gray[i - 1] - gray[i + 1] - gray[i - w] - gray[i + w];
      ls += L; lq += L * L; n++;
    }
  }
  const lv = n ? lq / n - (ls / n) ** 2 : 0;

  const issues = [];
  let status = 'Good';
  const reject = (m) => { status = 'Rejected'; issues.push(m); };
  const warn = (m) => { if (status === 'Good') status = 'Usable'; issues.push(m); };
  if (Math.min(ow, oh) < 360 || Math.max(ow, oh) < 640) reject(`Resolution too low (${ow}×${oh}). Use a photo of at least 640×360 px.`);
  if (mean < 35) reject('Too dark to read surfaces. Retake in daylight.');
  else if (mean < 70) warn('Photo is dim; colours in the preview may be less accurate.');
  if (mean > 235) reject('Overexposed; surfaces are washed out. Avoid shooting into the sun.');
  else if (mean > 210) warn('Very bright; some detail may be lost.');
  if (lv < 12) reject('Too blurry to identify edges. Hold the phone steady and refocus.');
  else if (lv < 45) warn('Slightly soft focus; edges may need manual correction.');
  if (ow / oh < 0.55) warn('Very narrow view. Step back so the whole façade fits.');

  const score = Math.round(
    Math.min(1, (ow * oh) / 1.2e6) * 30 + Math.max(0, 1 - Math.abs(mean - 135) / 135) * 30 + Math.min(1, lv / 300) * 40,
  );
  return { status, issues, score, metrics: `${ow}×${oh} · light ${Math.round(mean)} · sharp ${Math.round(lv)} · score ${score}` };
}

// Greyscale "shading" layer taken from the photo. Materials are multiplied
// over it so the redesign keeps the original light, shadow and structure.
export function buildShade(img) {
  const W = img.width, H = img.height, c = document.createElement('canvas');
  c.width = W; c.height = H;
  const g = c.getContext('2d');
  g.drawImage(img, 0, 0);
  const d = g.getImageData(0, 0, W, H), p = d.data;
  let s = 0;
  for (let i = 0; i < p.length; i += 4) s += 0.299 * p[i] + 0.587 * p[i + 1] + 0.114 * p[i + 2];
  const mean = s / (W * H) || 128;
  for (let i = 0; i < p.length; i += 4) {
    const l = 0.299 * p[i] + 0.587 * p[i + 1] + 0.114 * p[i + 2];
    const v = Math.max(70, Math.min(255, (l / mean) * 228));
    p[i] = p[i + 1] = p[i + 2] = v;
  }
  g.putImageData(d, 0, 0);
  return c;
}

// A synthetic two-storey house so the app can be tried without a photo.
export function sampleHouse() {
  const W = 1200, H = 800, c = document.createElement('canvas');
  c.width = W; c.height = H;
  const g = c.getContext('2d');
  const R = (x, y, w, h, f) => { g.fillStyle = f; g.fillRect(x * W, y * H, w * W, h * H); };
  let gr = g.createLinearGradient(0, 0, 0, H * 0.84);
  gr.addColorStop(0, '#b9cfdc'); gr.addColorStop(1, '#e6ecee');
  g.fillStyle = gr; g.fillRect(0, 0, W, H);
  R(0, 0.84, 1, 0.16, '#8e9a7c'); R(0.3, 0.84, 0.4, 0.16, '#b8b3a9');
  gr = g.createLinearGradient(0.16 * W, 0, 0.84 * W, 0);
  gr.addColorStop(0, '#dcd6ca'); gr.addColorStop(1, '#c4bdb0');
  g.fillStyle = gr; g.fillRect(0.16 * W, 0.185 * H, 0.68 * W, 0.655 * H);
  R(0.16, 0.185, 0.68, 0.03, 'rgba(0,0,0,.12)');
  R(0.14, 0.1, 0.72, 0.06, '#cfc8ba'); R(0.13, 0.16, 0.74, 0.025, '#b3ac9f');
  R(0.16, 0.49, 0.68, 0.015, '#bcb5a8');
  [[0.22, 0.25, 0.12, 0.14], [0.66, 0.25, 0.12, 0.14], [0.22, 0.58, 0.12, 0.16], [0.66, 0.58, 0.12, 0.16]].forEach(([x, y, w, h]) => {
    R(x - 0.006, y - 0.008, w + 0.012, h + 0.016, '#efece6'); R(x, y, w, h, '#3d4c57');
    R(x + w / 2 - 0.002, y, 0.004, h, '#efece6'); R(x, y + h * 0.45, w, 0.005, '#efece6');
  });
  R(0.45, 0.55, 0.1, 0.29, '#5a3f2c'); R(0.455, 0.56, 0.042, 0.27, '#6a4a34'); R(0.503, 0.56, 0.042, 0.27, '#6a4a34');
  R(0.4, 0.43, 0.24, 0.02, '#b9b2a5'); R(0.4, 0.35, 0.24, 0.008, '#555');
  for (let x = 0.4; x < 0.64; x += 0.012) R(x, 0.35, 0.003, 0.08, '#555');
  R(0.13, 0.5, 0.035, 0.34, '#d3ccbf'); R(0.835, 0.5, 0.035, 0.34, '#c9c2b5');
  const id = g.getImageData(0, 0, W, H), p = id.data, rn = rng(7);
  for (let i = 0; i < p.length; i += 4) { const n = (rn() - 0.5) * 14; p[i] += n; p[i + 1] += n; p[i + 2] += n; }
  g.putImageData(id, 0, 0);
  return c.toDataURL('image/jpeg', 0.92);
}
