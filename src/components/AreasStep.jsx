import { SCALE_MODES, hasLength, isFinishable } from '../lib/catalog.js';
import { measure, num, qtyText } from '../lib/estimate.js';

export default function AreasStep({ regions, setRegions, labels, design, ppf, settings, setSettings, scale, setScale, t, next }) {
  const mode = SCALE_MODES.find((s) => s.id === scale.mode) || SCALE_MODES[0];
  const surfaces = regions.filter((r) => isFinishable(r.type));
  const setDim = (id, f) => (e) => {
    const v = e.target.value;
    setRegions((rs) => rs.map((r) => (r.id === id ? { ...r, [f]: v === '' ? undefined : Math.max(0, +v) } : r)));
  };

  return (
    <>
      <div>
        <h2>Surface areas and quantities</h2>
        <p className="lede">Pixel sizes are converted to feet using a reference of known size. Change the reference, or type a measured width or height for any surface, to refine the numbers.</p>
      </div>

      <div className="soft stack" style={{ gap: 10, padding: 12 }}>
        <div className="seg">
          {SCALE_MODES.map((s) => (
            <button key={s.id} className={scale.mode === s.id ? 'on' : ''} onClick={() => setScale({ mode: s.id, refFt: s.def })}>{s.label}</button>
          ))}
        </div>
        <div className="row" style={{ fontSize: 13 }}>
          <span>{mode.field}</span>
          <input className="input" type="number" step="0.5" min="0.5" style={{ width: 70 }} value={scale.refFt} onChange={(e) => setScale((s) => ({ ...s, refFt: e.target.value }))} />
          <span>ft</span>
          <div className="spacer" />
          <span className="mono tiny muted">1 ft ≈ {num(ppf, 1)} px</span>
        </div>
        <div className="row" style={{ fontSize: 13 }}>
          <span>Exposed pillar faces</span>
          <div className="seg" style={{ flex: 'none' }}>
            {[1, 2, 3, 4].map((n) => (
              <button key={n} style={{ padding: '4px 10px' }} className={settings.pillarFaces === n ? 'on' : ''} onClick={() => setSettings((s) => ({ ...s, pillarFaces: n }))}>{n}</button>
            ))}
          </div>
        </div>
      </div>

      <div>
        <div className="eyebrow">Measured surfaces</div>
        <div className="dims">
          <span className="small muted">Surface</span>
          <span className="small muted" style={{ textAlign: 'right' }}>Net area</span>
          <span className="small muted">Width ft</span>
          <span className="small muted">Height ft</span>
          {surfaces.map((r) => {
            const m = measure(r, regions, ppf, settings.pillarFaces);
            return [
              <span key={r.id + 'l'}>{labels[r.id]}{hasLength(r.type) && <span className="mono tiny muted"> · {num(m.len, 1)} rft</span>}</span>,
              <span key={r.id + 'a'} className="num">{num(m.area, 1)} sqft</span>,
              <input key={r.id + 'w'} type="number" min="0" step="0.5" placeholder={num(r.w / ppf, 1)} value={r.mw ?? ''} onChange={setDim(r.id, 'mw')} aria-label={`${labels[r.id]} measured width`} />,
              <input key={r.id + 'h'} type="number" min="0" step="0.5" placeholder={num(r.h / ppf, 1)} value={r.mh ?? ''} onChange={setDim(r.id, 'mh')} aria-label={`${labels[r.id]} measured height`} />,
            ];
          })}
        </div>
        <div className="tiny muted" style={{ marginTop: 6 }}>
          Grey values are estimated from the photo; type a tape-measured value to override. Wall area excludes windows and doors. Pillars count {settings.pillarFaces} exposed face{settings.pillarFaces > 1 ? 's' : ''}; parapets count inner and outer faces.
        </div>
      </div>

      <div>
        <div className="eyebrow">Material quantities · {design?.name}</div>
        <div style={{ borderTop: '1px solid var(--line)' }}>
          {t.lines.map((l) => (
            <div key={l.region.id} className="qty">
              <div className="row" style={{ justifyContent: 'space-between', fontSize: 13, flexWrap: 'nowrap' }}>
                <span>{l.label} · {l.material.name}</span>
                <span className="mono small" style={{ fontWeight: 500, whiteSpace: 'nowrap' }}>{qtyText(l.qty, l.material.unit)}</span>
              </div>
              <div className="mono tiny muted">{l.formula}</div>
            </div>
          ))}
          {!t.lines.length && <div className="small muted" style={{ padding: '8px 0' }}>No new finishes in this variation yet.</div>}
        </div>
      </div>
      <button className="btn-primary" onClick={next}>Calculate cost</button>
    </>
  );
}
