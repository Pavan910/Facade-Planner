import { money } from '../lib/estimate.js';

// Side-by-side design variations with thumbnail and grand total.
export default function Variations({ designs, active, setActive, thumbs, grandFor, onAdd, onDelete }) {
  return (
    <div className="variations">
      {designs.map((d, i) => (
        <button key={d.id} className={'variation' + (i === active ? ' on' : '')} onClick={() => setActive(i)}>
          {thumbs[d.id] ? <img src={thumbs[d.id]} alt="" /> : <div className="placeholder" style={{ padding: 0 }} />}
          <div className="row" style={{ justifyContent: 'space-between', marginTop: 8, fontSize: 13, flexWrap: 'nowrap' }}>
            <span style={{ fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{d.name}</span>
            <span className="mono small">{money(grandFor(d))}</span>
          </div>
          {i === active && designs.length > 1 && (
            <span
              role="button"
              tabIndex={0}
              className="link"
              style={{ display: 'inline-block', marginTop: 4 }}
              onClick={(e) => { e.stopPropagation(); onDelete(i); }}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.stopPropagation(); onDelete(i); } }}
            >
              Remove
            </span>
          )}
        </button>
      ))}
      <button className="variation-add" onClick={onAdd}>+ New variation</button>
    </div>
  );
}
