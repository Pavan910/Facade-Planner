// POST /api/detect — façade structure identification with a vision model on
// Groq (OpenAI-compatible chat completions API, free tier).
// Body: { image: <base64 JPEG, no data: prefix> }
// Returns: { source: 'ai', isHouseExterior, usable, guidance, regions: [{ type, x, y, w, h }] }
// with x/y/w/h as fractions (0–1) of the image size.

export const config = { maxDuration: 60 };

const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';
const DEFAULT_MODEL = 'qwen/qwen3.8-27b';
const TYPES = ['wall', 'window', 'gate', 'balcony', 'slab', 'pillar', 'parapet', 'roofedge'];
const MAX_IMAGE_BYTES = 3.5 * 1024 * 1024; // stay under Vercel's 4.5 MB body limit

const PROMPT = `You map the front elevation of a low-rise residential building from a photo so a homeowner can preview exterior finishes and estimate their cost.

Return bounding boxes in a 0–1000 coordinate system: (0,0) is the top-left of the image and (1000,1000) the bottom-right, independent of aspect ratio. x0<x1 and y0<y1.

Region types:
- wall: each distinct plastered façade plane of the house (usually 1–3 boxes). Draw the whole plane including the windows and doors on it; openings are subtracted later.
- window: every visible window, one box each, including its frame.
- gate: every main door, garage door and compound gate, one box each.
- balcony: the railing / balustrade band of each balcony (not the slab below it).
- slab: the projecting edge / fascia of each balcony slab or sunshade (chajja).
- pillar: each visible column or pillar, one box each.
- parapet: the low wall along the top of the roof or terrace.
- roofedge: the roof edge, cornice or eave band just below the parapet or along a sloped roof.

Ignore trees, vehicles, people, neighbouring buildings, sky and ground. Keep boxes tight to the building element.

Set is_house_exterior=false if the photo is not the outside of a building. Set usable=false if the façade is too occluded, cropped, angled or small to map. In guidance, give one or two short sentences a non-technical homeowner can act on (for example how to retake the photo), or say briefly what was found.

Respond with JSON only, exactly in this shape:
{"is_house_exterior": true, "usable": true, "guidance": "…", "regions": [{"type": "wall", "x0": 120, "y0": 180, "x1": 880, "y1": 840}]}`;

class HttpError extends Error {
  constructor(status, message) { super(message); this.status = status; }
}

export function parseRegions(out) {
  return (Array.isArray(out.regions) ? out.regions : [])
    .filter((r) => r && TYPES.includes(r.type))
    .map((r) => {
      const c = (v) => Math.min(1000, Math.max(0, Math.round(+v || 0)));
      const x0 = c(Math.min(r.x0, r.x1)), x1 = c(Math.max(r.x0, r.x1));
      const y0 = c(Math.min(r.y0, r.y1)), y1 = c(Math.max(r.y0, r.y1));
      return { type: r.type, x: x0 / 1000, y: y0 / 1000, w: (x1 - x0) / 1000, h: (y1 - y0) / 1000 };
    })
    .filter((r) => r.w > 0.005 && r.h > 0.005)
    .slice(0, 60);
}

// Tolerates a stray code fence around the JSON.
function parseJson(text) {
  const s = String(text || '').trim().replace(/^```(?:json)?\s*/i, '').replace(/```$/, '');
  return JSON.parse(s.slice(s.indexOf('{'), s.lastIndexOf('}') + 1));
}

export async function detect(image, { apiKey = process.env.GROQ_API_KEY, model = process.env.GROQ_MODEL || DEFAULT_MODEL, fetchImpl = fetch } = {}) {
  const res = await fetchImpl(GROQ_URL, {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model,
      temperature: 0.2,
      max_completion_tokens: 4096,
      response_format: { type: 'json_object' },
      reasoning_format: 'hidden',
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: PROMPT },
            { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${image}` } },
          ],
        },
      ],
    }),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = (data.error && data.error.message) || `AI service error ${res.status}`;
    if (res.status === 401) throw new HttpError(501, 'AI detection key is invalid.');
    if (res.status === 429) throw new HttpError(429, 'AI detection is busy (free-tier limit). Try again in a minute.');
    throw new HttpError(502, msg);
  }

  const text = data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content;
  let out;
  try { out = parseJson(text); } catch { throw new HttpError(502, 'AI returned an unreadable result.'); }
  return {
    source: 'ai',
    model: data.model || model,
    isHouseExterior: out.is_house_exterior !== false,
    usable: out.usable !== false,
    guidance: String(out.guidance || ''),
    regions: parseRegions(out),
  };
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Use POST.' });
  if (!process.env.GROQ_API_KEY) return res.status(501).json({ error: 'AI detection is not configured (GROQ_API_KEY missing).' });

  const image = req.body && req.body.image;
  if (typeof image !== 'string' || !image.length) return res.status(400).json({ error: 'Send { image: <base64 JPEG> }.' });
  if (image.length * 0.75 > MAX_IMAGE_BYTES) return res.status(413).json({ error: 'Image too large. Resize to under 3.5 MB.' });

  try {
    return res.status(200).json(await detect(image));
  } catch (err) {
    return res.status(err.status || 500).json({ error: err.message || 'Detection failed.' });
  }
}
