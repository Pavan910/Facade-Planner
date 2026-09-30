import { describe, expect, it } from 'vitest';
import { detect } from '../api/detect.js';

const reply = (content, status = 200) => async () => ({
  ok: status < 400,
  status,
  json: async () => (status < 400 ? { model: 'test-model', choices: [{ message: { content } }] } : { error: { message: 'nope' } }),
});

describe('detect', () => {
  it('normalises boxes, fixes swapped corners and drops unknown or tiny regions', async () => {
    const content = JSON.stringify({
      is_house_exterior: true,
      usable: true,
      guidance: 'Looks good.',
      regions: [
        { type: 'wall', x0: 100, y0: 200, x1: 900, y1: 950 },
        { type: 'window', x0: 400, y0: 500, x1: 300, y1: 350 },
        { type: 'chimney', x0: 0, y0: 0, x1: 100, y1: 100 },
        { type: 'pillar', x0: 10, y0: 10, x1: 12, y1: 500 },
      ],
    });
    const out = await detect('AAAA', { apiKey: 'k', fetchImpl: reply(content) });
    expect(out.regions).toEqual([
      { type: 'wall', x: 0.1, y: 0.2, w: 0.8, h: 0.75 },
      { type: 'window', x: 0.3, y: 0.35, w: 0.1, h: 0.15 },
    ]);
    expect(out.source).toBe('ai');
  });

  it('accepts JSON wrapped in a code fence', async () => {
    const out = await detect('AAAA', { apiKey: 'k', fetchImpl: reply('```json\n{"regions":[{"type":"wall","x0":0,"y0":0,"x1":500,"y1":500}]}\n```') });
    expect(out.regions).toHaveLength(1);
  });

  it('maps rate limits and unreadable output to clear errors', async () => {
    await expect(detect('AAAA', { apiKey: 'k', fetchImpl: reply('', 429) })).rejects.toMatchObject({ status: 429 });
    await expect(detect('AAAA', { apiKey: 'k', fetchImpl: reply('not json') })).rejects.toMatchObject({ status: 502 });
  });
});
