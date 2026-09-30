import { useEffect, useRef } from 'react';
import { REGION_TYPES } from '../lib/catalog.js';

const col = (type, a) => {
  const h = REGION_TYPES[type].hue;
  return a == null ? `oklch(0.6 0.15 ${h})` : `oklch(0.6 0.15 ${h} / ${a})`;
};
const clamp = (v, lo, hi) => Math.min(Math.max(v, lo), hi);
const CORNERS = [
  ['nw', { left: -6, top: -6, cursor: 'nwse-resize' }],
  ['ne', { right: -6, top: -6, cursor: 'nesw-resize' }],
  ['sw', { left: -6, bottom: -6, cursor: 'nesw-resize' }],
  ['se', { right: -6, bottom: -6, cursor: 'nwse-resize' }],
];

// Photo with the redesign canvas, the before/after divider, and the editable
// region boxes (step 2).
export default function Stage({ img, renderer, regions, setRegions, sel, setSel, labels, step, design, ppf, detecting, compare, setCompare, showOutlines, setShowOutlines }) {
  const stageRef = useRef(null);
  const canvasRef = useRef(null);
  const drag = useRef(null);
  const editable = step === 2 && !detecting;
  const showCompare = !!img && step >= 3 && !detecting;
  const showOverlays = !!img && !detecting && (step === 2 || (step >= 3 && showOutlines));

  // Repaint the redesign whenever the design, regions or scale change.
  useEffect(() => {
    const c = canvasRef.current;
    if (!c || !renderer || !design || !showCompare) return;
    c.width = renderer.img.width;
    c.height = renderer.img.height;
    renderer.render(c.getContext('2d'), design, regions, ppf);
  }, [renderer, design, regions, ppf, showCompare]);

  // Drag to move; drag a corner handle to resize.
  useEffect(() => {
    const onMove = (e) => {
      const d = drag.current;
      if (!d) return;
      const W = img.w, H = img.h, o = d.o;
      const dx = (e.clientX - d.sx) * d.s, dy = (e.clientY - d.sy) * d.s;
      let { x, y, w, h } = o;
      if (d.mode === 'move') {
        x = clamp(o.x + dx, 0, W - o.w);
        y = clamp(o.y + dy, 0, H - o.h);
      } else {
        if (d.mode.includes('w')) { x = clamp(o.x + dx, 0, o.x + o.w - 8); w = o.w + (o.x - x); }
        if (d.mode.includes('e')) w = clamp(o.w + dx, 8, W - o.x);
        if (d.mode.includes('n')) { y = clamp(o.y + dy, 0, o.y + o.h - 8); h = o.h + (o.y - y); }
        if (d.mode.includes('s')) h = clamp(o.h + dy, 8, H - o.y);
      }
      setRegions((rs) => rs.map((r) => (r.id === d.id ? { ...r, x, y, w, h } : r)));
    };
    const onUp = () => { drag.current = null; };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };
  }, [img, setRegions]);

  function startDrag(e, r, mode) {
    if (!editable) return;
    e.preventDefault();
    e.stopPropagation();
    const rect = stageRef.current.getBoundingClientRect();
    drag.current = { id: r.id, mode, sx: e.clientX, sy: e.clientY, o: { ...r }, s: img.w / rect.width };
    setSel(r.id);
  }

  function onKey(e, r) {
    if (!editable) return;
    const step = (e.shiftKey ? 10 : 2) * (img.w / 600);
    const d = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] }[e.key];
    if (!d) return;
    e.preventDefault();
    setRegions((rs) => rs.map((x) => (x.id === r.id ? { ...x, x: clamp(x.x + d[0], 0, img.w - x.w), y: clamp(x.y + d[1], 0, img.h - x.h) } : x)));
  }

  if (!img) {
    return (
      <div className="card">
        <div className="placeholder">exterior photo of the house<br />upload on the right, or use the sample house</div>
      </div>
    );
  }

  const W = img.w, H = img.h;
  return (
    <div className="card">
      <div className="stage" ref={stageRef}>
        <img src={img.src} alt="Original exterior" draggable="false" />
        <canvas ref={canvasRef} style={{ display: showCompare ? 'block' : 'none', clipPath: `inset(0 0 0 ${compare}%)` }} />
        {showCompare && (
          <>
            <div className="divider" style={{ left: compare + '%' }} />
            <div className="tag" style={{ left: 10, background: 'rgba(28,27,25,.8)' }}>ORIGINAL</div>
            <div className="tag" style={{ right: 10, background: 'var(--accent)' }}>REDESIGN · {design?.name}</div>
          </>
        )}
        {showOverlays && regions.map((r) => {
          const on = r.id === sel && editable, c = col(r.type);
          const front = REGION_TYPES[r.type].opening || ['pillar', 'balcony', 'slab'].includes(r.type);
          return (
            <div
              key={r.id}
              className="region"
              role={editable ? 'button' : undefined}
              tabIndex={editable ? 0 : -1}
              aria-label={labels[r.id]}
              onPointerDown={(e) => startDrag(e, r, 'move')}
              onKeyDown={(e) => onKey(e, r)}
              onFocus={() => editable && setSel(r.id)}
              style={{
                left: (r.x / W) * 100 + '%', top: (r.y / H) * 100 + '%', width: (r.w / W) * 100 + '%', height: (r.h / H) * 100 + '%',
                border: `${on ? 2.5 : 1.5}px solid ${c}`,
                background: editable ? col(r.type, on ? 0.28 : 0.12) : 'transparent',
                cursor: editable ? 'move' : 'default',
                pointerEvents: editable ? 'auto' : 'none',
                zIndex: on ? 3 : front ? 2 : 1,
              }}
            >
              {editable && (on || r.w / W > 0.06) && <div className="region-label" style={{ background: c }}>{labels[r.id]}</div>}
              {on && CORNERS.map(([mode, pos]) => (
                <div key={mode} className="handle" style={{ ...pos, border: `2px solid ${c}` }} onPointerDown={(e) => startDrag(e, r, mode)} />
              ))}
            </div>
          );
        })}
        {detecting && (
          <div className="overlay">
            <div><b>Identifying structure…</b><div className="muted small" style={{ marginTop: 4 }}>Walls, windows, balconies, pillars, parapet, gate and roof edge</div></div>
          </div>
        )}
      </div>

      {showCompare && (
        <div className="row" style={{ marginTop: 12, gap: 12 }}>
          <span className="mono tiny muted">BEFORE</span>
          <input type="range" className="range" min="0" max="100" value={compare} onChange={(e) => setCompare(+e.target.value)} aria-label="Compare original and redesign" />
          <span className="mono tiny muted">AFTER</span>
          <label className="check small" style={{ marginLeft: 8 }}>
            <input type="checkbox" checked={showOutlines} onChange={(e) => setShowOutlines(e.target.checked)} />Outlines
          </label>
        </div>
      )}
      {editable && (
        <div className="muted small" style={{ marginTop: 10, lineHeight: 1.5 }}>
          Drag a box to move it; drag a corner handle to resize. Arrow keys nudge the selected box (Shift for larger steps).
        </div>
      )}
    </div>
  );
}
