// Structure identification. Sends a downsized photo to /api/detect (a vision
// model on Groq). If the service is unavailable, falls back to the standard façade
// template so the user can still correct regions by hand.
import { regionsFromTemplate, uid } from './catalog.js';
import { resize } from './image.js';

export async function detectRegions(src, W, H) {
  try {
    const small = await resize(src, 1024, 0.85);
    const res = await fetch('/api/detect', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ image: small.src.split(',')[1] }),
    });
    const out = await res.json().catch(() => ({}));
    if (res.status === 501) throw new Error('AI detection is not set up on this deployment');
    if (!res.ok) throw new Error((out.error || `Detection failed (${res.status})`).replace(/\.$/, ''));

    const regions = out.regions.map((r) => ({ id: uid('r'), type: r.type, x: r.x * W, y: r.y * H, w: r.w * W, h: r.h * H }));
    if (!regions.some((r) => r.type === 'wall')) {
      return { source: 'template', regions: regionsFromTemplate(W, H), note: 'AI found no main wall, so the standard layout was placed. Adjust it to fit.', guidance: out.guidance };
    }
    return {
      source: 'ai',
      regions,
      isHouseExterior: out.isHouseExterior,
      usable: out.usable,
      guidance: out.guidance,
      note: `${regions.length} components identified by AI.`,
    };
  } catch (err) {
    return {
      source: 'template',
      regions: regionsFromTemplate(W, H),
      note: `${err.message}. A standard layout was placed instead; drag the boxes onto your house.`,
    };
  }
}
