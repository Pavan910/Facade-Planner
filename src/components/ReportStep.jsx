import { money } from '../lib/estimate.js';
import { reportHtml } from '../lib/report.js';

export default function ReportStep({ projectName, img, renderer, designs, design, regions, ppf, t, grandFor, rates, scale, settings, detection, onSave, flash }) {
  const build = () => reportHtml({
    projectName,
    original: img.src,
    redesigned: renderer.toDataURL(design, regions, ppf),
    design,
    t,
    variations: designs.map((d) => ({ name: d.name, grand: grandFor(d) })),
    rates,
    settings: { scaleMode: scale.mode, refFt: scale.refFt, ppf, gst: settings.gst, pillarFaces: settings.pillarFaces, detection: detection?.source },
  });

  const fileName = (projectName || 'report').replace(/[^\w\- ]+/g, '').trim().replace(/\s+/g, '-') + '-report.html';

  function download() {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([build()], { type: 'text/html' }));
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  }

  function print() {
    const w = window.open('', '_blank');
    if (!w) { flash('Pop-up blocked. Use Download report instead.'); return; }
    w.document.write(build());
    w.document.close();
    setTimeout(() => { try { w.focus(); w.print(); } catch { /* user closed it */ } }, 600);
  }

  return (
    <>
      <div>
        <h2>Renovation report</h2>
        <p className="lede">A document to discuss with contractors: original and redesigned images, selected materials, quantity calculations, the cost breakdown and the rates used.</p>
      </div>
      <div className="card" style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '6px 14px', fontSize: 13 }}>
        <span className="muted">Project</span><span>{projectName}</span>
        <span className="muted">Variation</span><span>{design?.name}</span>
        <span className="muted">Surfaces</span><span>{t.lines.length} with new finishes</span>
        <span className="muted">Grand total</span><b>{money(t.grand)}</b>
      </div>
      <button className="btn-primary" onClick={download}>Download report (.html)</button>
      <button className="btn" style={{ padding: 10 }} onClick={print}>Open printable report / save as PDF</button>
      <button className="btn" style={{ padding: 10 }} onClick={onSave}>Save project to continue editing later</button>
    </>
  );
}
