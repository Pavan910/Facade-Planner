import { useState } from 'react';

export default function UploadStep({ uploads, activeUpload, addFiles, onSample, onUse, hasImg, detecting, next }) {
  const [over, setOver] = useState(false);
  return (
    <>
      <div>
        <h2>Upload exterior photos</h2>
        <p className="lede">Add one or more photos of the front of the house. Each photo is checked for resolution, lighting and sharpness, and the clearest usable view is selected automatically.</p>
      </div>
      <label
        className={'drop' + (over ? ' over' : '')}
        onDragOver={(e) => { e.preventDefault(); setOver(true); }}
        onDragLeave={() => setOver(false)}
        onDrop={(e) => { e.preventDefault(); setOver(false); addFiles(e.dataTransfer.files); }}
      >
        <b style={{ fontSize: 14 }}>Drop photos here or click to browse</b>
        <span className="small muted">JPG or PNG · at least 640×360 px</span>
        <input type="file" accept="image/*" multiple style={{ display: 'none' }} onChange={(e) => { addFiles(e.target.files); e.target.value = ''; }} />
      </label>
      <button className="btn" onClick={onSample}>Use sample house</button>

      {uploads.map((u) => {
        const on = u.id === activeUpload, st = u.q.status;
        return (
          <div key={u.id} className={'upload' + (on ? ' on' : '') + (st === 'Rejected' ? ' rejected' : '')}>
            {u.src ? <img src={u.src} alt="" /> : <div className="placeholder" style={{ width: 72, height: 54, padding: 0 }} />}
            <div className="stack" style={{ flex: 1, minWidth: 0, gap: 4 }}>
              <div className="row" style={{ flexWrap: 'nowrap' }}>
                <span style={{ fontSize: 13, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.name}</span>
                <span className={'status ' + st}>{on ? st + ' · in use' : st}</span>
              </div>
              <div className="mono tiny muted">{u.q.metrics}</div>
              {u.q.issues.map((is) => <div key={is} className="issue">{is}</div>)}
              {!on && st !== 'Rejected' && <button className="btn btn-sm" style={{ alignSelf: 'flex-start' }} disabled={detecting} onClick={() => onUse(u)}>Use this view</button>}
            </div>
          </div>
        );
      })}

      <div className="soft" style={{ fontSize: 13, lineHeight: 1.6 }}>
        <div style={{ fontWeight: 600, marginBottom: 4 }}>For best results</div>
        <div>Stand across the road, facing the house straight on.</div>
        <div>Fit the whole façade, including the parapet and gate, in the frame.</div>
        <div>Shoot in daylight; avoid strong backlight and deep shadows.</div>
        <div>Keep cars, trees and people out of the way where possible.</div>
      </div>
      {hasImg && <button className="btn-primary" disabled={detecting} onClick={next}>{detecting ? 'Identifying structure…' : 'Continue to structure review'}</button>}
    </>
  );
}
