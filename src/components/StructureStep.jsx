import { useState } from 'react';
import { REGION_TYPES, uid } from '../lib/catalog.js';
import { num } from '../lib/estimate.js';

const col = (type) => `oklch(0.6 0.15 ${REGION_TYPES[type].hue})`;
const TYPE_OPTS = Object.entries(REGION_TYPES).map(([id, t]) => ({ id, label: t.label }));

export default function StructureStep({ img, regions, setRegions, sel, setSel, labels, ppf, detection, detecting, onReset, onRerunAI, next }) {
  const [addType, setAddType] = useState('window');
  const selR = regions.find((r) => r.id === sel);

  const add = () => {
    const id = uid('r');
    setRegions((rs) => [...rs, { id, type: addType, x: img.w * 0.42, y: img.h * 0.4, w: img.w * 0.12, h: img.h * 0.12 }]);
    setSel(id);
  };

  const warn = detection && (detection.source !== 'ai' || detection.isHouseExterior === false || detection.usable === false);

  return (
    <>
      <div>
        <h2>Review detected regions</h2>
        <p className="lede">These are the building components identified on the photo. Check that each box covers the right surface; move, resize, retype, add or delete as needed. Areas and costs are based on these boxes.</p>
      </div>

      {detection && !detecting && (
        <div className={'notice' + (warn ? ' warn' : '')}>
          <b>{detection.source === 'ai' ? 'Detected by AI vision. ' : 'Standard layout. '}</b>
          {detection.note}
          {detection.isHouseExterior === false && <div><b>This does not look like a house exterior.</b></div>}
          {detection.guidance && <div style={{ marginTop: 4 }}>{detection.guidance}</div>}
        </div>
      )}

      <div className="list">
        {regions.map((r) => (
          <button key={r.id} className={'list-row' + (r.id === sel ? ' on' : '')} onClick={() => setSel(r.id)}>
            <span className="dot" style={{ background: col(r.type) }} />
            <span style={{ flex: 1 }}>{labels[r.id]}</span>
            <span className="mono tiny muted">{num(r.w / ppf, 1)} × {num(r.h / ppf, 1)} ft</span>
          </button>
        ))}
      </div>

      {selR && (
        <div className="row soft">
          <b style={{ fontSize: 13 }}>{labels[selR.id]}</b>
          <div className="spacer" />
          <select className="input" value={selR.type} aria-label="Region type" onChange={(e) => { const v = e.target.value; setRegions((rs) => rs.map((r) => (r.id === sel ? { ...r, type: v } : r))); }}>
            {TYPE_OPTS.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
          </select>
          <button className="btn btn-sm btn-danger" onClick={() => { setRegions((rs) => rs.filter((r) => r.id !== sel)); setSel(null); }}>Delete</button>
        </div>
      )}

      <div className="row">
        <select className="input" style={{ flex: 1, padding: 8 }} value={addType} onChange={(e) => setAddType(e.target.value)} aria-label="Type of region to add">
          {TYPE_OPTS.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
        </select>
        <button className="btn" onClick={add}>Add region</button>
      </div>
      <div className="row">
        <button className="btn" onClick={onRerunAI}>Re-run AI detection</button>
        <button className="btn" onClick={onReset}>Use standard layout</button>
      </div>
      <button className="btn-primary" disabled={!regions.some((r) => r.type === 'wall')} onClick={next}>Confirm regions and choose materials</button>
      {!regions.some((r) => r.type === 'wall') && <div className="tiny muted">Add at least one main wall to continue.</div>}
    </>
  );
}
