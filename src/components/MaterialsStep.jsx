import { useState } from 'react';
import { MATERIALS, REGION_TYPES, assignmentFor, isFinishable } from '../lib/catalog.js';

const col = (type) => `oklch(0.6 0.15 ${REGION_TYPES[type].hue})`;

export default function MaterialsStep({ regions, sel, setSel, labels, design, updateDesign, rates, next }) {
  const [applyAll, setApplyAll] = useState(true);
  const surfaces = regions.filter((r) => isFinishable(r.type));
  const selR = surfaces.find((r) => r.id === sel);
  const cur = selR && assignmentFor(design, selR);

  const targets = () => (applyAll ? regions.filter((x) => x.type === selR.type).map((x) => x.id) : [selR.id]);
  const apply = (m, v) => updateDesign((d) => {
    const a = { ...d.assign };
    targets().forEach((id) => { a[id] = { m, v }; });
    return { ...d, assign: a };
  });
  const clear = () => updateDesign((d) => {
    const a = { ...d.assign };
    targets().forEach((id) => delete a[id]);
    return { ...d, assign: a };
  });

  return (
    <>
      <div>
        <h2>Apply materials</h2>
        <p className="lede">Pick a surface, then a material and finish. Each variation below the image keeps its own combination so you can compare looks and totals.</p>
      </div>
      <div className="row" style={{ flexWrap: 'nowrap' }}>
        <span className="small muted">Variation name</span>
        <input className="input" style={{ flex: 1 }} value={design?.name || ''} onChange={(e) => { const v = e.target.value; updateDesign((d) => ({ ...d, name: v })); }} />
      </div>

      <div className="list">
        {surfaces.map((r) => {
          const a = assignmentFor(design, r), m = a && MATERIALS[a.m];
          return (
            <button key={r.id} className={'list-row' + (r.id === sel ? ' on' : '')} onClick={() => setSel(r.id)}>
              <span className="dot" style={{ background: col(r.type) }} />
              <span style={{ flex: 1 }}>{labels[r.id]}</span>
              <span className="small muted">{m ? `${m.name} · ${(m.variants[a.v] || {}).n}` : 'Original'}</span>
              <span className={'swatch' + (m ? '' : ' none')} style={m ? { background: m.variants[a.v].c } : undefined} />
            </button>
          );
        })}
      </div>

      {selR ? (
        <>
          <div className="row" style={{ fontSize: 13 }}>
            <label className="check">
              <input type="checkbox" checked={applyAll} onChange={(e) => setApplyAll(e.target.checked)} />
              Apply to every {REGION_TYPES[selR.type].label.toLowerCase()} region
            </label>
            <div className="spacer" />
            <button className="link" onClick={clear}>Keep original</button>
          </div>
          <div className="stack">
            {Object.entries(MATERIALS).filter(([, m]) => m.applies.includes(selR.type)).map(([id, m]) => {
              const on = cur && cur.m === id;
              return (
                <div key={id} className={'mat' + (on ? ' on' : '')}>
                  <div className="row" style={{ justifyContent: 'space-between', alignItems: 'baseline' }}>
                    <b style={{ fontSize: 14 }}>{m.name}</b>
                    <span className="mono tiny muted">₹{rates[id].rate}/{m.unit} + ₹{rates[id].labor}/{m.basis} labour</span>
                  </div>
                  <div className="facts">
                    <span>Durability</span><span>{m.durability}</span>
                    <span>Upkeep</span><span>{m.maintenance}</span>
                    <span>Suits</span><span>{m.bestFor}</span>
                  </div>
                  <div className="row" style={{ gap: 6 }}>
                    {m.variants.map((v, vi) => (
                      <button key={v.n} className={'chip' + (on && cur.v === vi ? ' on' : '')} title={v.n} onClick={() => apply(id, vi)}>
                        <i style={{ background: v.c }} />{v.n}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      ) : (
        <div className="muted small">Select a surface above to see the materials that suit it.</div>
      )}
      <button className="btn-primary" onClick={next}>Estimate areas and quantities</button>
    </>
  );
}
