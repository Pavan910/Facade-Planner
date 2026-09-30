import { useEffect } from 'react';

export default function ProjectsModal({ projects, onOpen, onDelete, onClose }) {
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="modal-bg" onClick={onClose}>
      <div className="modal" role="dialog" aria-modal="true" aria-label="Saved projects" onClick={(e) => e.stopPropagation()}>
        <div className="row" style={{ justifyContent: 'space-between' }}>
          <h3 style={{ margin: 0, fontSize: 18 }}>Saved projects</h3>
          <button className="link" onClick={onClose}>Close</button>
        </div>
        <div className="tiny muted">Projects are saved in this browser.</div>
        {!projects.length && <div className="small muted">No saved projects yet.</div>}
        {projects.map((p) => (
          <div key={p.id} className="proj">
            {p.thumb ? <img src={p.thumb} alt="" /> : <div className="placeholder" style={{ width: 64, height: 44, padding: 0 }} />}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 14, fontWeight: 600 }}>{p.name}</div>
              <div className="small muted">{new Date(p.date).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</div>
            </div>
            <button className="btn btn-sm" onClick={() => onOpen(p.id)}>Open</button>
            <button className="link" style={{ color: 'var(--danger)' }} onClick={() => onDelete(p.id)}>Delete</button>
          </div>
        ))}
      </div>
    </div>
  );
}
